'use strict';

require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });

// Configurar DATABASE_URL para tests - forzar credenciales correctas
process.env.DATABASE_URL_TEST = 'postgresql://postgres:071104@localhost:5432/volunteer_platform_dev';
process.env.DATABASE_URL = 'postgresql://postgres:071104@localhost:5432/volunteer_platform_dev';

// Configurar JWT secrets para tests - asegurar que sean consistentes
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jwt';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-key';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

jest.setTimeout(30000);

// Setup global antes de todos los tests
beforeAll(async () => {
  // Asegurar que la base de datos de test esté lista
  const { initializePrisma } = require('./helpers/prisma');
  try {
    await initializePrisma();
    console.log('✅ Conectado a la base de datos de test\n');
  } catch (error) {
    console.warn('\n⚠️ No se pudo conectar a la base de datos de test:', error.message);
    console.warn('Para configurar la BD de test, ejecuta:');
    console.warn('  npm run test:setup');
    console.warn('O manualmente:');
    console.warn('  createdb volunteer_platform_dev');
    console.warn('  DATABASE_URL=postgresql://postgres:071104@localhost:5432/volunteer_platform_dev npx prisma db push\n');
  }
});

// Cleanup después de todos los tests
afterAll(async () => {
  const { disconnect } = require('./helpers/prisma');
  await disconnect();
});


