'use strict';

/**
 * Tests para funcionalidades de Perfil (Sprint 1)
 * - Cambio de contraseña
 * - Upload de avatar
 */

const request = require('supertest');
const app = require('../../app');
const { getPrisma, cleanup } = require('../helpers/prisma');
const { createTestToken, getAuthHeader } = require('../helpers/auth');
const { hashPassword, verifyPassword } = require('../../utils/password');

let prisma;

beforeAll(async () => {
  prisma = getPrisma();
  await cleanup();
}, 30000);

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
}, 30000);

describe('User Profile Management (Sprint 1)', () => {
  let user;
  let token;

  beforeEach(async () => {
    await cleanup();

    const passwordHash = await hashPassword('OldPassword123!');
    user = await prisma.user.create({
      data: {
        fullName: 'Test User Profile',
        email: 'profile-test@example.com',
        phoneNumber: '+59170000001',
        passwordHash,
        role: 'VOLUNTEER',
      },
    });

    await prisma.volunteerProfile.create({
      data: {
        userId: user.id,
        skills: ['test'],
        baseLocation: 'Test City',
      },
    });

    token = createTestToken(user);
  }, 30000);

  // ============================================
  // CHANGE PASSWORD
  // ============================================
  describe('PATCH /api/users/me/password', () => {
    it('debería cambiar la contraseña correctamente', async () => {
      const response = await request(app)
        .patch('/api/users/me/password')
        .set(...getAuthHeader(token))
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.success).toBe(true);

      // Verificar que la nueva contraseña funciona
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      const isValid = await verifyPassword('NewPassword123!', updatedUser.passwordHash);
      expect(isValid).toBe(true);
    });

    it('debería fallar con contraseña actual incorrecta', async () => {
      const response = await request(app)
        .patch('/api/users/me/password')
        .set(...getAuthHeader(token))
        .send({
          currentPassword: 'WrongPassword!',
          newPassword: 'NewPassword123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('incorrecta');
    });

    it('debería fallar si la nueva contraseña es muy corta', async () => {
      const response = await request(app)
        .patch('/api/users/me/password')
        .set(...getAuthHeader(token))
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'short',
        });

      expect(response.status).toBe(400);
    });

    it('debería fallar sin autenticación', async () => {
      const response = await request(app)
        .patch('/api/users/me/password')
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!',
        });

      expect(response.status).toBe(401);
    });
  });

  // ============================================
  // UPLOAD AVATAR
  // ============================================
  describe('POST /api/users/me/avatar', () => {
    it('debería subir avatar correctamente', async () => {
      // Buffer de imagen de prueba (1x1 pixel PNG)
      const testImageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
        'base64'
      );

      const response = await request(app)
        .post('/api/users/me/avatar')
        .set(...getAuthHeader(token))
        .attach('avatar', testImageBuffer, 'test.png');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('avatarUrl');
      expect(response.body.data.avatarUrl).toContain('cloudinary.com');
    });

    it('debería fallar sin archivo', async () => {
      const response = await request(app)
        .post('/api/users/me/avatar')
        .set(...getAuthHeader(token));

      expect(response.status).toBe(400);
    });

    it('debería fallar sin autenticación', async () => {
      const testImageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
        'base64'
      );

      const response = await request(app)
        .post('/api/users/me/avatar')
        .attach('avatar', testImageBuffer, 'test.png');

      expect(response.status).toBe(401);
    });
  });
});

