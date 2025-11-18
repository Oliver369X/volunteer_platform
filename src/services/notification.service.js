'use strict';

const logger = require('../utils/logger');

const notifyVolunteerAssignment = async ({ volunteer, task }) => {
  logger.info('Notificando asignación a voluntario', {
    volunteerId: volunteer.id,
    taskId: task.id,
    taskTitle: task.title,
  });
};

const notifyTaskStatusChange = async ({ organization, task, status }) => {
  logger.info('Notificando cambio de estado de tarea', {
    organizationId: organization.id,
    taskId: task.id,
    status,
  });
};

module.exports = {
  notifyVolunteerAssignment,
  notifyTaskStatusChange,
};


