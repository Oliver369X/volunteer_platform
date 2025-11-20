'use strict';

const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class CloudinaryService {
  /**
   * Subir imagen a Cloudinary
   * @param {Buffer|string} file - Buffer o path del archivo
   * @param {object} options - Opciones de upload
   * @returns {Promise<object>} - Resultado del upload
   */
  async uploadImage(file, options = {}) {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      logger.warn('Cloudinary no configurado. Retornando URL simulada.');
      return {
        url: 'https://via.placeholder.com/400',
        public_id: `mock_${Date.now()}`,
        secure_url: 'https://via.placeholder.com/400',
      };
    }

    try {
      const uploadOptions = {
        folder: options.folder || 'volunteer-platform',
        resource_type: 'image',
        transformation: options.transformation || [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
        ...options,
      };

      let result;

      if (Buffer.isBuffer(file)) {
        // Upload desde buffer
        result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          });
          uploadStream.end(file);
        });
      } else {
        // Upload desde path
        result = await cloudinary.uploader.upload(file, uploadOptions);
      }

      logger.info('Imagen subida a Cloudinary', {
        public_id: result.public_id,
        url: result.secure_url,
      });

      return {
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        created_at: result.created_at,
      };
    } catch (error) {
      logger.error('Error al subir a Cloudinary', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Eliminar imagen de Cloudinary
   * @param {string} publicId - Public ID de la imagen
   */
  async deleteImage(publicId) {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return;
    }

    try {
      await cloudinary.uploader.destroy(publicId);
      logger.info('Imagen eliminada de Cloudinary', { public_id: publicId });
    } catch (error) {
      logger.warn('Error al eliminar de Cloudinary', {
        error: error.message,
        public_id: publicId,
      });
    }
  }

  /**
   * Generar URL con transformaciones
   * @param {string} publicId - Public ID de la imagen
   * @param {object} transformations - Transformaciones a aplicar
   */
  getTransformedUrl(publicId, transformations = {}) {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return 'https://via.placeholder.com/400';
    }

    return cloudinary.url(publicId, {
      secure: true,
      ...transformations,
    });
  }

  /**
   * Subir avatar de usuario
   * @param {Buffer} file - Buffer del archivo
   * @param {string} userId - ID del usuario
   */
  async uploadAvatar(file, userId) {
    return this.uploadImage(file, {
      folder: 'volunteer-platform/avatars',
      public_id: `avatar_${userId}`,
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
      overwrite: true,
    });
  }

  /**
   * Subir evidencia de tarea
   * @param {Buffer} file - Buffer del archivo
   * @param {string} assignmentId - ID de la asignación
   */
  async uploadEvidence(file, assignmentId) {
    return this.uploadImage(file, {
      folder: 'volunteer-platform/evidence',
      public_id: `evidence_${assignmentId}_${Date.now()}`,
    });
  }
}

module.exports = new CloudinaryService();

