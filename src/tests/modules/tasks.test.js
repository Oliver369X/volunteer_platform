'use strict';

const request = require('supertest');
const app = require('../../app');
const { getPrisma, cleanup } = require('../helpers/prisma');
const {
  createUserData,
  createOrganizationData,
  createTaskData,
} = require('../helpers/factories');
const { createTestToken, getAuthHeader } = require('../helpers/auth');
const { hashPassword } = require('../../utils/password');

describe('Tasks Module', () => {
  let prisma;
  let adminUser;
  let orgUser;
  let volunteerUser;
  let adminToken;
  let orgToken;
  let volunteerToken;
  let organization;

  beforeAll(async () => {
    prisma = getPrisma();
  });

  beforeEach(async () => {
    await cleanup();

    // Crear usuarios
    adminUser = await prisma.user.create({
      data: {
        ...createUserData({ role: 'ADMIN' }),
        passwordHash: await hashPassword('password123'),
      },
    });
    adminToken = createTestToken(adminUser);

    orgUser = await prisma.user.create({
      data: {
        ...createUserData({ role: 'ORGANIZATION' }),
        passwordHash: await hashPassword('password123'),
      },
    });
    orgToken = createTestToken(orgUser);

    volunteerUser = await prisma.user.create({
      data: {
        ...createUserData({ role: 'VOLUNTEER' }),
        passwordHash: await hashPassword('password123'),
      },
    });
    volunteerToken = createTestToken(volunteerUser);

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
  });

  describe('POST /api/tasks', () => {
    it('debería crear una tarea para miembro de organización', async () => {
      const taskData = createTaskData(organization.id, orgUser.id);

      const response = await request(app)
        .post('/api/tasks')
        .set(getAuthHeader(orgToken))
        .send(taskData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.title).toBe(taskData.title);
      expect(response.body.data.organizationId).toBe(organization.id);

      // Verificar en BD
      const task = await prisma.task.findFirst({
        where: { title: taskData.title },
      });
      expect(task).toBeTruthy();
    });

    it('debería rechazar creación para no miembros', async () => {
      const taskData = createTaskData(organization.id, orgUser.id);

      const response = await request(app)
        .post('/api/tasks')
        .set(getAuthHeader(volunteerToken))
        .send(taskData)
        .expect(403);

      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('debería obtener una tarea para miembro de organización', async () => {
      const task = await prisma.task.create({
        data: createTaskData(organization.id, orgUser.id),
      });

      const response = await request(app)
        .get(`/api/tasks/${task.id}`)
        .set(getAuthHeader(orgToken))
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.id).toBe(task.id);
    });

    it('debería obtener una tarea asignada para voluntario', async () => {
      const task = await prisma.task.create({
        data: createTaskData(organization.id, orgUser.id),
      });

      await prisma.assignment.create({
        data: {
          taskId: task.id,
          volunteerId: volunteerUser.id,
          organizationId: organization.id,
          status: 'ACCEPTED',
        },
      });

      const response = await request(app)
        .get(`/api/tasks/${task.id}`)
        .set(getAuthHeader(volunteerToken))
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.id).toBe(task.id);
    });
  });

  describe('GET /api/tasks', () => {
    it('debería listar tareas para organización', async () => {
      await prisma.task.create({
        data: createTaskData(organization.id, orgUser.id),
      });

      const response = await request(app)
        .get('/api/tasks')
        .set(getAuthHeader(orgToken))
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('debería filtrar por estado', async () => {
      await prisma.task.create({
        data: createTaskData(organization.id, orgUser.id, { status: 'PENDING' }),
      });
      await prisma.task.create({
        data: createTaskData(organization.id, orgUser.id, { status: 'COMPLETED' }),
      });

      const response = await request(app)
        .get('/api/tasks?status=PENDING')
        .set(getAuthHeader(orgToken))
        .expect(200);

      expect(response.body.data.every((t) => t.status === 'PENDING')).toBe(true);
    });
  });

  describe('PATCH /api/tasks/:id', () => {
    it('debería actualizar una tarea', async () => {
      const task = await prisma.task.create({
        data: createTaskData(organization.id, orgUser.id),
      });

      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
      };

      const response = await request(app)
        .patch(`/api/tasks/${task.id}`)
        .set(getAuthHeader(orgToken))
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.title).toBe(updateData.title);
    });
  });
});

