'use strict';

const multer        = require('multer');
const path          = require('path');
const { ApiError }  = require('../utils/apiResponse');
const config        = require('../config');

const storage = multer.memoryStorage(); // keep files in memory; upload to Supabase storage

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  if (config.upload.allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest(`File type '.${ext}' is not allowed`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.upload.maxFileSizeMb * 1024 * 1024 },
});

module.exports = upload;
