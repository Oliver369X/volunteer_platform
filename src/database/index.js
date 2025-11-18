'use strict';

const { PrismaClient } = require('@prisma/client');
const loadEnv = require('../config/env');
const logger = require('../utils/logger');

let prismaInstance;

const getDatabaseUrl = () => {
  const {
    DB_HOST = 'localhost',
    DB_PORT = '5432',
    DB_NAME = 'volunteer_platform_dev',
    DB_USERNAME = 'postgres',
    DB_PASSWORD = 'postgres',
    DATABASE_URL,
  } = process.env;

  // Si existe DATABASE_URL, usarla directamente
  if (DATABASE_URL) {
    return DATABASE_URL;
  }

  // Si no, construirla desde las variables individuales
  return `postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
};

const connectDatabase = async () => {
  if (prismaInstance) {
    return prismaInstance;
  }

  try {
    const databaseUrl = getDatabaseUrl();
    
    // Establecer DATABASE_URL en process.env para Prisma
    process.env.DATABASE_URL = databaseUrl;

    prismaInstance = new PrismaClient({
      log: process.env.DB_LOGGING === 'true' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });

    // Probar la conexión
    await prismaInstance.$connect();
    logger.info('Conexión a base de datos establecida correctamente');
  } catch (error) {
    logger.error('No fue posible conectar con la base de datos', { error });
    throw error;
  }

  return prismaInstance;
};

const getPrisma = () => {
  if (!prismaInstance) {
    throw new Error(
      'La instancia de Prisma no está disponible. Llama a connectDatabase primero.',
    );
  }
  return prismaInstance;
};

const disconnectDatabase = async () => {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
};

module.exports = {
  connectDatabase,
  getPrisma,
  disconnectDatabase,
};
