'use strict';

require('dotenv').config();

const logger = require('../utils/logger');

const {
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_NAME = 'volunteer_platform_dev',
  DB_USERNAME = 'postgres',
  DB_PASSWORD = 'postgres',
  DB_LOGGING = 'false',
  DB_SSL = 'false',
} = process.env;

const baseConfig = {
  username: DB_USERNAME,
  password: DB_PASSWORD,
  database: DB_NAME,
  host: DB_HOST,
  port: Number(DB_PORT),
  dialect: 'postgres',
  logging: DB_LOGGING === 'true' ? (msg) => logger.info(msg) : false,
  dialectOptions: DB_SSL === 'true' ? { ssl: { require: true, rejectUnauthorized: false } } : {},
  define: {
    underscored: true,
    paranoid: true,
    timestamps: true,
  },
};

module.exports = {
  development: baseConfig,
  test: {
    ...baseConfig,
    database: process.env.DB_NAME_TEST || 'volunteer_platform_test',
    logging: false,
  },
  production: {
    ...baseConfig,
    database: process.env.DB_NAME_PROD || DB_NAME,
  },
};
