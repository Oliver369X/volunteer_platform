'use strict';

const Joi = require('joi');

const issueCertificateSchema = Joi.object({
  assignmentId: Joi.string().guid({ version: 'uuidv4' }).required(),
  volunteerId: Joi.string().guid({ version: 'uuidv4' }).required(),
  customTitle: Joi.string().max(200).optional(),
  customDescription: Joi.string().max(1000).optional(),
});

module.exports = {
  issueCertificateSchema,
};

