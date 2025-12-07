'use strict';

const { getPrisma } = require('../../database');
const { NotFoundError, ForbiddenError, ValidationError } = require('../../core/api-error');
const NotificationService = require('../../services/notification.service');
const CloudinaryClient = require('../../services/cloudinary-client');

/**
 * CU06: Registro y Validación de Organizadores
 * Servicio para gestionar el proceso de validación de organizaciones
 */

/**
 * Actualiza el estado de validación de una organización
 * Solo administradores pueden validar organizaciones
 */
const validateOrganization = async (adminId, organizationId, validationData) => {
  const prisma = getPrisma();

  // Verificar que el usuario es admin
  const admin = await prisma.user.findUnique({
    where: { id: adminId },
  });

  if (!admin || admin.role !== 'ADMIN') {
    throw new ForbiddenError('Solo los administradores pueden validar organizaciones');
  }

  // Obtener organización
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      creator: true,
    },
  });

  if (!organization) {
    throw new NotFoundError('Organización no encontrada');
  }

  const { approved, rejectionReason } = validationData;

  return prisma.$transaction(async (tx) => {
    // Actualizar el estado del usuario creador
    const newStatus = approved ? 'ACTIVE' : 'SUSPENDED';
    
    await tx.user.update({
      where: { id: organization.createdByUserId },
      data: {
        status: newStatus,
      },
    });

    // Registrar en audit log
    await tx.auditLog.create({
      data: {
        organizationId: organization.id,
        action: approved ? 'ORGANIZATION_APPROVED' : 'ORGANIZATION_REJECTED',
        actorType: 'ADMIN',
        actorId: adminId,
        entityType: 'ORGANIZATION',
        entityId: organizationId,
        metadata: {
          rejectionReason: rejectionReason || null,
        },
      },
    });

    // Enviar notificación al usuario
    const emailSubject = approved 
      ? 'Organización Aprobada' 
      : 'Organización Rechazada';
    
    const emailBody = approved
      ? `
        <h2>¡Felicidades!</h2>
        <p>Tu organización "${organization.name}" ha sido aprobada.</p>
        <p>Ya puedes comenzar a crear eventos y tareas.</p>
      `
      : `
        <h2>Solicitud Rechazada</h2>
        <p>Lamentamos informarte que tu organización "${organization.name}" no ha sido aprobada.</p>
        <p><strong>Motivo:</strong> ${rejectionReason || 'No especificado'}</p>
        <p>Puedes corregir los documentos y volver a solicitar.</p>
      `;

    await NotificationService.sendEmail({
      to: organization.creator.email,
      subject: emailSubject,
      html: emailBody,
    });

    return {
      success: true,
      approved,
      message: approved 
        ? 'Organización aprobada exitosamente' 
        : 'Organización rechazada',
    };
  });
};

/**
 * Lista organizaciones pendientes de validación
 */
const listPendingOrganizations = async (adminId) => {
  const prisma = getPrisma();

  // Verificar que el usuario es admin
  const admin = await prisma.user.findUnique({
    where: { id: adminId },
  });

  if (!admin || admin.role !== 'ADMIN') {
    throw new ForbiddenError('Solo los administradores pueden ver esta información');
  }

  // Buscar usuarios organizadores con estado PENDING
  const pendingOrgs = await prisma.user.findMany({
    where: {
      role: 'ORGANIZATION',
      status: 'PENDING',
    },
    include: {
      organizationsCreated: {
        select: {
          id: true,
          name: true,
          description: true,
          sector: true,
          contactEmail: true,
          contactPhone: true,
          headquartersLocation: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return pendingOrgs.map((user) => ({
    userId: user.id,
    userEmail: user.email,
    userFullName: user.fullName,
    userCreatedAt: user.createdAt,
    organizations: user.organizationsCreated,
  }));
};

/**
 * Sube documentos legales de la organización
 */
const uploadLegalDocuments = async (userId, files) => {
  const prisma = getPrisma();

  // Verificar que el usuario es organizador
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organizationsCreated: true,
    },
  });

  if (!user || user.role !== 'ORGANIZATION') {
    throw new ForbiddenError('Solo organizaciones pueden subir documentos');
  }

  if (!user.organizationsCreated || user.organizationsCreated.length === 0) {
    throw new NotFoundError('No se encontró organización asociada');
  }

  const organization = user.organizationsCreated[0];

  // Validar archivos
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  const uploadedDocs = [];

  for (const file of files) {
    if (!allowedTypes.includes(file.mimetype)) {
      throw new ValidationError(
        `Archivo ${file.originalname}: Tipo no permitido. Solo PDF, JPG y PNG`,
      );
    }

    if (file.size > maxSize) {
      throw new ValidationError(
        `Archivo ${file.originalname}: Excede el tamaño máximo de 10MB`,
      );
    }

    // Subir a Cloudinary
    const uploadResult = await CloudinaryClient.uploadFile(file.buffer, {
      folder: `organizations/${organization.id}/legal`,
      resource_type: 'auto',
    });

    uploadedDocs.push({
      fileName: file.originalname,
      url: uploadResult.secure_url,
      uploadedAt: new Date(),
    });
  }

  // Actualizar metadata de la organización
  await prisma.organization.update({
    where: { id: organization.id },
    data: {
      metadata: {
        ...(organization.metadata || {}),
        legalDocuments: uploadedDocs,
      },
    },
  });

  // Cambiar estado a PENDING si estaba en otro estado
  if (user.status !== 'PENDING') {
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'PENDING',
      },
    });
  }

  return {
    success: true,
    documents: uploadedDocs,
    message: 'Documentos subidos exitosamente. En revisión por administrador',
  };
};

module.exports = {
  validateOrganization,
  listPendingOrganizations,
  uploadLegalDocuments,
};


