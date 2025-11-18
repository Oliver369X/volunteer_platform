'use strict';

const Joi = require('joi');

const runMatchingSchema = Joi.object({
  autoAssign: Joi.boolean().default(false),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

const taskIdParamSchema = Joi.object({
  id: Joi.string().guid({ version: 'uuidv4' }).required(),
});

module.exports = {
  runMatchingSchema,
  taskIdParamSchema,
};


