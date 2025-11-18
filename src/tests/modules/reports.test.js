'use strict';

const request = require('supertest');
const app = require('../../app');
const { getPrisma, cleanup } = require('../helpers/prisma');
const {
  createUserData,
  createOrganizationData,
  createTaskData,
  createAssignmentData,
  createVolunteerProfileData,
} = require('../helpers/factories');
const { createTestToken, getAuthHeader } = require('../helpers/auth');
const { hashPassword } = require('../../utils/password');

describe('Reports Module', () => {
  let prisma;
  let orgUser;
  let volunteerUser;
  let orgToken;
  let volunteerToken;
  let organization;
  let tasks = [];
  let assignments = [];

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

    // Crear voluntario
    volunteerUser = await prisma.user.create({
      data: {
        ...createUserData({ role: 'VOLUNTEER' }),
        passwordHash: await hashPassword('password123'),
      },
    });
    volunteerToken = createTestToken(volunteerUser);

    await prisma.volunteerProfile.create({
      data: createVolunteerProfileData(volunteerUser.id),
    });

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

    // Crear tareas y asignaciones
    for (let i = 0; i < 3; i++) {
      const task = await prisma.task.create({
        data: createTaskData(organization.id, orgUser.id, {
          status: i === 0 ? 'PENDING' : i === 1 ? 'IN_PROGRESS' : 'COMPLETED',
        }),
      });
      tasks.push(task);

      const assignment = await prisma.assignment.create({
        data: createAssignmentData(task.id, volunteerUser.id, organization.id, {
          status: i === 2 ? 'VERIFIED' : 'PENDING',
        }),
      });
      assignments.push(assignment);
    }
  });

  describe('GET /api/reports/organization', () => {
    it('debería obtener dashboard de organización', async () => {
      const response = await request(app)
        .get(`/api/reports/organization?organizationId=${organization.id}`)
        .set(getAuthHeader(orgToken))
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('organization');
      expect(response.body.data).toHaveProperty('tasks');
      expect(response.body.data).toHaveProperty('assignments');
      expect(response.body.data).toHaveProperty('recognition');
      expect(response.body.data.tasks).toHaveProperty('total');
      expect(response.body.data.tasks).toHaveProperty('byStatus');
      expect(response.body.data.assignments).toHaveProperty('total');
      expect(response.body.data.assignments).toHaveProperty('byStatus');
    });

    it('debería filtrar por rango de fechas', async () => {
      const from = new Date();
      from.setMonth(from.getMonth() - 1);
      const to = new Date();

      const response = await request(app)
        .get(
          `/api/reports/organization?organizationId=${organization.id}&from=${from.toISOString()}&to=${to.toISOString()}`,
        )
        .set(getAuthHeader(orgToken))
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.period.from).toBeTruthy();
      expect(response.body.data.period.to).toBeTruthy();
    });

    it('debería rechazar acceso para no miembros', async () => {
      const otherUser = await prisma.user.create({
        data: {
          ...createUserData({ role: 'ORGANIZATION' }),
          passwordHash: await hashPassword('password123'),
        },
      });
      const otherToken = createTestToken(otherUser);

      const response = await request(app)
        .get(`/api/reports/organization?organizationId=${organization.id}`)
        .set(getAuthHeader(otherToken))
        .expect(403);

      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /api/reports/volunteer', () => {
    it('debería obtener KPIs del voluntario', async () => {
      const response = await request(app)
        .get('/api/reports/volunteer')
        .set(getAuthHeader(volunteerToken))
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('volunteerId');
      expect(response.body.data).toHaveProperty('level');
      expect(response.body.data).toHaveProperty('totalPoints');
      expect(response.body.data).toHaveProperty('assignmentsCompleted');
    });

    it('debería rechazar acceso para organizaciones', async () => {
      const response = await request(app)
        .get('/api/reports/volunteer')
        .set(getAuthHeader(orgToken))
        .expect(403);

      expect(response.body.status).toBe('error');
    });
  });
});

