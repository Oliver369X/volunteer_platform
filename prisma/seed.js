#!/usr/bin/env node
'use strict';

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando datos iniciales...\n');

  // Limpiar datos existentes (orden correcto para evitar foreign key constraints)
  console.log('Limpiando datos existentes...');
  await prisma.volunteerBadge.deleteMany();
  await prisma.pointTransaction.deleteMany();
  await prisma.aiRecommendation.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.locationTracking.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.broadcast.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.eventCoordinator.deleteMany();
  await prisma.task.deleteMany();
  await prisma.event.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.passwordReset.deleteMany();
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
      fullName: 'Admin Organización',
      email: 'admin@admin.com',
      passwordHash: await bcrypt.hash('12345678', 10),
      role: 'ORGANIZATION',
      status: 'ACTIVE',
      phoneNumber: '+59170000000',
    },
  });

  const org1 = await prisma.organization.create({
    data: {
      createdByUserId: orgUser1.id,
      name: 'Organización de Prueba',
      description: 'Organización para pruebas y desarrollo',
      sector: 'Humanitarian',
      contactEmail: 'admin@admin.com',
      contactPhone: '+59170000000',
      headquartersLocation: 'Santa Cruz, Bolivia',
      coverageAreas: ['Santa Cruz', 'La Paz', 'Cochabamba'],
    },
  });

  await prisma.organizationMember.create({
    data: {
      organizationId: org1.id,
      userId: orgUser1.id,
      role: 'OWNER',
    },
  });

  // Crear suscripción
  await prisma.subscription.create({
    data: {
      organizationId: org1.id,
      plan: 'PROFESSIONAL',
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`   ✅ Organización creada: ${org1.name}\n`);

  // 4. Crear voluntarios (10 voluntarios)
  console.log('4️⃣ Creando 10 voluntarios...');
  
  const volunteers = [];
  const volunteerData = [
    { fullName: 'Juan Pérez', email: 'juan.perez@test.com', skills: ['first-aid', 'communication'], level: 'PLATA', totalPoints: 1500, reputationScore: 85 },
    { fullName: 'Ana López', email: 'ana.lopez@test.com', skills: ['medical', 'psychology'], level: 'ORO', totalPoints: 3000, reputationScore: 92 },
    { fullName: 'Carlos Mamani', email: 'carlos.mamani@test.com', skills: ['construction', 'logistics'], level: 'BRONCE', totalPoints: 500, reputationScore: 75 },
    { fullName: 'María Fernández', email: 'maria.fernandez@test.com', skills: ['communication', 'logistics'], level: 'PLATA', totalPoints: 1800, reputationScore: 88 },
    { fullName: 'Luis Quispe', email: 'luis.quispe@test.com', skills: ['medical', 'first-aid'], level: 'ORO', totalPoints: 2500, reputationScore: 90 },
    { fullName: 'Sofia Morales', email: 'sofia.morales@test.com', skills: ['psychology', 'communication'], level: 'PLATA', totalPoints: 1200, reputationScore: 82 },
    { fullName: 'Roberto Vargas', email: 'roberto.vargas@test.com', skills: ['construction', 'coordination'], level: 'BRONCE', totalPoints: 800, reputationScore: 78 },
    { fullName: 'Laura Gutierrez', email: 'laura.gutierrez@test.com', skills: ['medical', 'nursing'], level: 'ORO', totalPoints: 2800, reputationScore: 95 },
    { fullName: 'Diego Rojas', email: 'diego.rojas@test.com', skills: ['logistics', 'coordination'], level: 'PLATA', totalPoints: 1600, reputationScore: 86 },
    { fullName: 'Carmen Suarez', email: 'carmen.suarez@test.com', skills: ['communication', 'first-aid'], level: 'BRONCE', totalPoints: 600, reputationScore: 72 },
  ];

  for (const data of volunteerData) {
      const user = await prisma.user.create({
        data: {
          fullName: data.fullName,
          email: data.email,
          passwordHash: await bcrypt.hash('12345678', 10),
          role: 'VOLUNTEER',
          status: 'ACTIVE',
          phoneNumber: `+5917${Math.floor(Math.random() * 10000000).toString().padStart(8, '0')}`,
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
  console.log('   Organización:');
  console.log('     Email: admin@admin.com');
  console.log('     Password: 12345678');
  console.log('');
  console.log('   Voluntarios (10):');
  volunteerData.forEach((v, i) => {
    console.log(`     ${i + 1}. ${v.email} / 12345678`);
  });
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

