'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const AiRecommendation = sequelize.define(
    'AiRecommendation',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
      },
      taskId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      volunteerId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      organizationId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      requestContext: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      responsePayload: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      confidenceScore: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
    },
    {
      tableName: 'ai_recommendations',
    },
  );

  return AiRecommendation;
};
