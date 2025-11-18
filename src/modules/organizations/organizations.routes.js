'use strict';

const { Router } = require('express');
const validate = require('../../middlewares/validator');
const { authenticate, authorizeRoles } = require('../../middlewares/auth');
const controller = require('./organizations.controller');
const schemas = require('./organizations.validators');

const router = Router();

router.use(authenticate());

router.get('/', authorizeRoles('ADMIN', 'ORGANIZATION'), controller.listOrganizations);

router.get(
  '/:id',
  authorizeRoles('ADMIN', 'ORGANIZATION'),
  validate(schemas.organizationIdParamSchema, 'params'),
  controller.getOrganizationDetails,
);

router.post(
  '/:id/members',
  authorizeRoles('ADMIN', 'ORGANIZATION'),
  validate(schemas.organizationIdParamSchema, 'params'),
  validate(schemas.addMemberSchema),
  controller.addMember,
);

module.exports = router;


