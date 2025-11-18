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

    req[property] = value;
    return next();
  };

module.exports = validate;


