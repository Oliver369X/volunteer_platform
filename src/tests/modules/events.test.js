'use strict';

const request = require('supertest');
const app = require('../../app');
const { getPrisma } = require('../../database');
const { createTestUser, createTestOrganization, cleanupTestData } = require('../helpers/factories');
const { signAccessToken } = require('../../utils/jwt');

describe('Events Module - CU08 & CU20', () => {
  let prisma;
  let organizationToken;
  let organizationId;
  let userId;
  let eventId;

  beforeAll(async () => {
    prisma = getPrisma();
    
    // Crear organización de prueba
    const org = await createTestOrganization(prisma);
    organizationId = org.id;
    userId = org.userId;
    organizationToken = signAccessToken({ sub: userId, email: 'org@test.com', role: 'ORGANIZATION' });
  });

  afterAll(async () => {
    await cleanupTestData(prisma);
  });

  describe('POST /api/events', () => {
    it('should create new event', async () => {
      const eventData = {
        organizationId,
        title: 'Campaña de Reforestación 2024',
        description: 'Plantación de 1000 árboles en áreas deforestadas',
        locationName: 'Parque Nacional Amboró',
        latitude: -18.0625,
        longitude: -63.1234,
        startDate: new Date('2024-12-15T08:00:00Z'),
        endDate: new Date('2024-12-15T16:00:00Z'),
      };

      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${organizationToken}`)
        .send(eventData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.title).toBe(eventData.title);
      expect(response.body.data.status).toBe('DRAFT');
      
      eventId = response.body.data.id;
    });

    it('should fail without organization membership', async () => {
      const anotherUserToken = signAccessToken({ 
        sub: 'random-id', 
        email: 'random@test.com', 
        role: 'ORGANIZATION' 
      });

      await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .send({
          organizationId,
          title: 'Test Event',
          startDate: new Date(),
          endDate: new Date(),
        })
        .expect(403);
    });
  });

  describe('GET /api/events', () => {
    it('should list organization events', async () => {
      const response = await request(app)
        .get(`/api/events?organizationId=${organizationId}`)
        .set('Authorization', `Bearer ${organizationToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/events/:id', () => {
    it('should get event details', async () => {
      const response = await request(app)
        .get(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${organizationToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.id).toBe(eventId);
      expect(response.body.data.tasks).toBeDefined();
    });
  });

  describe('PUT /api/events/:id', () => {
    it('should update event', async () => {
      const updateData = {
        title: 'Campaña de Reforestación 2024 - Actualizado',
        description: 'Plantación de 2000 árboles (actualizado)',
      };

      const response = await request(app)
        .put(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${organizationToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.title).toBe(updateData.title);
    });
  });

  describe('POST /api/events/:id/publish', () => {
    it('should fail to publish event without tasks', async () => {
      await request(app)
        .post(`/api/events/${eventId}/publish`)
        .set('Authorization', `Bearer ${organizationToken}`)
        .expect(400);
    });
  });

  describe('POST /api/events/:id/cancel', () => {
    it('should cancel event', async () => {
      const response = await request(app)
        .post(`/api/events/${eventId}/cancel`)
        .set('Authorization', `Bearer ${organizationToken}`)
        .send({ reason: 'Condiciones climáticas adversas' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.status).toBe('CANCELLED');
    });
  });
});


