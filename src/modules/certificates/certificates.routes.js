'use strict';

const { Router } = require('express');
const { authenticate, authorizeRoles } = require('../../middlewares/auth');
const validate = require('../../middlewares/validator');
const controller = require('./certificates.controller');
const schemas = require('./certificates.validators');

const router = Router();

// CU15: Emisión de Certificados Digitales (NFT)
router.get('/my-certificates', authenticate(['VOLUNTEER']), controller.getMyCertificates);
router.get('/verify/:nftTokenId', controller.verifyCertificate);

// Rutas que requieren autenticación primero
router.use(authenticate());

// Para organizaciones: emitir certificados
router.post(
  '/issue',
  authorizeRoles('ADMIN', 'ORGANIZATION'),
  validate(schemas.issueCertificateSchema),
  controller.issueCertificate,
);

// Listar asignaciones verificadas para emitir certificados
router.get(
  '/assignments/verified',
  authorizeRoles('ADMIN', 'ORGANIZATION'),
  controller.getVerifiedAssignments,
);

module.exports = router;


