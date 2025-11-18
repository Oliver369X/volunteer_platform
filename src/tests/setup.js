'use strict';

require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });

// Configurar DATABASE_URL para tests si no existe
if (!process.env.DATABASE_URL_TEST && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST || 
    'postgresql://postgres:postgres@localhost:5432/volunteer_platform_test';
}

jest.setTimeout(30000);

// Setup global antes de todos los tests
beforeAll(async () => {
  // Asegurar que la base de datos de test esté lista
  const { getPrisma } = require('./helpers/prisma');
  const prisma = getPrisma();
  try {
    await prisma.$connect();
    console.log('✅ Conectado a la base de datos de test\n');
  } catch (error) {
    console.warn('\n⚠️ No se pudo conectar a la base de datos de test:', error.message);
    console.warn('Para configurar la BD de test, ejecuta:');
    console.warn('  npm run test:setup');
    console.warn('O manualmente:');
    console.warn('  createdb volunteer_platform_test');
    console.warn('  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/volunteer_platform_test npx prisma db push\n');
  }
});

// Cleanup después de todos los tests
afterAll(async () => {
  const { disconnect } = require('./helpers/prisma');
  await disconnect();
});


