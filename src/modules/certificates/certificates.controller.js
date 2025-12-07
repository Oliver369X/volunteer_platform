'use strict';

const certificatesService = require('./certificates.service');
const { getPrisma } = require('../../database');
const { AuthorizationError } = require('../../core/api-error');

const getMyCertificates = async (req, res, next) => {
  try {
    const result = await certificatesService.getVolunteerCertificates(req.user.id);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const verifyCertificate = async (req, res, next) => {
  try {
    const result = await certificatesService.verifyCertificate(req.params.nftTokenId);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const issueCertificate = async (req, res, next) => {
  try {
    const { assignmentId, volunteerId, customTitle, customDescription } = req.body;
    
    // Verificar que la organización tiene acceso a esta asignación
    const prisma = getPrisma();
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        task: {
          include: {
            organization: {
              include: {
                members: {
                  where: { userId: req.user.id },
                },
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      return res.status(404).json({ status: 'error', message: 'Asignación no encontrada' });
    }

    if (req.user.role !== 'ADMIN') {
      const isMember = assignment.task.organization.members.length > 0;
      if (!isMember) {
        throw new AuthorizationError('No perteneces a la organización de esta tarea');
      }
    }

    const result = await certificatesService.issueCertificate(volunteerId, assignmentId);
    
    // Si hay título o descripción personalizada, actualizar
    if (customTitle || customDescription) {
      await prisma.certificate.update({
        where: { id: result.id },
        data: {
          ...(customTitle && { title: customTitle }),
          ...(customDescription && { description: customDescription }),
        },
      });
      result.title = customTitle || result.title;
      result.description = customDescription || result.description;
    }

    return res.status(201).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const getVerifiedAssignments = async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const userId = req.user.id;
    const userRole = req.user.role;

    // Obtener IDs de organizaciones del usuario
    let orgIds = [];
    if (userRole === 'ORGANIZATION') {
      const orgMemberships = await prisma.organizationMember.findMany({
        where: { userId },
        select: { organizationId: true },
      });
      orgIds = orgMemberships.map((m) => m.organizationId);
    }

    // Obtener todas las asignaciones verificadas
    const allAssignments = await prisma.assignment.findMany({
      where: {
        status: 'VERIFIED',
        ...(userRole === 'ORGANIZATION' && {
          task: {
            organizationId: { in: orgIds },
          },
        }),
      },
      include: {
        volunteer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    // Verificar cuáles no tienen certificado
    const assignmentsWithoutCert = [];
    for (const assignment of allAssignments) {
      const existingCert = await prisma.certificate.findFirst({
        where: {
          assignmentId: assignment.id,
          volunteerId: assignment.volunteerId,
        },
      });

      if (!existingCert) {
        assignmentsWithoutCert.push({
          ...assignment,
          hasCertificate: false,
        });
      }
    }

    return res.status(200).json({ status: 'success', data: assignmentsWithoutCert });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getMyCertificates,
  verifyCertificate,
  issueCertificate,
  getVerifiedAssignments,
};


