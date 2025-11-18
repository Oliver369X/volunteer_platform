'use strict';

const { Router } = require('express');
const validate = require('../../middlewares/validator');
const { authenticate, authorizeRoles } = require('../../middlewares/auth');
const controller = require('./gamification.controller');
const schemas = require('./gamification.validators');

const router = Router();

router.use(authenticate());

router.post(
  '/assignments/:id/complete',
  authorizeRoles('ADMIN', 'ORGANIZATION'),
  validate(schemas.assignmentIdParamSchema, 'params'),
  validate(schemas.completeAssignmentSchema),
  controller.completeAssignment,
);

router.get(
  '/leaderboard',
  validate(schemas.leaderboardQuerySchema, 'query'),
  controller.getLeaderboard,
);

router.get(
  '/me',
  authorizeRoles('VOLUNTEER', 'ADMIN', 'ORGANIZATION'),
  controller.getVolunteerGamification,
);

module.exports = router;


