'use strict';

const { Router } = require('express');
const { authenticate } = require('../../middlewares/auth');
const controller = require('./broadcasts.controller');

const router = Router();

// CU21: Difusión de Comunicados
router.post('/', authenticate(['ORGANIZATION']), controller.sendBroadcast);
router.get('/', authenticate(['ORGANIZATION']), controller.listBroadcasts);
router.get('/:id', authenticate(['ORGANIZATION', 'ADMIN']), controller.getBroadcastById);

module.exports = router;


