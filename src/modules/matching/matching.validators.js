'use strict';

const Joi = require('joi');

const runMatchingSchema = Joi.object({
  autoAssign: Joi.boolean().default(false),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

const taskIdParamSchema = Joi.object({
  id: Joi.string().guid({ version: 'uuidv4' }).required(),
});

const predictStaffingSchema = Joi.object({
  eventType: Joi.string().valid('SOCIAL', 'ENVIRONMENTAL', 'EDUCATIONAL', 'HEALTH', 'EMERGENCY', 'LOGISTICS').required(),
  expectedAttendees: Joi.number().integer().min(1).required(),
  duration: Joi.number().integer().min(1).required(),
  complexity: Joi.string().valid('LOW', 'MEDIUM', 'HIGH').default('MEDIUM'),
});

module.exports = {
  runMatchingSchema,
  taskIdParamSchema,
  predictStaffingSchema,
};


