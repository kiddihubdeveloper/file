import S3 from "../clients/S3/index.js";
import fs from "fs";

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
export default {
  /**
   * Upload a single file to S3
   * @param {Express.Multer.File} file
   * @returns {Promise<{filename:string}>}
   */
  async upload(file, unlink = true) {
    const result = await S3.PutObject(file);
    if (unlink) unlinkFiles([file]);
    return result;
  },
  /**
   * Upload multiple files to S3
   * @param {Array<Express.Multer.File>} files
   * @returns {Promise<Array<{filename:string}>>}
   */
  async uploadMultiple(files, unlink = true) {
    const uploadResults = await Promise.all(
      files.map((file) => S3.PutObject(file))
    );
    if (unlink) unlinkFiles(files);
    return uploadResults;
  },
  /**
   * Transfer multiple file urls to S3
   * @param {string[]} urls
   * @returns {Promise<Array<{filename:string}>>}
   */
  async transferUrl(urls) {
    return await Promise.all(urls.map((url) => S3.PutObject(url)));
  },
  /**
   * @param {String} filename
   * @return {string} file url
   */
  url(filename) {
    return `${S3.__cnf.baseCDN}/${S3.__cnf.bucket}/${filename}`;
  },
};
