'use strict';

const winston  = require('winston');
const path     = require('path');
const config   = require('../config');
require('winston-daily-rotate-file');

const { combine, timestamp, printf, colorize, errors } = winston.format;

// ── Custom line format ───────────────────────────────────────────────────────
const lineFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// ── Transports ───────────────────────────────────────────────────────────────
const transports = [
  // Console (always on)
  new winston.transports.Console({
    format: combine(
      colorize({ all: true }),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      lineFormat
    ),
  }),
];

// File transport only for production / when LOG_DIR is set
if (!config.isDev) {
  const logDir = path.join(__dirname, '../../..', config.log.dir);

  transports.push(
    new winston.transports.DailyRotateFile({
      dirname:     logDir,
      filename:    'error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level:       'error',
      maxFiles:    '30d',
      format:      combine(timestamp(), errors({ stack: true }), lineFormat),
    }),
    new winston.transports.DailyRotateFile({
      dirname:     logDir,
      filename:    'combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles:    '14d',
      format:      combine(timestamp(), errors({ stack: true }), lineFormat),
    })
  );
}

const logger = winston.createLogger({
  level:       config.log.level,
  transports,
  exitOnError: false,
});

module.exports = logger;
