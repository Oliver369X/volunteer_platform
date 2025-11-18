'use strict';

const reportsService = require('./reports.service');

const getOrganizationDashboard = async (req, res, next) => {
  try {
    const { organizationId, ...filters } = req.query;
    const result = await reportsService.getOrganizationDashboard(
      { organizationId, ...filters },
      req.user,
    );
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const getVolunteerKpis = async (req, res, next) => {
  try {
    const result = await reportsService.getVolunteerKpis(req.query, req.user);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getOrganizationDashboard,
  getVolunteerKpis,
};
