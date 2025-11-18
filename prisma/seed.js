#!/usr/bin/env node
'use strict';

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando datos iniciales...\n');

  // Limpiar datos existentes
  console.log('Limpiando datos existentes...');
  await prisma.volunteerBadge.deleteMany();
  await prisma.pointTransaction.deleteMany();
  await prisma.aiRecommendation.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.volunteerProfile.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.user.deleteMany();

  // 1. Crear badges
  console.log('1️⃣ Creando badges...');
  const badges = await Promise.all([
    prisma.badge.create({
      data: {
        code: 'HERO_BADGE',
        name: 'Héroe Humanitario',
        description: 'Otorgado por completar 10 misiones críticas',
        category: 'Achievement',
        level: 'ORO',
        criteria: { minMissions: 10, minRating: 4 },
      },
    }),
    prisma.badge.create({
      data: {
        code: 'FIRST_MISSION',
        name: 'Primera Misión',
        description: 'Completaste tu primera misión',
        category: 'Milestone',
        level: 'BRONCE',
        criteria: { missions: 1 },
      },
    }),
    prisma.badge.create({
      data: {
        code: 'RAPID_RESPONSE',
        name: 'Respuesta Rápida',
        description: 'Respondiste en menos de 1 hora',
        category: 'Speed',
        level: 'PLATA',
        criteria: { responseTime: 3600 },
      },
    }),
  ]);
  console.log(`   ✅ ${badges.length} badges creados\n`);

  // 2. Crear usuario administrador
  console.log('2️⃣ Creando usuario administrador...');
  const admin = await prisma.user.create({
    data: {
      fullName: 'Admin Sistema',
      email: 'admin@volunteerplatform.org',
      passwordHash: await bcrypt.hash('Admin123!', 10),
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log(`   ✅ Admin creado: ${admin.email}\n`);

  // 3. Crear organizaciones con usuarios
  console.log('3️⃣ Creando organizaciones...');
  
  const orgUser1 = await prisma.user.create({
    data: {
      fullName: 'María González',
      email: 'maria@cruzroja.org',
      passwordHash: await bcrypt.hash('Password123!', 10),
      role: 'ORGANIZATION',
      status: 'ACTIVE',
      phoneNumber: '+59178901234',
    },
  });

  const org1 = await prisma.organization.create({
    data: {
      createdByUserId: orgUser1.id,
      name: 'Cruz Roja Boliviana',
      description: 'Organización humanitaria internacional',
      sector: 'Healthcare',
      contactEmail: orgUser1.email,
      contactPhone: orgUser1.phoneNumber,
      headquartersLocation: 'La Paz, Bolivia',
      coverageAreas: ['La Paz', 'Cochabamba', 'Santa Cruz'],
    },
  });

  await prisma.organizationMember.create({
    data: {
      organizationId: org1.id,
      userId: orgUser1.id,
      role: 'OWNER',
    },
  });

  console.log(`   ✅ Organización creada: ${org1.name}\n`);

  // 4. Crear voluntarios
  console.log('4️⃣ Creando voluntarios...');
  
  const volunteers = [];
  const volunteerData = [
    {
      fullName: 'Juan Pérez',
      email: 'juan.perez@example.com',
      skills: ['first-aid', 'communication', 'logistics'],
      certifications: ['CPR', 'First Aid'],
      level: 'PLATA',
      totalPoints: 1500,
      reputationScore: 85,
    },
    {
      fullName: 'Ana López',
      email: 'ana.lopez@example.com',
      skills: ['medical', 'psychology', 'communication'],
      certifications: ['Nursing', 'Psychological First Aid'],
      level: 'ORO',
      totalPoints: 3000,
      reputationScore: 92,
    },
    {
      fullName: 'Carlos Mamani',
      email: 'carlos.mamani@example.com',
      skills: ['construction', 'logistics', 'coordination'],
      certifications: ['Construction Safety'],
      level: 'BRONCE',
      totalPoints: 500,
      reputationScore: 75,
    },
  ];

  for (const data of volunteerData) {
    const user = await prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        passwordHash: await bcrypt.hash('Password123!', 10),
        role: 'VOLUNTEER',
        status: 'ACTIVE',
        phoneNumber: '+59178900000',
      },
    });

    const profile = await prisma.volunteerProfile.create({
      data: {
        userId: user.id,
        bio: `Voluntario comprometido con la ayuda humanitaria`,
        baseLocation: 'Santa Cruz, Bolivia',
        latitude: -17.783327,
        longitude: -63.182076,
        skills: data.skills,
        certifications: data.certifications,
        transportOptions: ['car'],
        level: data.level,
        totalPoints: data.totalPoints,
        reputationScore: data.reputationScore,
      },
    });

    volunteers.push({ user, profile });
  }
  console.log(`   ✅ ${volunteers.length} voluntarios creados\n`);

  // 5. Crear tareas
  console.log('5️⃣ Creando tareas...');
  
  const task1 = await prisma.task.create({
    data: {
      organizationId: org1.id,
      createdByUserId: orgUser1.id,
      title: 'Distribución de alimentos - Zona Sur',
      description: 'Se necesita apoyo para distribuir alimentos en comunidades afectadas por inundaciones',
      urgency: 'HIGH',
      category: 'Logistics',
      skillsRequired: ['logistics', 'communication'],
      locationName: 'Villa Tunari, Cochabamba',
      latitude: -16.9833,
      longitude: -65.4167,
      volunteersNeeded: 5,
      startAt: new Date('2024-12-20T08:00:00Z'),
      endAt: new Date('2024-12-20T18:00:00Z'),
      status: 'PENDING',
    },
  });

  const task2 = await prisma.task.create({
    data: {
      organizationId: org1.id,
      createdByUserId: orgUser1.id,
      title: 'Atención médica de emergencia',
      description: 'Brigada médica en zona de desastre',
      urgency: 'CRITICAL',
      category: 'Healthcare',
      skillsRequired: ['medical', 'first-aid'],
      locationName: 'Trinidad, Beni',
      latitude: -14.8333,
      longitude: -64.9000,
      volunteersNeeded: 3,
      startAt: new Date('2024-12-21T06:00:00Z'),
      endAt: new Date('2024-12-22T20:00:00Z'),
      status: 'PENDING',
    },
  });

  console.log(`   ✅ ${2} tareas creadas\n`);

  // 6. Crear algunas asignaciones
  console.log('6️⃣ Creando asignaciones de ejemplo...');
  
  const assignment1 = await prisma.assignment.create({
    data: {
      taskId: task1.id,
      volunteerId: volunteers[0].user.id,
      organizationId: org1.id,
      assignedByUserId: orgUser1.id,
      status: 'ACCEPTED',
    },
  });

  console.log(`   ✅ Asignaciones creadas\n`);

  console.log('✅ ¡Seed completado exitosamente!\n');
  console.log('📊 Credenciales de prueba:');
  console.log('   Admin:');
  console.log('     Email: admin@volunteerplatform.org');
  console.log('     Password: Admin123!');
  console.log('');
  console.log('   Organización:');
  console.log('     Email: maria@cruzroja.org');
  console.log('     Password: Password123!');
  console.log('');
  console.log('   Voluntarios:');
  volunteerData.forEach((v) => {
    console.log(`     Email: ${v.email}`);
  });
  console.log('     Password: Password123! (para todos)');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

