'use strict';

const crypto = require('crypto');
const dayjs = require('dayjs');
const { getPrisma } = require('../../database');
const { hashPassword } = require('../../utils/password');
const { ValidationError, NotFoundError, AuthenticationError } = require('../../core/api-error');
const NotificationService = require('../../services/notification.service');

/**
 * CU03: Recuperación de Credenciales
 * Servicio para gestionar el proceso de recuperación de contraseñas
 */

/**
 * Genera un token seguro de recuperación de contraseña
 */
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Solicita un enlace de recuperación de contraseña
 * @param {string} email - Correo electrónico del usuario
 */
const requestPasswordReset = async (email) => {
  const prisma = getPrisma();

  // Buscar usuario por email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Por seguridad, no revelar si el email existe o no
  if (!user) {
    // Retornar éxito de todas formas para evitar enumeración de usuarios
    return {
      success: true,
      message: 'Si el correo existe, recibirás un enlace de recuperación',
    };
  }

  // Verificar que el usuario esté activo
  if (user.status === 'SUSPENDED') {
    throw new AuthenticationError('Esta cuenta está suspendida');
  }

  // Generar token único
  const token = generateResetToken();
  const expiresAt = dayjs().add(1, 'hour').toDate(); // Token válido por 1 hora

  // Guardar token en la base de datos
  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  // Enviar correo con el enlace
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  
  await NotificationService.sendEmail({
    to: user.email,
    subject: 'Recuperación de Contraseña',
    html: `
      <h2>Recuperación de Contraseña</h2>
      <p>Hola ${user.fullName},</p>
      <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>Este enlace expirará en 1 hora.</p>
      <p>Si no solicitaste este cambio, ignora este correo.</p>
    `,
  });

  return {
    success: true,
    message: 'Si el correo existe, recibirás un enlace de recuperación',
  };
};

/**
 * Valida un token de recuperación de contraseña
 * @param {string} token - Token de recuperación
 */
const validateResetToken = async (token) => {
  const prisma = getPrisma();

  const resetRecord = await prisma.passwordReset.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
        },
      },
    },
  });

  if (!resetRecord) {
    throw new ValidationError('Token inválido o expirado');
  }

  if (resetRecord.usedAt) {
    throw new ValidationError('Este token ya fue utilizado');
  }

  if (dayjs(resetRecord.expiresAt).isBefore(dayjs())) {
    throw new ValidationError('Este token ha expirado. Solicita uno nuevo');
  }

  return {
    valid: true,
    email: resetRecord.user.email,
  };
};

/**
 * Restablece la contraseña usando el token
 * @param {string} token - Token de recuperación
 * @param {string} newPassword - Nueva contraseña
 */
const resetPassword = async (token, newPassword) => {
  const prisma = getPrisma();

  // Validar token
  const resetRecord = await prisma.passwordReset.findUnique({
    where: { token },
    include: {
      user: true,
    },
  });

  if (!resetRecord) {
    throw new ValidationError('Token inválido o expirado');
  }

  if (resetRecord.usedAt) {
    throw new ValidationError('Este token ya fue utilizado');
  }

  if (dayjs(resetRecord.expiresAt).isBefore(dayjs())) {
    throw new ValidationError('Este token ha expirado. Solicita uno nuevo');
  }

  // Validar que la contraseña sea segura
  if (newPassword.length < 8) {
    throw new ValidationError('La contraseña debe tener al menos 8 caracteres');
  }

  return prisma.$transaction(async (tx) => {
    // Actualizar contraseña del usuario
    await tx.user.update({
      where: { id: resetRecord.userId },
      data: {
        passwordHash: await hashPassword(newPassword),
      },
    });

    // Marcar token como usado
    await tx.passwordReset.update({
      where: { id: resetRecord.id },
      data: {
        usedAt: new Date(),
      },
    });

    // Revocar todos los refresh tokens del usuario por seguridad
    await tx.refreshToken.updateMany({
      where: {
        userId: resetRecord.userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    // Enviar notificación de confirmación
    await NotificationService.sendEmail({
      to: resetRecord.user.email,
      subject: 'Contraseña Actualizada Exitosamente',
      html: `
        <h2>Contraseña Actualizada</h2>
        <p>Hola ${resetRecord.user.fullName},</p>
        <p>Tu contraseña ha sido actualizada exitosamente.</p>
        <p>Si no realizaste este cambio, contacta con soporte inmediatamente.</p>
      `,
    });

    return {
      success: true,
      message: 'Contraseña actualizada exitosamente',
    };
  });
};

module.exports = {
  requestPasswordReset,
  validateResetToken,
  resetPassword,
};


