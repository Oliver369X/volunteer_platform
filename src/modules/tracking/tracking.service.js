'use strict';

const { getPrisma } = require('../../database');
const { NotFoundError, ForbiddenError, ValidationError } = require('../../core/api-error');

/**
 * CU23: Monitoreo de Ubicación de Voluntarios (Tiempo Real)
 * Servicio para registrar y consultar ubicaciones GPS de voluntarios
 */

/**
 * Registra una nueva ubicación del voluntario
 */
const recordLocation = async (userId, payload) => {
  const prisma = getPrisma();

  // Verificar que el usuario es voluntario
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.role !== 'VOLUNTEER') {
    throw new ForbiddenError('Solo voluntarios pueden registrar ubicaciones');
  }

  // Si se proporciona taskId, validar que el voluntario está asignado
  if (payload.taskId) {
    const assignment = await prisma.assignment.findFirst({
      where: {
        taskId: payload.taskId,
        volunteerId: userId,
        status: 'IN_PROGRESS',
      },
    });

    if (!assignment) {
      throw new ForbiddenError('No estás asignado a esta tarea o no está en progreso');
    }
  }

  const location = await prisma.locationTracking.create({
    data: {
      volunteerId: userId,
      taskId: payload.taskId,
      latitude: payload.latitude,
      longitude: payload.longitude,
      accuracy: payload.accuracy,
      recordedAt: new Date(),
      metadata: payload.metadata || {},
    },
  });

  return location;
};

/**
 * Obtiene la última ubicación conocida de un voluntario
 */
const getLastLocation = async (userId, volunteerId) => {
  const prisma = getPrisma();

  // Verificar permisos (coordinador u organizador)
  const requester = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organizationMemberships: true,
    },
  });

  if (
    !requester ||
    !['ADMIN', 'ORGANIZATION'].includes(requester.role)
  ) {
    throw new ForbiddenError('No tienes permisos para ver ubicaciones');
  }

  const lastLocation = await prisma.locationTracking.findFirst({
    where: { volunteerId },
    orderBy: { recordedAt: 'desc' },
    include: {
      volunteer: {
        select: {
          id: true,
          fullName: true,
        },
      },
      task: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  return lastLocation;
};

/**
 * Obtiene ubicaciones de voluntarios en un evento específico
 */
const getEventVolunteersLocations = async (userId, eventId) => {
  const prisma = getPrisma();

  // Verificar que el evento existe y el usuario tiene acceso
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new NotFoundError('Evento no encontrado');
  }

  // Verificar membresía
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      organizationId: event.organizationId,
    },
  });

  if (!membership) {
    throw new ForbiddenError('No tienes acceso a este evento');
  }

  // Obtener todas las tareas del evento
  const tasks = await prisma.task.findMany({
    where: { eventId },
    select: { id: true },
  });

  const taskIds = tasks.map((t) => t.id);

  // Obtener última ubicación de cada voluntario activo
  const locations = await prisma.locationTracking.findMany({
    where: {
      taskId: { in: taskIds },
      recordedAt: {
        gte: new Date(Date.now() - 30 * 60 * 1000), // Últimos 30 minutos
      },
    },
    include: {
      volunteer: {
        select: {
          id: true,
          fullName: true,
        },
      },
      task: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: { recordedAt: 'desc' },
  });

  // Agrupar por voluntario para obtener solo la última ubicación de cada uno
  const uniqueLocations = [];
  const seen = new Set();

  for (const loc of locations) {
    if (!seen.has(loc.volunteerId)) {
      uniqueLocations.push(loc);
      seen.add(loc.volunteerId);
    }
  }

  return uniqueLocations;
};

/**
 * Obtiene el historial de ubicaciones de un voluntario en una tarea
 */
const getVolunteerTaskHistory = async (userId, taskId, volunteerId) => {
  const prisma = getPrisma();

  // Verificar acceso
  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new NotFoundError('Tarea no encontrada');
  }

  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      organizationId: task.organizationId,
    },
  });

  if (!membership) {
    throw new ForbiddenError('No tienes acceso a esta información');
  }

  const locations = await prisma.locationTracking.findMany({
    where: {
      taskId,
      volunteerId,
    },
    orderBy: { recordedAt: 'asc' },
  });

  return locations;
};

module.exports = {
  recordLocation,
  getLastLocation,
  getEventVolunteersLocations,
  getVolunteerTaskHistory,
};


