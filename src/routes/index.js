'use strict';

const { Router } = require('express');

const authRoutes = require('../modules/auth/auth.routes');
const userRoutes = require('../modules/users/users.routes');
const organizationRoutes = require('../modules/organizations/organizations.routes');
const taskRoutes = require('../modules/tasks/tasks.routes');
const matchingRoutes = require('../modules/matching/matching.routes');
const gamificationRoutes = require('../modules/gamification/gamification.routes');
const reportRoutes = require('../modules/reports/reports.routes');

// Nuevos módulos
const profilesRoutes = require('../modules/profiles/profiles.routes');
const eventsRoutes = require('../modules/events/events.routes');
const trackingRoutes = require('../modules/tracking/tracking.routes');
const incidentsRoutes = require('../modules/incidents/incidents.routes');
const broadcastsRoutes = require('../modules/broadcasts/broadcasts.routes');
const auditRoutes = require('../modules/audit/audit.routes');
const certificatesRoutes = require('../modules/certificates/certificates.routes');
const paymentsRoutes = require('../modules/payments/payments.routes');

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    name: 'Volunteer Intelligence Platform API',
    version: '0.1.0',
    message: 'API lista para recibir solicitudes',
  });
});

// Módulos existentes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/organizations', organizationRoutes);
router.use('/tasks', taskRoutes);
router.use('/matching', matchingRoutes);
router.use('/gamification', gamificationRoutes);
router.use('/reports', reportRoutes);

// Nuevos módulos
router.use('/profiles', profilesRoutes);
router.use('/events', eventsRoutes);
router.use('/tracking', trackingRoutes);
router.use('/incidents', incidentsRoutes);
router.use('/broadcasts', broadcastsRoutes);
router.use('/audit', auditRoutes);
router.use('/certificates', certificatesRoutes);
router.use('/payments', paymentsRoutes);

module.exports = router;
