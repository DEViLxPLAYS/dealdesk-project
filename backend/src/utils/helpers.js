'use strict';

/** Build pagination params from query string */
const parsePagination = (query) => {
  const page  = Math.max(1, parseInt(query.page  || '1',  10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
  const from  = (page - 1) * limit;
  const to    = from + limit - 1;
  return { page, limit, from, to };
};

/** Strip undefined keys from an object (for partial updates) */
const stripUndefined = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

/** Slugify a string */
const slugify = (str) =>
  str.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

/** Generate a random alphanumeric string of given length */
const randomString = (length = 12) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

module.exports = { parsePagination, stripUndefined, slugify, randomString };
