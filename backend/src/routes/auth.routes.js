'use strict';

const router   = require('express').Router();
const { body } = require('express-validator');
const ctrl     = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

// POST /auth/register
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password min 8 chars'),
    body('full_name').trim().notEmpty().withMessage('Full name required'),
    body('company_name').trim().notEmpty().withMessage('Company name required'),
  ],
  validate,
  ctrl.register
);

// POST /auth/login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  ctrl.login
);

// POST /auth/team-login
router.post('/team-login',
  [
    body('company_id').notEmpty().withMessage('Company ID required'),
    body('username').trim().notEmpty().withMessage('Username required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  validate,
  ctrl.teamLogin
);

// POST /auth/refresh
router.post('/refresh',
  [body('refreshToken').notEmpty()],
  validate,
  ctrl.refreshToken
);

// GET  /auth/me
router.get('/me', authenticate, ctrl.getMe);

// POST /auth/logout
router.post('/logout', authenticate, ctrl.logout);

module.exports = router;
