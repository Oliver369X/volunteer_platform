'use strict';

const Joi = require('joi');

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const volunteerRegisterSchema = Joi.object({
  fullName: Joi.string().min(3).max(120).required(),
  email: Joi.string().email().max(160).required(),
  password: Joi.string().min(8).max(64).required(),
  phoneNumber: Joi.string().min(6).max(20).optional(),
  bio: Joi.string().max(500).optional(),
  baseLocation: Joi.string().max(180).optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  availability: Joi.object().pattern(Joi.string(), Joi.array().items(Joi.string())).optional(),
  skills: Joi.array().items(Joi.string().max(80)).max(25).optional(),
  certifications: Joi.array().items(Joi.string().max(120)).optional(),
  transportOptions: Joi.array().items(Joi.string().max(60)).optional(),
});

const organizationRegisterSchema = Joi.object({
  fullName: Joi.string().min(3).max(120).required(),
  email: Joi.string().email().max(160).required(),
  password: Joi.string().min(8).max(64).required(),
  phoneNumber: Joi.string().min(6).max(20).optional(),
  organization: Joi.object({
    name: Joi.string().min(3).max(150).required(),
    description: Joi.string().max(800).optional(),
    sector: Joi.string().max(80).optional(),
    headquartersLocation: Joi.string().max(255).optional(),
    coverageAreas: Joi.array().items(Joi.string().max(80)).optional(),
  }).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().max(160).required(),
  password: Joi.string().min(8).max(64).required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().min(20).required(),
});

const revokeSchema = Joi.object({
  refreshTokenId: Joi.string().pattern(uuidRegex).required(),
});

module.exports = {
  volunteerRegisterSchema,
  organizationRegisterSchema,
  loginSchema,
  refreshSchema,
  revokeSchema,
};


