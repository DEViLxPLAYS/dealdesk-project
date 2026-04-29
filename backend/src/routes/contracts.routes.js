'use strict';

const router   = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/contracts.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/',    ctrl.listContracts);
router.get('/:id', ctrl.getContract);

router.post('/',
  [
    body('title').trim().notEmpty().withMessage('Title required'),
    body('client_id').notEmpty().withMessage('Client required'),
    body('value').optional().isFloat({ min: 0 }),
    body('start_date').optional().isISO8601(),
    body('end_date').optional().isISO8601(),
  ],
  validate,
  ctrl.createContract
);

router.patch('/:id',
  [
    body('status').optional().isIn(['draft','active','expired','terminated']),
    body('value').optional().isFloat({ min: 0 }),
  ],
  validate,
  ctrl.updateContract
);

router.delete('/:id', ctrl.deleteContract);

module.exports = router;
