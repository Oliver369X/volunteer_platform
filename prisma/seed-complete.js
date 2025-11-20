#!/usr/bin/env node
'use strict';

/**
 * Script de seed completo para poblar la base de datos
 * con datos de prueba que cubren todas las Historias de Usuario
 * 
 * Uso: node prisma/seed-complete.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ============================================
// HELPER: Generar fechas actuales dinámicas
// ============================================
const getDateFromNow = (days = 0, hours = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(date.getHours() + hours);
  return date;
};

// Datos de ejemplo
const VOLUNTEER_DATA = [
  {
    fullName: 'Juan Pérez Rodríguez',
    email: 'juan.perez@example.com',
    phone: '+59178901111',
    bio: 'Paramédico con 5 años de experiencia en emergencias. Apasionado por ayudar en situaciones críticas.',
    baseLocation: 'Santa Cruz de la Sierra',
    latitude: -17.783327,
    longitude: -63.182076,
    skills: ['primeros-auxilios', 'rescate', 'comunicacion', 'coordinacion'],
    certifications: ['RCP', 'Primeros Auxilios Avanzados', 'Rescate Acuático'],
    transportOptions: ['auto', 'moto'],
    level: 'ORO',
    totalPoints: 3500,
    reputationScore: 92,
    experienceHours: 120,
  },
  {
    fullName: 'Ana María López Gutiérrez',
    email: 'ana.lopez@example.com',
    phone: '+59178902222',
    bio: 'Enfermera especializada en atención a víctimas de desastres naturales. Voluntaria activa desde hace 3 años.',
    baseLocation: 'La Paz',
    latitude: -16.5000,
    longitude: -68.1500,
    skills: ['atencion-medica', 'primeros-auxilios', 'psicologia', 'gestion-recursos'],
    certifications: ['Enfermería', 'Primeros Auxilios Psicológicos', 'Triage'],
    transportOptions: ['auto'],
    level: 'PLATINO',
    totalPoints: 5200,
    reputationScore: 98,
    experienceHours: 180,
  },
  {
    fullName: 'Carlos Mamani Quispe',
    email: 'carlos.mamani@example.com',
    phone: '+59178903333',
    bio: 'Ingeniero civil con experiencia en construcción de refugios temporales. Me encanta trabajar en equipo.',
    baseLocation: 'Cochabamba',
    latitude: -17.3935,
    longitude: -66.1570,
    skills: ['construccion', 'logistica', 'coordinacion', 'evaluacion-daños'],
    certifications: ['Seguridad en Construcción', 'Gestión de Proyectos'],
    transportOptions: ['auto', 'camioneta'],
    level: 'PLATA',
    totalPoints: 2100,
    reputationScore: 85,
    experienceHours: 75,
  },
  {
    fullName: 'Laura Fernández Castro',
    email: 'laura.fernandez@example.com',
    phone: '+59178904444',
    bio: 'Comunicadora social especializada en gestión de crisis. Experiencia en coordinación de equipos de voluntarios.',
    baseLocation: 'Santa Cruz de la Sierra',
    latitude: -17.783327,
    longitude: -63.182076,
    skills: ['comunicacion', 'coordinacion', 'redes-sociales', 'gestion-recursos'],
    certifications: ['Gestión de Crisis', 'Comunicación en Emergencias'],
    transportOptions: ['auto'],
    level: 'PLATA',
    totalPoints: 1800,
    reputationScore: 88,
    experienceHours: 60,
  },
  {
    fullName: 'Roberto Silva Mendoza',
    email: 'roberto.silva@example.com',
    phone: '+59178905555',
    bio: 'Estudiante de medicina apasionado por el voluntariado. Primera experiencia en atención de emergencias.',
    baseLocation: 'Tarija',
    latitude: -21.5355,
    longitude: -64.7296,
    skills: ['primeros-auxilios', 'comunicacion'],
    certifications: ['RCP Básico'],
    transportOptions: ['moto'],
    level: 'BRONCE',
    totalPoints: 350,
    reputationScore: 72,
    experienceHours: 15,
  },
  {
    fullName: 'Patricia Morales Vargas',
    email: 'patricia.morales@example.com',
    phone: '+59178906666',
    bio: 'Chef profesional que colabora en la preparación de alimentos para refugios y albergues de emergencia.',
    baseLocation: 'Santa Cruz de la Sierra',
    latitude: -17.783327,
    longitude: -63.182076,
    skills: ['logistica', 'cocina', 'gestion-recursos', 'higiene'],
    certifications: ['Manipulación de Alimentos', 'Nutrición en Emergencias'],
    transportOptions: ['auto'],
    level: 'PLATA',
    totalPoints: 1500,
    reputationScore: 80,
    experienceHours: 50,
  },
];

const ORGANIZATION_DATA = [
  {
    user: {
      fullName: 'María González Pérez',
      email: 'maria@cruzroja.org',
      phone: '+59178901234',
    },
    org: {
      name: 'Cruz Roja Boliviana',
      description: 'Organización humanitaria internacional dedicada a la asistencia en emergencias y desastres naturales. Presente en Bolivia desde 1917.',
      sector: 'Salud y Emergencias',
      headquartersLocation: 'La Paz, Bolivia',
      coverageAreas: ['La Paz', 'Cochabamba', 'Santa Cruz', 'Oruro', 'Potosí'],
    },
  },
  {
    user: {
      fullName: 'Jorge Torrez Suárez',
      email: 'jorge@defcivil.gob.bo',
      phone: '+59178905678',
    },
    org: {
      name: 'Defensa Civil Bolivia',
      description: 'Institución encargada de coordinar y ejecutar acciones de prevención, atención y recuperación ante desastres naturales y antrópicos.',
      sector: 'Gobierno y Emergencias',
      headquartersLocation: 'La Paz, Bolivia',
      coverageAreas: ['La Paz', 'El Alto', 'Cochabamba', 'Santa Cruz', 'Sucre', 'Tarija', 'Trinidad', 'Oruro', 'Potosí'],
    },
  },
  {
    user: {
      fullName: 'Sandra Flores Mendoza',
      email: 'sandra@caritas.org.bo',
      phone: '+59178909012',
    },
    org: {
      name: 'Cáritas Bolivia',
      description: 'Organización de la Iglesia Católica dedicada a la promoción humana y el desarrollo integral de comunidades vulnerables.',
      sector: 'Desarrollo Social',
      headquartersLocation: 'La Paz, Bolivia',
      coverageAreas: ['La Paz', 'Cochabamba', 'Santa Cruz', 'Sucre'],
    },
  },
];

const TASK_DATA = [
  {
    title: 'Distribución de alimentos en zonas inundadas - Villa Tunari',
    description: 'Se requiere apoyo urgente para distribuir alimentos y agua potable en comunidades afectadas por las inundaciones. Se proporcionará transporte y materiales necesarios.',
    urgency: 'CRITICAL',
    category: 'Logística',
    skillsRequired: ['logistica', 'coordinacion', 'comunicacion'],
    locationName: 'Villa Tunari, Cochabamba',
    latitude: -16.9833,
    longitude: -65.4167,
    volunteersNeeded: 8,
    startAt: getDateFromNow(2, 7), // En 2 días a las 7am
    endAt: getDateFromNow(2, 19), // En 2 días a las 7pm
    status: 'ASSIGNED',
    metadata: {
      beneficiaries: 500,
      supplies: ['alimentos', 'agua', 'medicamentos básicos'],
      meetingPoint: 'Plaza Principal Villa Tunari',
    },
  },
  {
    title: 'Brigada médica de emergencia - Trinidad',
    description: 'Brigada médica para atención de emergencias en zona afectada por desbordamiento del río Mamoré. Se necesitan profesionales de salud y paramédicos.',
    urgency: 'CRITICAL',
    category: 'Salud',
    skillsRequired: ['atencion-medica', 'primeros-auxilios', 'rescate'],
    locationName: 'Trinidad, Beni',
    latitude: -14.8333,
    longitude: -64.9000,
    volunteersNeeded: 6,
    startAt: getDateFromNow(3, 6), // En 3 días a las 6am
    endAt: getDateFromNow(4, 20), // En 4 días a las 8pm
    status: 'IN_PROGRESS',
    metadata: {
      medicalSupplies: true,
      accommodationProvided: true,
      transportProvided: true,
    },
  },
  {
    title: 'Construcción de refugios temporales - Zona Sur',
    description: 'Construcción de refugios temporales para familias damnificadas. Se requieren personas con conocimientos básicos de construcción.',
    urgency: 'HIGH',
    category: 'Construcción',
    skillsRequired: ['construccion', 'logistica', 'coordinacion'],
    locationName: 'Zona Sur, La Paz',
    latitude: -16.5400,
    longitude: -68.1193,
    volunteersNeeded: 10,
    startAt: getDateFromNow(5, 8), // En 5 días a las 8am
    endAt: getDateFromNow(7, 18), // En 7 días a las 6pm
    status: 'PENDING',
    metadata: {
      materials: 'proporcionados',
      meals: 'incluidas',
      tools: 'necesarias',
    },
  },
  {
    title: 'Apoyo psicosocial a víctimas de desastre',
    description: 'Se necesitan psicólogos y trabajadores sociales para brindar apoyo emocional a familias afectadas por las recientes inundaciones.',
    urgency: 'HIGH',
    category: 'Apoyo Psicosocial',
    skillsRequired: ['psicologia', 'comunicacion', 'trabajo-social'],
    locationName: 'Cochabamba',
    latitude: -17.3935,
    longitude: -66.1570,
    volunteersNeeded: 4,
    startAt: getDateFromNow(6, 9), // En 6 días a las 9am
    endAt: getDateFromNow(8, 17), // En 8 días a las 5pm
    status: 'PENDING',
    metadata: {
      sessions: 'grupales e individuales',
      training: 'será proporcionada',
    },
  },
  {
    title: 'Evaluación de daños estructurales - Zona Norte',
    description: 'Evaluación técnica de viviendas y edificios afectados por el sismo. Se requieren ingenieros civiles o arquitectos.',
    urgency: 'MEDIUM',
    category: 'Evaluación Técnica',
    skillsRequired: ['evaluacion-daños', 'construccion'],
    locationName: 'El Alto, La Paz',
    latitude: -16.5000,
    longitude: -68.1500,
    volunteersNeeded: 3,
    startAt: getDateFromNow(10, 8), // En 10 días a las 8am
    endAt: getDateFromNow(11, 18), // En 11 días a las 6pm
    status: 'PENDING',
    metadata: {
      equipment: 'proporcionado',
      reports: 'formato digital',
    },
  },
  {
    title: 'Limpieza y rehabilitación de escuela inundada',
    description: 'Limpieza y rehabilitación de escuela primaria afectada por inundación. Necesitamos voluntarios para limpieza general y pintura.',
    urgency: 'MEDIUM',
    category: 'Limpieza y Rehabilitación',
    skillsRequired: ['logistica', 'coordinacion'],
    locationName: 'Santa Cruz de la Sierra',
    latitude: -17.783327,
    longitude: -63.182076,
    volunteersNeeded: 15,
    startAt: getDateFromNow(-2, 8), // Hace 2 días a las 8am (pasado)
    endAt: getDateFromNow(-2, 17), // Hace 2 días a las 5pm (pasado)
    status: 'COMPLETED',
    metadata: {
      materials: 'proporcionados',
      meals: 'almuerzo incluido',
      students: 300,
    },
  },
  {
    title: 'Campaña de vacunación en refugios temporales',
    description: 'Campaña de vacunación para prevenir enfermedades en albergues. Se necesitan profesionales de salud y voluntarios de apoyo.',
    urgency: 'HIGH',
    category: 'Salud Preventiva',
    skillsRequired: ['atencion-medica', 'primeros-auxilios', 'logistica'],
    locationName: 'Tarija',
    latitude: -21.5355,
    longitude: -64.7296,
    volunteersNeeded: 5,
    startAt: getDateFromNow(-3, 8), // Hace 3 días a las 8am (pasado - verificado)
    endAt: getDateFromNow(-3, 16), // Hace 3 días a las 4pm (pasado - verificado)
    status: 'VERIFIED',
    metadata: {
      vaccines: ['COVID-19', 'Influenza', 'Tetanos'],
      beneficiaries: 200,
    },
  },
];

const BADGE_DATA = [
  {
    code: 'FIRST_MISSION',
    name: 'Primera Misión',
    description: '¡Completaste tu primera misión! Este es solo el comienzo de tu viaje como voluntario.',
    category: 'Hito',
    level: 'BRONCE',
    criteria: { missions: 1 },
    iconUrl: '/badges/first-mission.svg',
  },
  {
    code: 'RAPID_RESPONSE',
    name: 'Respuesta Rápida',
    description: 'Aceptaste y completaste una misión en tiempo récord. Tu rapidez salva vidas.',
    category: 'Velocidad',
    level: 'PLATA',
    criteria: { responseTimeMinutes: 60, completionTimeHours: 24 },
    iconUrl: '/badges/rapid-response.svg',
  },
  {
    code: 'HERO_BADGE',
    name: 'Héroe Humanitario',
    description: 'Has completado 10 misiones críticas con excelente calificación. Eres un verdadero héroe.',
    category: 'Logro',
    level: 'ORO',
    criteria: { minMissions: 10, minRating: 4, urgency: 'CRITICAL' },
    iconUrl: '/badges/hero.svg',
  },
  {
    code: 'MEDICAL_EXPERT',
    name: 'Experto Médico',
    description: 'Has demostrado excelencia en misiones de salud y emergencias médicas.',
    category: 'Especialización',
    level: 'ORO',
    criteria: { category: 'Salud', missions: 5, minRating: 4.5 },
    iconUrl: '/badges/medical-expert.svg',
  },
  {
    code: 'TEAM_LEADER',
    name: 'Líder de Equipo',
    description: 'Has coordinado exitosamente múltiples equipos de voluntarios.',
    category: 'Liderazgo',
    level: 'PLATINO',
    criteria: { leadershipRoles: 3, teamSize: 5 },
    iconUrl: '/badges/team-leader.svg',
  },
  {
    code: 'DEDICATION_100',
    name: 'Compromiso Centenario',
    description: 'Has dedicado más de 100 horas al voluntariado. Tu compromiso es inspirador.',
    category: 'Dedicación',
    level: 'PLATINO',
    criteria: { experienceHours: 100 },
    iconUrl: '/badges/dedication-100.svg',
  },
  {
    code: 'COMMUNITY_FAVORITE',
    name: 'Favorito de la Comunidad',
    description: 'Has recibido excelentes calificaciones de múltiples organizaciones.',
    category: 'Reputación',
    level: 'ORO',
    criteria: { avgRating: 4.8, missions: 8 },
    iconUrl: '/badges/community-favorite.svg',
  },
  {
    code: 'SPECIALIST_BADGE',
    name: 'Especialista en Emergencias',
    description: 'Badge especial otorgado por demostrar habilidades excepcionales en múltiples áreas.',
    category: 'Especial',
    level: 'ESPECIAL',
    criteria: { specialRecognition: true },
    iconUrl: '/badges/specialist.svg',
  },
];

async function main() {
  console.log('🌱 Iniciando seed completo de la base de datos...\n');

  // 1. Limpiar base de datos
  console.log('🧹 Paso 1/8: Limpiando datos existentes...');
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
  console.log('   ✅ Base de datos limpiada\n');

  // 2. Crear badges del sistema
  console.log('🏅 Paso 2/8: Creando badges del sistema...');
  const badges = [];
  for (const badgeData of BADGE_DATA) {
    const badge = await prisma.badge.create({ data: badgeData });
    badges.push(badge);
  }
  console.log(`   ✅ ${badges.length} badges creados\n`);

  // 3. Crear usuario administrador
  console.log('👤 Paso 3/8: Creando usuario administrador...');
  const admin = await prisma.user.create({
    data: {
      fullName: 'Admin Sistema',
      email: 'admin@volunteerplatform.org',
      passwordHash: await bcrypt.hash('Admin123!', 10),
      role: 'ADMIN',
      status: 'ACTIVE',
      phoneNumber: '+59178900000',
    },
  });
  console.log(`   ✅ Admin creado: ${admin.email}\n`);

  // 4. Crear organizaciones
  console.log('🏢 Paso 4/8: Creando organizaciones...');
  const organizations = [];
  for (const orgData of ORGANIZATION_DATA) {
    const orgUser = await prisma.user.create({
      data: {
        fullName: orgData.user.fullName,
        email: orgData.user.email,
        passwordHash: await bcrypt.hash('Password123!', 10),
        role: 'ORGANIZATION',
        status: 'ACTIVE',
        phoneNumber: orgData.user.phone,
      },
    });

    const org = await prisma.organization.create({
      data: {
        createdByUserId: orgUser.id,
        name: orgData.org.name,
        description: orgData.org.description,
        sector: orgData.org.sector,
        contactEmail: orgUser.email,
        contactPhone: orgUser.phoneNumber,
        headquartersLocation: orgData.org.headquartersLocation,
        coverageAreas: orgData.org.coverageAreas,
      },
    });

    await prisma.organizationMember.create({
      data: {
        organizationId: org.id,
        userId: orgUser.id,
        role: 'OWNER',
      },
    });

    organizations.push({ user: orgUser, org });
  }
  console.log(`   ✅ ${organizations.length} organizaciones creadas\n`);

  // 5. Crear voluntarios
  console.log('🙋 Paso 5/8: Creando voluntarios...');
  const volunteers = [];
  for (const volData of VOLUNTEER_DATA) {
    const user = await prisma.user.create({
      data: {
        fullName: volData.fullName,
        email: volData.email,
        passwordHash: await bcrypt.hash('Password123!', 10),
        role: 'VOLUNTEER',
        status: 'ACTIVE',
        phoneNumber: volData.phone,
      },
    });

    const profile = await prisma.volunteerProfile.create({
      data: {
        userId: user.id,
        bio: volData.bio,
        baseLocation: volData.baseLocation,
        latitude: volData.latitude,
        longitude: volData.longitude,
        skills: volData.skills,
        certifications: volData.certifications,
        transportOptions: volData.transportOptions,
        level: volData.level,
        totalPoints: volData.totalPoints,
        reputationScore: volData.reputationScore,
        experienceHours: volData.experienceHours,
      },
    });

    volunteers.push({ user, profile });
  }
  console.log(`   ✅ ${volunteers.length} voluntarios creados\n`);

  // 6. Crear tareas
  console.log('📋 Paso 6/8: Creando tareas...');
  const tasks = [];
  for (let i = 0; i < TASK_DATA.length; i++) {
    const taskData = TASK_DATA[i];
    const org = organizations[i % organizations.length];
    
    const task = await prisma.task.create({
      data: {
        organizationId: org.org.id,
        createdByUserId: org.user.id,
        title: taskData.title,
        description: taskData.description,
        urgency: taskData.urgency,
        category: taskData.category,
        skillsRequired: taskData.skillsRequired,
        locationName: taskData.locationName,
        latitude: taskData.latitude,
        longitude: taskData.longitude,
        volunteersNeeded: taskData.volunteersNeeded,
        startAt: taskData.startAt,
        endAt: taskData.endAt,
        status: taskData.status,
        metadata: taskData.metadata,
      },
    });

    tasks.push(task);
  }
  console.log(`   ✅ ${tasks.length} tareas creadas\n`);

  // 7. Crear asignaciones
  console.log('🤝 Paso 7/8: Creando asignaciones...');
  const assignments = [];

  // Asignación completada y verificada
  const completedAssignment = await prisma.assignment.create({
    data: {
      taskId: tasks[6].id, // Campaña de vacunación (VERIFIED)
      volunteerId: volunteers[1].user.id, // Ana (PLATINO)
      organizationId: organizations[0].org.id,
      assignedByUserId: organizations[0].user.id,
      status: 'VERIFIED',
      assignedAt: getDateFromNow(-4, 10), // Hace 4 días a las 10am
      respondedAt: getDateFromNow(-4, 10.5), // 30 minutos después
      completedAt: getDateFromNow(-3, 17), // Hace 3 días a las 5pm
      rating: 5,
      feedback: 'Excelente trabajo. Ana demostró gran profesionalismo y empatía con los pacientes.',
    },
  });
  assignments.push(completedAssignment);

  // Crear transacción de puntos por completar tarea
  await prisma.pointTransaction.create({
    data: {
      volunteerProfileId: volunteers[1].profile.id,
      assignmentId: completedAssignment.id,
      type: 'EARN',
      points: 500,
      description: 'Puntos ganados por completar: Campaña de vacunación en refugios temporales',
      referenceType: 'assignment',
      referenceId: completedAssignment.id,
    },
  });

  // Otorgar badge "Primera Misión" si corresponde
  if (volunteers[4].profile.totalPoints < 500) {
    await prisma.volunteerBadge.create({
      data: {
        volunteerProfileId: volunteers[4].profile.id,
        badgeId: badges[0].id, // FIRST_MISSION
        assignmentId: completedAssignment.id,
        blockchainStatus: 'MINTED',
        tokenId: `0x${Math.random().toString(16).substr(2, 40)}`,
        metadata: { mintedAt: new Date(), network: 'simulated-blockchain' },
      },
    });
  }

  // Asignación en progreso
  const inProgressAssignment = await prisma.assignment.create({
    data: {
      taskId: tasks[1].id, // Brigada médica (IN_PROGRESS)
      volunteerId: volunteers[0].user.id, // Juan (ORO)
      organizationId: organizations[1].org.id,
      assignedByUserId: organizations[1].user.id,
      status: 'IN_PROGRESS',
      assignedAt: getDateFromNow(-1, 10), // Hace 1 día a las 10am
      respondedAt: getDateFromNow(-1, 10.25), // 15 minutos después
    },
  });
  assignments.push(inProgressAssignment);

  // Más voluntarios asignados a la brigada médica
  assignments.push(
    await prisma.assignment.create({
      data: {
        taskId: tasks[1].id,
        volunteerId: volunteers[1].user.id, // Ana
        organizationId: organizations[1].org.id,
        assignedByUserId: organizations[1].user.id,
        status: 'IN_PROGRESS',
        assignedAt: getDateFromNow(-1, 10), // Hace 1 día a las 10am
        respondedAt: getDateFromNow(-1, 10.33), // 20 minutos después
      },
    }),
  );

  // Asignación aceptada (listo para empezar)
  assignments.push(
    await prisma.assignment.create({
      data: {
        taskId: tasks[0].id, // Distribución de alimentos (ASSIGNED)
        volunteerId: volunteers[2].user.id, // Carlos
        organizationId: organizations[0].org.id,
        assignedByUserId: organizations[0].user.id,
        status: 'ACCEPTED',
        assignedAt: getDateFromNow(0, 15), // Hoy a las 3pm
        respondedAt: getDateFromNow(0, 16), // 1 hora después
      },
    }),
  );

  assignments.push(
    await prisma.assignment.create({
      data: {
        taskId: tasks[0].id,
        volunteerId: volunteers[3].user.id, // Laura
        organizationId: organizations[0].org.id,
        assignedByUserId: organizations[0].user.id,
        status: 'ACCEPTED',
        assignedAt: getDateFromNow(0, 15), // Hoy a las 3pm
        respondedAt: getDateFromNow(0, 15.75), // 45 minutos después
      },
    }),
  );

  // Asignación pendiente (esperando respuesta)
  assignments.push(
    await prisma.assignment.create({
      data: {
        taskId: tasks[2].id, // Construcción de refugios (PENDING)
        volunteerId: volunteers[4].user.id, // Roberto
        organizationId: organizations[0].org.id,
        assignedByUserId: organizations[0].user.id,
        status: 'PENDING',
        assignedAt: getDateFromNow(0, -2), // Hace 2 horas
      },
    }),
  );

  console.log(`   ✅ ${assignments.length} asignaciones creadas\n`);

  // 8. Crear badges para voluntarios destacados
  console.log('🏆 Paso 8/8: Otorgando badges a voluntarios destacados...');
  
  // Ana (PLATINO) - Múltiples badges
  await prisma.volunteerBadge.create({
    data: {
      volunteerProfileId: volunteers[1].profile.id,
      badgeId: badges[5].id, // DEDICATION_100
      blockchainStatus: 'MINTED',
      tokenId: `0x${Math.random().toString(16).substr(2, 40)}`,
      metadata: { achievement: '180 horas de servicio' },
    },
  });

  await prisma.volunteerBadge.create({
    data: {
      volunteerProfileId: volunteers[1].profile.id,
      badgeId: badges[3].id, // MEDICAL_EXPERT
      blockchainStatus: 'MINTED',
      tokenId: `0x${Math.random().toString(16).substr(2, 40)}`,
    },
  });

  // Juan (ORO) - Badges de logro
  await prisma.volunteerBadge.create({
    data: {
      volunteerProfileId: volunteers[0].profile.id,
      badgeId: badges[2].id, // HERO_BADGE
      blockchainStatus: 'MINTED',
      tokenId: `0x${Math.random().toString(16).substr(2, 40)}`,
    },
  });

  await prisma.volunteerBadge.create({
    data: {
      volunteerProfileId: volunteers[0].profile.id,
      badgeId: badges[5].id, // DEDICATION_100
      blockchainStatus: 'MINTED',
      tokenId: `0x${Math.random().toString(16).substr(2, 40)}`,
    },
  });

  // Carlos (PLATA)
  await prisma.volunteerBadge.create({
    data: {
      volunteerProfileId: volunteers[2].profile.id,
      badgeId: badges[0].id, // FIRST_MISSION
      blockchainStatus: 'MINTED',
      tokenId: `0x${Math.random().toString(16).substr(2, 40)}`,
    },
  });

  console.log('   ✅ Badges otorgados\n');

  // 9. Crear algunas recomendaciones de IA (simuladas)
  console.log('🤖 Creando recomendaciones de IA...');
  await prisma.aiRecommendation.create({
    data: {
      taskId: tasks[0].id,
      volunteerId: volunteers[2].user.id,
      organizationId: organizations[0].org.id,
      confidenceScore: 0.92,
      requestContext: {
        taskSkills: tasks[0].skillsRequired,
        volunteerSkills: volunteers[2].profile.skills,
        distance: 5.2,
      },
      responsePayload: {
        recommendation: 'ALTA',
        reasoning: 'Excelente coincidencia de habilidades y ubicación cercana',
        matchScore: 92,
      },
    },
  });
  console.log('   ✅ Recomendaciones de IA creadas\n');

  // Resumen final
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ ¡SEED COMPLETADO EXITOSAMENTE!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📊 RESUMEN DE DATOS CREADOS:');
  console.log(`   • ${badges.length} badges del sistema`);
  console.log(`   • 1 usuario administrador`);
  console.log(`   • ${organizations.length} organizaciones`);
  console.log(`   • ${volunteers.length} voluntarios`);
  console.log(`   • ${tasks.length} tareas`);
  console.log(`   • ${assignments.length} asignaciones`);
  console.log('');

  console.log('🔐 CREDENCIALES DE ACCESO:\n');
  
  console.log('👤 ADMINISTRADOR:');
  console.log('   📧 Email:    admin@volunteerplatform.org');
  console.log('   🔑 Password: Admin123!');
  console.log('');

  console.log('🏢 ORGANIZACIONES:');
  organizations.forEach((org) => {
    console.log(`   📧 ${org.org.name}`);
    console.log(`      Email:    ${org.user.email}`);
    console.log(`      Password: Password123!`);
  });
  console.log('');

  console.log('🙋 VOLUNTARIOS:');
  volunteers.forEach((vol) => {
    console.log(`   📧 ${vol.user.fullName} (${vol.profile.level})`);
    console.log(`      Email:    ${vol.user.email}`);
    console.log(`      Password: Password123!`);
  });
  console.log('');

  console.log('📋 ESTADO DE TAREAS:');
  const tasksByStatus = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});
  Object.entries(tasksByStatus).forEach(([status, count]) => {
    console.log(`   • ${status}: ${count}`);
  });
  console.log('');

  console.log('🎯 FLUJO DE PRUEBA RECOMENDADO:');
  console.log('   1. Inicia sesión como organización (maria@cruzroja.org)');
  console.log('   2. Crea una nueva tarea de emergencia');
  console.log('   3. Usa el matching de IA para encontrar voluntarios');
  console.log('   4. Inicia sesión como voluntario (juan.perez@example.com)');
  console.log('   5. Ve las tareas disponibles y acepta una asignación');
  console.log('   6. Completa la tarea y sube evidencia');
  console.log('   7. Vuelve como organización y verifica la tarea');
  console.log('   8. Revisa los puntos y badges obtenidos');
  console.log('   9. Genera reportes de impacto');
  console.log('');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 ¡Listo para probar todas las funcionalidades!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('\n❌ ERROR EN SEED:', e);
    console.error('\nStack trace:', e.stack);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


