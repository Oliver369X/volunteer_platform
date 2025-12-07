'use strict';

const authService = require('./auth.service');
const passwordResetService = require('./password-reset.service');

const registerVolunteer = async (req, res, next) => {
  try {
    const result = await authService.registerVolunteer(req.body);
    return res.status(201).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const registerOrganization = async (req, res, next) => {
  try {
    const result = await authService.registerOrganization(req.body);
    return res.status(201).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const result = await authService.refreshTokens(req.body);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshTokenId } = req.body;
    const result = await authService.revokeRefreshToken({
      refreshTokenId,
      userId: req.user.id,
    });
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const me = async (req, res, next) => {
  try {
    const result = await authService.getCurrentUser(req.user.id);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

// CU03: Recuperación de Credenciales
const requestPasswordReset = async (req, res, next) => {
  try {
    const result = await passwordResetService.requestPasswordReset(req.body.email);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const validateResetToken = async (req, res, next) => {
  try {
    const result = await passwordResetService.validateResetToken(req.query.token);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const result = await passwordResetService.resetPassword(token, newPassword);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  registerVolunteer,
  registerOrganization,
  login,
  refresh,
  logout,
  me,
  requestPasswordReset,
  validateResetToken,
  resetPassword,
};


