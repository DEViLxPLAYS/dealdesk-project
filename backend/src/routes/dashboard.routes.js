'use strict';

const router   = require('express').Router();
const { body } = require('express-validator');
const dashCtrl = require('../controllers/dashboard.controller');
const settCtrl = require('../controllers/settings.controller');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Dashboard stats
router.get('/dashboard', dashCtrl.getDashboard);
router.get('/reports',   authorize('owner', 'manager'), dashCtrl.getReports);

// Company settings
router.get('/settings',  settCtrl.getSettings);
router.patch('/settings',
  authorize('owner'),
  [body('name').optional().trim().notEmpty()],
  validate,
  settCtrl.updateSettings
);

module.exports = router;
