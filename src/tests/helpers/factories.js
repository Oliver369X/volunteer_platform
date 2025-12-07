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

// Helper para crear usuario completo en BD
const createTestUser = async (prisma, overrides = {}) => {
  const userData = createUserData(overrides);
  const user = await prisma.user.create({
    data: {
      ...userData,
      passwordHash: '$2a$10$dummyHashForTests',
    },
  });

  if (user.role === 'VOLUNTEER') {
    await prisma.volunteerProfile.create({
      data: createVolunteerProfileData(user.id),
    });
  }

  return user;
};

// Helper para crear organización completa
const createTestOrganization = async (prisma) => {
  const user = await createTestUser(prisma, { role: 'ORGANIZATION' });
  
  const org = await prisma.organization.create({
    data: createOrganizationData(user.id),
  });

  await prisma.organizationMember.create({
    data: {
      organizationId: org.id,
      userId: user.id,
      role: 'OWNER',
    },
  });

  return {
    ...org,
    userId: user.id,
  };
};

// Helper para crear tarea
const createTestTask = async (prisma, overrides = {}) => {
  const org = await createTestOrganization(prisma);
  
  const task = await prisma.task.create({
    data: createTaskData(org.id, org.userId, overrides),
  });

  return { ...task, organizationId: org.id };
};

// Cleanup helper
const cleanupTestData = async (prisma) => {
  // Limpiar en orden correcto por foreign keys
  await prisma.locationTracking.deleteMany({});
  await prisma.certificate.deleteMany({});
  await prisma.broadcast.deleteMany({});
  await prisma.incident.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.eventCoordinator.deleteMany({});
  await prisma.passwordReset.deleteMany({});
  await prisma.volunteerBadge.deleteMany({});
  await prisma.pointTransaction.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.aiRecommendation.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.organizationMember.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.volunteerProfile.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});
};

module.exports = {
  createUserData,
  createVolunteerProfileData,
  createOrganizationData,
  createTaskData,
  createAssignmentData,
  createTestUser,
  createTestOrganization,
  createTestTask,
  cleanupTestData,
};

