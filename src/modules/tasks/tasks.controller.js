'use strict';

const tasksService = require('./tasks.service');

const createTask = async (req, res, next) => {
  try {
    const task = await tasksService.createTask(req.body, req.user);
    return res.status(201).json({ status: 'success', data: task });
  } catch (error) {
    return next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const task = await tasksService.updateTask(req.params.id, req.body, req.user);
    return res.status(200).json({ status: 'success', data: task });
  } catch (error) {
    return next(error);
  }
};

const updateTaskStatus = async (req, res, next) => {
  try {
    const task = await tasksService.updateTaskStatus(req.params.id, req.body.status, req.user);
    return res.status(200).json({ status: 'success', data: task });
  } catch (error) {
    return next(error);
  }
};

const getTask = async (req, res, next) => {
  try {
    const task = await tasksService.getTask(req.params.id, req.user);
    return res.status(200).json({ status: 'success', data: task });
  } catch (error) {
    return next(error);
  }
};

const listTasks = async (req, res, next) => {
  try {
    const tasks = await tasksService.listTasks(req.query, req.user);
    return res.status(200).json({ status: 'success', data: tasks });
  } catch (error) {
    return next(error);
  }
};

const assignTaskToVolunteer = async (req, res, next) => {
  try {
    const assignment = await tasksService.assignTaskToVolunteer(
      req.params.id,
      req.body.volunteerId,
      req.user,
    );
    return res.status(201).json({ status: 'success', data: assignment });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createTask,
  updateTask,
  updateTaskStatus,
  getTask,
  listTasks,
  assignTaskToVolunteer,
};


