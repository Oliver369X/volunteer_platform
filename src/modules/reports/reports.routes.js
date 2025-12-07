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

// Exportar PDFs
router.get(
  '/organization/export',
  authorizeRoles('ADMIN', 'ORGANIZATION'),
  validate(schemas.organizationDashboardSchema, 'query'),
  controller.exportOrganizationReportPDF,
);

router.get(
  '/volunteer/export',
  authorizeRoles('VOLUNTEER', 'ADMIN'),
  validate(schemas.volunteerKpiSchema, 'query'),
  controller.exportVolunteerReportPDF,
);

module.exports = router;


