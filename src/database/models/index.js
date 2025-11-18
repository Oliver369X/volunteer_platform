'use strict';

const fs = require('fs');
const path = require('path');

const loadModelDefinitions = () => {
  const modelsDir = __dirname;
  const modelFiles = fs
    .readdirSync(modelsDir)
    .filter((file) => file !== 'index.js' && file.endsWith('.js'));

  return modelFiles.map((file) => require(path.join(modelsDir, file)));
};

module.exports = (sequelize) => {
  const DataTypes = require('sequelize').DataTypes;
  const modelDefinitions = loadModelDefinitions();

  modelDefinitions.forEach((defineModel) => {
    defineModel(sequelize, DataTypes);
  });

  return sequelize.models;
};


