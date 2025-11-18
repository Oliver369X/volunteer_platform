'use strict';

const dayjs = require('dayjs');
const { getPrisma } = require('../../database');
const { AuthorizationError, NotFoundError } = require('../../core/api-error');

const buildDateRange = ({ from, to }) => {
  const range = {};
  if (from) {
    range.gte = dayjs(from).startOf('day').toDate();
  }
  if (to) {
    range.lte = dayjs(to).endOf('day').toDate();
  }
  return Object.keys(range).length ? range : null;
};

const ensureOrganizationAccess = async (prisma, organizationId, requester) => {
  if (requester.role === 'ADMIN') {
    return true;
  }

  if (requester.role !== 'ORGANIZATION') {
    throw new AuthorizationError('No tienes permisos para consultar estos reportes');
  }

  const membership = await prisma.organizationMember.findFirst({
    where: { organizationId, userId: requester.id },
  });

  if (!membership) {
    throw new AuthorizationError('No perteneces a esta organización');
  }
  return true;
};

const getOrganizationDashboard = async ({ organizationId, from, to }, requester) => {
  const prisma = getPrisma();

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
  });
  if (!organization) {
    throw new NotFoundError('Organización no encontrada');
  }

  await ensureOrganizationAccess(prisma, organizationId, requester);

  const dateRange = buildDateRange({ from, to });
  const whereTasks = { organizationId };
  const whereAssignments = { organizationId };
  const wherePoints = { referenceType: 'ASSIGNMENT' };

  if (dateRange) {
    whereTasks.createdAt = dateRange;
    whereAssignments.createdAt = dateRange;
    wherePoints.createdAt = dateRange;
  }

  const [taskStats, assignmentStats, pointsEarned] = await Promise.all([
    prisma.task.groupBy({
      by: ['status'],
      where: whereTasks,
      _count: {
        id: true,
      },
    }),
    prisma.assignment.groupBy({
      by: ['status'],
      where: whereAssignments,
      _count: {
        id: true,
      },
    }),
    prisma.pointTransaction.aggregate({
      where: wherePoints,
      _sum: {
        points: true,
      },
    }),
  ]);

  const taskSummary = taskStats.reduce(
    (acc, stat) => ({
      ...acc,
      [stat.status]: stat._count.id,
    }),
    {},
  );

  const assignmentSummary = assignmentStats.reduce(
    (acc, stat) => ({
      ...acc,
      [stat.status]: stat._count.id,
    }),
    {},
  );

  const totalPoints = pointsEarned._sum.points || 0;

  const completedAssignments = assignmentSummary.VERIFIED || 0;
  const pendingTasks = taskSummary.PENDING || 0;
  const totalConsidered = completedAssignments + pendingTasks;
  const completionRate =
    totalConsidered > 0
      ? Number(((completedAssignments / totalConsidered) * 100).toFixed(2))
      : null;

  const topVolunteersRaw = await prisma.assignment.groupBy({
    by: ['volunteerId'],
    where: {
      organizationId,
      status: 'VERIFIED',
      ...(dateRange ? { completedAt: dateRange } : {}),
    },
    _count: {
      volunteerId: true,
    },
    orderBy: {
      _count: {
        volunteerId: 'desc',
      },
    },
    take: 5,
  });

  const volunteerIds = topVolunteersRaw.map((row) => row.volunteerId);
  const volunteers = await prisma.user.findMany({
    where: { id: { in: volunteerIds } },
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  });
  const volunteerMap = new Map(volunteers.map((v) => [v.id, v]));

  const topVolunteers = topVolunteersRaw.map((row) => {
    const volunteer = volunteerMap.get(row.volunteerId);
    return {
      volunteerId: row.volunteerId,
      fullName: volunteer?.fullName,
      email: volunteer?.email,
      assignmentsCompleted: row._count.volunteerId,
    };
  });

  return {
    organization: {
      id: organization.id,
      name: organization.name,
    },
    period: {
      from: from || null,
      to: to || null,
    },
    tasks: {
      total: taskStats.reduce((acc, stat) => acc + stat._count.id, 0),
      byStatus: taskSummary,
    },
    assignments: {
      total: assignmentStats.reduce((acc, stat) => acc + stat._count.id, 0),
      byStatus: assignmentSummary,
      completionRate,
    },
    recognition: {
      totalPointsAwarded: totalPoints,
    },
    topVolunteers,
  };
};

const getVolunteerKpis = async ({ from, to }, requester) => {
  const prisma = getPrisma();

  if (requester.role === 'ORGANIZATION') {
    throw new AuthorizationError(
      'Solo voluntarios o administradores pueden consultar este recurso',
    );
  }

  const profile = await prisma.volunteerProfile.findUnique({
    where: { userId: requester.id },
  });
  if (!profile) {
    throw new NotFoundError('Perfil de voluntario no encontrado');
  }

  const dateRange = buildDateRange({ from, to });
  const whereAssignments = { volunteerId: requester.id, status: 'VERIFIED' };
  const wherePoints = { volunteerProfileId: profile.id, type: 'EARN' };

  if (dateRange) {
    whereAssignments.completedAt = dateRange;
    wherePoints.createdAt = dateRange;
  }

  const [assignments, points] = await Promise.all([
    prisma.assignment.count({ where: whereAssignments }),
    prisma.pointTransaction.aggregate({
      where: wherePoints,
      _sum: {
        points: true,
      },
    }),
  ]);

  return {
    volunteerId: requester.id,
    level: profile.level,
    totalPoints: profile.totalPoints,
    assignmentsCompleted: assignments,
    pointsEarnedInPeriod: points._sum.points || 0,
  };
};

module.exports = {
  getOrganizationDashboard,
  getVolunteerKpis,
};
