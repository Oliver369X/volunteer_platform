'use strict';

const request = require('supertest');
const app = require('../../app');
const { getPrisma } = require('../../database');
const { createTestOrganization, cleanupTestData } = require('../helpers/factories');
const { signAccessToken } = require('../../utils/jwt');

describe('Payments Module - CU17', () => {
  let prisma;
  let organizationToken;
  let userId;

  beforeAll(async () => {
    prisma = getPrisma();
    
    const org = await createTestOrganization(prisma);
    userId = org.userId;
    organizationToken = signAccessToken({ sub: userId, email: 'org@test.com', role: 'ORGANIZATION' });
  });

  afterAll(async () => {
    await cleanupTestData(prisma);
  });

  describe('GET /api/payments/subscription', () => {
    it('should get current subscription', async () => {
      const response = await request(app)
        .get('/api/payments/subscription')
        .set('Authorization', `Bearer ${organizationToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.subscription).toBeDefined();
      expect(response.body.data.plan).toBeDefined();
    });

    it('should default to FREE plan', async () => {
      const response = await request(app)
        .get('/api/payments/subscription')
        .set('Authorization', `Bearer ${organizationToken}`)
        .expect(200);

      expect(response.body.data.subscription.plan).toBe('FREE');
    });
  });

  describe('POST /api/payments/checkout', () => {
    it('should create checkout session for BASIC plan', async () => {
      // Skip if Stripe not configured
      if (!process.env.STRIPE_SECRET_KEY) {
        console.log('⏭️  Skipping Stripe checkout test - STRIPE_SECRET_KEY not configured');
        return;
      }

      // Skip if Stripe price IDs not configured (productos no creados en Stripe)
      if (!process.env.STRIPE_PRICE_BASIC) {
        console.log('⏭️  Skipping Stripe checkout test - STRIPE_PRICE_BASIC not configured. Create products in Stripe Dashboard first.');
        return;
      }

      const response = await request(app)
        .post('/api/payments/checkout')
        .set('Authorization', `Bearer ${organizationToken}`)
        .send({ plan: 'BASIC' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.sessionId).toBeDefined();
      expect(response.body.data.url).toBeDefined();
    });

    it('should fail for invalid plan', async () => {
      await request(app)
        .post('/api/payments/checkout')
        .set('Authorization', `Bearer ${organizationToken}`)
        .send({ plan: 'INVALID' })
        .expect(400);
    });

    it('should not allow FREE plan checkout', async () => {
      await request(app)
        .post('/api/payments/checkout')
        .set('Authorization', `Bearer ${organizationToken}`)
        .send({ plan: 'FREE' })
        .expect(400);
    });
  });

  describe('Subscription Plans', () => {
    it('should have correct plan features', async () => {
      const { PLANS } = require('../../modules/payments/payments.service');

      expect(PLANS.FREE.features.maxEvents).toBe(1);
      expect(PLANS.BASIC.features.maxEvents).toBe(10);
      expect(PLANS.BASIC.features.aiMatching).toBe(true);
      expect(PLANS.PROFESSIONAL.features.predictiveAI).toBe(true);
      expect(PLANS.ENTERPRISE.features.dedicatedSupport).toBe(true);
    });
  });

  describe('POST /api/payments/subscription/cancel', () => {
    it('should fail to cancel FREE plan', async () => {
      await request(app)
        .post('/api/payments/subscription/cancel')
        .set('Authorization', `Bearer ${organizationToken}`)
        .expect(400);
    });
  });
});


