'use strict';

const { Router } = require('express');

const authRoutes = require('../modules/auth/auth.routes');
const userRoutes = require('../modules/users/users.routes');
const organizationRoutes = require('../modules/organizations/organizations.routes');
const taskRoutes = require('../modules/tasks/tasks.routes');
const matchingRoutes = require('../modules/matching/matching.routes');
const gamificationRoutes = require('../modules/gamification/gamification.routes');
const reportRoutes = require('../modules/reports/reports.routes');

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    name: 'Volunteer Intelligence Platform API',
    version: '0.1.0',
    message: 'API lista para recibir solicitudes',
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/organizations', organizationRoutes);
router.use('/tasks', taskRoutes);
router.use('/matching', matchingRoutes);
router.use('/gamification', gamificationRoutes);
router.use('/reports', reportRoutes);

module.exports = router;
