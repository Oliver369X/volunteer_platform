'use strict';

const Joi = require('joi');

const createEventSchema = Joi.object({
  organizationId: Joi.string().uuid().required(),
  title: Joi.string().min(3).max(180).required(),
  description: Joi.string().max(2000).optional(),
  locationName: Joi.string().max(180).optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).required(),
  coverImageUrl: Joi.string().uri().optional(),
  coordinatorIds: Joi.array().items(Joi.string().uuid()).optional(),
  metadata: Joi.object().optional(),
});

const updateEventSchema = Joi.object({
  title: Joi.string().min(3).max(180).optional(),
  description: Joi.string().max(2000).optional(),
  locationName: Joi.string().max(180).optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  coverImageUrl: Joi.string().uri().optional(),
  metadata: Joi.object().optional(),
});

const cancelEventSchema = Joi.object({
  reason: Joi.string().max(500).required(),
});

module.exports = {
  createEventSchema,
  updateEventSchema,
  cancelEventSchema,
};


