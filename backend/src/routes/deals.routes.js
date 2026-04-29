'use strict';

const router   = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/deals.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/',    ctrl.listDeals);
router.get('/:id', ctrl.getDeal);

router.post('/',
  [
    body('title').trim().notEmpty().withMessage('Title required'),
    body('value').isFloat({ min: 0 }).withMessage('Value must be a positive number'),
    body('stage').optional().isIn(['lead','qualified','proposal','negotiation','won','lost']),
  ],
  validate,
  ctrl.createDeal
);

router.patch('/:id',
  [
    body('value').optional().isFloat({ min: 0 }),
    body('stage').optional().isIn(['lead','qualified','proposal','negotiation','won','lost']),
  ],
  validate,
  ctrl.updateDeal
);

router.delete('/:id', ctrl.deleteDeal);

module.exports = router;
