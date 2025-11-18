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

module.exports = {
  assignmentIdParamSchema,
  completeAssignmentSchema,
  leaderboardQuerySchema,
};


