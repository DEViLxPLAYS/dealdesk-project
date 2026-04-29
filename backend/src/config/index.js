'use strict';

const dotenv = require('dotenv');
const path   = require('path');

// Load .env from the backend root
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

// ── Validate required variables ──────────────────────────────────────────────
const required = [
  'NODE_ENV',
  'PORT',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`[Config] Missing required env variables: ${missing.join(', ')}`);
  process.exit(1);
}

module.exports = {
  // ── Server ─────────────────────────────────────────────────────────────────
  env:        process.env.NODE_ENV    || 'development',
  port:       parseInt(process.env.PORT || '5000', 10),
  apiPrefix:  process.env.API_PREFIX  || '/api/v1',
  isDev:      (process.env.NODE_ENV  || 'development') === 'development',

  // ── Supabase ───────────────────────────────────────────────────────────────
  supabase: {
    url:             process.env.SUPABASE_URL,
    anonKey:         process.env.SUPABASE_ANON_KEY,
    serviceRoleKey:  process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  // ── JWT ────────────────────────────────────────────────────────────────────
  jwt: {
    secret:          process.env.JWT_SECRET,
    expiresIn:       process.env.JWT_EXPIRES_IN         || '7d',
    refreshSecret:   process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // ── CORS ───────────────────────────────────────────────────────────────────
  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:5173')
      .split(',')
      .map((o) => o.trim()),
  },

  // ── Rate Limit ─────────────────────────────────────────────────────────────
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max:      parseInt(process.env.RATE_LIMIT_MAX        || '100',    10),
  },

  // ── Email / SMTP ───────────────────────────────────────────────────────────
  smtp: {
    host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user:   process.env.SMTP_USER,
    pass:   process.env.SMTP_PASS,
    from:   process.env.EMAIL_FROM  || 'Deal Desk CRM <noreply@dealdesk.com>',
  },

  // ── Stripe ─────────────────────────────────────────────────────────────────
  stripe: {
    secretKey:     process.env.STRIPE_SECRET_KEY     || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },

  // ── File Upload ────────────────────────────────────────────────────────────
  upload: {
    maxFileSizeMb:   parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
    allowedTypes:    (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,xls,xlsx,png,jpg,jpeg')
      .split(','),
  },

  // ── Logging ────────────────────────────────────────────────────────────────
  log: {
    level: process.env.LOG_LEVEL || 'debug',
    dir:   process.env.LOG_DIR   || 'logs',
  },
};
