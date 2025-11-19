'use strict';

const request = require('supertest');
const app = require('../../app');
const { getPrisma, cleanup } = require('../helpers/prisma');
const {
  createUserData,
  createOrganizationData,
  createTaskData,
  createAssignmentData,
  createVolunteerProfileData,
} = require('../helpers/factories');
const { createTestToken, getAuthHeader } = require('../helpers/auth');
const { hashPassword } = require('../../utils/password');

describe('Gamification Module', () => {
  let prisma;
  let orgUser;
  let volunteerUser;
  let orgToken;
  let organization;
  let task;
  let assignment;
  let volunteerProfile;

  beforeAll(async () => {
    prisma = getPrisma();
  });

  beforeEach(async () => {
    await cleanup();

    // Crear usuario organización
    orgUser = await prisma.user.create({
      data: {
        ...createUserData({ role: 'ORGANIZATION' }),
        passwordHash: await hashPassword('password123'),
      },
    });
    orgToken = createTestToken(orgUser);

    // Crear voluntario
    volunteerUser = await prisma.user.create({
      data: {
        ...createUserData({ role: 'VOLUNTEER' }),
        passwordHash: await hashPassword('password123'),
      },
    });

    volunteerProfile = await prisma.volunteerProfile.create({
      data: createVolunteerProfileData(volunteerUser.id, {
        totalPoints: 500,
        reputationScore: 50,
        level: 'BRONCE',
      }),
    });

    // Crear organización
    organization = await prisma.organization.create({
      data: createOrganizationData(orgUser.id),
    });

    await prisma.organizationMember.create({
      data: {
        organizationId: organization.id,
        userId: orgUser.id,
        role: 'OWNER',
      },
    });

    // Crear tarea y asignación
    task = await prisma.task.create({
      data: createTaskData(organization.id, orgUser.id),
    });

    assignment = await prisma.assignment.create({
      data: createAssignmentData(task.id, volunteerUser.id, organization.id, {
        status: 'IN_PROGRESS',
      }),
    });
  });

  describe('POST /api/gamification/assignments/:id/complete', () => {
    it('debería completar asignación y otorgar puntos', async () => {
      const completeData = {
        pointsAwarded: 100,
        rating: 5,
        feedback: 'Excelente trabajo',
      };

      const response = await request(app)
        .post(`/api/gamification/assignments/${assignment.id}/complete`)
        .set(getAuthHeader(orgToken))
        .send(completeData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('pointsAwarded', completeData.pointsAwarded);
      expect(response.body.data).toHaveProperty('newTotalPoints');
      expect(response.body.data).toHaveProperty('newLevel');

      // Verificar que se actualizó el perfil
      const updatedProfile = await prisma.volunteerProfile.findUnique({
        where: { id: volunteerProfile.id },
      });
      expect(updatedProfile.totalPoints).toBe(volunteerProfile.totalPoints + completeData.pointsAwarded);

      // Verificar que se creó la transacción de puntos
      const transaction = await prisma.pointTransaction.findFirst({
        where: {
          assignmentId: assignment.id,
          volunteerProfileId: volunteerProfile.id,
        },
      });
      expect(transaction).toBeTruthy();
      expect(transaction.points).toBe(completeData.pointsAwarded);
    });

    it('debería rechazar completar asignación para no miembros', async () => {
      const otherUser = await prisma.user.create({
        data: {
          ...createUserData({ role: 'ORGANIZATION' }),
          passwordHash: await hashPassword('password123'),
        },
      });
      const otherToken = createTestToken(otherUser);

      const response = await request(app)
        .post(`/api/gamification/assignments/${assignment.id}/complete`)
        .set(getAuthHeader(otherToken))
        .send({
          pointsAwarded: 100,
          rating: 5,
        })
        .expect(403);

      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /api/gamification/leaderboard', () => {
    it('debería obtener leaderboard', async () => {
      // Crear más voluntarios con puntos
      for (let i = 0; i < 3; i++) {
        const user = await prisma.user.create({
          data: {
            ...createUserData({ role: 'VOLUNTEER' }),
            passwordHash: await hashPassword('password123'),
          },
        });

        await prisma.volunteerProfile.create({
          data: createVolunteerProfileData(user.id, {
            totalPoints: 1000 + i * 100,
            reputationScore: 60 + i * 10,
          }),
        });
      }

      const response = await request(app)
        .get('/api/gamification/leaderboard?limit=10')
        .set(getAuthHeader(orgToken))
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Verificar que está ordenado por puntos
      for (let i = 1; i < response.body.data.length; i++) {
        expect(response.body.data[i - 1].totalPoints).toBeGreaterThanOrEqual(
          response.body.data[i].totalPoints,
        );
      }
    });
  });

  describe('GET /api/gamification/me', () => {
    it('debería obtener gamificación del voluntario autenticado', async () => {
      const volunteerToken = createTestToken(volunteerUser);

      const response = await request(app)
        .get('/api/gamification/me')
        .set(getAuthHeader(volunteerToken))
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('profile');
      expect(response.body.data).toHaveProperty('transactions');
      expect(response.body.data).toHaveProperty('badges');
    });
  });
});

