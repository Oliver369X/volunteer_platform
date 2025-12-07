'use strict';

const incidentsService = require('./incidents.service');

const createIncident = async (req, res, next) => {
  try {
    const result = await incidentsService.createIncident(req.user.id, req.body);
    return res.status(201).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const listIncidents = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      category: req.query.category,
    };
    const result = await incidentsService.listIncidents(req.user.id, filters);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const getIncidentById = async (req, res, next) => {
  try {
    const result = await incidentsService.getIncidentById(req.user.id, req.params.id);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const updateIncidentStatus = async (req, res, next) => {
  try {
    const result = await incidentsService.updateIncidentStatus(
      req.user.id,
      req.params.id,
      req.body.status,
      req.body.resolution
    );
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createIncident,
  listIncidents,
  getIncidentById,
  updateIncidentStatus,
};


