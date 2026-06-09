const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { HttpError } = require('./errorHandler');

const uploadRoot = path.resolve(__dirname, '..', '..', 'uploads', 'categories');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(uploadRoot, { recursive: true });
    cb(null, uploadRoot);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    cb(null, `${Date.now()}${extension || '.png'}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      cb(new HttpError(400, 'Only image uploads are allowed', 'INVALID_IMAGE_UPLOAD'));
      return;
    }
    cb(null, true);
  },
});

const uploadCategoryImage = upload.single('image');

function normalizeCategoryBody(req, res, next) {
  if (typeof req.body?.isPremium === 'string') {
    req.body.isPremium = req.body.isPremium === 'true';
  }
  next();
}

module.exports = {
  uploadCategoryImage,
  normalizeCategoryBody,
};