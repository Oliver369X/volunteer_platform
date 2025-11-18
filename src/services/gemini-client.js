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

module.exports = {
  requestRecommendations,
};


