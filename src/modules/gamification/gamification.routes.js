'use strict';

const { Router } = require('express');
const validate = require('../../middlewares/validator');
const { authenticate, authorizeRoles } = require('../../middlewares/auth');
const { uploadSingle, handleMulterError } = require('../../middlewares/upload');
const controller = require('./gamification.controller');
const schemas = require('./gamification.validators');

const router = Router();

router.use(authenticate());

// ============================================
// ASSIGNMENTS - Gestión de asignaciones
// ============================================
router.get(
  '/assignments',
  authorizeRoles('VOLUNTEER'),
  controller.getMyAssignments,
);

router.post(
  '/assignments/:id/accept',
  authorizeRoles('VOLUNTEER'),
  validate(schemas.assignmentIdParamSchema, 'params'),
  controller.acceptAssignment,
);

router.post(
  '/assignments/:id/reject',
  authorizeRoles('VOLUNTEER'),
  validate(schemas.assignmentIdParamSchema, 'params'),
  controller.rejectAssignment,
);

router.post(
  '/assignments/:id/mark-completed',
  authorizeRoles('VOLUNTEER'),
  validate(schemas.assignmentIdParamSchema, 'params'),
  uploadSingle('evidence'),
  handleMulterError,
  controller.markAsCompleted,
);

router.post(
  '/assignments/:id/complete',
  authorizeRoles('ADMIN', 'ORGANIZATION'),
  validate(schemas.assignmentIdParamSchema, 'params'),
  validate(schemas.completeAssignmentSchema),
  controller.completeAssignment,
);

router.get(
  '/assignments/completed',
  authorizeRoles('ADMIN', 'ORGANIZATION'),
  controller.getOrganizationCompletedAssignments,
);

// ============================================
// GAMIFICATION
// ============================================
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

// ============================================
// BADGES - Gestión de Badges NFT
// ============================================
router.get(
  '/badges',
  authorizeRoles('ORGANIZATION', 'ADMIN', 'VOLUNTEER'),
  controller.listBadges,
);

router.post(
  '/badges',
  authorizeRoles('ORGANIZATION', 'ADMIN'),
  uploadSingle('icon'),
  handleMulterError,
  validate(schemas.createBadgeSchema),
  controller.createBadge,
);

module.exports = router;


