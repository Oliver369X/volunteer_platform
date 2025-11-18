'use strict';

class ApiError extends Error {
  constructor(statusCode, message, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends ApiError {
  constructor(message = 'Solicitud inválida', details = {}) {
    super(400, message, details);
  }
}

class AuthenticationError extends ApiError {
  constructor(message = 'No autorizado') {
    super(401, message);
  }
}

class AuthorizationError extends ApiError {
  constructor(message = 'Acceso denegado') {
    super(403, message);
  }
}

class NotFoundError extends ApiError {
  constructor(message = 'Recurso no encontrado') {
    super(404, message);
  }
}

module.exports = {
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
};


