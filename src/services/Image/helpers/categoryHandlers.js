import fs from "fs/promises";
import {
  processDeviceVariant,
  cleanupFiles,
  processOriginalImage,
  processDeviceVariantWithTimestamp,
  processSchoolThumbnailDevice,
  processAllDeviceVariants,
} from "./deviceProcessor.js";
import {
  buildFileName,
  buildResponseFileName,
  extractFilenameParts,
  createResponseObject,
} from "./fileNameBuilder.js";
import Thumnail from "../Thumnail.js";
import S3 from "../../../clients/S3/index.js";

/**
 * Handle school-thumbnail category uploads (returns object format)
 * @param {Array<Express.Multer.File>} fileList
 * @param {object} thumbConfig
 * @param {string|null} folderPrefix - Folder prefix (can be null)
 * @param {string} category - Optional category
 * @returns {Promise<object>} {mobile: [], tablet: [], desktop: []}
 */
export async function handleSchoolThumbnail(
  fileList,
  thumbConfig,
  folderPrefix,
  category = null
) {
  const result = { mobile: [], tablet: [], desktop: [] };
  const processedFiles = new Set();

  // Process each device type
  if (thumbConfig.mobile && Array.isArray(thumbConfig.mobile)) {
    result.mobile = await processSchoolThumbnailDevice(
      fileList,
      thumbConfig.mobile,
      folderPrefix,
      null, // No device suffix for mobile in school-thumbnail
      category,
      processedFiles
    );
  }

  if (thumbConfig.tablet && Array.isArray(thumbConfig.tablet)) {
    result.tablet = await processSchoolThumbnailDevice(
      fileList,
      thumbConfig.tablet,
      folderPrefix,
      null, // No device suffix for tablet in school-thumbnail
      category,
      processedFiles
    );
  }

  if (thumbConfig.desktop && Array.isArray(thumbConfig.desktop)) {
    result.desktop = await processSchoolThumbnailDevice(
      fileList,
      thumbConfig.desktop,
      folderPrefix,
      null, // No device suffix for desktop in school-thumbnail
      category,
      processedFiles
    );
  }

  // Cleanup original files
  await cleanupFiles(processedFiles);
  return result;
}

/**
 * Handle other categories uploads (returns array of objects format)
 * @param {Array<Express.Multer.File>} fileList
 * @param {object} thumbConfig
 * @param {object} origConfig - Original image config
 * @param {string|null} folderPrefix - Folder prefix (can be null)
 * @param {string} category - Optional category
 * @returns {Promise<Array<object>>} Array of {k: key_without_ext, e: ext, c: category}
 */
export async function handleOtherCategories(
  fileList,
  thumbConfig,
  origConfig,
  folderPrefix,
  category = null
) {
  const processedFiles = new Set();
  const responseObjects = [];

  for (const file of fileList) {
    const timestamp = Date.now();
    const { baseName, ext } = extractFilenameParts(file.originalname);

    // Process original image if origConfig exists
    if (origConfig) {
      await processOriginalImage(file, folderPrefix, origConfig, timestamp);
    }

    // Process all device variants
    if (thumbConfig) {
      await processAllDeviceVariants(
        file,
        thumbConfig,
        folderPrefix,
        timestamp,
        baseName,
        ext
      );
    }

    processedFiles.add(file.path);

    // Create response object
    const responseObject = createResponseObject(
      folderPrefix,
      timestamp,
      baseName,
      ext,
      category
    );
    responseObjects.push(responseObject);
  }

  // Cleanup original files
  await cleanupFiles(processedFiles);
  return responseObjects;
}
