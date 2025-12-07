'use strict';

const { getPrisma } = require('../../database');
const { NotFoundError, ForbiddenError } = require('../../core/api-error');
const BlockchainSimulator = require('../../services/blockchain-simulator');
const BadgeGenerator = require('../../services/badge-generator');

/**
 * CU15: Emisión de Certificados Digitales (NFT)
 * Servicio para generar certificados verificables en blockchain
 */

/**
 * Emite un certificado para un voluntario por completar una asignación
 */
const issueCertificate = async (volunteerId, assignmentId) => {
  const prisma = getPrisma();

  // Verificar que la asignación existe y está verificada
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      task: {
        include: {
          organization: true,
        },
      },
      volunteer: true,
    },
  });

  if (!assignment) {
    throw new NotFoundError('Asignación no encontrada');
  }

  if (assignment.status !== 'VERIFIED') {
    throw new ForbiddenError('Solo se pueden emitir certificados para asignaciones verificadas');
  }

  // Verificar que el voluntario no tenga ya un certificado para esta asignación
  const existing = await prisma.certificate.findFirst({
    where: {
      volunteerId,
      assignmentId,
    },
  });

  if (existing) {
    return existing; // Ya existe, retornar el existente
  }

  // Generar metadata del certificado
  const certificateTitle = `Certificado: ${assignment.task.title}`;
  const certificateDescription = `Certificado por completar exitosamente la tarea "${assignment.task.title}"`;
  const issuerName = assignment.task.organization.name;

  const metadata = {
    volunteerName: assignment.volunteer.fullName,
    taskTitle: assignment.task.title,
    organizationName: issuerName,
    completedAt: assignment.completedAt,
    rating: assignment.rating,
  };

  // Crear certificado en DB
  const certificate = await prisma.certificate.create({
    data: {
      volunteerId,
      assignmentId,
      certificateType: 'TASK_COMPLETION',
      title: certificateTitle,
      description: certificateDescription,
      issuerName: issuerName,
      issuedAt: new Date(),
      blockchainStatus: 'PENDING',
      metadata,
    },
  });

  // Intentar mintear en blockchain (simulado)
  try {
    const nftResult = await BlockchainSimulator.mintNFT({
      certificateId: certificate.id,
      recipientAddress: `0x${volunteerId.replace(/-/g, '').substring(0, 40)}`,
      metadata: {
        ...metadata,
        title: certificateTitle,
        description: certificateDescription,
        issuerName: issuerName,
        certificateType: 'TASK_COMPLETION',
      },
    });

    // Actualizar con información del NFT
    await prisma.certificate.update({
      where: { id: certificate.id },
      data: {
        nftTokenId: nftResult.tokenId,
        blockchainStatus: 'MINTED',
        certificateUrl: nftResult.url || nftResult.gatewayUrl,
        metadata: {
          ...metadata,
          nftTokenId: nftResult.tokenId,
          ipfsHash: nftResult.ipfsHash,
          gatewayUrl: nftResult.gatewayUrl,
          mintedAt: new Date().toISOString(),
        },
      },
    });

    certificate.nftTokenId = nftResult.tokenId;
    certificate.blockchainStatus = 'MINTED';
    certificate.certificateUrl = nftResult.url || nftResult.gatewayUrl;
  } catch (error) {
    console.error('Error minting NFT:', error);
    // Marcar como fallido
    await prisma.certificate.update({
      where: { id: certificate.id },
      data: {
        blockchainStatus: 'FAILED',
      },
    });
  }

  return certificate;
};

/**
 * Emite certificados automáticamente para asignaciones verificadas
 */
const autoIssueCertificatesForAssignment = async (assignmentId) => {
  const prisma = getPrisma();

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
  });

  if (!assignment || assignment.status !== 'VERIFIED') {
    return null;
  }

  return issueCertificate(assignment.volunteerId, assignmentId);
};

/**
 * Emite un certificado especial por hito alcanzado
 */
const issueMilestoneCertificate = async (volunteerId, milestoneType, details) => {
  const prisma = getPrisma();

  const volunteer = await prisma.user.findUnique({
    where: { id: volunteerId },
    include: {
      volunteerProfile: true,
    },
  });

  if (!volunteer) {
    throw new NotFoundError('Voluntario no encontrado');
  }

  const certificateTitle = `Certificado: ${milestoneType}`;
  const certificateDescription = details.description || `Certificado especial por ${milestoneType}`;
  const issuerName = 'Plataforma de Voluntariado';

  const metadata = {
    volunteerName: volunteer.fullName,
    milestoneType,
    details,
    achievedAt: new Date(),
  };

  const certificate = await prisma.certificate.create({
    data: {
      volunteerId,
      certificateType: milestoneType,
      title: certificateTitle,
      description: certificateDescription,
      issuerName: issuerName,
      issuedAt: new Date(),
      blockchainStatus: 'PENDING',
      metadata,
    },
  });

  // Intentar mintear en blockchain
  try {
    const nftResult = await BlockchainSimulator.mintNFT({
      certificateId: certificate.id,
      recipientAddress: `0x${volunteerId.replace(/-/g, '').substring(0, 40)}`,
      metadata: {
        ...metadata,
        title: certificateTitle,
        description: certificateDescription,
        issuerName: issuerName,
        certificateType: milestoneType,
      },
    });

    await prisma.certificate.update({
      where: { id: certificate.id },
      data: {
        nftTokenId: nftResult.tokenId,
        blockchainStatus: 'MINTED',
        certificateUrl: nftResult.url || nftResult.gatewayUrl,
        metadata: {
          ...metadata,
          nftTokenId: nftResult.tokenId,
          ipfsHash: nftResult.ipfsHash,
          gatewayUrl: nftResult.gatewayUrl,
          mintedAt: new Date().toISOString(),
        },
      },
    });

    certificate.nftTokenId = nftResult.tokenId;
    certificate.blockchainStatus = 'MINTED';
    certificate.certificateUrl = nftResult.url || nftResult.gatewayUrl;
  } catch (error) {
    console.error('Error minting NFT:', error);
    await prisma.certificate.update({
      where: { id: certificate.id },
      data: {
        blockchainStatus: 'FAILED',
      },
    });
  }

  return certificate;
};

/**
 * Lista certificados de un voluntario
 */
const getVolunteerCertificates = async (volunteerId) => {
  const prisma = getPrisma();

  const certificates = await prisma.certificate.findMany({
    where: {
      volunteerId,
      deletedAt: null,
    },
    orderBy: {
      issuedAt: 'desc',
    },
  });

  return certificates;
};

/**
 * Verifica un certificado por su ID de blockchain
 */
const verifyCertificate = async (nftTokenId) => {
  const prisma = getPrisma();

  const certificate = await prisma.certificate.findUnique({
    where: { nftTokenId },
    include: {
      volunteer: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  if (!certificate) {
    throw new NotFoundError('Certificado no encontrado');
  }

  // Verificar en blockchain
  const isValid = await BlockchainSimulator.verifyNFT(nftTokenId);

  return {
    certificate,
    valid: isValid,
    verifiedAt: new Date(),
  };
};

module.exports = {
  issueCertificate,
  autoIssueCertificatesForAssignment,
  issueMilestoneCertificate,
  getVolunteerCertificates,
  verifyCertificate,
};


