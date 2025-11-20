'use strict';

const Joi = require('joi');

const createTaskSchema = Joi.object({
  organizationId: Joi.string().guid({ version: 'uuidv4' }).required(),
  title: Joi.string().max(180).required(),
  description: Joi.string().max(2000).optional(),
  urgency: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').default('MEDIUM'),
  category: Joi.string().max(80).optional(),
  skillsRequired: Joi.array().items(Joi.string().max(80)).optional(),
  locationName: Joi.string().max(180).optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  startAt: Joi.date().optional(),
  endAt: Joi.date().optional(),
  volunteersNeeded: Joi.number().integer().min(1).max(500).default(1),
  metadata: Joi.object().optional(),
});

const updateTaskSchema = Joi.object({
  title: Joi.string().max(180).optional(),
  description: Joi.string().max(2000).optional(),
  urgency: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').optional(),
  category: Joi.string().max(80).optional(),
  skillsRequired: Joi.array().items(Joi.string().max(80)).optional(),
  locationName: Joi.string().max(180).optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  startAt: Joi.date().optional(),
  endAt: Joi.date().optional(),
  volunteersNeeded: Joi.number().integer().min(1).max(500).optional(),
  metadata: Joi.object().optional(),
}).min(1);

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED', 'CANCELLED')
    .required(),
});

const taskIdParamSchema = Joi.object({
  id: Joi.string().guid({ version: 'uuidv4' }).required(),
});

const listTasksSchema = Joi.object({
  status: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
  organizationId: Joi.string().guid({ version: 'uuidv4' }).optional(),
  urgency: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').optional(),
  search: Joi.string().optional(),
  assignedToMe: Joi.boolean().optional(),
});

const assignTaskSchema = Joi.object({
  volunteerId: Joi.string().guid({ version: 'uuidv4' }).required(),
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  updateStatusSchema,
  taskIdParamSchema,
  listTasksSchema,
  assignTaskSchema,
};


