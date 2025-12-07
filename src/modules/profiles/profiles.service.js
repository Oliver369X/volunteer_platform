'use strict';

const { getPrisma } = require('../../database');
const { NotFoundError, ForbiddenError, ValidationError } = require('../../core/api-error');
const CloudinaryClient = require('../../services/cloudinary-client');

/**
 * CU05: Gestión de Perfil y Habilidades
 * Servicio para gestionar los perfiles de voluntarios
 */

/**
 * Obtiene el perfil completo del voluntario
 */
const getVolunteerProfile = async (userId) => {
  const prisma = getPrisma();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      volunteerProfile: true,
    },
  });

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  if (user.role !== 'VOLUNTEER') {
    throw new ForbiddenError('Este usuario no es un voluntario');
  }

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      status: user.status,
    },
    profile: user.volunteerProfile,
  };
};

/**
 * Actualiza el perfil del voluntario
 */
const updateVolunteerProfile = async (userId, payload) => {
  const prisma = getPrisma();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      volunteerProfile: true,
    },
  });

  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  if (user.role !== 'VOLUNTEER') {
    throw new ForbiddenError('Este usuario no es un voluntario');
  }

  return prisma.$transaction(async (tx) => {
    // Actualizar datos básicos del usuario si se proporcionan
    if (payload.fullName || payload.phoneNumber) {
      await tx.user.update({
        where: { id: userId },
        data: {
          fullName: payload.fullName,
          phoneNumber: payload.phoneNumber,
        },
      });
    }

    // Actualizar perfil de voluntario
    const updatedProfile = await tx.volunteerProfile.update({
      where: { userId },
      data: {
        bio: payload.bio,
        baseLocation: payload.baseLocation,
        latitude: payload.latitude,
        longitude: payload.longitude,
        availability: payload.availability,
        skills: payload.skills,
        certifications: payload.certifications,
        transportOptions: payload.transportOptions,
      },
    });

    return updatedProfile;
  });
};

/**
 * Agrega habilidades al perfil del voluntario
 */
const addSkills = async (userId, skills) => {
  const prisma = getPrisma();

  const profile = await prisma.volunteerProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new NotFoundError('Perfil de voluntario no encontrado');
  }

  // Combinar skills existentes con las nuevas (sin duplicados)
  const existingSkills = profile.skills || [];
  const newSkills = [...new Set([...existingSkills, ...skills])];

  const updated = await prisma.volunteerProfile.update({
    where: { userId },
    data: {
      skills: newSkills,
    },
  });

  return updated;
};

/**
 * Elimina habilidades del perfil del voluntario
 */
const removeSkills = async (userId, skillsToRemove) => {
  const prisma = getPrisma();

  const profile = await prisma.volunteerProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new NotFoundError('Perfil de voluntario no encontrado');
  }

  const updatedSkills = (profile.skills || []).filter(
    (skill) => !skillsToRemove.includes(skill),
  );

  const updated = await prisma.volunteerProfile.update({
    where: { userId },
    data: {
      skills: updatedSkills,
    },
  });

  return updated;
};

/**
 * Actualiza la disponibilidad del voluntario
 */
const updateAvailability = async (userId, availability) => {
  const prisma = getPrisma();

  const profile = await prisma.volunteerProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new NotFoundError('Perfil de voluntario no encontrado');
  }

  const updated = await prisma.volunteerProfile.update({
    where: { userId },
    data: {
      availability,
    },
  });

  return updated;
};

/**
 * Sube certificados de habilidades (documentos de soporte)
 */
const uploadCertification = async (userId, file) => {
  const prisma = getPrisma();

  const profile = await prisma.volunteerProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new NotFoundError('Perfil de voluntario no encontrado');
  }

  // Validar tipo de archivo
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  if (!allowedTypes.includes(file.mimetype)) {
    throw new ValidationError(
      'Tipo de archivo no permitido. Solo PDF, JPG y PNG',
    );
  }

  // Validar tamaño (5MB max)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new ValidationError('El archivo excede el tamaño máximo de 5MB');
  }

  // Subir a Cloudinary
  const uploadResult = await CloudinaryClient.uploadFile(file.buffer, {
    folder: `certifications/${userId}`,
    resource_type: 'auto',
  });

  // Agregar URL a las certificaciones
  const existingCerts = profile.certifications || [];
  const updatedCerts = [...existingCerts, uploadResult.secure_url];

  const updated = await prisma.volunteerProfile.update({
    where: { userId },
    data: {
      certifications: updatedCerts,
    },
  });

  return {
    url: uploadResult.secure_url,
    profile: updated,
  };
};

module.exports = {
  getVolunteerProfile,
  updateVolunteerProfile,
  addSkills,
  removeSkills,
  updateAvailability,
  uploadCertification,
};


