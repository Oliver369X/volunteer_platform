'use strict';

const { getPrisma } = require('../../database');
const { NotFoundError, AuthorizationError } = require('../../core/api-error');

const updateProfile = async (userId, payload) => {
  const prisma = getPrisma();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: payload,
  });

  return {
    id: updated.id,
    fullName: updated.fullName,
    email: updated.email,
    phoneNumber: updated.phoneNumber,
  };
};

const updateVolunteerProfile = async (userId, payload) => {
  const prisma = getPrisma();

  const profile = await prisma.volunteerProfile.findUnique({ where: { userId } });
  if (!profile) {
    throw new NotFoundError('Perfil de voluntario no encontrado');
  }

  const updated = await prisma.volunteerProfile.update({
    where: { userId },
    data: payload,
  });

  return updated;
};

const listVolunteers = async (requester, filters) => {
  if (!['ADMIN', 'ORGANIZATION'].includes(requester.role)) {
    throw new AuthorizationError(
      'Solo organizaciones o administradores pueden consultar voluntarios',
    );
  }

  const prisma = getPrisma();

  const where = {};

  if (filters.level) {
    where.level = filters.level;
  }

  if (filters.skills) {
    const skillsArray = Array.isArray(filters.skills) ? filters.skills : [filters.skills];
    where.skills = {
      hasEvery: skillsArray,
    };
  }

  const userWhere = {};
  if (filters.search) {
    userWhere.OR = [
      { fullName: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const volunteers = await prisma.volunteerProfile.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
        },
        where: userWhere,
      },
    },
    orderBy: [
      { level: 'desc' },
      { reputationScore: 'desc' },
      { totalPoints: 'desc' },
    ],
    take: 100,
  });

  return volunteers.map((profile) => ({
    id: profile.id,
    userId: profile.userId,
    user: profile.user,
    level: profile.level,
    totalPoints: profile.totalPoints,
    reputationScore: profile.reputationScore,
    skills: profile.skills,
    baseLocation: profile.baseLocation,
    availability: profile.availability,
  }));
};

module.exports = {
  updateProfile,
  updateVolunteerProfile,
  listVolunteers,
};
