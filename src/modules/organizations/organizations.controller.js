'use strict';

const organizationsService = require('./organizations.service');

const listOrganizations = async (req, res, next) => {
  try {
    const result = await organizationsService.listOrganizations(req.user);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const getOrganizationDetails = async (req, res, next) => {
  try {
    const result = await organizationsService.getOrganizationDetails(req.params.id, req.user);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const addMember = async (req, res, next) => {
  try {
    const result = await organizationsService.addMember(req.params.id, req.body, req.user);
    return res.status(201).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listOrganizations,
  getOrganizationDetails,
  addMember,
};


