'use strict';

const jwt    = require('jsonwebtoken');
const config = require('../config');

const signToken = (payload, secret, expiresIn) =>
  jwt.sign(payload, secret, { expiresIn });

const verifyToken = (token, secret) => jwt.verify(token, secret);

const generateTokenPair = (payload) => ({
  accessToken:  signToken(payload, config.jwt.secret,        config.jwt.expiresIn),
  refreshToken: signToken(payload, config.jwt.refreshSecret, config.jwt.refreshExpiresIn),
});

module.exports = { signToken, verifyToken, generateTokenPair };
