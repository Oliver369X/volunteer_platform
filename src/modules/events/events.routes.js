'use strict';

const { Router } = require('express');
const validate = require('../../middlewares/validator');
const { authenticate } = require('../../middlewares/auth');
const controller = require('./events.controller');
const schemas = require('./events.validators');

const router = Router();

// CU08: Creación de Eventos o Proyectos
router.post(
  '/',
  authenticate(['ORGANIZATION']),
  validate(schemas.createEventSchema),
  controller.createEvent,
);

router.get('/', authenticate(['ORGANIZATION', 'ADMIN']), controller.listEvents);

router.get('/:id', authenticate(), controller.getEventById);

// CU20: Modificación y Cancelación de Eventos
router.put(
  '/:id',
  authenticate(['ORGANIZATION']),
  validate(schemas.updateEventSchema),
  controller.updateEvent,
);

router.post(
  '/:id/cancel',
  authenticate(['ORGANIZATION']),
  validate(schemas.cancelEventSchema),
  controller.cancelEvent,
);

router.post('/:id/publish', authenticate(['ORGANIZATION']), controller.publishEvent);

module.exports = router;


