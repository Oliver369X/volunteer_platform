'use strict';

const gamificationService = require('./gamification.service');

const completeAssignment = async (req, res, next) => {
  try {
    const result = await gamificationService.completeAssignment(req.params.id, req.body, req.user);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const getLeaderboard = async (req, res, next) => {
  try {
    const result = await gamificationService.getLeaderboard(req.query);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const getVolunteerGamification = async (req, res, next) => {
  try {
    const result = await gamificationService.getVolunteerGamification(req.user.id);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

// ============================================
// GET MY ASSIGNMENTS
// ============================================
const getMyAssignments = async (req, res, next) => {
  try {
    const result = await gamificationService.getMyAssignments(req.user.id, req.query);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

// ============================================
// ACCEPT ASSIGNMENT
// ============================================
const acceptAssignment = async (req, res, next) => {
  try {
    const result = await gamificationService.acceptAssignment(req.params.id, req.user.id);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

// ============================================
// REJECT ASSIGNMENT
// ============================================
const rejectAssignment = async (req, res, next) => {
  try {
    const result = await gamificationService.rejectAssignment(
      req.params.id,
      req.user.id,
      req.body.reason,
    );
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

// ============================================
// MARK AS COMPLETED (Voluntario marca como completada)
// ============================================
const markAsCompleted = async (req, res, next) => {
  try {
    const evidenceFile = req.file ? req.file.buffer : null;
    const notes = req.body.notes || '';

    const result = await gamificationService.markAsCompleted(
      req.params.id,
      req.user.id,
      evidenceFile,
      notes,
    );
    
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

// ============================================
// CREATE BADGE - Crear badge NFT
// ============================================
const createBadge = async (req, res, next) => {
  try {
    const iconFile = req.file ? req.file.buffer : null;
    const payload = {
      code: req.body.code,
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      level: req.body.level,
      criteria: req.body.criteria ? JSON.parse(req.body.criteria) : {},
    };

    const result = await gamificationService.createBadge(payload, iconFile, req.user);
    return res.status(201).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  completeAssignment,
  getLeaderboard,
  getVolunteerGamification,
  getMyAssignments,
  acceptAssignment,
  rejectAssignment,
  markAsCompleted,
  createBadge,
};


