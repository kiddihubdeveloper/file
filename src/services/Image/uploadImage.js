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
 * @param {boolean} [checkPrefix] - Whether to validate prefix
 * @param {boolean} [addTimestamp] - Whether to add timestamp to file keys
 * @returns {Promise<Array<object>|object>} Array of {k, e, c?} or school-thumbnail object format
 */
export default async function uploadImage(
  files,
  category,
  prefix = null,
  checkPrefix = false,
  addTimestamp = true
) {
  const isArray = Array.isArray(files);
  const fileList = isArray ? files : [files];

  // Ensure base tmp directory exists first
  await fs.mkdir("tmp", { recursive: true });

  // Get validated prefix for folder structure
  const folderPrefix = getValidatedPrefix(prefix, checkPrefix);

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
        category,
        addTimestamp
      );
    }

    // Other categories: process each file for each device, return flat array
    return await handleOtherCategories(
      fileList,
      thumbConfig,
      origConfig,
      folderPrefix,
      category,
      addTimestamp
    );
  }

  // Handle single file or non-thumbnail uploads
  return await handleSingleFileUploads(
    fileList,
    thumbConfig,
    origConfig,
    folderPrefix,
    addTimestamp
  );
}

/**
 * Handle single file uploads and fallback cases
 * @param {Array<Express.Multer.File>} fileList
 * @param {object} thumbConfig
 * @param {object} origConfig
 * @param {string|null} folderPrefix - Folder prefix (can be null)
 * @param {boolean} addTimestamp - Whether to add timestamp to file keys
 * @returns {Promise<Array<object>>} Array of {k, e, c?}
 */
async function handleSingleFileUploads(
  fileList,
  thumbConfig,
  origConfig,
  folderPrefix,
  addTimestamp = true
) {
  const responseObjects = [];

  for (const file of fileList) {
    // Ensure the directory containing the file exists
    const path = await import("path");
    const fileDir = path.dirname(file.path);

    await fs.mkdir(fileDir, { recursive: true });

    const timestamp = Date.now();
    const { baseName, ext } = extractFilenameParts(file.originalname);

    // Process original file if config exists
    if (origConfig) {
      const origFileName = buildFileName(baseName, ext, null);
      const s3Key = addTimestamp
        ? folderPrefix
          ? `${folderPrefix}/${timestamp}-${origFileName}`
          : `${timestamp}-${origFileName}`
        : folderPrefix
        ? `${folderPrefix}/${origFileName}`
        : origFileName;
      const origPath = `tmp/original/${origFileName}`;
      console.log(origPath);

      // Ensure tmp/original directory exists
      await fs.mkdir("tmp/original", { recursive: true });

      await fs.copyFile(file.path, origPath);
      // Upload to S3
      await S3.PutObject({ ...file, path: origPath }, s3Key);
      await fs.unlink(origPath);
      await fs.unlink(file.path);

      // Create response object
      const responseObject = {
        k: addTimestamp
          ? folderPrefix
            ? `${folderPrefix}/${timestamp}-${baseName}`
            : `${timestamp}-${baseName}`
          : folderPrefix
          ? `${folderPrefix}/${baseName}`
          : baseName,
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
          const s3Key = addTimestamp
            ? folderPrefix
              ? `${folderPrefix}/${timestamp}-${thumbFileName}`
              : `${timestamp}-${thumbFileName}`
            : folderPrefix
            ? `${folderPrefix}/${thumbFileName}`
            : thumbFileName;
          const thumbPath = await Thumnail.makeOne(file, thumbConfig[device]);
          const destPath = `tmp/digest/${thumbFileName}`;

          // Ensure tmp/digest directory exists
          await fs.mkdir("tmp/digest", { recursive: true });

          await fs.rename(thumbPath, destPath);
          await S3.PutObject({ ...file, path: destPath }, s3Key);
          await fs.unlink(destPath);

          // Create response object for this device variant
          const responseObject = {
            k: addTimestamp
              ? folderPrefix
                ? `${folderPrefix}/${timestamp}-${baseName}_${deviceSuffix}`
                : `${timestamp}-${baseName}_${deviceSuffix}`
              : folderPrefix
              ? `${folderPrefix}/${baseName}_${deviceSuffix}`
              : `${baseName}_${deviceSuffix}`,
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
    const s3Key = addTimestamp
      ? folderPrefix
        ? `${folderPrefix}/${timestamp}-${origFileName}`
        : `${timestamp}-${origFileName}`
      : folderPrefix
      ? `${folderPrefix}/${origFileName}`
      : origFileName;
    await S3.PutObject(file, s3Key);
    await fs.unlink(file.path);

    // Create response object for fallback
    const responseObject = {
      k: addTimestamp
        ? folderPrefix
          ? `${folderPrefix}/${timestamp}-${baseName}`
          : `${timestamp}-${baseName}`
        : folderPrefix
        ? `${folderPrefix}/${baseName}`
        : baseName,
      e: `.${ext}`,
    };
    responseObjects.push(responseObject);
  }

  return responseObjects;
}
