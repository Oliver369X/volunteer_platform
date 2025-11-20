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

  const assignment = await prisma.assignment.findUnique({ 
    where: { id: assignmentId },
    include: {
      task: true,
    },
  });
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

  // Get badge codes from task metadata if not provided in payload
  let badgeCodesToAward = payload.badgeCodes || [];
  if (!badgeCodesToAward.length && assignment.task?.metadata) {
    const taskMetadata = typeof assignment.task.metadata === 'string' 
      ? JSON.parse(assignment.task.metadata) 
      : assignment.task.metadata;
    if (taskMetadata.badgeCodes && Array.isArray(taskMetadata.badgeCodes)) {
      badgeCodesToAward = taskMetadata.badgeCodes;
    }
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

    if (badgeCodesToAward.length) {
      const badges = await tx.badge.findMany({
        where: { code: { in: badgeCodesToAward } },
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
          badgeCodes: badgeCodesToAward,
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
      metadata: award.metadata,
      earnedAt: award.createdAt,
      createdAt: award.createdAt,
      awardedAt: award.createdAt,
      badge: {
        id: award.badge.id,
        code: award.badge.code,
        name: award.badge.name,
        description: award.badge.description,
        level: award.badge.level,
        category: award.badge.category,
        iconUrl: award.badge.iconUrl,
      },
      // También incluir propiedades directas para compatibilidad
      name: award.badge.name,
      description: award.badge.description,
      level: award.badge.level,
      iconUrl: award.badge.iconUrl,
    })),
  };
};

// ============================================
// GET MY ASSIGNMENTS - Ver mis asignaciones
// ============================================
const getMyAssignments = async (userId, filters = {}) => {
  const prisma = getPrisma();

  const where = {
    volunteerId: userId,
    deletedAt: null, // Exclude deleted assignments
  };

  // Filtro por status
  if (filters.status) {
    const statuses = filters.status.split(',').map((s) => s.trim());
    where.status = { in: statuses };
  }

  const assignments = await prisma.assignment.findMany({
    where,
    include: {
      task: {
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      volunteer: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      },
      assignedBy: {  // Changed from assignedByUser to assignedBy
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: [
      { assignedAt: 'desc' },
    ],
  });

  return assignments;
};

// ============================================
// GET ORGANIZATION COMPLETED ASSIGNMENTS - Ver asignaciones completadas de la organización
// ============================================
const getOrganizationCompletedAssignments = async (requester, filters = {}) => {
  const prisma = getPrisma();
  const { AuthorizationError } = require('../../core/api-error');

  // Obtener organizaciones del usuario
  const memberships = await prisma.organizationMember.findMany({
    where: { userId: requester.id },
    include: { organization: true },
  });

  if (requester.role !== 'ADMIN' && memberships.length === 0) {
    throw new AuthorizationError('No perteneces a ninguna organización');
  }

  const organizationIds = requester.role === 'ADMIN' 
    ? undefined 
    : memberships.map((m) => m.organizationId);

  const where = {
    organizationId: organizationIds ? { in: organizationIds } : undefined,
    status: { in: ['COMPLETED', 'VERIFIED'] },
    deletedAt: null,
  };

  // Filtro por status específico
  if (filters.status) {
    const statuses = filters.status.split(',').map((s) => s.trim());
    where.status = { in: statuses };
  }

  // Filtro por organización específica
  if (filters.organizationId) {
    // Verificar acceso
    if (requester.role !== 'ADMIN') {
      const hasAccess = memberships.some((m) => m.organizationId === filters.organizationId);
      if (!hasAccess) {
        throw new AuthorizationError('No tienes acceso a esta organización');
      }
    }
    where.organizationId = filters.organizationId;
  }

  const assignments = await prisma.assignment.findMany({
    where,
    include: {
      task: {
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      volunteer: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      },
      assignedBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: [
      { completedAt: 'desc' },
      { assignedAt: 'desc' },
    ],
  });

  return assignments;
};

// ============================================
// ACCEPT ASSIGNMENT - Aceptar asignación
// ============================================
const acceptAssignment = async (assignmentId, userId) => {
  const prisma = getPrisma();

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
  });

  if (!assignment) {
    throw new NotFoundError('Asignación no encontrada');
  }

  if (assignment.volunteerId !== userId) {
    throw new AuthorizationError('No puedes aceptar una asignación que no es tuya');
  }

  if (assignment.status !== 'PENDING') {
    throw new ValidationError('Solo puedes aceptar asignaciones pendientes');
  }

  const updated = await prisma.assignment.update({
    where: { id: assignmentId },
    data: {
      status: 'ACCEPTED',
      respondedAt: new Date(),
    },
    include: {
      task: {
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      volunteer: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  return updated;
};

// ============================================
// REJECT ASSIGNMENT - Rechazar asignación
// ============================================
const rejectAssignment = async (assignmentId, userId, reason = null) => {
  const prisma = getPrisma();

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
  });

  if (!assignment) {
    throw new NotFoundError('Asignación no encontrada');
  }

  if (assignment.volunteerId !== userId) {
    throw new AuthorizationError('No puedes rechazar una asignación que no es tuya');
  }

  if (assignment.status !== 'PENDING') {
    throw new ValidationError('Solo puedes rechazar asignaciones pendientes');
  }

  const updated = await prisma.assignment.update({
    where: { id: assignmentId },
    data: {
      status: 'REJECTED',
      respondedAt: new Date(),
      verificationNotes: reason || 'Rechazada por el voluntario',
    },
    include: {
      task: {
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      volunteer: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  return updated;
};

/**
 * Marcar asignación como completada (desde el voluntario)
 * @param {string} assignmentId - ID de la asignación
 * @param {string} userId - ID del voluntario
 * @param {Buffer} evidenceFile - Archivo de evidencia (opcional)
 * @param {string} notes - Notas del voluntario
 */
const markAsCompleted = async (assignmentId, userId, evidenceFile = null, notes = '') => {
  const prisma = getPrisma();
  const cloudinaryClient = require('../../services/cloudinary-client');
  const logger = require('../../utils/logger');

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
  });

  if (!assignment) {
    throw new NotFoundError('Asignación no encontrada');
  }

  if (assignment.volunteerId !== userId) {
    throw new AuthorizationError('No puedes completar una asignación que no es tuya');
  }

  if (!['ACCEPTED', 'IN_PROGRESS'].includes(assignment.status)) {
    throw new ValidationError('Solo puedes completar asignaciones aceptadas o en progreso');
  }

  let evidenceUrl = null;

  // Subir evidencia si existe
  if (evidenceFile) {
    try {
      const result = await cloudinaryClient.uploadEvidence(evidenceFile, assignmentId);
      evidenceUrl = result.url;
      logger.info('Evidencia subida a Cloudinary', { url: evidenceUrl });
    } catch (error) {
      logger.warn('Error al subir evidencia, continuando sin ella', { error: error.message });
    }
  }

  // Actualizar asignación a COMPLETED (pendiente de verificación)
  const updated = await prisma.assignment.update({
    where: { id: assignmentId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      evidenceUrl,
      verificationNotes: notes,
    },
    include: {
      task: {
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      volunteer: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  return updated;
};

// ============================================
// CREATE BADGE - Crear badge NFT
// ============================================
const createBadge = async (payload, iconFile, requester) => {
  const prisma = getPrisma();
  const cloudinaryClient = require('../../services/cloudinary-client');
  const logger = require('../../utils/logger');

  // Verificar que el usuario es organización o admin
  if (requester.role !== 'ORGANIZATION' && requester.role !== 'ADMIN') {
    throw new AuthorizationError('Solo las organizaciones pueden crear badges');
  }

  // Verificar que el código no existe
  const existingBadge = await prisma.badge.findUnique({
    where: { code: payload.code },
  });

  if (existingBadge) {
    throw new ValidationError('Ya existe un badge con este código');
  }

  let iconUrl = null;

  // Subir imagen si existe
  if (iconFile) {
    try {
      const result = await cloudinaryClient.uploadImage(iconFile, {
        folder: 'badges',
        transformation: [
          { width: 512, height: 512, crop: 'limit' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
      });
      iconUrl = result.url;
      logger.info('Imagen de badge subida a Cloudinary', { url: iconUrl });
    } catch (error) {
      logger.warn('Error al subir imagen de badge', { error: error.message });
      throw new ValidationError('Error al subir la imagen del badge');
    }
  }

  // Crear badge
  const badge = await prisma.badge.create({
    data: {
      code: payload.code,
      name: payload.name,
      description: payload.description,
      category: payload.category,
      level: payload.level || 'BRONCE',
      criteria: payload.criteria || {},
      iconUrl,
    },
  });

  logger.info('Badge creado', { badgeId: badge.id, code: badge.code });

  return badge;
};

// ============================================
// LIST BADGES - Listar todos los badges
// ============================================
const listBadges = async (filters = {}) => {
  const prisma = getPrisma();

  const where = {
    deletedAt: null,
  };

  if (filters.level) {
    where.level = filters.level;
  }

  if (filters.category) {
    where.category = filters.category;
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { code: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const badges = await prisma.badge.findMany({
    where,
    orderBy: [
      { createdAt: 'desc' },
    ],
    take: filters.limit || 100,
  });

  return badges;
};

module.exports = {
  completeAssignment,
  getLeaderboard,
  getVolunteerGamification,
  getMyAssignments,
  getOrganizationCompletedAssignments,
  acceptAssignment,
  rejectAssignment,
  markAsCompleted,
  createBadge,
  listBadges,
};
