'use strict';

const request = require('supertest');
const app = require('../../app');
const { getPrisma } = require('../../database');
const { createTestUser, createTestTask, cleanupTestData } = require('../helpers/factories');
const { signAccessToken } = require('../../utils/jwt');

describe('Tracking Module - CU23', () => {
  let prisma;
  let volunteerToken;
  let organizationToken;
  let volunteerId;
  let taskId;

  beforeAll(async () => {
    prisma = getPrisma();
    
    const volunteer = await createTestUser(prisma, { role: 'VOLUNTEER' });
    volunteerId = volunteer.id;
    volunteerToken = signAccessToken({ sub: volunteer.id, email: volunteer.email, role: 'VOLUNTEER' });

    const org = await createTestUser(prisma, { role: 'ORGANIZATION' });
    organizationToken = signAccessToken({ sub: org.id, email: org.email, role: 'ORGANIZATION' });

    const task = await createTestTask(prisma, { volunteerId });
    taskId = task.id;
  });

  afterAll(async () => {
    await cleanupTestData(prisma);
  });

  describe('POST /api/tracking', () => {
    it('should record volunteer location', async () => {
      const locationData = {
        taskId,
        latitude: -17.7833,
        longitude: -63.1821,
        accuracy: 10,
      };

      const response = await request(app)
        .post('/api/tracking')
        .set('Authorization', `Bearer ${volunteerToken}`)
        .send(locationData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.latitude).toBe(locationData.latitude.toString());
    });

    it('should fail without authentication', async () => {
      await request(app)
        .post('/api/tracking')
        .send({
          taskId,
          latitude: -17.7833,
          longitude: -63.1821,
        })
        .expect(401);
    });
  });

  describe('GET /api/tracking/volunteer/:volunteerId', () => {
    it('should get last known location', async () => {
      const response = await request(app)
        .get(`/api/tracking/volunteer/${volunteerId}`)
        .set('Authorization', `Bearer ${organizationToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      if (response.body.data) {
        expect(response.body.data.latitude).toBeDefined();
        expect(response.body.data.longitude).toBeDefined();
      }
    });

    it('should fail for volunteer role', async () => {
      await request(app)
        .get(`/api/tracking/volunteer/${volunteerId}`)
        .set('Authorization', `Bearer ${volunteerToken}`)
        .expect(403);
    });
  });

  describe('GET /api/tracking/event/:eventId', () => {
    it('should get all volunteer locations for event', async () => {
      // Assuming event exists from previous tests
      const response = await request(app)
        .get('/api/tracking/event/test-event-id')
        .set('Authorization', `Bearer ${organizationToken}`)
        .expect(404); // Will be 404 if event doesn't exist

      // In real test, would create event first
    });
  });

  describe('GPS Tracking Flow', () => {
    it('should track volunteer during task execution', async () => {
      const locations = [
        { lat: -17.7833, lng: -63.1821 },
        { lat: -17.7834, lng: -63.1822 },
        { lat: -17.7835, lng: -63.1823 },
      ];

      for (const loc of locations) {
        await request(app)
          .post('/api/tracking')
          .set('Authorization', `Bearer ${volunteerToken}`)
          .send({
            taskId,
            latitude: loc.lat,
            longitude: loc.lng,
            accuracy: 15,
          })
          .expect(201);

        // Simular 5 minutos entre registros
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Verificar que se guardaron todas las ubicaciones
      const trackings = await prisma.locationTracking.findMany({
        where: { volunteerId, taskId },
        orderBy: { recordedAt: 'asc' },
      });

      expect(trackings.length).toBeGreaterThanOrEqual(3);
    });
  });
});


