'use strict';

const trackingService = require('./tracking.service');

const recordLocation = async (req, res, next) => {
  try {
    const result = await trackingService.recordLocation(req.user.id, req.body);
    return res.status(201).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const getLastLocation = async (req, res, next) => {
  try {
    const result = await trackingService.getLastLocation(req.user.id, req.params.volunteerId);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const getEventVolunteersLocations = async (req, res, next) => {
  try {
    const result = await trackingService.getEventVolunteersLocations(req.user.id, req.params.eventId);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const getVolunteerTaskHistory = async (req, res, next) => {
  try {
    const result = await trackingService.getVolunteerTaskHistory(
      req.user.id,
      req.params.taskId,
      req.params.volunteerId
    );
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  recordLocation,
  getLastLocation,
  getEventVolunteersLocations,
  getVolunteerTaskHistory,
};


