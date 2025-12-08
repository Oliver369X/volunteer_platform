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

  console.log('[addMember] Iniciando - OrgID:', organizationId, 'Payload:', payload);

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
  });
  if (!organization) {
    console.log('[addMember] Organización no encontrada');
    throw new NotFoundError('Organización no encontrada');
  }

  const membership = await ensureMembership(prisma, organizationId, requester.id);
  console.log('[addMember] Membership:', membership);
  if (!membership || !['OWNER', 'COORDINATOR'].includes(membership.role)) {
    throw new AuthorizationError('No tienes permisos para gestionar miembros');
  }

  // Buscar usuario por email
  const user = await prisma.user.findFirst({ 
    where: { 
      email: payload.email.toLowerCase().trim()
    } 
  });
  console.log('[addMember] Buscando usuario:', payload.email);
  console.log('[addMember] Usuario encontrado:', user ? `${user.email} (${user.id})` : 'NO ENCONTRADO');
  
  if (!user) {
    throw new NotFoundError(
      `❌ El usuario con email "${payload.email}" no está registrado en la plataforma.\n\n` +
      `📝 Para agregar este usuario al equipo:\n` +
      `1. El usuario debe registrarse primero en la plataforma\n` +
      `2. Luego puedes agregarlo usando su email`
    );
  }

  const existing = await prisma.organizationMember.findFirst({
    where: { organizationId, userId: user.id },
  });
  if (existing) {
    const roleName = existing.role === 'OWNER' ? 'propietario' : existing.role === 'COORDINATOR' ? 'coordinador' : 'analista';
    throw new ValidationError(`El usuario ya es miembro de la organización (rol: ${roleName}). Usa un email diferente.`);
  }

  const newMember = await prisma.organizationMember.create({
    data: {
      organizationId,
      userId: user.id,
      role: payload.role || 'COORDINATOR',
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

  console.log('[addMember] Miembro agregado exitosamente');
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
