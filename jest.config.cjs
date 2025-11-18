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

