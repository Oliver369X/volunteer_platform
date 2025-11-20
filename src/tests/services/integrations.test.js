'use strict';

/**
 * Tests para servicios de integración (Sprint 1)
 * - Cloudinary
 * - Badge Generator
 * - Gemini
 */

const cloudinaryClient = require('../../services/cloudinary-client');
const badgeGenerator = require('../../services/badge-generator');
const geminiClient = require('../../services/gemini-client');

describe('Integration Services (Sprint 1)', () => {
  // ============================================
  // CLOUDINARY CLIENT
  // ============================================
  describe('Cloudinary Client', () => {
    it('debería subir imagen a Cloudinary', async () => {
      // Buffer de imagen de prueba
      const testImageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
        'base64'
      );

      const result = await cloudinaryClient.uploadImage(testImageBuffer, {
        folder: 'volunteer-platform/test',
      });

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('public_id');
      expect(result.url).toBeTruthy();

      // Limpiar
      if (result.public_id) {
        await cloudinaryClient.deleteImage(result.public_id);
      }
    }, 15000);

    it('debería subir avatar con transformaciones', async () => {
      const testImageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
        'base64'
      );

      const result = await cloudinaryClient.uploadAvatar(testImageBuffer, 'test-user-123');

      expect(result).toHaveProperty('url');
      expect(result.public_id).toContain('avatar');

      // Limpiar
      if (result.public_id) {
        await cloudinaryClient.deleteImage(result.public_id);
      }
    }, 15000);

    it('debería generar URL transformada', () => {
      const url = cloudinaryClient.getTransformedUrl('test/sample', {
        width: 200,
        height: 200,
        crop: 'fill',
      });

      expect(url).toBeTruthy();
      expect(typeof url).toBe('string');
    });

    it('debería manejar error de imagen inválida', async () => {
      await expect(
        cloudinaryClient.uploadImage(Buffer.from('invalid'), {
          folder: 'test',
        })
      ).rejects.toThrow();
    }, 15000);
  });

  // ============================================
  // GEMINI CLIENT
  // ============================================
  describe('Gemini Client', () => {
    it('debería generar descripción de badge', async () => {
      const description = await geminiClient.generateBadgeDescription({
        name: 'Test Badge',
        level: 'ORO',
        category: 'Test',
        achievement: 'Test achievement',
      });

      expect(description).toBeTruthy();
      expect(typeof description).toBe('string');
      expect(description.length).toBeGreaterThan(0);
    }, 15000);

    it('debería generar prompt de imagen', async () => {
      const prompt = await geminiClient.generateBadgeImagePrompt({
        name: 'Test Badge',
        level: 'PLATINO',
        category: 'Salud',
      });

      expect(prompt).toBeTruthy();
      expect(typeof prompt).toBe('string');
    }, 15000);
  });

  // ============================================
  // BADGE GENERATOR
  // ============================================
  describe('Badge Generator', () => {
    it('debería generar badge completo', async () => {
      const result = await badgeGenerator.generateBadge({
        name: 'Test Badge',
        level: 'ORO',
        code: 'TEST_BADGE',
        category: 'Test',
        achievement: 'Test achievement',
      });

      expect(result).toHaveProperty('imageUrl');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('metadata');
      expect(result.imageUrl).toBeTruthy();
      expect(result.description).toBeTruthy();
    }, 30000);

    it('debería obtener placeholder URL según nivel', () => {
      const url = badgeGenerator.getPlaceholderBadgeUrl('ORO');
      
      expect(url).toContain('placeholder');
      expect(url).toContain('ORO');
    });

    it('debería generar badges de todos los niveles', async () => {
      const levels = ['BRONCE', 'PLATA', 'ORO', 'PLATINO'];
      
      for (const level of levels) {
        const result = await badgeGenerator.generateBadge({
          name: `Test ${level}`,
          level,
          code: `TEST_${level}`,
          category: 'Test',
        });

        expect(result).toHaveProperty('imageUrl');
        expect(result.description).toBeTruthy();
      }
    }, 60000);
  });
});

