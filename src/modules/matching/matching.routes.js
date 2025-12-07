'use strict';

const { Router } = require('express');
const validate = require('../../middlewares/validator');
const { authenticate, authorizeRoles } = require('../../middlewares/auth');
const controller = require('./matching.controller');
const schemas = require('./matching.validators');

const router = Router();

router.use(authenticate());

router.post(
  '/tasks/:id/run',
  authorizeRoles('ADMIN', 'ORGANIZATION'),
  validate(schemas.taskIdParamSchema, 'params'),
  validate(schemas.runMatchingSchema),
  controller.runMatching,
);

router.post(
  '/predict-staffing',
  authorizeRoles('ADMIN', 'ORGANIZATION'),
  validate(schemas.predictStaffingSchema),
  controller.predictStaffing,
);

module.exports = router;


