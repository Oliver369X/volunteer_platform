'use strict';

const { randomUUID } = require('crypto');

const createUserData = (overrides = {}) => ({
  fullName: 'Test User',
  email: `test-${randomUUID()}@example.com`,
  phoneNumber: '+1234567890',
  role: 'VOLUNTEER',
  status: 'ACTIVE',
  ...overrides,
});

const createVolunteerProfileData = (userId, overrides = {}) => ({
  userId,
  bio: 'Test bio',
  baseLocation: 'Test Location',
  latitude: 40.7128,
  longitude: -74.0060,
  skills: ['first-aid', 'communication'],
  certifications: ['CPR'],
  transportOptions: ['car'],
  ...overrides,
});

const createOrganizationData = (createdByUserId, overrides = {}) => ({
  createdByUserId,
  name: 'Test Organization',
  description: 'Test description',
  sector: 'Healthcare',
  contactEmail: `org-${randomUUID()}@example.com`,
  contactPhone: '+1234567890',
  headquartersLocation: 'Test HQ',
  coverageAreas: ['Area 1', 'Area 2'],
  ...overrides,
});

const createTaskData = (organizationId, createdByUserId, overrides = {}) => ({
  organizationId,
  createdByUserId,
  title: 'Test Task',
  description: 'Test task description',
  urgency: 'MEDIUM',
  category: 'Healthcare',
  skillsRequired: ['first-aid'],
  locationName: 'Test Location',
  latitude: 40.7128,
  longitude: -74.0060,
  volunteersNeeded: 2,
  ...overrides,
});

const createAssignmentData = (taskId, volunteerId, organizationId, overrides = {}) => ({
  taskId,
  volunteerId,
  organizationId,
  status: 'PENDING',
  ...overrides,
});

module.exports = {
  createUserData,
  createVolunteerProfileData,
  createOrganizationData,
  createTaskData,
  createAssignmentData,
};

