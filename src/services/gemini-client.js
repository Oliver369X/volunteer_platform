'use strict';

const axios = require('axios');
const loadEnv = require('../config/env');
const logger = require('../utils/logger');

const buildVolunteerSummary = (volunteer) => ({
  id: volunteer.userId,
  name: volunteer.user.fullName,
  skills: volunteer.skills || [],
  availability: volunteer.availability || {},
  reputationScore: volunteer.reputationScore,
  totalPoints: volunteer.totalPoints,
  level: volunteer.level,
  baseLocation: volunteer.baseLocation,
});

const buildPrompt = (task, volunteers) => {
  const taskSummary = {
    title: task.title,
    description: task.description,
    urgency: task.urgency,
    status: task.status,
    location: task.locationName,
    skillsRequired: task.skillsRequired || [],
    volunteersNeeded: task.volunteersNeeded,
    startAt: task.startAt,
    endAt: task.endAt,
  };

  return [
    {
      role: 'user',
      parts: [
        {
          text: `Eres un asistente experto en coordinación humanitaria. Dada la siguiente tarea y lista de voluntarios, genera una lista priorizada de los voluntarios que mejor se ajustan a la tarea. Devuelve respuesta JSON con esquema { "recommendations": [ { "volunteerId": string, "score": number (0-100), "justification": string, "priority": number } ] }.\n\nTarea: ${JSON.stringify(
            taskSummary,
            null,
            2,
          )}\n\nVoluntarios disponibles: ${JSON.stringify(
            volunteers.map(buildVolunteerSummary),
            null,
            2,
          )}`,
        },
      ],
    },
  ];
};

const parseResponse = (response) => {
  try {
    const content = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      return null;
    }
    return JSON.parse(content);
  } catch (error) {
    logger.warn('No se pudo parsear la respuesta de Gemini', { error });
    return null;
  }
};

const requestRecommendations = async (task, volunteers) => {
  const config = loadEnv().integrations;
  if (!config.geminiApiKey) {
    logger.warn('Gemini API key no configurado. Se utilizará heurística local.');
    return null;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent`;
    const response = await axios.post(
      url,
      { contents: buildPrompt(task, volunteers) },
      {
        params: { key: config.geminiApiKey },
      },
    );
    return parseResponse(response);
  } catch (error) {
    logger.error('Error al comunicarse con Gemini', {
      error: error.response?.data || error.message,
    });
    return null;
  }
};

/**
 * Generar descripción de badge con IA
 * @param {object} badgeInfo - Información del badge
 * @returns {Promise<string>} - Descripción generada
 */
const generateBadgeDescription = async (badgeInfo) => {
  const config = loadEnv().integrations;
  if (!config.geminiApiKey) {
    logger.warn('Gemini API key no configurado. Usando descripción por defecto.');
    return `Badge ${badgeInfo.name} de nivel ${badgeInfo.level}`;
  }

  try {
    const prompt = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Genera una descripción inspiradora y profesional en español para un badge NFT de voluntariado con las siguientes características:
              
Nombre: ${badgeInfo.name}
Nivel: ${badgeInfo.level}
Categoría: ${badgeInfo.category || 'General'}
Logro: ${badgeInfo.achievement || 'Participación destacada'}

La descripción debe:
- Ser de máximo 150 caracteres
- Ser motivadora y celebrar el logro
- Mencionar el impacto del voluntario
- No usar emojis

Responde SOLO con la descripción, sin formato adicional.`,
            },
          ],
        },
      ],
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent`;
    const response = await axios.post(url, prompt, {
      params: { key: config.geminiApiKey },
    });

    const description = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return description || `Badge ${badgeInfo.name} otorgado por ${badgeInfo.achievement || 'contribución excepcional'}`;
  } catch (error) {
    logger.error('Error al generar descripción con Gemini', {
      error: error.response?.data || error.message,
    });
    return `Badge ${badgeInfo.name} de nivel ${badgeInfo.level}`;
  }
};

/**
 * Generar prompt para imagen de badge
 * @param {object} badgeInfo - Información del badge
 * @returns {Promise<string>} - Prompt para generación de imagen
 */
const generateBadgeImagePrompt = async (badgeInfo) => {
  const config = loadEnv().integrations;
  if (!config.geminiApiKey) {
    return `A ${badgeInfo.level} level badge medal for volunteer work`;
  }

  try {
    const prompt = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Genera un prompt en inglés para crear una imagen de badge/medalla NFT con estas características:

Nombre: ${badgeInfo.name}
Nivel: ${badgeInfo.level} (BRONCE=bronze, PLATA=silver, ORO=gold, PLATINO=platinum)
Categoría: ${badgeInfo.category || 'General'}

El prompt debe describir:
- Una medalla/badge circular o hexagonal
- Colores según el nivel (bronce/plata/oro/platino)
- Estilo moderno, digital, NFT art
- Símbolos relacionados con voluntariado humanitario
- Alta calidad, 3D render

Responde SOLO con el prompt en inglés, máximo 200 caracteres.`,
            },
          ],
        },
      ],
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent`;
    const response = await axios.post(url, prompt, {
      params: { key: config.geminiApiKey },
    });

    const generatedPrompt = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return generatedPrompt || `A ${badgeInfo.level} level badge medal for volunteer humanitarian work, 3D render, modern, digital art, NFT style`;
  } catch (error) {
    logger.error('Error al generar prompt de imagen', {
      error: error.response?.data || error.message,
    });
    return `A ${badgeInfo.level} level badge medal for volunteer work, 3D digital art, NFT style`;
  }
};

module.exports = {
  requestRecommendations,
  generateBadgeDescription,
  generateBadgeImagePrompt,
};


