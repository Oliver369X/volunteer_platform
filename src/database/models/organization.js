'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Organization = sequelize.define(
    'Organization',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      sector: {
        type: DataTypes.STRING(80),
        allowNull: true,
      },
      contactEmail: {
        type: DataTypes.STRING(160),
        allowNull: false,
        validate: { isEmail: true },
      },
      contactPhone: {
        type: DataTypes.STRING(25),
        allowNull: true,
      },
      headquartersLocation: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      coverageAreas: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
      },
    },
    {
      tableName: 'organizations',
    },
  );

  return Organization;
};


