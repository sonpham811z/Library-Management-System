const multer = require('multer');
const path = require('path');

// Store file in memory — no disk I/O needed for bulk inserts
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowed = ['.xlsx', '.xls', '.csv'];
  if (allowed.includes(ext)) return cb(null, true);
  cb(new Error(`Chỉ chấp nhận file Excel (.xlsx, .xls) hoặc CSV (.csv). File nhận được: ${ext}`));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

module.exports = { upload };
