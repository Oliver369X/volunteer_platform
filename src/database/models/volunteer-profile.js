'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const VolunteerProfile = sequelize.define(
    'VolunteerProfile',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      baseLocation: {
        type: DataTypes.STRING(180),
        allowNull: true,
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      longitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      availability: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Bloques horarios disponibles',
      },
      skills: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      },
      certifications: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      },
      transportOptions: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      },
      reputationScore: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      totalPoints: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      level: {
        type: DataTypes.ENUM('BRONCE', 'PLATA', 'ORO', 'PLATINO'),
        defaultValue: 'BRONCE',
      },
      experienceHours: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      tableName: 'volunteer_profiles',
    },
  );

  return VolunteerProfile;
};
