import fs from "fs/promises";
import Thumnail from "../Thumnail.js";
import S3 from "../../../clients/S3/index.js";
import {
  buildFileName,
  extractFilenameParts,
  createResponseObject,
} from "./fileNameBuilder.js";

/**
 * Process original file with size constraints
 * @param {Express.Multer.File} file
 * @param {string|null} folderPrefix - Folder prefix for S3 storage (can be null)
 * @param {object} origConfig - Original image config {max_width, max_height}
 * @param {number} timestamp - Specific timestamp to use
 * @returns {Promise<string>} S3 result filename
 */
export async function processOriginalImage(
  file,
  folderPrefix,
  origConfig,
  timestamp
) {
  const { baseName, ext } = extractFilenameParts(file.originalname);
  const origFileName = buildFileName(baseName, ext, null);
  const s3Key = folderPrefix
    ? `${folderPrefix}/${timestamp}-${origFileName}`
    : `${timestamp}-${origFileName}`;
  const destDir = folderPrefix ? `tmp/digest/${folderPrefix}` : `tmp/digest`;
  await fs.mkdir(destDir, { recursive: true });
  const destPath = `${destDir}/${origFileName}`;

  // Process image with size constraints
  const processedPath = await Thumnail.makeOne(file, origConfig);
  await fs.rename(processedPath, destPath);

  const s3Result = await S3.PutObject({ ...file, path: destPath }, s3Key);
  await fs.unlink(destPath);
  return s3Result.filename;
}

/**
 * Process single file for one device type with specific timestamp
 * @param {Express.Multer.File} file
 * @param {string|null} folderPrefix - Folder prefix for S3 storage (can be null)
 * @param {string|null} device - xs/md/lg or null for no suffix
 * @param {object} size - {width, height}
 * @param {number} timestamp - Specific timestamp to use
 * @param {string} baseName - Base filename without extension
 * @param {string} ext - File extension
 * @returns {Promise<void>} Uploads to S3 but returns nothing
 */
export async function processDeviceVariantWithTimestamp(
  file,
  folderPrefix,
  device,
  size,
  timestamp,
  baseName,
  ext
) {
  // Build filename using precomputed parts
  const thumbFileName = device
    ? `${baseName}_${device}.${ext}`
    : `${baseName}.${ext}`;
  const s3Key = folderPrefix
    ? `${folderPrefix}/${timestamp}-${thumbFileName}`
    : `${timestamp}-${thumbFileName}`;
  const destDir = folderPrefix ? `tmp/digest/${folderPrefix}` : `tmp/digest`;
  await fs.mkdir(destDir, { recursive: true });
  const destPath = `${destDir}/${thumbFileName}`;
  const thumbPath = await Thumnail.makeOne(file, size);
  await fs.rename(thumbPath, destPath);
  await S3.PutObject({ ...file, path: destPath }, s3Key);
  await fs.unlink(destPath);
}

/**
 * Process school thumbnail for a specific device type
 * @param {Array<Express.Multer.File>} fileList
 * @param {Array} deviceConfig - Size configuration for device
 * @param {string|null} folderPrefix - Folder prefix (can be null)
 * @param {string|null} device - Device suffix (null for no suffix)
 * @param {string|null} category
 * @param {Set} processedFiles - Set to track processed files
 * @returns {Promise<Array>} Array of response objects
 */
export async function processSchoolThumbnailDevice(
  fileList,
  deviceConfig,
  folderPrefix,
  device,
  category,
  processedFiles
) {
  const results = [];
  const count = Math.min(fileList.length, deviceConfig.length);

  for (let fileIndex = 0; fileIndex < count; fileIndex++) {
    const file = fileList[fileIndex];
    const size = deviceConfig[fileIndex];
    const timestamp = Date.now();
    const { baseName, ext } = extractFilenameParts(file.originalname);

    // Process and upload
    await processDeviceVariantWithTimestamp(
      file,
      folderPrefix,
      device,
      size,
      timestamp,
      baseName,
      ext
    );

    // Create response object
    const responseObject = createResponseObject(
      folderPrefix,
      timestamp,
      baseName,
      ext,
      category
    );
    results.push(responseObject);
    processedFiles.add(file.path);
  }

  return results;
}

/**
 * Process all device variants for a single file
 * @param {Express.Multer.File} file
 * @param {object} thumbConfig
 * @param {string} folderPrefix
 * @param {number} timestamp
 * @param {string} baseName
 * @param {string} ext
 * @returns {Promise<void>}
 */
export async function processAllDeviceVariants(
  file,
  thumbConfig,
  folderPrefix,
  timestamp,
  baseName,
  ext
) {
  const deviceMappings = [
    { configKey: "mobile", deviceSuffix: "xs" },
    { configKey: "tablet", deviceSuffix: "md" },
    { configKey: "desktop", deviceSuffix: "lg" },
  ];

  for (const { configKey, deviceSuffix } of deviceMappings) {
    if (thumbConfig[configKey]) {
      const size = Array.isArray(thumbConfig[configKey])
        ? thumbConfig[configKey][0]
        : thumbConfig[configKey];

      await processDeviceVariantWithTimestamp(
        file,
        folderPrefix,
        deviceSuffix,
        size,
        timestamp,
        baseName,
        ext
      );
    }
  }
}

/**
 * Process single file for one device type
 * @param {Express.Multer.File} file
 * @param {string|null} folderPrefix - Folder prefix for S3 storage (can be null)
 * @param {string|null} device - mobile/tablet/desktop or null for no suffix
 * @param {object} size - {width, height}
 * @returns {Promise<string>} S3 result filename
 */
export async function processDeviceVariant(file, folderPrefix, device, size) {
  const { baseName, ext } = extractFilenameParts(file.originalname);
  const thumbFileName = buildFileName(baseName, ext, device);
  const s3Key = folderPrefix
    ? `${folderPrefix}/${Date.now()}-${thumbFileName}`
    : `${Date.now()}-${thumbFileName}`;
  const destDir = folderPrefix ? `tmp/digest/${folderPrefix}` : `tmp/digest`;
  await fs.mkdir(destDir, { recursive: true });
  const destPath = `${destDir}/${thumbFileName}`;
  const thumbPath = await Thumnail.makeOne(file, size);
  await fs.rename(thumbPath, destPath);
  const s3Result = await S3.PutObject({ ...file, path: destPath }, s3Key);
  await fs.unlink(destPath);
  return s3Result.filename;
}

/**
 * Clean up original uploaded files
 * @param {Set<string>} filePaths
 */
export async function cleanupFiles(filePaths) {
  for (const filePath of filePaths) {
    try {
      await fs.unlink(filePath);
    } catch {}
  }
}
