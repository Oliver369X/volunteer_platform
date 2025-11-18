'use strict';

const http = require('http');
const loadEnv = require('./config/env');
const app = require('./app');
const logger = require('./utils/logger');
const { connectDatabase, disconnectDatabase } = require('./database');

const config = loadEnv();

const server = http.createServer(app);

const start = async () => {
  try {
    await connectDatabase();
    server.listen(config.app.port, () => {
      logger.info(`API escuchando en el puerto ${config.app.port}`);
    });
  } catch (error) {
    logger.error('Error al iniciar la aplicación', { error });
    process.exit(1);
  }
};

const gracefulShutdown = async () => {
  logger.info('Iniciando apagado controlado...');
  server.close(async () => {
    const { disconnectDatabase } = require('./database');
    await disconnectDatabase();
    logger.info('Servidor detenido correctamente');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

start();

module.exports = server;


