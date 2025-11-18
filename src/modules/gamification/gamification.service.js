'use strict';

const dayjs = require('dayjs');
const { getPrisma } = require('../../database');
const { AuthorizationError, NotFoundError, ValidationError } = require('../../core/api-error');
const blockchainSimulator = require('../../services/blockchain-simulator');

const LEVEL_THRESHOLDS = [
  { level: 'BRONCE', minPoints: 0 },
  { level: 'PLATA', minPoints: 1000 },
  { level: 'ORO', minPoints: 2500 },
  { level: 'PLATINO', minPoints: 5000 },
];

const ACTIVE_COMPLETION_STATUSES = ['PENDING', 'ACCEPTED', 'IN_PROGRESS'];

const getLevelForPoints = (points) => {
  let currentLevel = 'BRONCE';
  for (const { level, minPoints } of LEVEL_THRESHOLDS) {
    if (points >= minPoints) {
      currentLevel = level;
    }
  }
  return currentLevel;
};

const ensureOrgAssignmentAccess = async (prisma, assignment, requester) => {
  if (requester.role === 'ADMIN') {
    return;
  }

  if (requester.role !== 'ORGANIZATION') {
    throw new AuthorizationError('No tienes permisos para evaluar asignaciones');
  }

  const membership = await prisma.organizationMember.findFirst({
    where: { organizationId: assignment.organizationId, userId: requester.id },
  });

  if (!membership) {
    throw new AuthorizationError('No perteneces a la organización responsable');
  }
};

const completeAssignment = async (assignmentId, payload, requester) => {
  const prisma = getPrisma();

  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) {
    throw new NotFoundError('Asignación no encontrada');
  }

  if (!ACTIVE_COMPLETION_STATUSES.includes(assignment.status)) {
    throw new ValidationError('La asignación ya fue finalizada');
  }

  await ensureOrgAssignmentAccess(prisma, assignment, requester);

  const volunteerProfile = await prisma.volunteerProfile.findUnique({
    where: { userId: assignment.volunteerId },
  });

  if (!volunteerProfile) {
    throw new NotFoundError('Perfil de voluntario no encontrado');
  }

  const totalPoints = volunteerProfile.totalPoints + payload.pointsAwarded;
  const newLevel = getLevelForPoints(totalPoints);
  const newReputation = Math.min(
    100,
    Math.round(volunteerProfile.reputationScore * 0.8 + payload.rating * 4),
  );

  const awardedBadges = [];

  await prisma.$transaction(async (tx) => {
    await tx.assignment.update({
      where: { id: assignmentId },
      data: {
        status: 'VERIFIED',
        completedAt: new Date(),
        rating: payload.rating,
        feedback: payload.feedback,
        verificationNotes: payload.feedback,
      },
    });

    await tx.volunteerProfile.update({
      where: { id: volunteerProfile.id },
      data: {
        totalPoints,
        level: newLevel,
        reputationScore: newReputation,
      },
    });

    await tx.pointTransaction.create({
      data: {
        volunteerProfileId: volunteerProfile.id,
        assignmentId,
        type: 'EARN',
        points: payload.pointsAwarded,
        description: 'Reconocimiento por tarea completada',
        referenceType: 'ASSIGNMENT',
        referenceId: assignmentId,
      },
    });

    if (payload.badgeCodes?.length) {
      const badges = await tx.badge.findMany({
        where: { code: { in: payload.badgeCodes } },
      });

      for (const badge of badges) {
        const volunteerBadge = await tx.volunteerBadge.create({
          data: {
            volunteerProfileId: volunteerProfile.id,
            badgeId: badge.id,
            assignmentId,
          },
        });
        await blockchainSimulator.mintBadge({
          volunteerBadge,
          badge,
          volunteer: { id: assignment.volunteerId },
        });
        awardedBadges.push({
          id: volunteerBadge.id,
          badge: {
            code: badge.code,
            name: badge.name,
            level: badge.level,
          },
          tokenId: volunteerBadge.tokenId,
        });
      }
    }

    await tx.auditLog.create({
      data: {
        organizationId: assignment.organizationId,
        action: 'ASSIGNMENT_VERIFIED',
        actorType: requester.role,
        actorId: requester.id,
        entityType: 'ASSIGNMENT',
        entityId: assignment.id,
        metadata: {
          rating: payload.rating,
          pointsAwarded: payload.pointsAwarded,
          badgeCodes: payload.badgeCodes,
        },
      },
    });
  });

  return {
    assignmentId: assignment.id,
    status: 'VERIFIED',
    pointsAwarded: payload.pointsAwarded,
    newTotalPoints: totalPoints,
    newLevel,
    reputationScore: newReputation,
    badges: awardedBadges,
  };
};

const getLeaderboard = async ({ limit, timeframe, zone }) => {
  const prisma = getPrisma();

  let dateFilter = null;
  if (timeframe !== 'all') {
    const map = {
      weekly: dayjs().subtract(7, 'day'),
      monthly: dayjs().subtract(1, 'month'),
      yearly: dayjs().subtract(1, 'year'),
    };
    dateFilter = map[timeframe] || null;
  }

  if (!dateFilter) {
    const profiles = await prisma.volunteerProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: [
        { totalPoints: 'desc' },
        { reputationScore: 'desc' },
      ],
      take: limit,
    });

    return profiles.map((profile, index) => ({
      rank: index + 1,
      volunteerId: profile.userId,
      fullName: profile.user.fullName,
      email: profile.user.email,
      level: profile.level,
      totalPoints: profile.totalPoints,
      reputationScore: profile.reputationScore,
      baseLocation: profile.baseLocation,
    }));
  }

  const transactions = await prisma.pointTransaction.groupBy({
    by: ['volunteerProfileId'],
    where: {
      type: 'EARN',
      createdAt: { gte: dateFilter.toDate() },
    },
    _sum: {
      points: true,
    },
    orderBy: {
      _sum: {
        points: 'desc',
      },
    },
    take: limit,
  });

  const profileIds = transactions.map((t) => t.volunteerProfileId);

  const profiles = await prisma.volunteerProfile.findMany({
    where: { id: { in: profileIds } },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  return transactions.map((transaction, index) => {
    const profile = profileMap.get(transaction.volunteerProfileId);
    return {
      rank: index + 1,
      volunteerId: profile.userId,
      fullName: profile.user.fullName,
      email: profile.user.email,
      level: profile.level,
      totalPoints: profile.totalPoints,
      timeframePoints: transaction._sum.points || 0,
    };
  });
};

const getVolunteerGamification = async (userId) => {
  const prisma = getPrisma();

  const profile = await prisma.volunteerProfile.findUnique({ where: { userId } });
  if (!profile) {
    throw new NotFoundError('Perfil de voluntario no encontrado');
  }

  const [transactions, badges] = await Promise.all([
    prisma.pointTransaction.findMany({
      where: { volunteerProfileId: profile.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.volunteerBadge.findMany({
      where: { volunteerProfileId: profile.id },
      include: {
        badge: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  return {
    profile,
    transactions,
    badges: badges.map((award) => ({
      id: award.id,
      tokenId: award.tokenId,
      blockchainStatus: award.blockchainStatus,
      badge: {
        code: award.badge.code,
        name: award.badge.name,
        level: award.badge.level,
      },
      awardedAt: award.createdAt,
    })),
  };
};

module.exports = {
  completeAssignment,
  getLeaderboard,
  getVolunteerGamification,
};
