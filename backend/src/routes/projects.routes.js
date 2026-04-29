'use strict';

const router   = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/projects.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/',    ctrl.listProjects);
router.get('/:id', ctrl.getProject);

router.post('/',
  [
    body('name').trim().notEmpty().withMessage('Project name required'),
    body('status').optional().isIn(['planning','active','on_hold','completed','cancelled']),
    body('budget').optional().isFloat({ min: 0 }),
  ],
  validate,
  ctrl.createProject
);

router.patch('/:id',
  [
    body('status').optional().isIn(['planning','active','on_hold','completed','cancelled']),
    body('progress').optional().isInt({ min: 0, max: 100 }),
  ],
  validate,
  ctrl.updateProject
);

router.delete('/:id', ctrl.deleteProject);

module.exports = router;
