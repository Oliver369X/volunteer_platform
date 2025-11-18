'use strict';

const request = require('supertest');
const app = require('../../app');
const { getPrisma, cleanup } = require('../helpers/prisma');
const { createUserData, createOrganizationData } = require('../helpers/factories');
const { createTestToken, getAuthHeader } = require('../helpers/auth');
const { hashPassword } = require('../../utils/password');

describe('Organizations Module', () => {
  let prisma;
  let adminUser;
  let orgUser;
  let adminToken;
  let orgToken;
  let organization;

  beforeAll(async () => {
    prisma = getPrisma();
  });

  beforeEach(async () => {
    await cleanup();

    // Crear usuario admin
    adminUser = await prisma.user.create({
      data: {
        ...createUserData({ role: 'ADMIN' }),
        passwordHash: await hashPassword('password123'),
      },
    });
    adminToken = createTestToken(adminUser);

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
  });

  describe('GET /api/organizations', () => {
    it('debería listar organizaciones para admin', async () => {
      const response = await request(app)
        .get('/api/organizations')
        .set(getAuthHeader(adminToken))
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('debería listar solo organizaciones del usuario para ORGANIZATION', async () => {
      const response = await request(app)
        .get('/api/organizations')
        .set(getAuthHeader(orgToken))
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].id).toBe(organization.id);
    });

    it('debería rechazar acceso para voluntarios', async () => {
      const volunteerUser = await prisma.user.create({
        data: {
          ...createUserData({ role: 'VOLUNTEER' }),
          passwordHash: await hashPassword('password123'),
        },
      });
      const volunteerToken = createTestToken(volunteerUser);

      const response = await request(app)
        .get('/api/organizations')
        .set(getAuthHeader(volunteerToken))
        .expect(403);

      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /api/organizations/:id', () => {
    it('debería obtener detalles de organización para admin', async () => {
      const response = await request(app)
        .get(`/api/organizations/${organization.id}`)
        .set(getAuthHeader(adminToken))
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.id).toBe(organization.id);
      expect(response.body.data).toHaveProperty('metrics');
    });

    it('debería obtener detalles para miembro de la organización', async () => {
      const response = await request(app)
        .get(`/api/organizations/${organization.id}`)
        .set(getAuthHeader(orgToken))
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.id).toBe(organization.id);
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
        .get(`/api/organizations/${organization.id}`)
        .set(getAuthHeader(otherToken))
        .expect(403);

      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/organizations/:id/members', () => {
    it('debería agregar miembro para OWNER', async () => {
      const newUser = await prisma.user.create({
        data: {
          ...createUserData({ role: 'ORGANIZATION' }),
          passwordHash: await hashPassword('password123'),
        },
      });

      const response = await request(app)
        .post(`/api/organizations/${organization.id}/members`)
        .set(getAuthHeader(orgToken))
        .send({
          email: newUser.email,
          role: 'COORDINATOR',
        })
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.user.id).toBe(newUser.id);
      expect(response.body.data.role).toBe('COORDINATOR');

      // Verificar en BD
      const member = await prisma.organizationMember.findFirst({
        where: {
          organizationId: organization.id,
          userId: newUser.id,
        },
      });
      expect(member).toBeTruthy();
    });

    it('debería rechazar agregar miembro duplicado', async () => {
      const response = await request(app)
        .post(`/api/organizations/${organization.id}/members`)
        .set(getAuthHeader(orgToken))
        .send({
          email: orgUser.email,
          role: 'COORDINATOR',
        })
        .expect(400);

      expect(response.body.status).toBe('error');
    });
  });
});

