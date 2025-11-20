'use strict';

const Joi = require('joi');

const assignmentIdParamSchema = Joi.object({
  id: Joi.string().guid({ version: 'uuidv4' }).required(),
});

const completeAssignmentSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  feedback: Joi.string().max(1000).optional(),
  pointsAwarded: Joi.number().integer().min(0).max(1000).default(50),
  badgeCodes: Joi.array().items(Joi.string().max(80)).default([]),
});

const leaderboardQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(20),
  zone: Joi.string().max(120).optional(),
  timeframe: Joi.string().valid('weekly', 'monthly', 'yearly', 'all').default('all'),
});

const createBadgeSchema = Joi.object({
  code: Joi.string().max(80).required(),
  name: Joi.string().max(120).required(),
  description: Joi.string().max(500).optional(),
  category: Joi.string().max(60).optional(),
  level: Joi.string().valid('BRONCE', 'PLATA', 'ORO', 'PLATINO', 'ESPECIAL').default('BRONCE'),
  criteria: Joi.object().optional(),
});

module.exports = {
  assignmentIdParamSchema,
  completeAssignmentSchema,
  leaderboardQuerySchema,
  createBadgeSchema,
};


