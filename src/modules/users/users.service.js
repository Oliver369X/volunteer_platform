'use strict';

const { getPrisma } = require('../../database');
const { NotFoundError, AuthorizationError, ValidationError } = require('../../core/api-error');
const { hashPassword, verifyPassword } = require('../../utils/password');

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

  // Agregar filtro de búsqueda de usuario si existe
  if (filters.search) {
    where.user = {
      OR: [
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ],
    };
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

// ============================================
// CHANGE PASSWORD - Cambiar contraseña
// ============================================
const changePassword = async (userId, currentPassword, newPassword) => {
  const prisma = getPrisma();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  // Verificar contraseña actual
  const isValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!isValid) {
    throw new ValidationError('La contraseña actual es incorrecta');
  }

  // Hash de la nueva contraseña
  const newPasswordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash },
  });

  return { success: true };
};

/**
 * Subir avatar de usuario
 * @param {string} userId - ID del usuario
 * @param {Buffer} fileBuffer - Buffer del archivo
 * @returns {Promise<object>} - URL del avatar
 */
const uploadAvatar = async (userId, fileBuffer) => {
  const prisma = getPrisma();
  const cloudinaryClient = require('../services/cloudinary-client');

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  // Subir a Cloudinary
  const result = await cloudinaryClient.uploadAvatar(fileBuffer, userId);

  // Actualizar URL en la base de datos (agregar campo avatarUrl si no existe)
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      metadata: {
        ...(user.metadata || {}),
        avatarUrl: result.url,
        avatarPublicId: result.public_id,
      },
    },
  });

  return {
    avatarUrl: result.url,
    user: {
      id: updated.id,
      fullName: updated.fullName,
      email: updated.email,
    },
  };
};

module.exports = {
  updateProfile,
  updateVolunteerProfile,
  listVolunteers,
  changePassword,
  uploadAvatar,
};
