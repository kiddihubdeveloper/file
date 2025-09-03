import fs from "fs/promises";
import imagesConfig from "../../config/images.js";
import Thumnail from "./Thumnail.js";
import S3 from "../../clients/S3/index.js";
import {
  buildFileName,
  buildResponseFileName,
} from "./helpers/fileNameBuilder.js";
import {
  handleSchoolThumbnail,
  handleOtherCategories,
} from "./helpers/categoryHandlers.js";
import { getValidatedPrefix } from "../../config/prefixes.js";

/**
 * Main image upload function
 * @param {Express.Multer.File|Array<Express.Multer.File>} files
 * @param {string} category
 * @param {string} [prefix]
 * @returns {Promise<Array<string>|object>}
 */
export default async function uploadImage(files, category, prefix = null) {
  const isArray = Array.isArray(files);
  const fileList = isArray ? files : [files];

  // Get validated prefix for folder structure
  const folderPrefix = getValidatedPrefix(prefix);

  // Check config for category
  const thumbConfig = imagesConfig.thumbnails[category];
  const origConfig = imagesConfig.original[category];

  // Handle array uploads with thumbnail processing
  if (isArray && thumbConfig) {
    // Special case for school-thumbnail: return object with device types
    if (category === "school-thumbnail") {
      return await handleSchoolThumbnail(fileList, thumbConfig, folderPrefix);
    }

    // Other categories: process each file for each device, return flat array
    return await handleOtherCategories(fileList, thumbConfig, folderPrefix);
  }

  // Handle single file or non-thumbnail uploads
  return await handleSingleFileUploads(
    fileList,
    thumbConfig,
    origConfig,
    folderPrefix
  );
}

/**
 * Handle single file uploads and fallback cases
 * @param {Array<Express.Multer.File>} fileList
 * @param {object} thumbConfig
 * @param {object} origConfig
 * @param {string} folderPrefix
 * @returns {Promise<Array<string>>}
 */
async function handleSingleFileUploads(
  fileList,
  thumbConfig,
  origConfig,
  folderPrefix
) {
  const resultPaths = [];

  for (const file of fileList) {
    // Process original file if config exists
    if (origConfig) {
      const origFileName = buildFileName(file.originalname, null);
      const s3Key = `${folderPrefix}/${Date.now()}-${origFileName}`;
      const origPath = `tmp/original/${origFileName}`;
      await fs.copyFile(file.path, origPath);
      // Upload to S3
      const s3Result = await S3.PutObject({ ...file, path: origPath }, s3Key);
      await fs.unlink(origPath);
      resultPaths.push(s3Result.filename);
      await fs.unlink(file.path);
      continue;
    }

    // Process thumbnail(s)
    if (thumbConfig) {
      let found = false;
      for (const device of ["mobile", "tablet", "desktop"]) {
        if (thumbConfig[device]) {
          const thumbFileName = buildFileName(file.originalname, device);
          const s3Key = `${folderPrefix}/${Date.now()}-${thumbFileName}`;
          const thumbPath = await Thumnail.makeOne(file, thumbConfig[device]);
          const destPath = `tmp/digest/${thumbFileName}`;
          await fs.rename(thumbPath, destPath);
          const s3Result = await S3.PutObject(
            { ...file, path: destPath },
            s3Key
          );
          await fs.unlink(destPath);
          resultPaths.push(s3Result.filename);
          found = true;
        }
      }
      if (found) {
        await fs.unlink(file.path);
        continue;
      }
    }

    // Fallback: just upload original file
    const origFileName = buildFileName(file.originalname, null);
    const s3Key = `${folderPrefix}/${Date.now()}-${origFileName}`;
    const s3Result = await S3.PutObject(file, s3Key);
    resultPaths.push(s3Result.filename);
    await fs.unlink(file.path);
  }

  return resultPaths;
}
