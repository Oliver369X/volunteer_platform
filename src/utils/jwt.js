'use strict';

const jwt = require('jsonwebtoken');
const loadEnv = require('../config/env');

const getConfig = () => loadEnv().security;

const signAccessToken = (payload, options = {}) => {
  const config = getConfig();
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
    ...options,
  });
};

const signRefreshToken = (payload, options = {}) => {
  const config = getConfig();
  return jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiresIn,
    ...options,
  });
};

const verifyAccessToken = (token) => {
  const config = getConfig();
  return jwt.verify(token, config.jwtSecret);
};

const verifyRefreshToken = (token) => {
  const config = getConfig();
  return jwt.verify(token, config.jwtRefreshSecret);
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};


