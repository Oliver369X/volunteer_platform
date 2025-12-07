'use strict';

const { Router } = require('express');
const validate = require('../../middlewares/validator');
const { authenticate } = require('../../middlewares/auth');
const { uploadSingle } = require('../../middlewares/upload');
const controller = require('./profiles.controller');
const schemas = require('./profiles.validators');

const router = Router();

// CU05: Gestión de Perfil y Habilidades
router.get('/me', authenticate(['VOLUNTEER']), controller.getMyProfile);

router.put(
  '/me',
  authenticate(['VOLUNTEER']),
  validate(schemas.updateProfileSchema),
  controller.updateMyProfile,
);

router.post(
  '/me/skills',
  authenticate(['VOLUNTEER']),
  validate(schemas.addSkillsSchema),
  controller.addSkills,
);

router.delete(
  '/me/skills',
  authenticate(['VOLUNTEER']),
  validate(schemas.removeSkillsSchema),
  controller.removeSkills,
);

router.put(
  '/me/availability',
  authenticate(['VOLUNTEER']),
  validate(schemas.updateAvailabilitySchema),
  controller.updateAvailability,
);

router.post(
  '/me/certifications',
  authenticate(['VOLUNTEER']),
  uploadSingle('certification'),
  controller.uploadCertification,
);

module.exports = router;


