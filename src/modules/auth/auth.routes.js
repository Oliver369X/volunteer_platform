'use strict';

const { Router } = require('express');
const validate = require('../../middlewares/validator');
const { authenticate } = require('../../middlewares/auth');
const controller = require('./auth.controller');
const schemas = require('./auth.validators');

const router = Router();

router.post(
  '/register/volunteer',
  validate(schemas.volunteerRegisterSchema),
  controller.registerVolunteer,
);

router.post(
  '/register/organization',
  validate(schemas.organizationRegisterSchema),
  controller.registerOrganization,
);

router.post('/login', validate(schemas.loginSchema), controller.login);
router.post('/refresh', validate(schemas.refreshSchema), controller.refresh);
router.post('/logout', authenticate(), validate(schemas.revokeSchema), controller.logout);
router.get('/me', authenticate(), controller.me);

// CU03: Recuperación de Credenciales
router.post(
  '/password/request-reset',
  validate(schemas.passwordResetRequestSchema),
  controller.requestPasswordReset,
);
router.get(
  '/password/validate-token',
  validate(schemas.validateResetTokenSchema, 'query'),
  controller.validateResetToken,
);
router.post(
  '/password/reset',
  validate(schemas.resetPasswordSchema),
  controller.resetPassword,
);

module.exports = router;
