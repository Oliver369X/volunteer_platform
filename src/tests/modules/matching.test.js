'use strict';

const request = require('supertest');
const app = require('../../app');
const { getPrisma, cleanup } = require('../helpers/prisma');
const {
  createUserData,
  createOrganizationData,
  createTaskData,
  createVolunteerProfileData,
} = require('../helpers/factories');
const { createTestToken, getAuthHeader } = require('../helpers/auth');
const { hashPassword } = require('../../utils/password');

describe('Matching Module', () => {
  let prisma;
  let orgUser;
  let orgToken;
  let organization;
  let task;
  let volunteers = [];

  beforeAll(async () => {
    prisma = getPrisma();
  });

  beforeEach(async () => {
    await cleanup();

    // Crear usuario organización
    orgUser = await prisma.user.create({
      data: {
        ...createUserData({ role: 'ORGANIZATION' }),
        passwordHash: await hashPassword('password123'),
      },
    });
    orgToken = createTestToken(orgUser);

    // Crear organización
    organization = await prisma.organization.create({
      data: createOrganizationData(orgUser.id),
    });

    await prisma.organizationMember.create({
      data: {
        organizationId: organization.id,
        userId: orgUser.id,
        role: 'OWNER',
      },
    });

    // Crear tarea
    task = await prisma.task.create({
      data: createTaskData(organization.id, orgUser.id, {
        skillsRequired: ['first-aid', 'communication'],
        urgency: 'HIGH',
      }),
    });

    // Crear voluntarios con perfiles
    for (let i = 0; i < 3; i++) {
      const user = await prisma.user.create({
        data: {
          ...createUserData({ role: 'VOLUNTEER' }),
          passwordHash: await hashPassword('password123'),
        },
      });

      await prisma.volunteerProfile.create({
        data: createVolunteerProfileData(user.id, {
          skills: ['first-aid', 'communication'],
          reputationScore: 80 + i * 5,
          totalPoints: 1000 + i * 100,
        }),
      });

      volunteers.push(user);
    }
  });

  describe('POST /api/matching/tasks/:id/run', () => {
    it('debería ejecutar matching y retornar recomendaciones', async () => {
      const response = await request(app)
        .post(`/api/matching/tasks/${task.id}/run`)
        .set(getAuthHeader(orgToken))
        .send({
          autoAssign: false,
          limit: 5,
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('recommendations');
      expect(response.body.data).toHaveProperty('task');
      expect(Array.isArray(response.body.data.recommendations)).toBe(true);
      expect(response.body.data.recommendations.length).toBeGreaterThan(0);

      // Verificar que cada recomendación tiene la estructura correcta
      response.body.data.recommendations.forEach((rec) => {
        expect(rec).toHaveProperty('volunteerId');
        expect(rec).toHaveProperty('score');
        expect(rec).toHaveProperty('volunteer');
      });
    });

    it('debería auto-asignar voluntarios cuando autoAssign es true', async () => {
      const response = await request(app)
        .post(`/api/matching/tasks/${task.id}/run`)
        .set(getAuthHeader(orgToken))
        .send({
          autoAssign: true,
          limit: 2,
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('autoAssigned');
      expect(Array.isArray(response.body.data.autoAssigned)).toBe(true);

      // Verificar que se crearon las asignaciones
      const assignments = await prisma.assignment.findMany({
        where: { taskId: task.id },
      });
      expect(assignments.length).toBeGreaterThan(0);
    });

    it('debería rechazar matching para no miembros', async () => {
      const otherUser = await prisma.user.create({
        data: {
          ...createUserData({ role: 'ORGANIZATION' }),
          passwordHash: await hashPassword('password123'),
        },
      });
      const otherToken = createTestToken(otherUser);

      const response = await request(app)
        .post(`/api/matching/tasks/${task.id}/run`)
        .set(getAuthHeader(otherToken))
        .send({
          autoAssign: false,
          limit: 5,
        })
        .expect(403);

      expect(response.body.status).toBe('error');
    });
  });
});

