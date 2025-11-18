'use strict';

const { Router } = require('express');
const validate = require('../../middlewares/validator');
const { authenticate, authorizeRoles } = require('../../middlewares/auth');
const controller = require('./reports.controller');
const schemas = require('./reports.validators');

const router = Router();

router.use(authenticate());

router.get(
  '/organization',
  authorizeRoles('ADMIN', 'ORGANIZATION'),
  validate(schemas.organizationDashboardSchema, 'query'),
  controller.getOrganizationDashboard,
);

router.get(
  '/volunteer',
  authorizeRoles('VOLUNTEER', 'ADMIN'),
  validate(schemas.volunteerKpiSchema, 'query'),
  controller.getVolunteerKpis,
);

module.exports = router;


