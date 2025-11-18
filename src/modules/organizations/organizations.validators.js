'use strict';

const Joi = require('joi');

const organizationIdParamSchema = Joi.object({
  id: Joi.string().guid({ version: 'uuidv4' }).required(),
});

const addMemberSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().valid('COORDINATOR', 'ANALYST').default('COORDINATOR'),
});

module.exports = {
  organizationIdParamSchema,
  addMemberSchema,
};


