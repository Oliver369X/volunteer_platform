'use strict';

const { ApiError } = require('../core/api-error');
const logger = require('../utils/logger');

const formatError = (error) => {
  if (error instanceof ApiError) {
    return {
      status: 'error',
      message: error.message,
      details: error.details,
    };
  }

  return {
    status: 'error',
    message: 'Ocurrió un error inesperado',
  };
};

const errorMiddleware = (err, _req, res, _next) => {
  const status = err.statusCode || 500;

  if (status >= 500) {
    logger.error('Unhandled error', { error: err });
    // Solo en desarrollo mostrar stack trace completo
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error completo:', err);
      console.error('Stack trace:', err.stack);
    }
  } else {
    logger.warn('Handled error', { error: err });
  }

  res.status(status).json(formatError(err));
};

const notFoundHandler = (_req, res) => {
  res.status(404).json({ status: 'error', message: 'Ruta no encontrada' });
};

module.exports = {
  errorMiddleware,
  notFoundHandler,
};


