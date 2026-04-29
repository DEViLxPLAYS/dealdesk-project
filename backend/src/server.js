'use strict';

const app    = require('./app');
const config = require('./config');
const logger = require('./config/logger');

const server = app.listen(config.port, () => {
  logger.info(`
╔══════════════════════════════════════════════════╗
║        Deal Desk CRM — Backend Server            ║
╠══════════════════════════════════════════════════╣
║  ENV  : ${config.env.padEnd(39)}║
║  PORT : ${String(config.port).padEnd(39)}║
║  API  : http://localhost:${config.port}${config.apiPrefix.padEnd(22)}║
╚══════════════════════════════════════════════════╝
  `);
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
const shutdown = (signal) => {
  logger.warn(`[Server] ${signal} received — shutting down gracefully...`);
  server.close(() => {
    logger.info('[Server] HTTP server closed.');
    process.exit(0);
  });

  // Force exit if connections linger beyond 10s
  setTimeout(() => {
    logger.error('[Server] Forced exit after timeout.');
    process.exit(1);
  }, 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// ── Unhandled promise rejections / exceptions ─────────────────────────────────
process.on('unhandledRejection', (reason) => {
  logger.error('[Server] Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  logger.error('[Server] Uncaught Exception:', err);
  process.exit(1);
});

module.exports = server;
