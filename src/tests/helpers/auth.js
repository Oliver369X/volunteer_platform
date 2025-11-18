'use strict';

const { signAccessToken } = require('../../utils/jwt');

const createTestUser = (overrides = {}) => ({
  id: 'test-user-id',
  fullName: 'Test User',
  email: 'test@example.com',
  role: 'VOLUNTEER',
  ...overrides,
});

const createTestToken = (user = createTestUser()) => {
  return signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });
};

const getAuthHeader = (token) => ({
  Authorization: `Bearer ${token}`,
});

module.exports = {
  createTestUser,
  createTestToken,
  getAuthHeader,
};

