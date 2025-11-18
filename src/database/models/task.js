'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define(
    'Task',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
      },
      organizationId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      createdByUserId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(180),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM(
          'PENDING',
          'ASSIGNED',
          'IN_PROGRESS',
          'COMPLETED',
          'VERIFIED',
          'CANCELLED',
        ),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      urgency: {
        type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
        allowNull: false,
        defaultValue: 'MEDIUM',
      },
      category: {
        type: DataTypes.STRING(80),
        allowNull: true,
      },
      skillsRequired: {
        type: DataTypes.ARRAY(DataTypes.STRING),
      },
      locationName: {
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
      startAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      endAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      volunteersNeeded: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      tableName: 'tasks',
    },
  );

  return Task;
};
