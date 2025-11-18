'use strict';

const Joi = require('joi');

const organizationDashboardSchema = Joi.object({
  organizationId: Joi.string().guid({ version: 'uuidv4' }).required(),
  from: Joi.date().optional(),
  to: Joi.date().optional(),
});

const volunteerKpiSchema = Joi.object({
  from: Joi.date().optional(),
  to: Joi.date().optional(),
});

module.exports = {
  organizationDashboardSchema,
  volunteerKpiSchema,
};


