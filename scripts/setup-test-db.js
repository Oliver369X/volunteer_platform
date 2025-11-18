#!/usr/bin/env node
'use strict';

/**
 * Script para configurar la base de datos de test
 * Crea la BD si no existe y aplica el schema de Prisma
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');

const execAsync = promisify(exec);

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '5432';
const DB_USERNAME = process.env.DB_USERNAME || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const TEST_DB_NAME = process.env.DB_NAME_TEST || 'volunteer_platform_test';

const DATABASE_URL_TEST = `postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${TEST_DB_NAME}`;

async function setupTestDatabase() {
  console.log('🔧 Configurando base de datos de test...\n');

  try {
    // Paso 1: Verificar si PostgreSQL está corriendo
    console.log('1️⃣ Verificando conexión a PostgreSQL...');
    try {
      await execAsync(`psql -U ${DB_USERNAME} -h ${DB_HOST} -p ${DB_PORT} -c "SELECT 1" postgres`);
      console.log('   ✅ PostgreSQL está corriendo\n');
    } catch (error) {
      console.error('   ❌ No se pudo conectar a PostgreSQL');
      console.error('   Asegúrate de que PostgreSQL esté corriendo y las credenciales sean correctas\n');
      process.exit(1);
    }

    // Paso 2: Crear base de datos de test si no existe
    console.log('2️⃣ Creando base de datos de test...');
    try {
      // Intentar crear la BD
      await execAsync(
        `psql -U ${DB_USERNAME} -h ${DB_HOST} -p ${DB_PORT} -c "CREATE DATABASE ${TEST_DB_NAME};" postgres`,
      );
      console.log(`   ✅ Base de datos '${TEST_DB_NAME}' creada\n`);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`   ℹ️ Base de datos '${TEST_DB_NAME}' ya existe\n`);
      } else {
        console.error('   ⚠️ Error al crear la BD:', error.message);
      }
    }

    // Paso 3: Aplicar schema de Prisma
    console.log('3️⃣ Aplicando schema de Prisma...');
    process.env.DATABASE_URL = DATABASE_URL_TEST;
    
    const { stdout, stderr } = await execAsync(
      'npx prisma db push --skip-generate --accept-data-loss',
      {
        cwd: path.resolve(__dirname, '..'),
        env: {
          ...process.env,
          DATABASE_URL: DATABASE_URL_TEST,
        },
      },
    );
    
    if (stderr) {
      console.log(stderr);
    }
    console.log('   ✅ Schema aplicado correctamente\n');

    console.log('✅ ¡Base de datos de test lista!\n');
    console.log(`📊 Conexión: ${DATABASE_URL_TEST}\n`);
    console.log('Ahora puedes ejecutar: npm test\n');
  } catch (error) {
    console.error('❌ Error al configurar la base de datos de test:');
    console.error(error.message);
    process.exit(1);
  }
}

setupTestDatabase();

