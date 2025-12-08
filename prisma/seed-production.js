#!/usr/bin/env node
'use strict';

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Datos de voluntarios
const volunteerData = [
  { fullName: 'Juan Pérez', email: 'juan.perez@test.com', skills: ['first-aid', 'communication'], level: 'PLATA', points: 1500 },
  { fullName: 'Ana López', email: 'ana.lopez@test.com', skills: ['medical', 'psychology'], level: 'ORO', points: 3000 },
  { fullName: 'Carlos Mamani', email: 'carlos.mamani@test.com', skills: ['construction', 'logistics'], level: 'BRONCE', points: 500 },
  { fullName: 'María Fernández', email: 'maria.fernandez@test.com', skills: ['communication', 'logistics'], level: 'PLATA', points: 1800 },
  { fullName: 'Luis Quispe', email: 'luis.quispe@test.com', skills: ['medical', 'first-aid'], level: 'ORO', points: 2500 },
  { fullName: 'Sofia Morales', email: 'sofia.morales@test.com', skills: ['psychology', 'communication'], level: 'PLATA', points: 1200 },
  { fullName: 'Roberto Vargas', email: 'roberto.vargas@test.com', skills: ['construction', 'coordination'], level: 'BRONCE', points: 800 },
  { fullName: 'Laura Gutierrez', email: 'laura.gutierrez@test.com', skills: ['medical', 'nursing'], level: 'ORO', points: 2800 },
  { fullName: 'Diego Rojas', email: 'diego.rojas@test.com', skills: ['logistics', 'coordination'], level: 'PLATA', points: 1600 },
  { fullName: 'Carmen Suarez', email: 'carmen.suarez@test.com', skills: ['communication', 'first-aid'], level: 'BRONCE', points: 600 },
];

async function main() {
  console.log('🌱 Sembrando base de datos de producción...\n');

  try {
    // Limpiar datos existentes (orden correcto para evitar foreign key constraints)
    console.log('🧹 Limpiando datos existentes...');
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
    console.log('   ✅ Datos limpiados\n');

    // 1. Crear badges
    console.log('1️⃣ Creando badges...');
    const badges = await Promise.all([
      prisma.badge.create({ data: { code: 'HERO_BADGE', name: 'Héroe Humanitario', description: 'Completar 10 misiones críticas', category: 'Achievement', level: 'ORO', criteria: { minMissions: 10 } } }),
      prisma.badge.create({ data: { code: 'FIRST_MISSION', name: 'Primera Misión', description: 'Primera misión completada', category: 'Milestone', level: 'BRONCE', criteria: { missions: 1 } } }),
      prisma.badge.create({ data: { code: 'RAPID_RESPONSE', name: 'Respuesta Rápida', description: 'Responder en menos de 1 hora', category: 'Speed', level: 'PLATA', criteria: { responseTime: 3600 } } }),
    ]);
    console.log(`   ✅ ${badges.length} badges creados\n`);

    // 2. Crear organización con admin@admin.com
    console.log('2️⃣ Creando organización...');
    const orgUser = await prisma.user.create({
      data: {
        fullName: 'Admin Organización',
        email: 'admin@admin.com',
        passwordHash: await bcrypt.hash('12345678', 10),
        role: 'ORGANIZATION',
        status: 'ACTIVE',
        phoneNumber: '+59170000000',
      },
    });

    const organization = await prisma.organization.create({
      data: {
        createdByUserId: orgUser.id,
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
      data: { organizationId: organization.id, userId: orgUser.id, role: 'OWNER' },
    });

    // Crear suscripción
    await prisma.subscription.create({
      data: {
        organizationId: organization.id,
        plan: 'PROFESSIONAL',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    console.log(`   ✅ Organización creada: ${organization.name}`);
    console.log(`   ✅ Usuario: admin@admin.com / 123456\n`);

    // 3. Crear 10 voluntarios
    console.log('3️⃣ Creando 10 voluntarios...');
    const volunteers = [];
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
          latitude: -17.783327 + (Math.random() - 0.5) * 0.1,
          longitude: -63.182076 + (Math.random() - 0.5) * 0.1,
          skills: data.skills,
          certifications: ['CPR', 'First Aid'],
          transportOptions: ['car', 'motorcycle'],
          level: data.level,
          totalPoints: data.points,
          reputationScore: 70 + Math.floor(Math.random() * 30),
        },
      });

      volunteers.push({ user, profile });
    }
    console.log(`   ✅ ${volunteers.length} voluntarios creados\n`);

    // 4. Crear eventos
    console.log('4️⃣ Creando eventos...');
    const events = await Promise.all([
      prisma.event.create({
        data: {
          organizationId: organization.id,
          createdByUserId: orgUser.id,
          title: 'Campaña de Ayuda Humanitaria',
          description: 'Evento de ayuda humanitaria en zonas afectadas',
          status: 'PUBLISHED',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          location: 'Santa Cruz, Bolivia',
        },
      }),
      prisma.event.create({
        data: {
          organizationId: organization.id,
          createdByUserId: orgUser.id,
          title: 'Emergencia Inundaciones',
          description: 'Respuesta a emergencia por inundaciones',
          status: 'IN_PROGRESS',
          startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          location: 'Trinidad, Beni',
        },
      }),
    ]);
    console.log(`   ✅ ${events.length} eventos creados\n`);

    // 5. Crear tareas
    console.log('5️⃣ Creando tareas...');
    const tasks = await Promise.all([
      prisma.task.create({
        data: {
          organizationId: organization.id,
          eventId: events[0].id,
          createdByUserId: orgUser.id,
          title: 'Distribución de alimentos',
          description: 'Distribuir alimentos en comunidades afectadas',
          urgency: 'HIGH',
          category: 'Logistics',
          skillsRequired: ['logistics', 'communication'],
          locationName: 'Villa Tunari, Cochabamba',
          latitude: -16.9833,
          longitude: -65.4167,
          volunteersNeeded: 5,
          startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          endAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
          status: 'PENDING',
        },
      }),
      prisma.task.create({
        data: {
          organizationId: organization.id,
          eventId: events[0].id,
          createdByUserId: orgUser.id,
          title: 'Atención médica de emergencia',
          description: 'Brigada médica en zona de desastre',
          urgency: 'CRITICAL',
          category: 'Healthcare',
          skillsRequired: ['medical', 'first-aid'],
          locationName: 'Trinidad, Beni',
          latitude: -14.8333,
          longitude: -64.9000,
          volunteersNeeded: 3,
          startAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
          endAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          status: 'ASSIGNED',
        },
      }),
      prisma.task.create({
        data: {
          organizationId: organization.id,
          eventId: events[1].id,
          createdByUserId: orgUser.id,
          title: 'Construcción de refugios temporales',
          description: 'Construir refugios para familias afectadas',
          urgency: 'HIGH',
          category: 'Construction',
          skillsRequired: ['construction', 'coordination'],
          locationName: 'Riberalta, Beni',
          latitude: -11.0167,
          longitude: -66.0667,
          volunteersNeeded: 8,
          startAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          endAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          status: 'IN_PROGRESS',
        },
      }),
      prisma.task.create({
        data: {
          organizationId: organization.id,
          createdByUserId: orgUser.id,
          title: 'Apoyo psicológico',
          description: 'Brindar apoyo psicológico a afectados',
          urgency: 'MEDIUM',
          category: 'Support',
          skillsRequired: ['psychology', 'communication'],
          locationName: 'Santa Cruz, Bolivia',
          latitude: -17.7833,
          longitude: -63.1821,
          volunteersNeeded: 4,
          startAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          endAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
          status: 'PENDING',
        },
      }),
      prisma.task.create({
        data: {
          organizationId: organization.id,
          createdByUserId: orgUser.id,
          title: 'Coordinación logística',
          description: 'Coordinar recursos y voluntarios',
          urgency: 'MEDIUM',
          category: 'Logistics',
          skillsRequired: ['logistics', 'coordination'],
          locationName: 'La Paz, Bolivia',
          latitude: -16.5000,
          longitude: -68.1500,
          volunteersNeeded: 2,
          startAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          endAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
          status: 'COMPLETED',
        },
      }),
    ]);
    console.log(`   ✅ ${tasks.length} tareas creadas\n`);

    // 6. Crear asignaciones
    console.log('6️⃣ Creando asignaciones...');
    const assignments = [];
    for (let i = 0; i < Math.min(volunteers.length, tasks.length * 2); i++) {
      const task = tasks[i % tasks.length];
      const volunteer = volunteers[i % volunteers.length];
      const statuses = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      const assignment = await prisma.assignment.create({
        data: {
          taskId: task.id,
          volunteerId: volunteer.user.id,
          organizationId: organization.id,
          assignedByUserId: orgUser.id,
          status: status,
          assignedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          ...(status === 'COMPLETED' && { completedAt: new Date() }),
        },
      });
      assignments.push(assignment);
    }
    console.log(`   ✅ ${assignments.length} asignaciones creadas\n`);

    // 7. Crear transacciones de puntos
    console.log('7️⃣ Creando transacciones de puntos...');
    for (const assignment of assignments.filter(a => a.status === 'COMPLETED')) {
      await prisma.pointTransaction.create({
        data: {
          volunteerProfileId: volunteers.find(v => v.user.id === assignment.volunteerId)?.profile.id,
          type: 'EARN',
          amount: 100 + Math.floor(Math.random() * 200),
          description: 'Puntos por completar misión',
        },
      });
    }
    console.log('   ✅ Transacciones de puntos creadas\n');

    console.log('✅ ¡Seed completado exitosamente!\n');
    console.log('📊 Credenciales:');
    console.log('   Organización:');
    console.log('     Email: admin@admin.com');
    console.log('     Password: 12345678\n');
    console.log('   Voluntarios (10):');
    volunteerData.forEach((v, i) => {
      console.log(`     ${i + 1}. ${v.email} / 12345678`);
    });
    console.log('\n');

  } catch (error) {
    console.error('❌ Error en seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Error fatal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

