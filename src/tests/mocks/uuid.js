'use strict';

const { randomUUID } = require('crypto');

module.exports = {
  v4: () => randomUUID(),
};



