'use strict';

const { ValidationError } = require('../core/api-error');

const validate =
  (schema, property = 'body') =>
  (req, _res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      return next(
        new ValidationError('Datos inválidos', {
          details: error.details.map((detail) => detail.message),
        }),
      );
    }

    // Intentar establecer el valor validado, pero manejar propiedades de solo lectura
    try {
      req[property] = value;
    } catch (err) {
      // Si la propiedad es de solo lectura (como en tests con supertest),
      // usar Object.defineProperty para forzar el valor
      Object.defineProperty(req, property, {
        value,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
    return next();
  };

module.exports = validate;


