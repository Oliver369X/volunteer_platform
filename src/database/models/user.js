'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
      },
      fullName: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(160),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      passwordHash: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      phoneNumber: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      role: {
        type: DataTypes.ENUM('ADMIN', 'ORGANIZATION', 'VOLUNTEER'),
        allowNull: false,
        defaultValue: 'VOLUNTEER',
      },
      status: {
        type: DataTypes.ENUM('ACTIVE', 'SUSPENDED', 'PENDING'),
        allowNull: false,
        defaultValue: 'ACTIVE',
      },
      lastLoginAt: {
        type: DataTypes.DATE,
      },
    },
    {
      tableName: 'users',
    },
  );

  return User;
};


