'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = () => (req, _res, next) => {
  req.context = {
    requestId: uuidv4(),
    timestamp: new Date().toISOString(),
  };
  next();
};


