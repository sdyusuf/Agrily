const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Permitted MIME types for produce imagery
const MIME_TYPES = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

// Maximum allowed image file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Ensure upload destination exists
const uploadDir = path.join(__dirname, '../public/images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDir);
  },
  filename: (req, file, callback) => {
    // Sanitize original filename (remove existing extension and illegal characters)
    const ext = MIME_TYPES[file.mimetype] || 'jpg';
    const parsed = path.parse(file.originalname);
    const sanitizedBase = parsed.name
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 50);
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e6)}`;
    callback(null, `${sanitizedBase}_${uniqueSuffix}.${ext}`);
  }
});

// File filter restricting uploads to valid image formats
const fileFilter = (req, file, callback) => {
  if (file.mimetype && MIME_TYPES[file.mimetype]) {
    callback(null, true);
  } else {
    const error = new Error(
      `Invalid file format: ${file.mimetype}. Only JPEG, PNG, and WebP images up to 5MB are permitted.`
    );
    error.code = 'LIMIT_FILE_TYPE';
    callback(error, false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  },
  fileFilter
});

// Express middleware handling single 'image' field with friendly error responses
const multerMiddleware = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'File size exceeds 5MB limit. Please upload a smaller produce photograph.'
        });
      }
      if (err.code === 'LIMIT_FILE_TYPE') {
        return res.status(400).json({
          success: false,
          error: err.message
        });
      }
      return res.status(400).json({
        success: false,
        error: err.message || 'Image upload failed.'
      });
    }
    next();
  });
};

multerMiddleware.MIME_TYPES = MIME_TYPES;
multerMiddleware.MAX_FILE_SIZE = MAX_FILE_SIZE;
multerMiddleware.fileFilter = fileFilter;
multerMiddleware.storage = storage;

module.exports = multerMiddleware;
