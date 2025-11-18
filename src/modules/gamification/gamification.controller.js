'use strict';

const gamificationService = require('./gamification.service');

const completeAssignment = async (req, res, next) => {
  try {
    const result = await gamificationService.completeAssignment(req.params.id, req.body, req.user);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const getLeaderboard = async (req, res, next) => {
  try {
    const result = await gamificationService.getLeaderboard(req.query);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const getVolunteerGamification = async (req, res, next) => {
  try {
    const result = await gamificationService.getVolunteerGamification(req.user.id);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  completeAssignment,
  getLeaderboard,
  getVolunteerGamification,
};


