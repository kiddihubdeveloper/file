import S3 from "../../clients/S3/index.js";
import fs from "fs";
import uploadImage from "../Image/uploadImage.js";
/**
 * Unlink temporary files
 * @param {Array<Express.Multer.File>} files
 */
function unlinkFiles(files) {
  files.forEach((file) => {
    fs.unlink(file.path, (err) => {
      console.log(`Unable to unlink temporary file: ${err}`);
    });
  });
}

/**
 * Upload a single file to S3
 * @param {Express.Multer.File} file
 * @returns {Promise<{filename:string}>}
 */
async function upload(file, unlink = true) {
  const result = await S3.PutObject(file);
  if (unlink) unlinkFiles([file]);
  return result;
}

/**
 * Upload multiple files to S3
 * @param {Array<Express.Multer.File>} files
 * @param {string|null} prefix - Optional prefix for S3 keys
 * @returns {Promise<Array<{filename:string}>>}
 */
async function uploadMultiple(files, prefix) {
  const result = await uploadImage(files, null, prefix);
  // uploadImage handles file cleanup internally, so we don't need to unlink here
  return result;
}

/**
 * Transfer multiple file urls to S3
 * @param {string[]} urls
 * @returns {Promise<Array<{filename:string}>>}
 */
async function transferUrl(urls) {
  return await Promise.all(urls.map((url) => S3.PutObject(url)));
}

export default {
  upload,
  uploadMultiple,
  transferUrl,
  unlinkFiles,
};
