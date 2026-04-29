'use strict';

const router = require('express').Router();

router.use('/auth',      require('./auth.routes'));
router.use('/clients',   require('./clients.routes'));
router.use('/deals',     require('./deals.routes'));
router.use('/invoices',  require('./invoices.routes'));
router.use('/contracts', require('./contracts.routes'));
router.use('/projects',  require('./projects.routes'));
router.use('/team',      require('./team.routes'));
router.use('/',          require('./dashboard.routes'));

module.exports = router;
