'use strict';

const { Router } = require('express');
const validate = require('../../middlewares/validator');
const { authenticate } = require('../../middlewares/auth');
const controller = require('./tasks.controller');
const schemas = require('./tasks.validators');

const router = Router();

router.use(authenticate());

router.get('/', validate(schemas.listTasksSchema, 'query'), controller.listTasks);
router.post('/', validate(schemas.createTaskSchema), controller.createTask);
router.get('/:id', validate(schemas.taskIdParamSchema, 'params'), controller.getTask);
router.patch(
  '/:id',
  validate(schemas.taskIdParamSchema, 'params'),
  validate(schemas.updateTaskSchema),
  controller.updateTask,
);
router.patch(
  '/:id/status',
  validate(schemas.taskIdParamSchema, 'params'),
  validate(schemas.updateStatusSchema),
  controller.updateTaskStatus,
);

module.exports = router;


