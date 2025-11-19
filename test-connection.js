// NO cargar dotenv aquí
process.env.DATABASE_URL = 'postgresql://postgres:071104@localhost:5432/volunteer_platform_dev';

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Intentando conectar a:', process.env.DATABASE_URL);
    await prisma.$connect();
    console.log('✅ Conexión exitosa a la base de datos de test');
   await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.error('Detalles:', error);
  }
}

testConnection();

