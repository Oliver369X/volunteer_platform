'use strict';

const paymentsService = require('./payments.service');

const getCurrentSubscription = async (req, res, next) => {
  try {
    const result = await paymentsService.getCurrentSubscription(req.user.id);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const createCheckoutSession = async (req, res, next) => {
  try {
    const result = await paymentsService.createCheckoutSession(req.user.id, req.body.plan);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const cancelSubscription = async (req, res, next) => {
  try {
    const result = await paymentsService.cancelSubscription(req.user.id);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const verifyCheckoutSession = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ status: 'error', message: 'sessionId es requerido' });
    }
    const result = await paymentsService.verifyCheckoutSession(req.user.id, sessionId);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'];
    const result = await paymentsService.handleStripeWebhook(req.body, signature);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getCurrentSubscription,
  createCheckoutSession,
  verifyCheckoutSession,
  cancelSubscription,
  handleWebhook,
};


