'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Badge = sequelize.define(
    'Badge',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
      },
      code: {
        type: DataTypes.STRING(80),
        allowNull: false,
        unique: true,
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      category: {
        type: DataTypes.STRING(60),
        allowNull: true,
      },
      level: {
        type: DataTypes.ENUM('BRONCE', 'PLATA', 'ORO', 'PLATINO', 'ESPECIAL'),
        allowNull: false,
        defaultValue: 'BRONCE',
      },
      criteria: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      iconUrl: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: 'badges',
    },
  );

  return Badge;
};


