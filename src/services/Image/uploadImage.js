import fs from "fs/promises";
import imagesConfig from "../../config/images.js";
import Thumnail from "./Thumnail.js";
import S3 from "../../clients/S3/index.js";
import {
  buildFileName,
  buildResponseFileName,
  extractFilenameParts,
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
 * @returns {Promise<Array<object>|object>} Array of {k, e, c?} or school-thumbnail object format
 */
export default async function uploadImage(files, category, prefix = null) {
  const isArray = Array.isArray(files);
  const fileList = isArray ? files : [files];

  // Get validated prefix for folder structure
  const folderPrefix = getValidatedPrefix(prefix);

  // Check config for category
  const thumbConfig = imagesConfig.thumbnails[category];
  const origConfig = imagesConfig.original[category];

  // Handle array uploads with thumbnail processing or original processing
  if (isArray && (thumbConfig || origConfig)) {
    // Special case for school-thumbnail: return object with device types
    if (category === "school-thumbnail") {
      return await handleSchoolThumbnail(
        fileList,
        thumbConfig,
        folderPrefix,
        category
      );
    }

    // Other categories: process each file for each device, return flat array
    return await handleOtherCategories(
      fileList,
      thumbConfig,
      origConfig,
      folderPrefix,
      category
    );
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
 * @param {string|null} folderPrefix - Folder prefix (can be null)
 * @returns {Promise<Array<object>>} Array of {k, e, c?}
 */
async function handleSingleFileUploads(
  fileList,
  thumbConfig,
  origConfig,
  folderPrefix
) {
  const responseObjects = [];

  for (const file of fileList) {
    const timestamp = Date.now();
    const { baseName, ext } = extractFilenameParts(file.originalname);

    // Process original file if config exists
    if (origConfig) {
      const origFileName = buildFileName(baseName, ext, null);
      const s3Key = folderPrefix
        ? `${folderPrefix}/${timestamp}-${origFileName}`
        : `${timestamp}-${origFileName}`;
      const origPath = `tmp/original/${origFileName}`;
      await fs.copyFile(file.path, origPath);
      // Upload to S3
      await S3.PutObject({ ...file, path: origPath }, s3Key);
      await fs.unlink(origPath);
      await fs.unlink(file.path);

      // Create response object
      const responseObject = {
        k: folderPrefix
          ? `${folderPrefix}/${timestamp}-${baseName}`
          : `${timestamp}-${baseName}`,
        e: `.${ext}`,
      };
      responseObjects.push(responseObject);
      continue;
    }

    // Process thumbnail(s)
    if (thumbConfig) {
      let found = false;
      for (const device of ["mobile", "tablet", "desktop"]) {
        if (thumbConfig[device]) {
          const deviceSuffix =
            device === "mobile" ? "xs" : device === "tablet" ? "md" : "lg";
          const thumbFileName = buildFileName(baseName, ext, deviceSuffix);
          const s3Key = folderPrefix
            ? `${folderPrefix}/${timestamp}-${thumbFileName}`
            : `${timestamp}-${thumbFileName}`;
          const thumbPath = await Thumnail.makeOne(file, thumbConfig[device]);
          const destPath = `tmp/digest/${thumbFileName}`;
          await fs.rename(thumbPath, destPath);
          await S3.PutObject({ ...file, path: destPath }, s3Key);
          await fs.unlink(destPath);

          // Create response object for this device variant
          const responseObject = {
            k: folderPrefix
              ? `${folderPrefix}/${timestamp}-${baseName}_${deviceSuffix}`
              : `${timestamp}-${baseName}_${deviceSuffix}`,
            e: `.${ext}`,
          };
          responseObjects.push(responseObject);
          found = true;
        }
      }
      if (found) {
        await fs.unlink(file.path);
        continue;
      }
    }

    // Fallback: just upload original file
    const origFileName = buildFileName(baseName, ext, null);
    const s3Key = folderPrefix
      ? `${folderPrefix}/${timestamp}-${origFileName}`
      : `${timestamp}-${origFileName}`;
    await S3.PutObject(file, s3Key);
    await fs.unlink(file.path);

    // Create response object for fallback
    const responseObject = {
      k: folderPrefix
        ? `${folderPrefix}/${timestamp}-${baseName}`
        : `${timestamp}-${baseName}`,
      e: `.${ext}`,
    };
    responseObjects.push(responseObject);
  }

  return responseObjects;
}
