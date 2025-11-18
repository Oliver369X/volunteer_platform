'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const PointTransaction = sequelize.define(
    'PointTransaction',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
      },
      volunteerProfileId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      assignmentId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM('EARN', 'REDEEM', 'ADJUSTMENT'),
        allowNull: false,
      },
      points: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      referenceType: {
        type: DataTypes.STRING(60),
        allowNull: true,
      },
      referenceId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      tableName: 'point_transactions',
    },
  );

  return PointTransaction;
};
