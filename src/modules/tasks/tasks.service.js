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

  // Handle metadata with badgeCodes
  let taskMetadata = payload.metadata || {};
  if (payload.badgeCodes && Array.isArray(payload.badgeCodes)) {
    taskMetadata = { ...taskMetadata, badgeCodes: payload.badgeCodes };
  }

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
      metadata: taskMetadata,
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

  // Handle metadata with badgeCodes
  let updateData = { ...payload };
  if (payload.badgeCodes !== undefined) {
    const currentMetadata = task.metadata || {};
    const taskMetadata = typeof currentMetadata === 'string' 
      ? JSON.parse(currentMetadata) 
      : currentMetadata;
    
    if (Array.isArray(payload.badgeCodes)) {
      updateData.metadata = { ...taskMetadata, badgeCodes: payload.badgeCodes };
    } else {
      // Remove badgeCodes if empty array
      const { badgeCodes, ...restMetadata } = taskMetadata;
      updateData.metadata = restMetadata;
    }
    delete updateData.badgeCodes; // Remove from direct update
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: updateData,
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

// ============================================
// ASSIGN TASK TO VOLUNTEER - Asignar tarea a voluntario
// ============================================
const assignTaskToVolunteer = async (taskId, volunteerId, requester) => {
  const prisma = getPrisma();
  const notificationService = require('../../services/notification.service');

  // Verificar que la tarea existe
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      organization: true,
      assignments: true,
    },
  });

  if (!task) {
    throw new NotFoundError('Tarea no encontrada');
  }

  // Verificar permisos
  await ensureOrganizationAccess(prisma, task.organizationId, requester);

  // Verificar que el voluntario existe y tiene perfil
  const volunteer = await prisma.user.findUnique({
    where: { id: volunteerId },
    include: {
      volunteerProfile: true,
    },
  });

  if (!volunteer || volunteer.role !== 'VOLUNTEER') {
    throw new NotFoundError('Voluntario no encontrado');
  }

  if (!volunteer.volunteerProfile) {
    throw new ValidationError('El usuario no tiene un perfil de voluntario');
  }

  // Verificar que la tarea está en un estado válido
  if (!['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(task.status)) {
    throw new ValidationError('Solo se pueden asignar voluntarios a tareas activas');
  }

  // Verificar que el voluntario no está ya asignado
  const existingAssignment = task.assignments.find(
    (assignment) => assignment.volunteerId === volunteerId && assignment.status !== 'REJECTED',
  );

  if (existingAssignment) {
    throw new ValidationError('El voluntario ya está asignado a esta tarea');
  }

  // Verificar que no se exceda el número de voluntarios necesarios
  const activeAssignments = task.assignments.filter((assignment) =>
    ['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(assignment.status),
  );

  if (activeAssignments.length >= task.volunteersNeeded) {
    throw new ValidationError('Ya se alcanzó el número máximo de voluntarios para esta tarea');
  }

  // Crear la asignación
  const assignment = await prisma.assignment.create({
    data: {
      taskId: task.id,
      volunteerId: volunteer.id,
      organizationId: task.organizationId,
      assignedByUserId: requester.id,
      status: 'PENDING',
    },
    include: {
      volunteer: {
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
    },
  });

  // Notificar al voluntario
  await notificationService.notifyVolunteerAssignment({
    volunteer: { id: volunteerId },
    task,
  });

  // Actualizar estado de la tarea si es necesario
  if (task.status === 'PENDING') {
    await prisma.task.update({
      where: { id: taskId },
      data: { status: 'ASSIGNED' },
    });
  }

  // Crear log de auditoría
  await prisma.auditLog.create({
    data: {
      organizationId: task.organizationId,
      action: 'TASK_ASSIGNED',
      actorType: requester.role,
      actorId: requester.id,
      entityType: 'ASSIGNMENT',
      entityId: assignment.id,
      metadata: {
        taskId: task.id,
        volunteerId: volunteer.id,
      },
    },
  });

  return assignment;
};

module.exports = {
  createTask,
  updateTask,
  updateTaskStatus,
  getTask,
  listTasks,
  assignTaskToVolunteer,
};
