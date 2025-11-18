'use strict';

const usersService = require('./users.service');

const updateProfile = async (req, res, next) => {
  try {
    const result = await usersService.updateProfile(req.user.id, req.body);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const updateVolunteerProfile = async (req, res, next) => {
  try {
    const result = await usersService.updateVolunteerProfile(req.user.id, req.body);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const listVolunteers = async (req, res, next) => {
  try {
    const result = await usersService.listVolunteers(req.user, req.query);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  updateProfile,
  updateVolunteerProfile,
  listVolunteers,
};


