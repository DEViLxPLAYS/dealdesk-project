'use strict';

const router   = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/invoices.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/',    ctrl.listInvoices);
router.get('/:id', ctrl.getInvoice);

router.post('/',
  [
    body('client_id').notEmpty().withMessage('Client required'),
    body('invoice_number').trim().notEmpty().withMessage('Invoice number required'),
    body('due_date').isISO8601().withMessage('Valid due date required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item required'),
  ],
  validate,
  ctrl.createInvoice
);

router.patch('/:id',
  [
    body('status').optional().isIn(['draft','sent','paid','overdue','cancelled']),
    body('due_date').optional().isISO8601(),
  ],
  validate,
  ctrl.updateInvoice
);

router.delete('/:id', ctrl.deleteInvoice);

module.exports = router;
