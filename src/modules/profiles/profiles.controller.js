'use strict';

const profilesService = require('./profiles.service');

/**
 * CU05: Gestión de Perfil y Habilidades
 */

const getMyProfile = async (req, res, next) => {
  try {
    const result = await profilesService.getVolunteerProfile(req.user.id);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const updateMyProfile = async (req, res, next) => {
  try {
    const result = await profilesService.updateVolunteerProfile(req.user.id, req.body);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const addSkills = async (req, res, next) => {
  try {
    const result = await profilesService.addSkills(req.user.id, req.body.skills);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const removeSkills = async (req, res, next) => {
  try {
    const result = await profilesService.removeSkills(req.user.id, req.body.skills);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const updateAvailability = async (req, res, next) => {
  try {
    const result = await profilesService.updateAvailability(req.user.id, req.body.availability);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const uploadCertification = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'No se proporcionó ningún archivo' 
      });
    }

    const result = await profilesService.uploadCertification(req.user.id, req.file);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  addSkills,
  removeSkills,
  updateAvailability,
  uploadCertification,
};


