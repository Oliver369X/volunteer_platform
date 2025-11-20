'use strict';

const axios = require('axios');
const logger = require('../utils/logger');
const geminiClient = require('./gemini-client');
const cloudinaryClient = require('./cloudinary-client');

/**
 * Generar imagen de badge usando IA
 * Soporta múltiples proveedores: Stable Diffusion, DALL-E, etc.
 */
class BadgeGenerator {
  constructor() {
    // Configurar proveedores disponibles
    this.providers = {
      // Replicate (Stable Diffusion) - Gratuito con límites
      replicate: process.env.REPLICATE_API_KEY,
      // OpenAI DALL-E
      openai: process.env.OPENAI_API_KEY,
      // Stability AI
      stability: process.env.STABILITY_API_KEY,
    };
  }

  /**
   * Generar imagen con Replicate (Stable Diffusion)
   * @param {string} prompt - Prompt para generar la imagen
   */
  async generateWithReplicate(prompt) {
    if (!this.providers.replicate) {
      logger.warn('Replicate API key no configurada');
      return null;
    }

    try {
      const response = await axios.post(
        'https://api.replicate.com/v1/predictions',
        {
          version: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
          input: {
            prompt: `${prompt}, badge, medal, award, circular, professional, high quality, centered, clean background`,
            negative_prompt: 'text, words, letters, watermark, signature, blurry, low quality',
            width: 512,
            height: 512,
          },
        },
        {
          headers: {
            Authorization: `Token ${this.providers.replicate}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Esperar a que se complete la generación
      let prediction = response.data;
      while (prediction.status === 'starting' || prediction.status === 'processing') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const statusResponse = await axios.get(prediction.urls.get, {
          headers: { Authorization: `Token ${this.providers.replicate}` },
        });
        prediction = statusResponse.data;
      }

      if (prediction.status === 'succeeded' && prediction.output) {
        const imageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
        return imageUrl;
      }

      return null;
    } catch (error) {
      logger.error('Error generando imagen con Replicate', {
        error: error.response?.data || error.message,
      });
      return null;
    }
  }

  /**
   * Generar imagen con DALL-E (OpenAI)
   * @param {string} prompt - Prompt para generar la imagen
   */
  async generateWithDallE(prompt) {
    if (!this.providers.openai) {
      logger.warn('OpenAI API key no configurada');
      return null;
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/images/generations',
        {
          model: 'dall-e-3',
          prompt: `${prompt}. Badge design, medal, award, circular, professional, clean, centered, high quality`,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
        },
        {
          headers: {
            Authorization: `Bearer ${this.providers.openai}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data?.data?.[0]?.url || null;
    } catch (error) {
      logger.error('Error generando imagen con DALL-E', {
        error: error.response?.data || error.message,
      });
      return null;
    }
  }

  /**
   * Generar badge completo (imagen + metadata)
   * @param {object} badgeInfo - Información del badge
   * @returns {Promise<object>} - URL de imagen y metadata
   */
  async generateBadge(badgeInfo) {
    try {
      logger.info('Generando badge con IA...', { badge: badgeInfo.name });

      // 1. Generar descripción con Gemini
      const description = await geminiClient.generateBadgeDescription(badgeInfo);

      // 2. Generar prompt para imagen con Gemini
      const imagePrompt = await geminiClient.generateBadgeImagePrompt(badgeInfo);
      logger.info('Prompt generado para imagen:', { prompt: imagePrompt });

      // 3. Generar imagen con el proveedor disponible
      let imageUrl = null;

      // Intentar con Replicate primero (más económico)
      if (this.providers.replicate) {
        imageUrl = await this.generateWithReplicate(imagePrompt);
      }

      // Si falla, intentar con DALL-E
      if (!imageUrl && this.providers.openai) {
        imageUrl = await this.generateWithDallE(imagePrompt);
      }

      // Si no hay proveedores configurados, usar placeholder
      if (!imageUrl) {
        logger.warn('No hay proveedores de generación de imágenes configurados. Usando placeholder.');
        imageUrl = this.getPlaceholderBadgeUrl(badgeInfo.level);
      }

      // 4. Descargar imagen y subir a Cloudinary
      let cloudinaryUrl = imageUrl;
      if (imageUrl && !imageUrl.includes('placeholder') && !imageUrl.includes('cloudinary')) {
        try {
          const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
          const imageBuffer = Buffer.from(imageResponse.data);

          const cloudinaryResult = await cloudinaryClient.uploadImage(imageBuffer, {
            folder: 'volunteer-platform/badges',
            public_id: `badge_${badgeInfo.code}_${Date.now()}`,
            transformation: [
              { width: 512, height: 512, crop: 'fill' },
              { quality: 'auto:best' },
            ],
          });

          cloudinaryUrl = cloudinaryResult.secure_url;
          logger.info('Badge subido a Cloudinary', { url: cloudinaryUrl });
        } catch (uploadError) {
          logger.warn('Error al subir a Cloudinary, usando URL directa', {
            error: uploadError.message,
          });
        }
      }

      return {
        imageUrl: cloudinaryUrl,
        description,
        prompt: imagePrompt,
        metadata: {
          generatedWith: 'AI',
          provider: this.providers.replicate ? 'replicate' : this.providers.openai ? 'openai' : 'placeholder',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Error al generar badge completo', {
        error: error.message,
      });

      // Fallback a placeholder
      return {
        imageUrl: this.getPlaceholderBadgeUrl(badgeInfo.level),
        description: `Badge ${badgeInfo.name} de nivel ${badgeInfo.level}`,
        metadata: {
          generatedWith: 'fallback',
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Obtener URL de placeholder según nivel
   * @param {string} level - Nivel del badge
   */
  getPlaceholderBadgeUrl(level) {
    const colorMap = {
      BRONCE: 'CD7F32',
      PLATA: 'C0C0C0',
      ORO: 'FFD700',
      PLATINO: 'E5E4E2',
      ESPECIAL: 'FF00FF',
    };

    const color = colorMap[level] || 'CCCCCC';
    return `https://via.placeholder.com/512/${color}/FFFFFF?text=${level}`;
  }
}

module.exports = new BadgeGenerator();
