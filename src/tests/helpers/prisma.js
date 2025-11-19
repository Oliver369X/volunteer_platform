'use strict';

const { connectDatabase, getPrisma: getAppPrisma } = require('../../database');

let prisma;
let isInitialized = false;

const getPrisma = () => {
  if (!isInitialized) {
    // Asegurar que DATABASE_URL esté configurado para tests
    if (!process.env.DATABASE_URL) {
      const {
        DB_HOST = 'localhost',
        DB_PORT = '5432',
        DB_USERNAME = 'postgres',
        DB_PASSWORD = '071104',
      } = process.env;
      process.env.DATABASE_URL = `postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/volunteer_platform_dev`;
    }
    
    // Conectar usando el método de la aplicación (pero solo una vez)
    if (!prisma) {
      try {
        // Intentar obtener la instancia existente
        prisma = getAppPrisma();
      } catch (error) {
        // Si no existe, crear una nueva conexión
        // No podemos usar await aquí, así que lanzamos un error
        throw new Error('Prisma debe ser inicializado en beforeAll usando connectDatabase()');
      }
    }
    isInitialized = true;
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
    isInitialized = false;
  }
};

const initializePrisma = async () => {
  try {
    prisma = await connectDatabase();
    isInitialized = true;
    return prisma;
  } catch (error) {
    console.error('Error al inicializar Prisma:', error);
    throw error;
  }
};

module.exports = {
  getPrisma,
  cleanup,
  disconnect,
  initializePrisma,
  connectDatabase,
};
