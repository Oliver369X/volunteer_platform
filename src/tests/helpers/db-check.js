'use strict';

const { PrismaClient } = require('@prisma/client');

let dbAvailable = null;

const checkDatabaseAvailability = async () => {
  if (dbAvailable !== null) {
    return dbAvailable;
  }

  try {
    const databaseUrl =
      process.env.DATABASE_URL_TEST ||
      process.env.DATABASE_URL?.replace(/volunteer_platform_dev/, 'volunteer_platform_test') ||
      'postgresql://postgres:postgres@localhost:5432/volunteer_platform_test';

    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });

    await prisma.$connect();
    await prisma.$disconnect();
    dbAvailable = true;
  } catch (error) {
    console.warn('\n⚠️ Base de datos de test no disponible - Tests que requieren BD serán saltados\n');
    dbAvailable = false;
  }

  return dbAvailable;
};

const skipIfNoDatabase = () => {
  if (dbAvailable === false) {
    return test.skip;
  }
  return test;
};

const describeWithDb = (name, fn) => {
  return describe(name, () => {
    beforeAll(async () => {
      const available = await checkDatabaseAvailability();
      if (!available) {
        console.warn(`⚠️ Saltando suite "${name}" - BD no disponible`);
      }
    });

    if (dbAvailable !== false) {
      fn();
    }
  });
};

module.exports = {
  checkDatabaseAvailability,
  skipIfNoDatabase,
  describeWithDb,
};

