'use strict';

const { Router } = require('express');
const { authenticate } = require('../../middlewares/auth');
const controller = require('./incidents.controller');

const router = Router();

// CU22: Gestión de Incidencias y Disputas
router.post('/', authenticate(), controller.createIncident);
router.get('/', authenticate(), controller.listIncidents);
router.get('/:id', authenticate(), controller.getIncidentById);
router.put('/:id/status', authenticate(['ORGANIZATION', 'ADMIN']), controller.updateIncidentStatus);

module.exports = router;


