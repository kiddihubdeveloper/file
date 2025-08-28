import { Jimp } from "jimp";
import { readFile } from "node:fs/promises";
import S3 from "../clients/S3/index.js";
import images from "../config/images.js";

export default {
  /**
   *
   * @param {Array<Express.Multer.File>} files
   * @param {String} thumbnailKey
   */
  makeThumbnails(files, thumbnailKey) {
    const thumbnailConfig = images.thumbnails[thumbnailKey];
    if (!thumbnailConfig) {
      throw new Error(`Unknown thumbnail key: ${thumbnailKey}`);
    }

    // Implement thumbnail creation logic here
  },
  /**
   * @param {Express.Multer.File} files
   * @param {String} thumbnailKey
   */
  makeThumbnail(file, thumbnailKey) {},
  /**
   * @param {import('express').Request} req
   */
  async upload(req) {
    try {
      const thumbnail = req.body.thumbnail;
      console.log({ thumbnail });
      const _file = await readFile(req.file.path);
      const image = await Jimp.fromBuffer(_file);
      await image.resize({ w: 600 });
      await image.write(req.file.path);
    } catch (error) {
      console.log(error);
    }
  },
  /**
   * @param {String} filename
   * @return {string} file url
   */
  url(filename) {
    return `${S3.__cnf.baseCDN}/${S3.__cnf.bucket}/${filename}`;
  },
};
