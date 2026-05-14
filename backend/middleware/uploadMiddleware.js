import multer from 'multer';

// Configure multer for in-memory file storage
const storage = multer.memoryStorage();

/**
 * Middleware to handle a single file upload.
 * The file will be available under `req.file`.
 */
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
});

export default upload;
