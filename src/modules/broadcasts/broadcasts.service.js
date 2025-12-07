'use strict';

const { getPrisma } = require('../../database');
const { NotFoundError, ForbiddenError, ValidationError } = require('../../core/api-error');
const NotificationService = require('../../services/notification.service');

/**
 * CU21: Difusión de Comunicados (Broadcasting)
 * Servicio para enviar mensajes masivos a voluntarios
 */

/**
 * Envía un comunicado a voluntarios de un evento
 */
const sendBroadcast = async (userId, payload) => {
  const prisma = getPrisma();

  // Verificar permisos
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      organizationId: payload.organizationId,
      role: { in: ['OWNER', 'COORDINATOR'] },
    },
  });

  if (!membership) {
    throw new ForbiddenError('No tienes permisos para enviar comunicados');
  }

  // Si es para un evento, validar que existe
  let recipients = [];

  if (payload.eventId) {
    const event = await prisma.event.findUnique({
      where: { id: payload.eventId },
      include: {
        tasks: {
          include: {
            assignments: {
              where: {
                status: { in: ['ACCEPTED', 'PENDING', 'IN_PROGRESS'] },
              },
              include: {
                volunteer: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundError('Evento no encontrado');
    }

    // Obtener voluntarios únicos del evento
    const volunteersMap = new Map();
    event.tasks.forEach((task) => {
      task.assignments.forEach((assignment) => {
        if (!volunteersMap.has(assignment.volunteer.id)) {
          volunteersMap.set(assignment.volunteer.id, assignment.volunteer);
        }
      });
    });

    recipients = Array.from(volunteersMap.values());
  } else {
    // Broadcast general a todos los voluntarios de la organización
    const tasks = await prisma.task.findMany({
      where: {
        organizationId: payload.organizationId,
        status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
      },
      include: {
        assignments: {
          where: {
            status: { in: ['ACCEPTED', 'PENDING', 'IN_PROGRESS'] },
          },
          include: {
            volunteer: true,
          },
        },
      },
    });

    const volunteersMap = new Map();
    tasks.forEach((task) => {
      task.assignments.forEach((assignment) => {
        if (!volunteersMap.has(assignment.volunteer.id)) {
          volunteersMap.set(assignment.volunteer.id, assignment.volunteer);
        }
      });
    });

    recipients = Array.from(volunteersMap.values());
  }

  if (recipients.length === 0) {
    throw new ValidationError('No hay voluntarios asignados para recibir el comunicado');
  }

  // Crear registro de broadcast
  const broadcast = await prisma.broadcast.create({
    data: {
      eventId: payload.eventId,
      organizationId: payload.organizationId,
      sentByUserId: userId,
      channel: payload.channel || 'EMAIL',
      subject: payload.subject,
      message: payload.message,
      recipientCount: recipients.length,
      sentAt: new Date(),
      metadata: payload.metadata || {},
    },
  });

  // Enviar según el canal
  if (payload.channel === 'EMAIL' || payload.channel === 'ALL') {
    await Promise.all(
      recipients.map((volunteer) =>
        NotificationService.sendEmail({
          to: volunteer.email,
          subject: payload.subject,
          html: `
            <h2>${payload.subject}</h2>
            <p>${payload.message}</p>
            <hr>
            <p><small>Este es un comunicado oficial de la organización</small></p>
          `,
        }).catch((err) => {
          console.error(`Error enviando email a ${volunteer.email}:`, err);
        }),
      ),
    );
  }

  if (payload.channel === 'PUSH' || payload.channel === 'ALL') {
    // Implementar notificaciones push aquí
    // Por ahora solo registramos el intento
    console.log(`Push notification sent to ${recipients.length} volunteers`);
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      organizationId: payload.organizationId,
      action: 'BROADCAST_SENT',
      actorType: 'ORGANIZATION',
      actorId: userId,
      entityType: 'BROADCAST',
      entityId: broadcast.id,
      metadata: {
        channel: payload.channel,
        recipientCount: recipients.length,
      },
    },
  });

  return {
    broadcast,
    recipientCount: recipients.length,
    success: true,
  };
};

/**
 * Lista broadcasts enviados
 */
const listBroadcasts = async (userId, organizationId) => {
  const prisma = getPrisma();

  // Verificar acceso
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      organizationId,
    },
  });

  if (!membership) {
    throw new ForbiddenError('No tienes acceso a esta organización');
  }

  const broadcasts = await prisma.broadcast.findMany({
    where: {
      organizationId,
      deletedAt: null,
    },
    include: {
      sentBy: {
        select: {
          id: true,
          fullName: true,
        },
      },
      event: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      sentAt: 'desc',
    },
  });

  return broadcasts;
};

/**
 * Obtiene detalles de un broadcast
 */
const getBroadcastById = async (userId, broadcastId) => {
  const prisma = getPrisma();

  const broadcast = await prisma.broadcast.findUnique({
    where: { id: broadcastId },
    include: {
      sentBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      event: true,
      organization: true,
    },
  });

  if (!broadcast) {
    throw new NotFoundError('Broadcast no encontrado');
  }

  // Verificar acceso
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      organizationId: broadcast.organizationId,
    },
  });

  if (!membership) {
    throw new ForbiddenError('No tienes acceso a este broadcast');
  }

  return broadcast;
};

module.exports = {
  sendBroadcast,
  listBroadcasts,
  getBroadcastById,
};


