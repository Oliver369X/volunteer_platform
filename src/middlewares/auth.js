'use strict';

const { verifyAccessToken } = require('../utils/jwt');
const { AuthenticationError, AuthorizationError } = require('../core/api-error');
const { getPrisma } = require('../database');

const authenticate = () => async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AuthenticationError('Token de autenticación requerido'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    const prisma = getPrisma();

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      return next(new AuthenticationError('Token inválido'));
    }

    if (user.status !== 'ACTIVE') {
      return next(new AuthorizationError('Cuenta inactiva o suspendida'));
    }

    req.user = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };

    return next();
  } catch (error) {
    return next(new AuthenticationError('Token inválido o expirado'));
  }
};

const authorizeRoles =
  (...allowedRoles) =>
  (req, _res, next) => {
    if (!req.user) {
      return next(new AuthenticationError());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AuthorizationError('No tienes permisos para realizar esta acción'));
    }

    return next();
  };

module.exports = {
  authenticate,
  authorizeRoles,
};


