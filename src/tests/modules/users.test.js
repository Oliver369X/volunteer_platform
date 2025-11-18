'use strict';

const request = require('supertest');
const app = require('../../app');
const { getPrisma, cleanup } = require('../helpers/prisma');
const { createUserData, createVolunteerProfileData } = require('../helpers/factories');
const { createTestToken, getAuthHeader } = require('../helpers/auth');
const { hashPassword } = require('../../utils/password');

describe('Users Module', () => {
  let prisma;
  let adminUser;
  let volunteerUser;
  let adminToken;
  let volunteerToken;

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

    // Crear usuario voluntario
    volunteerUser = await prisma.user.create({
      data: {
        ...createUserData({ role: 'VOLUNTEER' }),
        passwordHash: await hashPassword('password123'),
      },
    });
    await prisma.volunteerProfile.create({
      data: createVolunteerProfileData(volunteerUser.id),
    });
    volunteerToken = createTestToken(volunteerUser);
  });

  describe('PATCH /api/users/me', () => {
    it('debería actualizar el perfil del usuario autenticado', async () => {
      const updateData = {
        fullName: 'Updated Name',
        phoneNumber: '+9876543210',
      };

      const response = await request(app)
        .patch('/api/users/me')
        .set(getAuthHeader(volunteerToken))
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.fullName).toBe(updateData.fullName);
      expect(response.body.data.phoneNumber).toBe(updateData.phoneNumber);

      // Verificar en BD
      const updated = await prisma.user.findUnique({
        where: { id: volunteerUser.id },
      });
      expect(updated.fullName).toBe(updateData.fullName);
    });

    it('debería rechazar actualización sin autenticación', async () => {
      const response = await request(app)
        .patch('/api/users/me')
        .send({ fullName: 'Test' })
        .expect(401);

      expect(response.body.status).toBe('error');
    });
  });

  describe('PATCH /api/users/me/volunteer-profile', () => {
    it('debería actualizar el perfil de voluntario', async () => {
      const updateData = {
        bio: 'Updated bio',
        skills: ['new-skill'],
        baseLocation: 'New Location',
      };

      const response = await request(app)
        .patch('/api/users/me/volunteer-profile')
        .set(getAuthHeader(volunteerToken))
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.bio).toBe(updateData.bio);
      expect(response.body.data.skills).toEqual(updateData.skills);
    });

    it('debería rechazar actualización si no es voluntario', async () => {
      const response = await request(app)
        .patch('/api/users/me/volunteer-profile')
        .set(getAuthHeader(adminToken))
        .send({ bio: 'Test' })
        .expect(404);

      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /api/users/volunteers', () => {
    it('debería listar voluntarios para admin', async () => {
      // Crear más voluntarios
      for (let i = 0; i < 3; i++) {
        const user = await prisma.user.create({
          data: {
            ...createUserData({ role: 'VOLUNTEER' }),
            passwordHash: await hashPassword('password123'),
          },
        });
        await prisma.volunteerProfile.create({
          data: createVolunteerProfileData(user.id),
        });
      }

      const response = await request(app)
        .get('/api/users/volunteers')
        .set(getAuthHeader(adminToken))
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('debería rechazar acceso para voluntarios', async () => {
      const response = await request(app)
        .get('/api/users/volunteers')
        .set(getAuthHeader(volunteerToken))
        .expect(403);

      expect(response.body.status).toBe('error');
    });

    it('debería filtrar por nivel', async () => {
      const user = await prisma.user.create({
        data: {
          ...createUserData({ role: 'VOLUNTEER' }),
          passwordHash: await hashPassword('password123'),
        },
      });
      await prisma.volunteerProfile.create({
        data: createVolunteerProfileData(user.id, { level: 'ORO' }),
      });

      const response = await request(app)
        .get('/api/users/volunteers?level=ORO')
        .set(getAuthHeader(adminToken))
        .expect(200);

      expect(response.body.data.every((v) => v.level === 'ORO')).toBe(true);
    });
  });
});

