'use strict';

const { getPrisma } = require('../../database');
const { ForbiddenError, NotFoundError } = require('../../core/api-error');

/**
 * CU19: Generación de Reportes de Auditoría
 * Servicio para consultar logs de seguridad y trazabilidad
 */

/**
 * Lista logs de auditoría con filtros
 */
const getAuditLogs = async (userId, filters = {}) => {
  const prisma = getPrisma();

  // Solo administradores pueden ver audit logs completos
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.role !== 'ADMIN') {
    throw new ForbiddenError('Solo administradores pueden acceder a logs de auditoría');
  }

  const where = {
    deletedAt: null,
  };

  // Aplicar filtros
  if (filters.organizationId) {
    where.organizationId = filters.organizationId;
  }
  if (filters.actorId) {
    where.actorId = filters.actorId;
  }
  if (filters.action) {
    where.action = { contains: filters.action };
  }
  if (filters.entityType) {
    where.entityType = filters.entityType;
  }
  if (filters.startDate) {
    where.createdAt = { gte: new Date(filters.startDate) };
  }
  if (filters.endDate) {
    where.createdAt = {
      ...where.createdAt,
      lte: new Date(filters.endDate),
    };
  }

  const logs = await prisma.auditLog.findMany({
    where,
    include: {
      actor: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      },
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: filters.limit || 100,
  });

  return logs;
};

/**
 * Genera reporte de auditoría para un usuario específico
 */
const generateUserAuditReport = async (adminId, targetUserId) => {
  const prisma = getPrisma();

  // Verificar que es admin
  const admin = await prisma.user.findUnique({
    where: { id: adminId },
  });

  if (!admin || admin.role !== 'ADMIN') {
    throw new ForbiddenError('Solo administradores pueden generar reportes');
  }

  // Verificar que el usuario existe
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!targetUser) {
    throw new NotFoundError('Usuario no encontrado');
  }

  // Obtener todos los logs del usuario
  const logs = await prisma.auditLog.findMany({
    where: {
      actorId: targetUserId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 1000,
  });

  return {
    user: {
      id: targetUser.id,
      fullName: targetUser.fullName,
      email: targetUser.email,
      role: targetUser.role,
      status: targetUser.status,
      createdAt: targetUser.createdAt,
      lastLoginAt: targetUser.lastLoginAt,
    },
    totalActions: logs.length,
    logs,
  };
};

/**
 * Genera reporte de auditoría para un evento específico
 */
const generateEventAuditReport = async (adminId, eventId) => {
  const prisma = getPrisma();

  // Verificar que es admin
  const admin = await prisma.user.findUnique({
    where: { id: adminId },
  });

  if (!admin || admin.role !== 'ADMIN') {
    throw new ForbiddenError('Solo administradores pueden generar reportes');
  }

  // Verificar que el evento existe
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new NotFoundError('Evento no encontrado');
  }

  // Obtener todos los logs relacionados
  const logs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { entityType: 'EVENT', entityId: eventId },
        { organizationId: event.organizationId },
      ],
    },
    include: {
      actor: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return {
    event: {
      id: event.id,
      title: event.title,
      status: event.status,
      createdAt: event.createdAt,
    },
    totalActions: logs.length,
    logs,
  };
};

/**
 * Registra un intento de acceso no autorizado
 */
const logUnauthorizedAccess = async (userId, resource, ipAddress, userAgent) => {
  const prisma = getPrisma();

  await prisma.auditLog.create({
    data: {
      action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      actorType: 'USER',
      actorId: userId,
      entityType: 'SECURITY',
      metadata: {
        resource,
        timestamp: new Date(),
        severity: 'HIGH',
      },
      ipAddress,
      userAgent,
    },
  });

  console.warn(`[SECURITY] Unauthorized access attempt by user ${userId} to ${resource}`);
};

module.exports = {
  getAuditLogs,
  generateUserAuditReport,
  generateEventAuditReport,
  logUnauthorizedAccess,
};


