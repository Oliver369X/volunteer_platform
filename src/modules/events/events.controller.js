'use strict';

const eventsService = require('./events.service');

const createEvent = async (req, res, next) => {
  try {
    const result = await eventsService.createEvent(req.user.id, req.body);
    return res.status(201).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const listEvents = async (req, res, next) => {
  try {
    const { organizationId, status } = req.query;
    const result = await eventsService.listEvents(req.user.id, organizationId, { status });
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const getEventById = async (req, res, next) => {
  try {
    const result = await eventsService.getEventById(req.user.id, req.params.id);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    const result = await eventsService.updateEvent(req.user.id, req.params.id, req.body);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const cancelEvent = async (req, res, next) => {
  try {
    const result = await eventsService.cancelEvent(req.user.id, req.params.id, req.body.reason);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const publishEvent = async (req, res, next) => {
  try {
    const result = await eventsService.publishEvent(req.user.id, req.params.id);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createEvent,
  listEvents,
  getEventById,
  updateEvent,
  cancelEvent,
  publishEvent,
};


