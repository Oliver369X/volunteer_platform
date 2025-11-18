'use strict';

const { getPrisma } = require('../../database');
const { AuthorizationError, NotFoundError, ValidationError } = require('../../core/api-error');
const notificationService = require('../../services/notification.service');

const ensureOrganizationAccess = async (prisma, organizationId, requester) => {
  if (requester.role === 'ADMIN') {
    return { role: 'ADMIN' };
  }

  if (requester.role !== 'ORGANIZATION') {
    throw new AuthorizationError('No tienes permisos para gestionar tareas de una organización');
  }

  const membership = await prisma.organizationMember.findFirst({
    where: { organizationId, userId: requester.id },
  });

  if (!membership) {
    throw new AuthorizationError('No perteneces a esta organización');
  }

  return membership;
};

const createTask = async (payload, requester) => {
  const prisma = getPrisma();

  const organization = await prisma.organization.findUnique({
    where: { id: payload.organizationId },
  });
  if (!organization) {
    throw new NotFoundError('Organización no encontrada');
  }

  await ensureOrganizationAccess(prisma, organization.id, requester);

  const task = await prisma.task.create({
    data: {
      organizationId: organization.id,
      createdByUserId: requester.id,
      title: payload.title,
      description: payload.description,
      urgency: payload.urgency,
      category: payload.category,
      skillsRequired: payload.skillsRequired || [],
      locationName: payload.locationName,
      latitude: payload.latitude,
      longitude: payload.longitude,
      startAt: payload.startAt,
      endAt: payload.endAt,
      volunteersNeeded: payload.volunteersNeeded,
      metadata: payload.metadata,
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: organization.id,
      action: 'TASK_CREATED',
      actorType: requester.role,
      actorId: requester.id,
      entityType: 'TASK',
      entityId: task.id,
      metadata: {
        title: task.title,
        urgency: task.urgency,
      },
    },
  });

  return task;
};

const updateTask = async (taskId, payload, requester) => {
  const prisma = getPrisma();

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    throw new NotFoundError('Tarea no encontrada');
  }

  await ensureOrganizationAccess(prisma, task.organizationId, requester);

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: payload,
  });

  await prisma.auditLog.create({
    data: {
      organizationId: task.organizationId,
      action: 'TASK_UPDATED',
      actorType: requester.role,
      actorId: requester.id,
      entityType: 'TASK',
      entityId: task.id,
      metadata: payload,
    },
  });

  return updated;
};

const updateTaskStatus = async (taskId, status, requester) => {
  const prisma = getPrisma();

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { organization: true },
  });
  if (!task) {
    throw new NotFoundError('Tarea no encontrada');
  }

  await ensureOrganizationAccess(prisma, task.organizationId, requester);

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { status },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: task.organizationId,
      action: 'TASK_STATUS_CHANGED',
      actorType: requester.role,
      actorId: requester.id,
      entityType: 'TASK',
      entityId: task.id,
      metadata: { status },
    },
  });

  await notificationService.notifyTaskStatusChange({
    organization: task.organization,
    task: updated,
    status,
  });

  return updated;
};

const getTask = async (taskId, requester) => {
  const prisma = getPrisma();

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
      assignments: {
        include: {
          volunteer: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      },
    },
  });
  if (!task) {
    throw new NotFoundError('Tarea no encontrada');
  }

  if (requester.role === 'VOLUNTEER') {
    const isAssigned = task.assignments.some(
      (assignment) => assignment.volunteerId === requester.id,
    );
    if (!isAssigned && task.status === 'CANCELLED') {
      throw new AuthorizationError('No tienes acceso a esta tarea');
    }
  } else if (requester.role === 'ORGANIZATION') {
    const membership = await ensureOrganizationAccess(prisma, task.organizationId, requester);
    if (!membership) {
      throw new AuthorizationError('No perteneces a esta organización');
    }
  }

  return task;
};

const listTasks = async (filters, requester) => {
  const prisma = getPrisma();

  const where = {};
  const include = {
    organization: {
      select: {
        id: true,
        name: true,
      },
    },
    assignments: {
      select: {
        id: true,
        volunteerId: true,
        status: true,
      },
    },
  };

  if (filters.status) {
    const statusArray = Array.isArray(filters.status) ? filters.status : [filters.status];
    where.status = { in: statusArray };
  }

  if (filters.urgency) {
    where.urgency = filters.urgency;
  }

  if (filters.organizationId) {
    where.organizationId = filters.organizationId;
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (requester.role === 'VOLUNTEER') {
    if (filters.assignedToMe) {
      where.assignments = {
        some: {
          volunteerId: requester.id,
        },
      };
    } else {
      where.status = where.status || { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] };
    }
  } else if (requester.role === 'ORGANIZATION') {
    const memberships = await prisma.organizationMember.findMany({
      where: { userId: requester.id },
      select: { organizationId: true },
    });
    const organizationIds = memberships.map((m) => m.organizationId);
    if (organizationIds.length === 0) {
      return [];
    }
    where.organizationId = where.organizationId || { in: organizationIds };
  }

  const tasks = await prisma.task.findMany({
    where,
    include,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return tasks;
};

module.exports = {
  createTask,
  updateTask,
  updateTaskStatus,
  getTask,
  listTasks,
};
