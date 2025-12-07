'use strict';

const { Router } = require('express');
const { authenticate } = require('../../middlewares/auth');
const controller = require('./audit.controller');

const router = Router();

// CU19: Generación de Reportes de Auditoría
router.get('/', authenticate(['ADMIN']), controller.getAuditLogs);
router.get('/user/:userId', authenticate(['ADMIN']), controller.generateUserAuditReport);
router.get('/event/:eventId', authenticate(['ADMIN']), controller.generateEventAuditReport);
router.get('/export', authenticate(['ADMIN']), controller.exportAuditReportPDF);

module.exports = router;


