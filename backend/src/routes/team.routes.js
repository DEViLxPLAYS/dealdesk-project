'use strict';

const router   = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/team.controller');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('owner', 'manager'));

router.get('/',    ctrl.listTeam);

router.post('/',
  [
    body('full_name').trim().notEmpty().withMessage('Full name required'),
    body('username').trim().notEmpty().withMessage('Username required'),
    body('role').isIn(['manager','employee']).withMessage('Role must be manager or employee'),
    body('password').optional().isLength({ min: 6 }),
  ],
  validate,
  ctrl.createMember
);

router.patch('/:id',
  [body('role').optional().isIn(['manager','employee'])],
  validate,
  ctrl.updateMember
);

router.post('/:id/reset-password',
  [body('new_password').isLength({ min: 6 }).withMessage('Min 6 chars')],
  validate,
  ctrl.resetPassword
);

router.delete('/:id', ctrl.deleteMember);

module.exports = router;
