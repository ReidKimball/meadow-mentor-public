// backend/middleware/fileUpload.js
import multer from "multer";

const multerStorage = multer.memoryStorage(); // Store files in memory

const fileFilter = (req, file, cb) => {
  // Basic filter example: Allow images and PDFs
  if (
    file.mimetype.startsWith("image") ||
    file.mimetype === "application/pdf"
  ) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only images and PDFs are allowed."),
      false
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export default upload;
