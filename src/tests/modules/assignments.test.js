'use strict';

/**
 * Tests para funcionalidades de Asignaciones (Sprint 1)
 * - Ver mis asignaciones
 * - Aceptar asignaciones
 * - Rechazar asignaciones
 * - Marcar como completada
 */

const request = require('supertest');
const app = require('../../app');
const { getPrisma, cleanup } = require('../helpers/prisma');
const { createTestToken, getAuthHeader } = require('../helpers/auth');
const { hashPassword } = require('../../utils/password');
const { createOrganizationData } = require('../helpers/factories');

let prisma;

beforeAll(async () => {
  prisma = getPrisma();
  await cleanup();
}, 30000);

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
}, 30000);

describe('Assignments Management (Sprint 1)', () => {
  let volunteerUser;
  let volunteerProfile;
  let volunteerToken;
  let orgUser;
  let organization;
  let orgToken;
  let task;
  let assignment;

  beforeEach(async () => {
    await cleanup();

    // Crear organización
    const orgPasswordHash = await hashPassword('Password123!');
    orgUser = await prisma.user.create({
      data: {
        fullName: 'Test Organization',
        email: 'org-test-assignments@example.com',
        phoneNumber: '+59170000001',
        passwordHash: orgPasswordHash,
        role: 'ORGANIZATION',
      },
    });

    organization = await prisma.organization.create({
      data: createOrganizationData(orgUser.id, {
        contactEmail: 'org-test-assignments@example.com',
      }),
    });

    await prisma.organizationMember.create({
      data: {
        organizationId: organization.id,
        userId: orgUser.id,
        role: 'ADMIN',
      },
    });

    orgToken = createTestToken(orgUser);

    // Crear voluntario
    const volunteerPasswordHash = await hashPassword('Password123!');
    volunteerUser = await prisma.user.create({
      data: {
        fullName: 'Test Volunteer',
        email: 'volunteer-test-assignments@example.com',
        phoneNumber: '+59170000002',
        passwordHash: volunteerPasswordHash,
        role: 'VOLUNTEER',
      },
    });

    volunteerProfile = await prisma.volunteerProfile.create({
      data: {
        userId: volunteerUser.id,
        skills: ['primeros-auxilios', 'logistica'],
        baseLocation: 'Santa Cruz',
        availability: {},
      },
    });

    volunteerToken = createTestToken(volunteerUser);

    // Crear tarea
    task = await prisma.task.create({
      data: {
        organizationId: organization.id,
        createdByUserId: orgUser.id,
        title: 'Test Task',
        description: 'Test description',
        urgency: 'MEDIUM',
        volunteersNeeded: 2,
        status: 'ASSIGNED',
      },
    });

    // Crear asignación pendiente
    assignment = await prisma.assignment.create({
      data: {
        taskId: task.id,
        volunteerId: volunteerUser.id,
        organizationId: organization.id,
        assignedByUserId: orgUser.id,
        status: 'PENDING',
        assignedAt: new Date(),
      },
    });
  }, 30000);

  // ============================================
  // GET MY ASSIGNMENTS
  // ============================================
  describe('GET /api/gamification/assignments', () => {
    it('debería obtener mis asignaciones como voluntario', async () => {
      const response = await request(app)
        .get('/api/gamification/assignments')
        .set(...getAuthHeader(volunteerToken));

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('task');
      expect(response.body.data[0]).toHaveProperty('status');
    });

    it('debería filtrar asignaciones por status', async () => {
      // Crear otra asignación aceptada
      await prisma.assignment.create({
        data: {
          taskId: task.id,
          volunteerId: volunteerUser.id,
          organizationId: organization.id,
          status: 'ACCEPTED',
          assignedAt: new Date(),
          respondedAt: new Date(),
        },
      });

      const response = await request(app)
        .get('/api/gamification/assignments?status=PENDING')
        .set(...getAuthHeader(volunteerToken));

      expect(response.status).toBe(200);
      const assignments = response.body.data;
      expect(assignments.every((a) => a.status === 'PENDING')).toBe(true);
    });

    it('debería fallar si no es voluntario', async () => {
      const response = await request(app)
        .get('/api/gamification/assignments')
        .set(...getAuthHeader(orgToken));

      expect(response.status).toBe(403);
    });
  });

  // ============================================
  // ACCEPT ASSIGNMENT
  // ============================================
  describe('POST /api/gamification/assignments/:id/accept', () => {
    it('debería aceptar una asignación pendiente', async () => {
      const response = await request(app)
        .post(`/api/gamification/assignments/${assignment.id}/accept`)
        .set(...getAuthHeader(volunteerToken));

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('ACCEPTED');
      expect(response.body.data.respondedAt).toBeTruthy();
    });

    it('debería fallar si la asignación no es mía', async () => {
      // Crear otro voluntario
      const otherUser = await prisma.user.create({
        data: {
          fullName: 'Other Volunteer',
          email: 'other@example.com',
          passwordHash: await hashPassword('Password123!'),
          role: 'VOLUNTEER',
        },
      });

      await prisma.volunteerProfile.create({
        data: {
          userId: otherUser.id,
          skills: ['test'],
          baseLocation: 'Test',
        },
      });

      const otherToken = createTestToken(otherUser);

      const response = await request(app)
        .post(`/api/gamification/assignments/${assignment.id}/accept`)
        .set(...getAuthHeader(otherToken));

      expect(response.status).toBe(403);
    });

    it('debería fallar si la asignación ya no está pendiente', async () => {
      // Aceptar primero
      await prisma.assignment.update({
        where: { id: assignment.id },
        data: { status: 'ACCEPTED', respondedAt: new Date() },
      });

      const response = await request(app)
        .post(`/api/gamification/assignments/${assignment.id}/accept`)
        .set(...getAuthHeader(volunteerToken));

      expect(response.status).toBe(400);
    });
  });

  // ============================================
  // REJECT ASSIGNMENT
  // ============================================
  describe('POST /api/gamification/assignments/:id/reject', () => {
    it('debería rechazar una asignación pendiente', async () => {
      const response = await request(app)
        .post(`/api/gamification/assignments/${assignment.id}/reject`)
        .set(...getAuthHeader(volunteerToken))
        .send({ reason: 'No disponible en esa fecha' });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('REJECTED');
      expect(response.body.data.verificationNotes).toContain('No disponible');
    });

    it('debería rechazar sin motivo (opcional)', async () => {
      const response = await request(app)
        .post(`/api/gamification/assignments/${assignment.id}/reject`)
        .set(...getAuthHeader(volunteerToken))
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('REJECTED');
    });
  });

  // ============================================
  // MARK AS COMPLETED (Voluntario)
  // ============================================
  describe('POST /api/gamification/assignments/:id/mark-completed', () => {
    beforeEach(async () => {
      // Aceptar la asignación primero
      await prisma.assignment.update({
        where: { id: assignment.id },
        data: { status: 'ACCEPTED', respondedAt: new Date() },
      });
    });

    it('debería marcar asignación como completada', async () => {
      const response = await request(app)
        .post(`/api/gamification/assignments/${assignment.id}/mark-completed`)
        .set(...getAuthHeader(volunteerToken))
        .send({ notes: 'Tarea completada exitosamente' });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('COMPLETED');
      expect(response.body.data.completedAt).toBeTruthy();
      expect(response.body.data.verificationNotes).toBe('Tarea completada exitosamente');
    });

    it('debería fallar si no está aceptada', async () => {
      // Volver a pendiente
      await prisma.assignment.update({
        where: { id: assignment.id },
        data: { status: 'PENDING' },
      });

      const response = await request(app)
        .post(`/api/gamification/assignments/${assignment.id}/mark-completed`)
        .set(...getAuthHeader(volunteerToken))
        .send({ notes: 'Test' });

      expect(response.status).toBe(400);
    });
  });
});

