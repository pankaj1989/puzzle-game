const multer = require('multer');
const { HttpError } = require('./errorHandler');

const ALLOWED_MIMES = new Set([
  'text/csv',
  'application/csv',
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const ALLOWED_EXT = /\.(csv|xlsx|xls)$/i;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const name = file.originalname || '';
    const mimeOk = file.mimetype && ALLOWED_MIMES.has(file.mimetype);
    const extOk = ALLOWED_EXT.test(name);
    if (!mimeOk && !extOk) {
      cb(new HttpError(400, 'Upload a CSV or Excel file (.csv, .xlsx, .xls)', 'INVALID_IMPORT_FILE'));
      return;
    }
    cb(null, true);
  },
});

const uploadPuzzleImport = upload.single('file');

module.exports = { uploadPuzzleImport };
