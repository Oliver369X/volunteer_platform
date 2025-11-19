// Configurar variables de entorno ANTES de cargar cualquier módulo
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jwt';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-key';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:071104@localhost:5432/volunteer_platform_dev';

module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/tests/**'],
  moduleNameMapper: {
    '^uuid$': '<rootDir>/src/tests/mocks/uuid.js',
  },
};

