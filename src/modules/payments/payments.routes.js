'use strict';

const { Router } = require('express');
const { authenticate } = require('../../middlewares/auth');
const controller = require('./payments.controller');

const router = Router();

// CU17: Gestión de Suscripción y Pagos (Stripe)
router.get('/subscription', authenticate(['ORGANIZATION']), controller.getCurrentSubscription);
router.post('/checkout', authenticate(['ORGANIZATION']), controller.createCheckoutSession);
router.post('/subscription/cancel', authenticate(['ORGANIZATION']), controller.cancelSubscription);
router.post('/webhook', controller.handleWebhook); // Sin auth, Stripe valida con signature

module.exports = router;


