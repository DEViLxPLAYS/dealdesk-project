'use strict';

require('express-async-errors');       // patches express to forward async throws

const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const morgan       = require('morgan');
const compression  = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit    = require('express-rate-limit');
const { StatusCodes } = require('http-status-codes');

const config       = require('./config');
const logger       = require('./config/logger');
const routes       = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());
app.disable('x-powered-by');

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin:      config.cors.origin,
  credentials: true,
  methods:     ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.options('*', cors());

// ── Body parsing ──────────────────────────────────────────────────────────────
// Raw body needed for Stripe webhook — mount BEFORE json parser
app.use('/api/v1/stripe/webhook',
  express.raw({ type: 'application/json' })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Compression ───────────────────────────────────────────────────────────────
app.use(compression());

// ── HTTP request logging ──────────────────────────────────────────────────────
const morganStream = { write: (msg) => logger.http(msg.trim()) };
app.use(morgan(config.isDev ? 'dev' : 'combined', { stream: morganStream }));

// ── Global rate limit ─────────────────────────────────────────────────────────
app.use(rateLimit({
  windowMs: config.rateLimit.windowMs,
  max:      config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests, please try again later.' },
}));

// ── Strict auth rate limit for login / register ───────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 min
  max: 20,
  message: { success: false, message: 'Too many auth attempts, please slow down.' },
});
app.use(`${config.apiPrefix}/auth`, authLimiter);

// ── Health check (no auth) ────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(StatusCodes.OK).json({
    status:    'ok',
    env:       config.env,
    timestamp: new Date().toISOString(),
    uptime:    Math.floor(process.uptime()),
  });
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use(config.apiPrefix, routes);

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success:   false,
    message:   'Route not found',
    timestamp: new Date().toISOString(),
  });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
