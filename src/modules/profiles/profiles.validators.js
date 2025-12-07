'use strict';

const Joi = require('joi');

const updateProfileSchema = Joi.object({
  fullName: Joi.string().min(3).max(120).optional(),
  phoneNumber: Joi.string().min(6).max(20).optional(),
  bio: Joi.string().max(500).optional(),
  baseLocation: Joi.string().max(180).optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  availability: Joi.object().pattern(Joi.string(), Joi.array().items(Joi.string())).optional(),
  skills: Joi.array().items(Joi.string().max(80)).max(25).optional(),
  certifications: Joi.array().items(Joi.string().max(255)).optional(),
  transportOptions: Joi.array().items(Joi.string().max(60)).optional(),
});

const addSkillsSchema = Joi.object({
  skills: Joi.array().items(Joi.string().max(80)).min(1).required(),
});

const removeSkillsSchema = Joi.object({
  skills: Joi.array().items(Joi.string().max(80)).min(1).required(),
});

const updateAvailabilitySchema = Joi.object({
  availability: Joi.object()
    .pattern(Joi.string(), Joi.array().items(Joi.string()))
    .required(),
});

module.exports = {
  updateProfileSchema,
  addSkillsSchema,
  removeSkillsSchema,
  updateAvailabilitySchema,
};


