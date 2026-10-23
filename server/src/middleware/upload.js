import multer from 'multer';
import { AppError } from './errorHandler.js';

// In-memory buffer storage for safe OCR processing without disk leaks
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Invalid file type. Please upload a receipt image (JPEG, PNG, or WebP).',
        400
      ),
      false
    );
  }
};

export const receiptUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit as specified
  },
  fileFilter,
});
