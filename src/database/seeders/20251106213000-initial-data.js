'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const adminId = uuidv4();
    const orgOwnerId = uuidv4();
    const volunteerId = uuidv4();
    const organizationId = uuidv4();
    const volunteerProfileId = uuidv4();

    const passwordHash = await bcrypt.hash('ChangeMe123!', 10);

    await queryInterface.bulkInsert('users', [
      {
        id: adminId,
        full_name: 'Admin Plataforma',
        email: 'admin@lacausa.org',
        password_hash: passwordHash,
        phone_number: '+59170000001',
        role: 'ADMIN',
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      },
      {
        id: orgOwnerId,
        full_name: 'Coordinador ONG Esperanza',
        email: 'coordinador@esperanza.org',
        password_hash: passwordHash,
        phone_number: '+59170000002',
        role: 'ORGANIZATION',
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      },
      {
        id: volunteerId,
        full_name: 'Voluntario Modelo',
        email: 'voluntario@ayuda.org',
        password_hash: passwordHash,
        phone_number: '+59170000003',
        role: 'VOLUNTEER',
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      },
    ]);

    await queryInterface.bulkInsert('organizations', [
      {
        id: organizationId,
        created_by_user_id: orgOwnerId,
        name: 'Organización Esperanza',
        description: 'ONG enfocada en respuesta a desastres naturales',
        sector: 'Humanitario',
        contact_email: 'contacto@esperanza.org',
        contact_phone: '+59170000004',
        headquarters_location: 'Santa Cruz de la Sierra',
        coverage_areas: ['Santa Cruz', 'Beni', 'Pando'],
        created_at: now,
        updated_at: now,
      },
    ]);

    await queryInterface.bulkInsert('organization_members', [
      {
        id: uuidv4(),
        organization_id: organizationId,
        user_id: orgOwnerId,
        role: 'OWNER',
        created_at: now,
        updated_at: now,
      },
    ]);

    await queryInterface.bulkInsert('volunteer_profiles', [
      {
        id: volunteerProfileId,
        user_id: volunteerId,
        bio: 'Voluntario con experiencia en logística y primeros auxilios.',
        base_location: 'La Paz',
        latitude: -16.4897,
        longitude: -68.1193,
        availability: {
          weekdays: ['evenings'],
          weekends: ['mornings', 'afternoons'],
        },
        skills: ['Primeros Auxilios', 'Logística', 'Coordinación'],
        certifications: ['Cruz Roja Nivel 1'],
        transport_options: ['Motocicleta'],
        reputation_score: 80,
        total_points: 1200,
        level: 'PLATA',
        experience_hours: 150,
        created_at: now,
        updated_at: now,
      },
    ]);

    await queryInterface.bulkInsert('badges', [
      {
        id: uuidv4(),
        code: 'RESPUESTA_RAPIDA',
        name: 'Respuesta Rápida',
        description:
          'Otorgado a voluntarios que aceptan y completan tareas urgentes en menos de 2 horas',
        category: 'Desempeño',
        level: 'PLATA',
        criteria: { urgency: 'CRITICAL', timeLimitHours: 2 },
        icon_url: null,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        code: 'LIDER_COMUNITARIO',
        name: 'Líder Comunitario',
        description: 'Reconoce a voluntarios que coordinan más de 10 tareas con éxito',
        category: 'Liderazgo',
        level: 'ORO',
        criteria: { completedAssignments: 10 },
        icon_url: null,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        code: 'ESPECIALISTA_LOGISTICA',
        name: 'Especialista en Logística',
        description: 'Otorgado por demostrar excelencia en operaciones logísticas',
        category: 'Especialidad',
        level: 'PLATINO',
        criteria: { skill: 'Logística', rating: 4.5 },
        icon_url: null,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('volunteer_profiles', null, {});
    await queryInterface.bulkDelete('organization_members', null, {});
    await queryInterface.bulkDelete('organizations', null, {});
    await queryInterface.bulkDelete('badges', null, {});
    await queryInterface.bulkDelete('users', null, {});
  },
};
