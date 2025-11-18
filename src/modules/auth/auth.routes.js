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

module.exports = router;
