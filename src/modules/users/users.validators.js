'use strict';

const Joi = require('joi');

const updateProfileSchema = Joi.object({
  fullName: Joi.string().min(3).max(120).optional(),
  phoneNumber: Joi.string().min(6).max(20).optional(),
}).min(1);

const updateVolunteerProfileSchema = Joi.object({
  bio: Joi.string().max(500).optional(),
  baseLocation: Joi.string().max(180).optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  availability: Joi.object().pattern(Joi.string(), Joi.array().items(Joi.string())).optional(),
  skills: Joi.array().items(Joi.string().max(80)).optional(),
  certifications: Joi.array().items(Joi.string().max(120)).optional(),
  transportOptions: Joi.array().items(Joi.string().max(60)).optional(),
}).min(1);

const volunteerQuerySchema = Joi.object({
  skills: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
  level: Joi.string().valid('BRONCE', 'PLATA', 'ORO', 'PLATINO').optional(),
  availability: Joi.string().optional(),
  search: Joi.string().optional(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).max(100).required(),
});

module.exports = {
  updateProfileSchema,
  updateVolunteerProfileSchema,
  volunteerQuerySchema,
  changePasswordSchema,
};


