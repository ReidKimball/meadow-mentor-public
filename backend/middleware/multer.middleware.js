import multer from "multer";

// Use memory storage to handle files as buffers
const multerStorage = multer.memoryStorage();

// Configure Multer to handle file uploads
export const upload = multer({
  storage: multerStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  // Optional: Add file filtering if needed
  // fileFilter: (req, file, cb) => {
  //   if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
  //     cb(null, true);
  //   } else {
  //     cb(new Error('Invalid file type'), false);
  //   }
  // }
});

// Export the configured multer instance
export default upload;
