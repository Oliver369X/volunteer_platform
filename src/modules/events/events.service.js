'use strict';

const { getPrisma } = require('../../database');
const { NotFoundError, ForbiddenError, ValidationError } = require('../../core/api-error');
const NotificationService = require('../../services/notification.service');

/**
 * CU08: Creación de Eventos o Proyectos
 * CU20: Modificación y Cancelación de Eventos
 */

/**
 * Crea un nuevo evento
 */
const createEvent = async (userId, payload) => {
  const prisma = getPrisma();

  // Verificar que el usuario tiene una organización
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      organizationId: payload.organizationId,
      role: { in: ['OWNER', 'COORDINATOR'] },
    },
  });

  if (!membership) {
    throw new ForbiddenError('No tienes permisos para crear eventos en esta organización');
  }

  // Verificar cuota del plan (aquí validaríamos el plan de suscripción)
  // Por ahora permitimos crear eventos sin límite

  const event = await prisma.event.create({
    data: {
      organizationId: payload.organizationId,
      createdByUserId: userId,
      title: payload.title,
      description: payload.description,
      status: 'DRAFT',
      locationName: payload.locationName,
      latitude: payload.latitude,
      longitude: payload.longitude,
      startDate: payload.startDate,
      endDate: payload.endDate,
      coverImageUrl: payload.coverImageUrl,
      metadata: payload.metadata || {},
    },
  });

  // Asignar coordinadores si se proporcionaron
  if (payload.coordinatorIds && payload.coordinatorIds.length > 0) {
    await Promise.all(
      payload.coordinatorIds.map((coordinatorId) =>
        prisma.eventCoordinator.create({
          data: {
            eventId: event.id,
            userId: coordinatorId,
          },
        }),
      ),
    );
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      organizationId: payload.organizationId,
      action: 'EVENT_CREATED',
      actorType: 'ORGANIZATION',
      actorId: userId,
      entityType: 'EVENT',
      entityId: event.id,
      metadata: { eventTitle: event.title },
    },
  });

  return event;
};

/**
 * Lista eventos de una organización
 */
const listEvents = async (userId, organizationId, filters = {}) => {
  const prisma = getPrisma();

  // Verificar membresía
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      organizationId,
    },
  });

  if (!membership) {
    throw new ForbiddenError('No tienes acceso a esta organización');
  }

  const where = {
    organizationId,
    deletedAt: null,
  };

  if (filters.status) {
    where.status = filters.status;
  }

  const events = await prisma.event.findMany({
    where,
    include: {
      creator: {
        select: {
          id: true,
          fullName: true,
        },
      },
      coordinators: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      },
      _count: {
        select: {
          tasks: true,
        },
      },
    },
    orderBy: {
      startDate: 'desc',
    },
  });

  return events;
};

/**
 * Obtiene detalles de un evento
 */
const getEventById = async (userId, eventId) => {
  const prisma = getPrisma();

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      organization: true,
      creator: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      coordinators: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      },
      tasks: {
        include: {
          _count: {
            select: {
              assignments: true,
            },
          },
        },
      },
    },
  });

  if (!event) {
    throw new NotFoundError('Evento no encontrado');
  }

  // Verificar acceso
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      organizationId: event.organizationId,
    },
  });

  if (!membership) {
    throw new ForbiddenError('No tienes acceso a este evento');
  }

  return event;
};

/**
 * Actualiza un evento
 */
const updateEvent = async (userId, eventId, payload) => {
  const prisma = getPrisma();

  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new NotFoundError('Evento no encontrado');
  }

  // Verificar permisos
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      organizationId: event.organizationId,
      role: { in: ['OWNER', 'COORDINATOR'] },
    },
  });

  if (!membership) {
    throw new ForbiddenError('No tienes permisos para editar este evento');
  }

  // No permitir ediciones si el evento ya inició
  if (event.status === 'IN_PROGRESS') {
    throw new ValidationError(
      'No se puede editar un evento en progreso. Solo puedes gestionar incidencias',
    );
  }

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: {
      title: payload.title,
      description: payload.description,
      locationName: payload.locationName,
      latitude: payload.latitude,
      longitude: payload.longitude,
      startDate: payload.startDate,
      endDate: payload.endDate,
      coverImageUrl: payload.coverImageUrl,
      metadata: payload.metadata,
    },
  });

  // Notificar a voluntarios asignados
  const tasks = await prisma.task.findMany({
    where: { eventId },
    include: {
      assignments: {
        where: { status: { in: ['ACCEPTED', 'PENDING'] } },
        include: {
          volunteer: true,
        },
      },
    },
  });

  const volunteers = tasks.flatMap((task) => task.assignments.map((a) => a.volunteer));
  const uniqueVolunteers = [...new Map(volunteers.map((v) => [v.id, v])).values()];

  await Promise.all(
    uniqueVolunteers.map((volunteer) =>
      NotificationService.sendEmail({
        to: volunteer.email,
        subject: `Evento Actualizado: ${updated.title}`,
        html: `
          <h2>Evento Actualizado</h2>
          <p>Hola ${volunteer.fullName},</p>
          <p>El evento "${updated.title}" ha sido actualizado.</p>
          <p>Por favor revisa los nuevos detalles en la plataforma.</p>
        `,
      }),
    ),
  );

  return updated;
};

/**
 * Cancela un evento
 */
const cancelEvent = async (userId, eventId, reason) => {
  const prisma = getPrisma();

  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new NotFoundError('Evento no encontrado');
  }

  // Verificar permisos
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      organizationId: event.organizationId,
      role: { in: ['OWNER'] },
    },
  });

  if (!membership) {
    throw new ForbiddenError('Solo el dueño puede cancelar eventos');
  }

  return prisma.$transaction(async (tx) => {
    // Actualizar evento
    const cancelled = await tx.event.update({
      where: { id: eventId },
      data: {
      status: 'CANCELLED',
      metadata: {
        ...(event.metadata || {}),
        cancellationReason: reason,
        cancelledAt: new Date(),
      },
      },
    });

    // Cancelar todas las tareas del evento
    await tx.task.updateMany({
      where: { eventId },
      data: { status: 'CANCELLED' },
    });

    // Notificar a todos los voluntarios asignados
    const tasks = await tx.task.findMany({
      where: { eventId },
      include: {
        assignments: {
          where: { status: { in: ['ACCEPTED', 'PENDING', 'IN_PROGRESS'] } },
          include: {
            volunteer: true,
          },
        },
      },
    });

    const volunteers = tasks.flatMap((task) => task.assignments.map((a) => a.volunteer));
    const uniqueVolunteers = [...new Map(volunteers.map((v) => [v.id, v])).values()];

    await Promise.all(
      uniqueVolunteers.map((volunteer) =>
        NotificationService.sendEmail({
          to: volunteer.email,
          subject: `Evento Cancelado: ${event.title}`,
          html: `
            <h2>Evento Cancelado</h2>
            <p>Hola ${volunteer.fullName},</p>
            <p>Lamentamos informarte que el evento "${event.title}" ha sido cancelado.</p>
            <p><strong>Motivo:</strong> ${reason || 'No especificado'}</p>
          `,
        }),
      ),
    );

    // Audit log
    await tx.auditLog.create({
      data: {
        organizationId: event.organizationId,
        action: 'EVENT_CANCELLED',
        actorType: 'ORGANIZATION',
        actorId: userId,
        entityType: 'EVENT',
        entityId: eventId,
        metadata: { reason },
      },
    });

    return cancelled;
  });
};

/**
 * Publica un evento (cambia de DRAFT a PUBLISHED)
 */
const publishEvent = async (userId, eventId) => {
  const prisma = getPrisma();

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      tasks: true,
    },
  });

  if (!event) {
    throw new NotFoundError('Evento no encontrado');
  }

  if (event.status !== 'DRAFT') {
    throw new ValidationError('Solo se pueden publicar eventos en borrador');
  }

  // Verificar que tenga al menos una tarea
  if (!event.tasks || event.tasks.length === 0) {
    throw new ValidationError('El evento debe tener al menos una tarea antes de publicarse');
  }

  const published = await prisma.event.update({
    where: { id: eventId },
    data: { status: 'PUBLISHED' },
  });

  return published;
};

module.exports = {
  createEvent,
  listEvents,
  getEventById,
  updateEvent,
  cancelEvent,
  publishEvent,
};


