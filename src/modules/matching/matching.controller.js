'use strict';

const matchingService = require('./matching.service');

const runMatching = async (req, res, next) => {
  try {
    const result = await matchingService.runMatching(req.params.id, req.body, req.user);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const predictStaffing = async (req, res, next) => {
  try {
    const result = await matchingService.predictStaffing(req.body, req.user);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  runMatching,
  predictStaffing,
};


