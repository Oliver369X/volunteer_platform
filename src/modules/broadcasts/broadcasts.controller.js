'use strict';

const broadcastsService = require('./broadcasts.service');

const sendBroadcast = async (req, res, next) => {
  try {
    const result = await broadcastsService.sendBroadcast(req.user.id, req.body);
    return res.status(201).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const listBroadcasts = async (req, res, next) => {
  try {
    const result = await broadcastsService.listBroadcasts(req.user.id, req.query.organizationId);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

const getBroadcastById = async (req, res, next) => {
  try {
    const result = await broadcastsService.getBroadcastById(req.user.id, req.params.id);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  sendBroadcast,
  listBroadcasts,
  getBroadcastById,
};


