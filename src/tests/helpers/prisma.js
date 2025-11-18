'use strict';

const { PrismaClient } = require('@prisma/client');

let prisma;

const getPrisma = () => {
  if (!prisma) {
    let databaseUrl = process.env.DATABASE_URL_TEST;
    
    if (!databaseUrl) {
      if (process.env.DATABASE_URL) {
        databaseUrl = process.env.DATABASE_URL.replace(
          /volunteer_platform_dev/,
          'volunteer_platform_test',
        );
      } else {
        const {
          DB_HOST = 'localhost',
          DB_PORT = '5432',
          DB_USERNAME = 'postgres',
          DB_PASSWORD = 'postgres',
        } = process.env;
        databaseUrl = `postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/volunteer_platform_test`;
      }
    }

    // Establecer DATABASE_URL para Prisma
    process.env.DATABASE_URL = databaseUrl;

    prisma = new PrismaClient({
      log: process.env.DB_LOGGING === 'true' ? ['error'] : [],
      errorFormat: 'minimal',
    });
  }
  return prisma;
};

const cleanup = async () => {
  try {
    const prismaInstance = getPrisma();
    
    // Verificar conexión primero
    await prismaInstance.$connect();
    
    // Eliminar datos en orden inverso de dependencias usando transacciones
    await prismaInstance.$transaction([
      prismaInstance.volunteerBadge.deleteMany(),
      prismaInstance.pointTransaction.deleteMany(),
      prismaInstance.aiRecommendation.deleteMany(),
      prismaInstance.auditLog.deleteMany(),
      prismaInstance.assignment.deleteMany(),
      prismaInstance.task.deleteMany(),
      prismaInstance.organizationMember.deleteMany(),
      prismaInstance.organization.deleteMany(),
      prismaInstance.refreshToken.deleteMany(),
      prismaInstance.volunteerProfile.deleteMany(),
      prismaInstance.badge.deleteMany(),
      prismaInstance.user.deleteMany(),
    ]);
  } catch (error) {
    // Si hay error de autenticación, es porque la BD no está disponible
    if (error.code === 'P1000' || error.code === 'P1001') {
      console.warn('\n⚠️ Base de datos de test no disponible. Saltando cleanup...\n');
    } else {
      console.warn('⚠️ Cleanup falló:', error.message);
    }
    // No lanzar el error para permitir que los tests continúen
  }
};

const disconnect = async () => {
  if (prisma) {
    try {
      await prisma.$disconnect();
    } catch (error) {
      // Ignorar errores al desconectar
    }
    prisma = null;
  }
};

module.exports = {
  getPrisma,
  cleanup,
  disconnect,
};
