'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const VolunteerBadge = sequelize.define(
    'VolunteerBadge',
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
      badgeId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      assignmentId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      tokenId: {
        type: DataTypes.STRING(160),
        allowNull: true,
      },
      blockchainStatus: {
        type: DataTypes.ENUM('PENDING', 'MINTED', 'FAILED'),
        defaultValue: 'PENDING',
      },
      sharedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      tableName: 'volunteer_badges',
    },
  );

  return VolunteerBadge;
};
