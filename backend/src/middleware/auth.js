'use strict';

const { verifyToken }    = require('../utils/jwt');
const { ApiError }       = require('../utils/apiResponse');
const { supabaseAdmin }  = require('../config/supabase');
const config             = require('../config');

/**
 * authenticate — verifies the Bearer JWT and attaches user + company_id to req
 */
const authenticate = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No token provided');
    }

    const token   = authHeader.split(' ')[1];
    const decoded = verifyToken(token, config.jwt.secret);

    // Fetch profile from Supabase so we always have fresh role info
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, role, company_id, username')
      .eq('id', decoded.sub)
      .single();

    if (error || !profile) throw ApiError.unauthorized('User not found');

    req.user       = profile;
    req.company_id = profile.company_id;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * authorize — role-based access control factory
 * Usage: authorize('owner', 'manager')
 */
const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden(`Role '${req.user.role}' is not allowed here`));
  }
  next();
};

/**
 * optionalAuth — attaches user if token present, but never blocks
 */
const optionalAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return next();
    const token   = authHeader.split(' ')[1];
    const decoded = verifyToken(token, config.jwt.secret);
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, role, company_id')
      .eq('id', decoded.sub)
      .single();
    if (profile) { req.user = profile; req.company_id = profile.company_id; }
  } catch (_) { /* intentionally ignored */ }
  next();
};

module.exports = { authenticate, authorize, optionalAuth };
