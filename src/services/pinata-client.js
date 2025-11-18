'use strict';

const axios = require('axios');
const FormData = require('form-data');
const logger = require('../utils/logger');

const PINATA_API_URL = 'https://api.pinata.cloud';

class PinataClient {
  constructor() {
    this.jwt = process.env.PINATA_JWT;
    this.gateway = process.env.PINATA_GATEWAY;
    this.gatewayKey = process.env.PINATA_GATEWAY_KEY;
  }

  async pinJSON(jsonData, name) {
    if (!this.jwt) {
      logger.warn('Pinata JWT no configurado. Saltando pinning.');
      return null;
    }

    try {
      const response = await axios.post(
        `${PINATA_API_URL}/pinning/pinJSONToIPFS`,
        {
          pinataContent: jsonData,
          pinataMetadata: {
            name: name || 'badge-metadata',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.jwt}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const ipfsHash = response.data.IpfsHash;
      const gatewayUrl = this.gateway
        ? `https://${this.gateway}/ipfs/${ipfsHash}?pinataGatewayToken=${this.gatewayKey}`
        : `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

      logger.info(`Badge metadata pinned to IPFS: ${ipfsHash}`);

      return {
        ipfsHash,
        gatewayUrl,
        timestamp: response.data.Timestamp,
      };
    } catch (error) {
      logger.error('Error al subir a Pinata', {
        error: error.response?.data || error.message,
      });
      throw error;
    }
  }

  async pinFile(fileBuffer, fileName, mimeType) {
    if (!this.jwt) {
      logger.warn('Pinata JWT no configurado. Saltando pinning.');
      return null;
    }

    try {
      const formData = new FormData();
      formData.append('file', fileBuffer, {
        filename: fileName,
        contentType: mimeType,
      });

      const metadata = JSON.stringify({
        name: fileName,
      });
      formData.append('pinataMetadata', metadata);

      const response = await axios.post(`${PINATA_API_URL}/pinning/pinFileToIPFS`, formData, {
        headers: {
          Authorization: `Bearer ${this.jwt}`,
          ...formData.getHeaders(),
        },
        maxBodyLength: Infinity,
      });

      const ipfsHash = response.data.IpfsHash;
      const gatewayUrl = this.gateway
        ? `https://${this.gateway}/ipfs/${ipfsHash}?pinataGatewayToken=${this.gatewayKey}`
        : `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

      logger.info(`File pinned to IPFS: ${ipfsHash}`);

      return {
        ipfsHash,
        gatewayUrl,
        timestamp: response.data.Timestamp,
      };
    } catch (error) {
      logger.error('Error al subir archivo a Pinata', {
        error: error.response?.data || error.message,
      });
      throw error;
    }
  }

  async unpin(ipfsHash) {
    if (!this.jwt) {
      return;
    }

    try {
      await axios.delete(`${PINATA_API_URL}/pinning/unpin/${ipfsHash}`, {
        headers: {
          Authorization: `Bearer ${this.jwt}`,
        },
      });
      logger.info(`Unpinned from IPFS: ${ipfsHash}`);
    } catch (error) {
      logger.warn('Error al desanclar de Pinata', {
        error: error.response?.data || error.message,
      });
    }
  }
}

module.exports = new PinataClient();

