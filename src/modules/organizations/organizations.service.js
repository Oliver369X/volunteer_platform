'use strict';

const { getPrisma } = require('../../database');
const { AuthorizationError, NotFoundError, ValidationError } = require('../../core/api-error');

const ensureMembership = async (prisma, organizationId, userId) => {
  const membership = await prisma.organizationMember.findFirst({
    where: { organizationId, userId },
  });

  return membership;
};

const listOrganizations = async (requester) => {
  const prisma = getPrisma();

  if (requester.role === 'ADMIN') {
    const organizations = await prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return organizations;
  }

  if (requester.role !== 'ORGANIZATION') {
    throw new AuthorizationError('No tienes permisos para consultar organizaciones');
  }

  const memberships = await prisma.organizationMember.findMany({
    where: { userId: requester.id },
    include: {
      organization: true,
    },
  });

  return memberships.map((membership) => ({
    id: membership.organization.id,
    name: membership.organization.name,
    role: membership.role,
    coverageAreas: membership.organization.coverageAreas,
  }));
};

const getOrganizationDetails = async (organizationId, requester) => {
  const prisma = getPrisma();

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
  });
  if (!organization) {
    throw new NotFoundError('Organización no encontrada');
  }

  if (requester.role !== 'ADMIN') {
    const membership = await ensureMembership(prisma, organizationId, requester.id);
    if (!membership) {
      throw new AuthorizationError('No perteneces a esta organización');
    }
  }

  const [memberCount, activeTasks, completedAssignments] = await Promise.all([
    prisma.organizationMember.count({ where: { organizationId } }),
    prisma.task.count({
      where: {
        organizationId,
        status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] },
      },
    }),
    prisma.assignment.count({
      where: { organizationId, status: 'COMPLETED' },
    }),
  ]);

  return {
    ...organization,
    metrics: {
      memberCount,
      activeTasks,
      completedAssignments,
    },
  };
};

const addMember = async (organizationId, payload, requester) => {
  const prisma = getPrisma();

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
  });
  if (!organization) {
    throw new NotFoundError('Organización no encontrada');
  }

  const membership = await ensureMembership(prisma, organizationId, requester.id);
  if (!membership || !['OWNER', 'COORDINATOR'].includes(membership.role)) {
    throw new AuthorizationError('No tienes permisos para gestionar miembros');
  }

  const user = await prisma.user.findFirst({ where: { email: payload.email } });
  if (!user) {
    throw new NotFoundError('Usuario no encontrado para agregar como miembro');
  }

  const existing = await prisma.organizationMember.findFirst({
    where: { organizationId, userId: user.id },
  });
  if (existing) {
    throw new ValidationError('El usuario ya es miembro de la organización');
  }

  const newMember = await prisma.organizationMember.create({
    data: {
      organizationId,
      userId: user.id,
      role: payload.role,
    },
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

  return {
    id: newMember.id,
    organizationId,
    user: newMember.user,
    role: newMember.role,
  };
};

module.exports = {
  listOrganizations,
  getOrganizationDetails,
  addMember,
};
