'use strict';

const { v4: uuidv4 } = require('uuid');
const loadEnv = require('../config/env');
const logger = require('../utils/logger');
const pinataClient = require('./pinata-client');
const badgeGenerator = require('./badge-generator');
const { getPrisma } = require('../database');

const mintBadge = async ({ volunteerBadge, badge, volunteer }) => {
  const config = loadEnv();
  if (!config.analytics.enableMockBlockchain) {
    logger.info('Simulador blockchain deshabilitado');
    return volunteerBadge;
  }

  try {
    // 🎨 NUEVO: Generar imagen del badge con IA
    logger.info('🎨 Generando imagen de badge con IA...', { badge: badge.name });
    const generatedBadge = await badgeGenerator.generateBadge({
      name: badge.name,
      level: badge.level,
      code: badge.code,
      category: badge.category,
      achievement: badge.description,
    });

    // Crear metadata del badge con imagen generada
    const metadata = {
      name: badge.name,
      description: generatedBadge.description || badge.description || `Badge ${badge.name} otorgado por participación destacada`,
      image: generatedBadge.imageUrl, // Imagen generada con IA
      external_url: `https://lacausa.org/badges/${badge.code}`,
      attributes: [
        {
          trait_type: 'Badge Code',
          value: badge.code,
        },
        {
          trait_type: 'Level',
          value: badge.level,
        },
        {
          trait_type: 'Category',
          value: badge.category || 'General',
        },
        {
          trait_type: 'Volunteer ID',
          value: volunteer.id,
        },
        {
          trait_type: 'Volunteer Name',
          value: volunteer.fullName || volunteer.name || 'Voluntario',
        },
        {
          trait_type: 'Generated With',
          value: generatedBadge.metadata?.generatedWith || 'AI',
        },
        {
          trait_type: 'Minted At',
          value: new Date().toISOString(),
        },
      ],
    };

    let tokenId = `mock-nft-${uuidv4()}`;
    let ipfsMetadata = null;
    let finalImageUrl = generatedBadge.imageUrl;

    // 📤 PASO 1: Si la imagen no está ya en Cloudinary, subirla
    if (finalImageUrl && !finalImageUrl.includes('cloudinary.com') && !finalImageUrl.includes('placeholder')) {
      try {
        logger.info('📤 Subiendo imagen del badge a Cloudinary...');
        const cloudinaryClient = require('./cloudinary-client');
        
        // Descargar la imagen generada
        const axios = require('axios');
        const imageResponse = await axios.get(finalImageUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(imageResponse.data);
        
        // Subir a Cloudinary
        const cloudinaryResult = await cloudinaryClient.uploadImage(imageBuffer, {
          folder: 'volunteer-platform/badges',
          public_id: `badge_${badge.code}_${volunteer.id}_${Date.now()}`,
        });
        
        finalImageUrl = cloudinaryResult.url;
        metadata.image = finalImageUrl;
        logger.info('✅ Imagen del badge subida a Cloudinary', { url: finalImageUrl });
      } catch (uploadError) {
        logger.warn('⚠️ Error al subir imagen a Cloudinary, usando URL original', { 
          error: uploadError.message 
        });
      }
    }

    // 📤 PASO 2: Subir metadata completa a IPFS con Pinata
    if (process.env.PINATA_JWT) {
      try {
        logger.info('📤 Subiendo metadata del badge NFT a IPFS/Pinata...');
        
        const result = await pinataClient.pinJSON(
          metadata,
          `badge-${badge.code}-${volunteer.id}-${Date.now()}`,
        );
        
        if (result) {
          ipfsMetadata = {
            ipfsHash: result.ipfsHash,
            gatewayUrl: result.gatewayUrl,
            timestamp: result.timestamp,
          };
          tokenId = `nft-${result.ipfsHash}`;
          logger.info('✅ Badge metadata subido a IPFS', { 
            ipfsHash: result.ipfsHash,
            gatewayUrl: result.gatewayUrl,
          });
        }
      } catch (error) {
        logger.warn('⚠️ Error al subir a Pinata, usando tokenId mock', { error: error.message });
      }
    } else {
      logger.warn('⚠️ Pinata JWT no configurado, usando modo mock');
    }

    // Actualizar el badge con la información del NFT
    const prisma = getPrisma();
    const updated = await prisma.volunteerBadge.update({
      where: { id: volunteerBadge.id },
      data: {
        tokenId,
        blockchainStatus: 'MINTED',
        metadata: {
          ...metadata,
          ...(ipfsMetadata && { ipfs: ipfsMetadata }),
          contractAddress: process.env.CONTRACT_ADDRESS || 'mock-contract',
          mintedAt: new Date().toISOString(),
        },
      },
    });

    logger.info('Badge NFT minted successfully', {
      badgeId: volunteerBadge.id,
      tokenId,
      ...(ipfsMetadata && { ipfsHash: ipfsMetadata.ipfsHash }),
    });

    return updated;
  } catch (error) {
    logger.error('Error al mintear badge', { error: error.message });
    
    // Marcar como fallido
    const prisma = getPrisma();
    await prisma.volunteerBadge.update({
      where: { id: volunteerBadge.id },
      data: {
        blockchainStatus: 'FAILED',
        metadata: {
          error: error.message,
          failedAt: new Date().toISOString(),
        },
      },
    });
    
    throw error;
  }
};

/**
 * Mintea un certificado NFT (para certificados digitales)
 */
const mintNFT = async ({ certificateId, recipientAddress, metadata }) => {
  const config = loadEnv();
  if (!config.analytics.enableMockBlockchain) {
    logger.info('Simulador blockchain deshabilitado');
    return {
      tokenId: `mock-cert-${certificateId}`,
      url: `https://lacausa.org/certificates/${certificateId}`,
    };
  }

  try {
    let tokenId = `mock-cert-${certificateId}-${uuidv4()}`;
    let ipfsMetadata = null;
    let gatewayUrl = null;

    // Crear metadata del certificado NFT
    const nftMetadata = {
      name: metadata.title || metadata.certificateType || 'Certificado Digital',
      description: metadata.description || `Certificado emitido por ${metadata.issuerName || 'Plataforma de Voluntariado'}`,
      image: metadata.image || 'https://via.placeholder.com/512x512?text=Certificado',
      external_url: `https://lacausa.org/certificates/${certificateId}`,
      attributes: [
        {
          trait_type: 'Certificate Type',
          value: metadata.certificateType || 'TASK_COMPLETION',
        },
        {
          trait_type: 'Issuer',
          value: metadata.issuerName || 'Plataforma de Voluntariado',
        },
        {
          trait_type: 'Volunteer Name',
          value: metadata.volunteerName || 'Voluntario',
        },
        {
          trait_type: 'Task Title',
          value: metadata.taskTitle || 'Tarea Completada',
        },
        {
          trait_type: 'Completed At',
          value: metadata.completedAt || new Date().toISOString(),
        },
        {
          trait_type: 'Rating',
          value: metadata.rating || 0,
        },
        {
          trait_type: 'Minted At',
          value: new Date().toISOString(),
        },
      ],
    };

    // 📤 Subir metadata del certificado a IPFS con Pinata
    if (process.env.PINATA_JWT) {
      try {
        logger.info('📤 Subiendo metadata del certificado NFT a IPFS/Pinata...', {
          certificateId,
        });

        const result = await pinataClient.pinJSON(
          nftMetadata,
          `certificate-${certificateId}-${Date.now()}`,
        );

        if (result) {
          ipfsMetadata = {
            ipfsHash: result.ipfsHash,
            gatewayUrl: result.gatewayUrl,
            timestamp: result.timestamp,
          };
          tokenId = `nft-${result.ipfsHash}`;
          gatewayUrl = result.gatewayUrl;
          logger.info('✅ Certificado metadata subido a IPFS', {
            ipfsHash: result.ipfsHash,
            gatewayUrl: result.gatewayUrl,
            certificateId,
          });
        }
      } catch (error) {
        logger.warn('⚠️ Error al subir certificado a Pinata, usando tokenId mock', {
          error: error.message,
          certificateId,
        });
      }
    } else {
      logger.warn('⚠️ Pinata JWT no configurado, usando modo mock para certificado');
    }

    return {
      tokenId,
      url: gatewayUrl || `https://lacausa.org/certificates/${certificateId}`,
      ipfsHash: ipfsMetadata?.ipfsHash,
      gatewayUrl: ipfsMetadata?.gatewayUrl,
    };
  } catch (error) {
    logger.error('Error al mintear certificado NFT', {
      error: error.message,
      certificateId,
    });
    throw error;
  }
};

/**
 * Verifica un NFT por su tokenId
 */
const verifyNFT = async (tokenId) => {
  const config = loadEnv();
  if (!config.analytics.enableMockBlockchain) {
    return true; // En modo mock siempre válido
  }

  try {
    // Si es un tokenId de Pinata (empieza con nft-), verificar en IPFS
    if (tokenId.startsWith('nft-')) {
      const ipfsHash = tokenId.replace('nft-', '');
      // Intentar acceder al gateway para verificar que existe
      const gatewayUrl = process.env.PINATA_GATEWAY
        ? `https://${process.env.PINATA_GATEWAY}/ipfs/${ipfsHash}?pinataGatewayToken=${process.env.PINATA_GATEWAY_KEY}`
        : `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

      try {
        const axios = require('axios');
        await axios.head(gatewayUrl, { timeout: 5000 });
        return true;
      } catch (error) {
        logger.warn('NFT no encontrado en IPFS', { tokenId, ipfsHash });
        return false;
      }
    }

    // Para tokens mock, siempre válidos
    return tokenId.startsWith('mock-');
  } catch (error) {
    logger.error('Error al verificar NFT', { error: error.message, tokenId });
    return false;
  }
};

module.exports = {
  mintBadge,
  mintNFT,
  verifyNFT,
};
