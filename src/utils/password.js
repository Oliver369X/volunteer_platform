'use strict';

const bcrypt = require('bcryptjs');
const loadEnv = require('../config/env');

const getSaltRounds = () => {
  const config = loadEnv();
  return config.security.passwordSaltRounds;
};

const hashPassword = async (plainPassword) => {
  const salt = await bcrypt.genSalt(getSaltRounds());
  return bcrypt.hash(plainPassword, salt);
};

const comparePassword = (plainPassword, hash) => bcrypt.compare(plainPassword, hash);

module.exports = {
  hashPassword,
  comparePassword,
};


