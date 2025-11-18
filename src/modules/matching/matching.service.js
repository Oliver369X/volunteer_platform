'use strict';

const { getPrisma } = require('../../database');
const { AuthorizationError, NotFoundError } = require('../../core/api-error');
const { calculateDistanceKm } = require('../../utils/geo');
const geminiClient = require('../../services/gemini-client');
const notificationService = require('../../services/notification.service');

const ACTIVE_ASSIGNMENT_STATUSES = ['PENDING', 'ACCEPTED', 'IN_PROGRESS'];

const ensureTaskPermission = async (prisma, task, requester) => {
  if (requester.role === 'ADMIN') {
    return;
  }

  if (requester.role !== 'ORGANIZATION') {
    throw new AuthorizationError('No tienes permisos para ejecutar asignaciones');
  }

  const membership = await prisma.organizationMember.findFirst({
    where: { organizationId: task.organizationId, userId: requester.id },
  });

  if (!membership) {
    throw new AuthorizationError('No perteneces a la organización propietaria de la tarea');
  }
};

const computeHeuristicScore = (task, volunteer, workloadMap) => {
  const requiredSkills = task.skillsRequired || [];
  const volunteerSkills = volunteer.skills || [];
  const skillMatches = requiredSkills.length
    ? requiredSkills.filter((skill) => volunteerSkills.includes(skill)).length
    : volunteerSkills.length;

  const skillScore = requiredSkills.length ? skillMatches / requiredSkills.length : 0.6;

  const distanceKm = calculateDistanceKm(
    task.latitude,
    task.longitude,
    volunteer.latitude,
    volunteer.longitude,
  );

  let distanceScore = 0.5;
  if (distanceKm !== null) {
    if (distanceKm < 5) distanceScore = 1;
    else if (distanceKm < 20) distanceScore = 0.8;
    else if (distanceKm < 50) distanceScore = 0.6;
    else if (distanceKm < 100) distanceScore = 0.4;
    else distanceScore = 0.2;
  }

  const workload = workloadMap.get(volunteer.userId) || 0;
  const workloadScore = workload >= 3 ? 0.2 : workload === 2 ? 0.5 : 1;

  const reputationScore = Math.min(volunteer.reputationScore / 100, 1);
  const pointsScore = Math.min(volunteer.totalPoints / 1000, 1);

  const finalScore =
    skillScore * 40 +
    distanceScore * 20 +
    workloadScore * 15 +
    reputationScore * 15 +
    pointsScore * 10;

  return {
    score: Math.round(finalScore),
    breakdown: {
      skillScore: Number(skillScore.toFixed(2)),
      distanceScore: Number(distanceScore.toFixed(2)),
      workloadScore: Number(workloadScore.toFixed(2)),
      reputationScore: Number(reputationScore.toFixed(2)),
      pointsScore: Number(pointsScore.toFixed(2)),
      distanceKm: distanceKm !== null ? Number(distanceKm.toFixed(2)) : null,
      workload,
    },
  };
};

const mergeAiRecommendations = (heuristicResults, aiResponse) => {
  if (!aiResponse?.recommendations?.length) {
    return heuristicResults;
  }

  const aiMap = new Map(aiResponse.recommendations.map((item) => [item.volunteerId, item]));

  return heuristicResults.map((result) => {
    const aiData = aiMap.get(result.volunteerId);
    if (!aiData) {
      return result;
    }

    const combinedScore = Math.round(result.score * 0.6 + aiData.score * 0.4);
    return {
      ...result,
      score: combinedScore,
      ai: {
        score: aiData.score,
        justification: aiData.justification,
        priority: aiData.priority,
      },
    };
  });
};

const runMatching = async (taskId, { autoAssign, limit }, requester) => {
  const prisma = getPrisma();

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: [
      {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      {
        assignments: true,
      },
    ],
  });

  if (!task) {
    throw new NotFoundError('Tarea no encontrada');
  }

  await ensureTaskPermission(prisma, task, requester);

  if (!['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(task.status)) {
    throw new AuthorizationError('Solo se pueden asignar voluntarios a tareas activas');
  }

  const existingVolunteerIds = new Set(
    task.assignments
      .filter((assignment) => assignment.status !== 'REJECTED')
      .map((a) => a.volunteerId),
  );

  // Calcular workload usando agregación de Prisma
  const activeAssignments = await prisma.assignment.groupBy({
    by: ['volunteerId'],
    where: {
      status: { in: ACTIVE_ASSIGNMENT_STATUSES },
    },
    _count: {
      volunteerId: true,
    },
  });

  const workloadMap = new Map(
    activeAssignments.map((item) => [item.volunteerId, item._count.volunteerId]),
  );

  const volunteers = await prisma.volunteerProfile.findMany({
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          status: true,
        },
        where: {
          status: 'ACTIVE',
        },
      },
    },
  });

  const candidateVolunteers = volunteers.filter(
    (volunteer) => !existingVolunteerIds.has(volunteer.userId),
  );

  const volunteerMap = new Map(
    candidateVolunteers.map((volunteer) => [volunteer.userId, volunteer]),
  );

  const heuristicResults = candidateVolunteers.map((volunteer) => {
    const { score, breakdown } = computeHeuristicScore(task, volunteer, workloadMap);
    return {
      volunteerId: volunteer.userId,
      volunteer: {
        id: volunteer.user.id,
        fullName: volunteer.user.fullName,
        email: volunteer.user.email,
        level: volunteer.level,
        totalPoints: volunteer.totalPoints,
      },
      score,
      breakdown,
    };
  });

  heuristicResults.sort((a, b) => b.score - a.score);
  const topHeuristic = heuristicResults.slice(0, limit);

  const aiResponse = await geminiClient.requestRecommendations(
    task,
    topHeuristic.map((item) => {
      const volunteer = volunteerMap.get(item.volunteerId);
      return {
        userId: item.volunteerId,
        skills: volunteer?.skills,
        availability: volunteer?.availability,
        reputationScore: volunteer?.reputationScore,
        totalPoints: volunteer?.totalPoints,
        level: volunteer?.level,
        baseLocation: volunteer?.baseLocation,
      };
    }),
  );

  const finalRanking = mergeAiRecommendations(topHeuristic, aiResponse).sort(
    (a, b) => b.score - a.score,
  );

  const aiRecord = await prisma.aiRecommendation.create({
    data: {
      taskId: task.id,
      organizationId: task.organizationId,
      requestContext: {
        taskId,
        autoAssign,
        limit,
      },
      responsePayload: {
        heuristicTop: topHeuristic,
        aiResponse,
        finalRanking,
      },
      confidenceScore: aiResponse?.recommendations ? 0.9 : 0.6,
    },
  });

  const result = {
    task: {
      id: task.id,
      title: task.title,
      status: task.status,
      volunteersNeeded: task.volunteersNeeded,
      organization: task.organization,
    },
    recommendations: finalRanking,
    aiRecommendationId: aiRecord.id,
  };

  if (autoAssign) {
    const currentActiveAssignments = task.assignments.filter((assignment) =>
      ACTIVE_ASSIGNMENT_STATUSES.includes(assignment.status),
    );
    const availableSlots = Math.max(task.volunteersNeeded - currentActiveAssignments.length, 0);

    const volunteersToAssign = finalRanking.slice(0, availableSlots);
    const createdAssignments = [];

    await prisma.$transaction(async (tx) => {
      for (const item of volunteersToAssign) {
        const assignment = await tx.assignment.create({
          data: {
            taskId: task.id,
            organizationId: task.organizationId,
            volunteerId: item.volunteerId,
            assignedByUserId: requester.id,
            status: 'PENDING',
          },
        });

        createdAssignments.push(assignment);

        await notificationService.notifyVolunteerAssignment({
          volunteer: { id: item.volunteerId },
          task,
        });
      }
    });

    result.autoAssigned = createdAssignments.map((assignment) => ({
      id: assignment.id,
      volunteerId: assignment.volunteerId,
      status: assignment.status,
    }));
  }

  return result;
};

module.exports = {
  runMatching,
};
