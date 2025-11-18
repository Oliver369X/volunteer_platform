'use strict';

const { v4: uuidv4 } = require('uuid');
const loadEnv = require('../config/env');
const logger = require('../utils/logger');
const pinataClient = require('./pinata-client');
const { getPrisma } = require('../database');

const mintBadge = async ({ volunteerBadge, badge, volunteer }) => {
  const config = loadEnv();
  if (!config.analytics.enableMockBlockchain) {
    logger.info('Simulador blockchain deshabilitado');
    return volunteerBadge;
  }

  try {
    // Crear metadata del badge
    const metadata = {
      name: badge.name,
      description: badge.description || `Badge ${badge.name} otorgado por participación`,
      image: badge.iconUrl || 'https://via.placeholder.com/150',
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
          trait_type: 'Minted At',
          value: new Date().toISOString(),
        },
      ],
    };

    let tokenId = `mock-nft-${uuidv4()}`;
    let ipfsMetadata = null;

    // Si Pinata está configurado, subir a IPFS
    if (process.env.PINATA_JWT) {
      try {
        const result = await pinataClient.pinJSON(
          metadata,
          `badge-${badge.code}-${volunteer.id}`,
        );
        
        if (result) {
          ipfsMetadata = {
            ipfsHash: result.ipfsHash,
            gatewayUrl: result.gatewayUrl,
            timestamp: result.timestamp,
          };
          tokenId = `nft-${result.ipfsHash}`;
          logger.info('Badge metadata subido a IPFS', { ipfsHash: result.ipfsHash });
        }
      } catch (error) {
        logger.warn('Error al subir a Pinata, usando mock', { error: error.message });
      }
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

module.exports = {
  mintBadge,
};
