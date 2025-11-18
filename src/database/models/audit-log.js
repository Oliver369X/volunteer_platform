'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define(
    'AuditLog',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
      },
      organizationId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      action: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      actorType: {
        type: DataTypes.STRING(60),
        allowNull: true,
      },
      actorId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      entityType: {
        type: DataTypes.STRING(60),
        allowNull: true,
      },
      entityId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      tableName: 'audit_logs',
    },
  );

  return AuditLog;
};
