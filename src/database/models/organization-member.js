'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const OrganizationMember = sequelize.define(
    'OrganizationMember',
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
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('OWNER', 'COORDINATOR', 'ANALYST'),
        defaultValue: 'COORDINATOR',
        allowNull: false,
      },
    },
    {
      tableName: 'organization_members',
    },
  );

  return OrganizationMember;
};
