// backend/utils/gcs.js
import { Storage } from '@google-cloud/storage';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize storage
const storage = new Storage({
  // keyFilename: path.join(__dirname, '../config/gcp-key.json'), // Uncomment if you have a key file
  projectId: process.env.GCP_PROJECT_ID,
});

const bucketName = process.env.GCS_BUCKET_NAME;
const bucket = storage.bucket(bucketName);
const imagePrefix = process.env.GCS_IMAGE_PREFIX;
const gcsPublicBase = process.env.GCS_PUBLIC_BASE;

/**
 * Uploads a buffer to Google Cloud Storage.
 * @param {Buffer} buffer - The buffer to upload.
 * @param {string} destination - The destination path and filename in the bucket (e.g., 'users/userId/recipes/recipeId/thumbnail.webp').
 * @param {boolean} usePrefix - Whether to use the imagePrefix (default: true). Set to false for user profile images.
 * @returns {Promise<string>} The public URL of the uploaded file.
 */
export const uploadBufferToGCS = (buffer, destination, usePrefix = true) => {
  return new Promise((resolve, reject) => {
    if (!buffer) {
      return reject('No buffer provided.');
    }

    const filePath = usePrefix ? `${imagePrefix}/${destination}` : destination;
    const blob = bucket.file(filePath);
    const blobStream = blob.createWriteStream({
      resumable: false,
      gzip: true,
    });

    blobStream.on('error', (err) => {
      reject(`Error uploading to GCS: ${err.message}`);
    });

    blobStream.on('finish', () => {
      const publicUrl = `${gcsPublicBase}/${bucket.name}/${blob.name}`;
      resolve(publicUrl);
    });

    blobStream.end(buffer);
  });
};

/**
 * Lists all images within a specific folder in GCS.
 * @param {string} folderPath - The path to the folder (e.g., 'users/userId/recipes/recipeId/').
 * @returns {Promise<Array<Object>>} A list of file objects with their public URLs and names.
 */
export const listImagesInFolder = async (folderPath) => {
  try {
    const [files] = await bucket.getFiles({ prefix: `${imagePrefix}/${folderPath}` });
    return files.map(file => ({
      name: file.name,
      url: `${gcsPublicBase}/${bucket.name}/${file.name}`,
    }));
  } catch (error) {
    console.error('Error listing files in GCS:', error);
    throw new Error(`Failed to list images in folder: ${error.message}`);
  }
};

/**
 * Deletes a file from Google Cloud Storage.
 * @param {string} filePath - The full path to the file in the bucket (e.g., 'image_prefix/users/userId/recipes/recipeId/image.webp').
 * @returns {Promise<void>}
 */
export const deleteFileFromGCS = async (filePath) => {
  try {
    await bucket.file(filePath).delete();
    console.log(`Successfully deleted ${filePath} from GCS.`);
  } catch (error) {
    console.error(`Error deleting file from GCS: ${filePath}`, error);
    // Don't throw an error if the file doesn't exist, as the goal is to have it gone.
    if (error.code !== 404) {
      throw new Error(`Failed to delete file from GCS: ${error.message}`);
    }
  }
};

/**
 * Downloads a file from GCS as a buffer.
 * @param {string} filePath - The path to the file in the bucket (e.g., 'users/userId/recipes/recipeId/image.webp').
 * @returns {Promise<Buffer>} The file content as a buffer.
 */
export const downloadFileAsBuffer = async (filePath) => {
  try {
    // Construct the full path within the bucket.
    // The filePath is expected to be the full path starting from the bucket root.
    const fullPath = filePath;
    const file = bucket.file(fullPath);

    const [buffer] = await file.download();
    return buffer;
  } catch (error) {
    console.error(`Error downloading file from GCS: ${filePath}`, error);
    throw new Error(`Failed to download file from GCS: ${error.message}`);
  }
};
