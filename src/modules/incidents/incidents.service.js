'use strict';

const { getPrisma } = require('../../database');
const { NotFoundError, ForbiddenError, ValidationError } = require('../../core/api-error');
const NotificationService = require('../../services/notification.service');

/**
 * CU22: Gestión de Incidencias y Disputas
 * Servicio para reportar y resolver problemas durante eventos
 */

/**
 * Crea un nuevo reporte de incidencia
 */
const createIncident = async (userId, payload) => {
  const prisma = getPrisma();

  // Validar que la tarea existe si se proporciona
  if (payload.taskId) {
    const task = await prisma.task.findUnique({
      where: { id: payload.taskId },
    });

    if (!task) {
      throw new NotFoundError('Tarea no encontrada');
    }
  }

  const incident = await prisma.incident.create({
    data: {
      reporterId: userId,
      taskId: payload.taskId,
      organizationId: payload.organizationId,
      category: payload.category,
      priority: payload.priority || 'MEDIUM',
      status: 'OPEN',
      title: payload.title,
      description: payload.description,
      evidenceUrls: payload.evidenceUrls || [],
      metadata: payload.metadata || {},
    },
  });

  // Notificar a administradores y organizadores
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
  });

  await Promise.all(
    admins.map((admin) =>
      NotificationService.sendEmail({
        to: admin.email,
        subject: `Nueva Incidencia: ${incident.title}`,
        html: `
          <h2>Nueva Incidencia Reportada</h2>
          <p><strong>Prioridad:</strong> ${incident.priority}</p>
          <p><strong>Categoría:</strong> ${incident.category}</p>
          <p><strong>Descripción:</strong> ${incident.description}</p>
        `,
      }),
    ),
  );

  // Audit log
  await prisma.auditLog.create({
    data: {
      organizationId: payload.organizationId,
      action: 'INCIDENT_CREATED',
      actorType: 'USER',
      actorId: userId,
      entityType: 'INCIDENT',
      entityId: incident.id,
      metadata: {
        category: incident.category,
        priority: incident.priority,
      },
    },
  });

  return incident;
};

/**
 * Lista incidencias con filtros
 */
const listIncidents = async (userId, filters = {}) => {
  const prisma = getPrisma();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organizationMemberships: {
        select: {
          organizationId: true,
        },
      },
    },
  });

  const where = { deletedAt: null };

  // Filtros de acceso según rol
  if (user.role === 'ADMIN') {
    // Admin ve todas
  } else if (user.role === 'ORGANIZATION') {
    // Organizadores ven solo de sus organizaciones
    const orgIds = user.organizationMemberships.map((m) => m.organizationId);
    where.organizationId = { in: orgIds };
  } else if (user.role === 'VOLUNTEER') {
    // Voluntarios solo ven las que reportaron
    where.reporterId = userId;
  }

  // Aplicar filtros adicionales
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.priority) {
    where.priority = filters.priority;
  }
  if (filters.category) {
    where.category = filters.category;
  }

  const incidents = await prisma.incident.findMany({
    where,
    include: {
      reporter: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      task: {
        select: {
          id: true,
          title: true,
        },
      },
      resolver: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
  });

  return incidents;
};

/**
 * Obtiene detalles de una incidencia
 */
const getIncidentById = async (userId, incidentId) => {
  const prisma = getPrisma();

  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: {
      reporter: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      task: true,
      organization: true,
      resolver: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  if (!incident) {
    throw new NotFoundError('Incidencia no encontrada');
  }

  // Verificar acceso
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organizationMemberships: {
        select: {
          organizationId: true,
        },
      },
    },
  });

  if (user.role !== 'ADMIN') {
    const hasAccess =
      incident.reporterId === userId ||
      user.organizationMemberships.some((m) => m.organizationId === incident.organizationId);

    if (!hasAccess) {
      throw new ForbiddenError('No tienes acceso a esta incidencia');
    }
  }

  return incident;
};

/**
 * Actualiza el estado de una incidencia
 */
const updateIncidentStatus = async (userId, incidentId, newStatus, resolution = null) => {
  const prisma = getPrisma();

  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: {
      reporter: true,
    },
  });

  if (!incident) {
    throw new NotFoundError('Incidencia no encontrada');
  }

  // Solo admins y organizadores pueden actualizar estado
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organizationMemberships: {
        select: {
          organizationId: true,
        },
      },
    },
  });

  if (user.role !== 'ADMIN') {
    const hasAccess = user.organizationMemberships.some(
      (m) => m.organizationId === incident.organizationId,
    );
    if (!hasAccess) {
      throw new ForbiddenError('No tienes permisos para actualizar esta incidencia');
    }
  }

  const updateData = {
    status: newStatus,
  };

  if (newStatus === 'RESOLVED' && resolution) {
    updateData.resolution = resolution;
    updateData.resolvedById = userId;
    updateData.resolvedAt = new Date();
  }

  const updated = await prisma.incident.update({
    where: { id: incidentId },
    data: updateData,
  });

  // Notificar al reportante
  if (newStatus === 'RESOLVED') {
    await NotificationService.sendEmail({
      to: incident.reporter.email,
      subject: `Incidencia Resuelta: ${incident.title}`,
      html: `
        <h2>Incidencia Resuelta</h2>
        <p>Tu incidencia "${incident.title}" ha sido resuelta.</p>
        <p><strong>Resolución:</strong> ${resolution || 'No especificada'}</p>
      `,
    });
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      organizationId: incident.organizationId,
      action: `INCIDENT_${newStatus}`,
      actorType: 'USER',
      actorId: userId,
      entityType: 'INCIDENT',
      entityId: incidentId,
      metadata: { resolution },
    },
  });

  return updated;
};

module.exports = {
  createIncident,
  listIncidents,
  getIncidentById,
  updateIncidentStatus,
};


