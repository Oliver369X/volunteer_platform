'use strict';

const request = require('supertest');
const app = require('../../app');
const { getPrisma } = require('../../database');
const { createTestUser, cleanupTestData } = require('../helpers/factories');
const { signAccessToken } = require('../../utils/jwt');

describe('Profiles Module - CU05', () => {
  let prisma;
  let volunteerToken;
  let volunteerId;

  beforeAll(async () => {
    prisma = getPrisma();
    
    // Crear voluntario de prueba
    const volunteer = await createTestUser(prisma, {
      role: 'VOLUNTEER',
      email: 'volunteer.test@example.com',
    });
    volunteerId = volunteer.id;
    volunteerToken = signAccessToken({ sub: volunteer.id, email: volunteer.email, role: 'VOLUNTEER' });
  });

  afterAll(async () => {
    await cleanupTestData(prisma);
  });

  describe('GET /api/profiles/me', () => {
    it('should return volunteer profile', async () => {
      const response = await request(app)
        .get('/api/profiles/me')
        .set('Authorization', `Bearer ${volunteerToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.profile).toBeDefined();
    });

    it('should fail without authentication', async () => {
      await request(app)
        .get('/api/profiles/me')
        .expect(401);
    });
  });

  describe('PUT /api/profiles/me', () => {
    it('should update volunteer profile', async () => {
      const updateData = {
        bio: 'Voluntario comprometido con causas sociales',
        baseLocation: 'Santa Cruz, Bolivia',
        skills: ['Primeros Auxilios', 'Logística'],
      };

      const response = await request(app)
        .put('/api/profiles/me')
        .set('Authorization', `Bearer ${volunteerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.bio).toBe(updateData.bio);
      expect(response.body.data.skills).toContain('Primeros Auxilios');
    });
  });

  describe('POST /api/profiles/me/skills', () => {
    it('should add new skills', async () => {
      const response = await request(app)
        .post('/api/profiles/me/skills')
        .set('Authorization', `Bearer ${volunteerToken}`)
        .send({ skills: ['Carpintería', 'Electricidad'] })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.skills).toContain('Carpintería');
    });

    it('should not add duplicate skills', async () => {
      await request(app)
        .post('/api/profiles/me/skills')
        .set('Authorization', `Bearer ${volunteerToken}`)
        .send({ skills: ['Carpintería'] })
        .expect(200);

      const profile = await prisma.volunteerProfile.findUnique({
        where: { userId: volunteerId },
      });

      const carpinteriaCount = profile.skills.filter(s => s === 'Carpintería').length;
      expect(carpinteriaCount).toBe(1);
    });
  });

  describe('DELETE /api/profiles/me/skills', () => {
    it('should remove skills', async () => {
      const response = await request(app)
        .delete('/api/profiles/me/skills')
        .set('Authorization', `Bearer ${volunteerToken}`)
        .send({ skills: ['Carpintería'] })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.skills).not.toContain('Carpintería');
    });
  });

  describe('PUT /api/profiles/me/availability', () => {
    it('should update availability schedule', async () => {
      const availability = {
        monday: ['09:00-12:00', '14:00-18:00'],
        wednesday: ['09:00-17:00'],
        friday: ['14:00-20:00'],
      };

      const response = await request(app)
        .put('/api/profiles/me/availability')
        .set('Authorization', `Bearer ${volunteerToken}`)
        .send({ availability })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.availability.monday).toBeDefined();
    });
  });
});


