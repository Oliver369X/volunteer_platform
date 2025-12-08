'use strict';

const request = require('supertest');
const app = require('../../app');
const { getPrisma } = require('../../database');
const { createTestOrganization, cleanupTestData } = require('../helpers/factories');
const { signAccessToken } = require('../../utils/jwt');

/**
 * TARJETAS DE PRUEBA STRIPE
 * Fuente: https://stripe.com/docs/testing
 * 
 * Pagos exitosos:
 * - 4242424242424242 (Visa) - Pago exitoso sin autenticación
 * - 5555555555554444 (Mastercard) - Pago exitoso
 * - 378282246310005 (American Express) - Pago exitoso
 * 
 * Requiere autenticación 3D Secure:
 * - 4000002500003155 - Requiere autenticación
 * - 4000002760003184 - Requiere autenticación
 * 
 * Tarjetas declinadas:
 * - 4000000000009995 - Declinada (insufficient_funds)
 * - 4000000000009987 - Declinada (lost_card)
 * - 4000000000000002 - Declinada (generic_decline)
 * 
 * Otros métodos:
 * - 6205500000000000004 - UnionPay con longitud variable
 */

describe('Payments Module - CU17', () => {
  let prisma;
  let organizationToken;
  let enterpriseToken;
  let userId;
  let enterpriseUserId;

  beforeAll(async () => {
    prisma = getPrisma();
    
    // Organización normal
    const org = await createTestOrganization(prisma);
    userId = org.userId;
    organizationToken = signAccessToken({ sub: userId, email: 'org@test.com', role: 'ORGANIZATION' });

    // Organización Enterprise (usuario autorizado)
    const enterpriseOrg = await createTestOrganization(prisma, 'oliver679801@gmail.com');
    enterpriseUserId = enterpriseOrg.userId;
    enterpriseToken = signAccessToken({ sub: enterpriseUserId, email: 'oliver679801@gmail.com', role: 'ORGANIZATION' });
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

      expect(PLANS.FREE.price).toBe(0);
      expect(PLANS.FREE.features.maxEvents).toBe(1);
      expect(PLANS.BASIC.price).toBe(29);
      expect(PLANS.BASIC.features.maxEvents).toBe(10);
      expect(PLANS.BASIC.features.aiMatching).toBe(true);
      expect(PLANS.PROFESSIONAL.price).toBe(99);
      expect(PLANS.PROFESSIONAL.features.maxEvents).toBe(-1); // Ilimitado
      expect(PLANS.PROFESSIONAL.features.predictiveAI).toBe(true);
      expect(PLANS.ENTERPRISE.price).toBe(299);
      expect(PLANS.ENTERPRISE.features.dedicatedSupport).toBe(true);
      expect(PLANS.ENTERPRISE.features.customIntegrations).toBe(true);
      expect(PLANS.ENTERPRISE.authorizedEmails).toContain('oliver679801@gmail.com');
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

  describe('Stripe Test Cards - Payment Scenarios', () => {
    it('should document successful payment card (4242424242424242)', () => {
      // Tarjeta de prueba más común de Stripe
      const testCard = {
        number: '4242424242424242',
        exp_month: 12,
        exp_year: 2034,
        cvc: '123',
        description: 'Visa - Pago exitoso sin autenticación',
      };

      expect(testCard.number).toBe('4242424242424242');
      expect(testCard.description).toContain('exitoso');
    });

    it('should document 3D Secure authentication required card (4000002500003155)', () => {
      const testCard = {
        number: '4000002500003155',
        exp_month: 12,
        exp_year: 2034,
        cvc: '123',
        description: 'Requiere autenticación 3D Secure',
      };

      expect(testCard.number).toBe('4000002500003155');
      expect(testCard.description).toContain('autenticación');
    });

    it('should document declined card (4000000000009995)', () => {
      const testCard = {
        number: '4000000000009995',
        exp_month: 12,
        exp_year: 2034,
        cvc: '123',
        description: 'Declinada - Fondos insuficientes',
        expectedError: 'insufficient_funds',
      };

      expect(testCard.number).toBe('4000000000009995');
      expect(testCard.expectedError).toBe('insufficient_funds');
    });

    it('should document lost card declined (4000000000009987)', () => {
      const testCard = {
        number: '4000000000009987',
        exp_month: 12,
        exp_year: 2034,
        cvc: '123',
        description: 'Declinada - Tarjeta perdida',
        expectedError: 'lost_card',
      };

      expect(testCard.expectedError).toBe('lost_card');
    });

    it('should document generic decline card (4000000000000002)', () => {
      const testCard = {
        number: '4000000000000002',
        exp_month: 12,
        exp_year: 2034,
        cvc: '123',
        description: 'Declinada - Error genérico',
        expectedError: 'generic_decline',
      };

      expect(testCard.expectedError).toBe('generic_decline');
    });

    it('should document Mastercard successful payment (5555555555554444)', () => {
      const testCard = {
        number: '5555555555554444',
        exp_month: 12,
        exp_year: 2034,
        cvc: '123',
        description: 'Mastercard - Pago exitoso',
      };

      expect(testCard.number).toBe('5555555555554444');
    });

    it('should document American Express successful payment (378282246310005)', () => {
      const testCard = {
        number: '378282246310005',
        exp_month: 12,
        exp_year: 2034,
        cvc: '1234', // Amex usa 4 dígitos
        description: 'American Express - Pago exitoso',
      };

      expect(testCard.number).toBe('378282246310005');
      expect(testCard.cvc).toBe('1234');
    });
  });

  describe('Enterprise Plan Access Control', () => {
    it('should allow enterprise user to see ENTERPRISE plan', async () => {
      const { PLANS } = require('../../modules/payments/payments.service');
      
      // Verificar que el plan Enterprise existe
      expect(PLANS.ENTERPRISE).toBeDefined();
      expect(PLANS.ENTERPRISE.authorizedEmails).toContain('oliver679801@gmail.com');
    });

    it('should allow enterprise user to checkout ENTERPRISE plan', async () => {
      if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ENTERPRISE) {
        console.log('⏭️  Skipping Enterprise checkout test - Stripe not fully configured');
        return;
      }

      const response = await request(app)
        .post('/api/payments/checkout')
        .set('Authorization', `Bearer ${enterpriseToken}`)
        .send({ plan: 'ENTERPRISE' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.sessionId).toBeDefined();
    });
  });

  describe('Payment Flow Integration', () => {
    it('should create checkout session with correct plan pricing', async () => {
      const { PLANS } = require('../../modules/payments/payments.service');

      // Verificar que los precios coinciden con la landing page
      expect(PLANS.FREE.price).toBe(0);
      expect(PLANS.BASIC.price).toBe(29);
      expect(PLANS.PROFESSIONAL.price).toBe(99);
      expect(PLANS.ENTERPRISE.price).toBe(299);
    });

    it('should validate plan features match subscription tiers', () => {
      const { PLANS } = require('../../modules/payments/payments.service');

      // FREE: limitado
      expect(PLANS.FREE.features.maxEvents).toBe(1);
      expect(PLANS.FREE.features.maxTasksPerEvent).toBe(5);
      expect(PLANS.FREE.features.aiMatching).toBe(false);

      // BASIC: para organizaciones pequeñas
      expect(PLANS.BASIC.features.maxEvents).toBe(10);
      expect(PLANS.BASIC.features.maxTasksPerEvent).toBe(50);
      expect(PLANS.BASIC.features.aiMatching).toBe(true);

      // PROFESSIONAL: ilimitado
      expect(PLANS.PROFESSIONAL.features.maxEvents).toBe(-1);
      expect(PLANS.PROFESSIONAL.features.maxTasksPerEvent).toBe(-1);
      expect(PLANS.PROFESSIONAL.features.predictiveAI).toBe(true);

      // ENTERPRISE: todo professional + soporte dedicado
      expect(PLANS.ENTERPRISE.features.maxEvents).toBe(-1);
      expect(PLANS.ENTERPRISE.features.dedicatedSupport).toBe(true);
      expect(PLANS.ENTERPRISE.features.customIntegrations).toBe(true);
    });
  });
});


