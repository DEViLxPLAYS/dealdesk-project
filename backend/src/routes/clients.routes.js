'use strict';

const router   = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/clients.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/',    ctrl.listClients);
router.get('/:id', ctrl.getClient);

router.post('/',
  [
    body('name').trim().notEmpty().withMessage('Name required'),
    body('email').optional().isEmail().normalizeEmail(),
  ],
  validate,
  ctrl.createClient
);

router.patch('/:id',
  [body('email').optional().isEmail().normalizeEmail()],
  validate,
  ctrl.updateClient
);

router.delete('/:id', ctrl.deleteClient);

module.exports = router;
