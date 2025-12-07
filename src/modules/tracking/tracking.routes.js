'use strict';

const { Router } = require('express');
const { authenticate } = require('../../middlewares/auth');
const controller = require('./tracking.controller');

const router = Router();

// CU23: Monitoreo de Ubicación de Voluntarios
router.post('/', authenticate(['VOLUNTEER']), controller.recordLocation);
router.get('/volunteer/:volunteerId', authenticate(['ORGANIZATION', 'ADMIN']), controller.getLastLocation);
router.get('/event/:eventId', authenticate(['ORGANIZATION', 'ADMIN']), controller.getEventVolunteersLocations);
router.get('/task/:taskId/volunteer/:volunteerId', authenticate(['ORGANIZATION', 'ADMIN']), controller.getVolunteerTaskHistory);

module.exports = router;


