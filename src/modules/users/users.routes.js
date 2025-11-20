'use strict';

const { Router } = require('express');
const validate = require('../../middlewares/validator');
const { authenticate, authorizeRoles } = require('../../middlewares/auth');
const { uploadSingle, handleMulterError } = require('../../middlewares/upload');
const controller = require('./users.controller');
const schemas = require('./users.validators');

const router = Router();

router.use(authenticate());

router.patch('/me', validate(schemas.updateProfileSchema), controller.updateProfile);

router.patch(
  '/me/volunteer-profile',
  validate(schemas.updateVolunteerProfileSchema),
  controller.updateVolunteerProfile,
);

router.patch(
  '/me/password',
  validate(schemas.changePasswordSchema),
  controller.changePassword,
);

router.post(
  '/me/avatar',
  uploadSingle('avatar'),
  handleMulterError,
  controller.uploadAvatar,
);

router.get(
  '/volunteers',
  authorizeRoles('ADMIN', 'ORGANIZATION'),
  validate(schemas.volunteerQuerySchema, 'query'),
  controller.listVolunteers,
);

module.exports = router;


