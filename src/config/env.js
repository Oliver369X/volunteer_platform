'use strict';

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const requiredVars = ['JWT_SECRET', 'GEMINI_API_KEY'];

module.exports = () => {
  const missing = requiredVars.filter((key) => !process.env[key]);
  if (missing.length) {
    // Advertencia pero no abortamos para permitir desarrollo con placeholders
    console.warn(
      `[config] Variables de entorno faltantes: ${missing.join(
        ', ',
      )}. Usa el archivo .env.example como referencia.`,
    );
  }

  return {
    app: {
      env: process.env.NODE_ENV || 'development',
      port: Number(process.env.PORT || 3000),
      frontendUrl: process.env.FRONTEND_URL || '*',
    },
    security: {
      jwtSecret: process.env.JWT_SECRET || 'development-secret',
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
      jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'development-refresh-secret',
      jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      passwordSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 10),
    },
    integrations: {
      geminiApiKey: process.env.GEMINI_API_KEY || '',
      geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    },
    analytics: {
      enableMockBlockchain: process.env.ENABLE_MOCK_BLOCKCHAIN === 'false' ? false : true,
    },
  };
};


