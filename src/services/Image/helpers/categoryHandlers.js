import fs from "fs/promises";
import { processDeviceVariant, cleanupFiles } from "./deviceProcessor.js";
import { buildFileName, buildResponseFileName } from "./fileNameBuilder.js";
import Thumnail from "../Thumnail.js";
import S3 from "../../../clients/S3/index.js";

/**
 * Process original file with size constraints
 * @param {Express.Multer.File} file
 * @param {string} folderPrefix - Folder prefix for S3 storage
 * @param {object} origConfig - Original image config {max_width, max_height}
 * @param {number} timestamp - Specific timestamp to use
 * @returns {Promise<string>} S3 result filename
 */
async function processOriginalImage(file, folderPrefix, origConfig, timestamp) {
  const origFileName = buildFileName(file.originalname, null);
  const s3Key = `${folderPrefix}/${timestamp}-${origFileName}`;
  const destDir = `tmp/digest/${folderPrefix}`;
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
 * @param {string} folderPrefix - Folder prefix for S3 storage
 * @param {string|null} device - mobile/tablet/desktop or null for no suffix
 * @param {object} size - {width, height}
 * @param {number} timestamp - Specific timestamp to use
 * @returns {Promise<string>} S3 result filename
 */
async function processDeviceVariantWithTimestamp(
  file,
  folderPrefix,
  device,
  size,
  timestamp
) {
  const thumbFileName = buildFileName(file.originalname, device);
  const s3Key = `${folderPrefix}/${timestamp}-${thumbFileName}`;
  const destDir = `tmp/digest/${folderPrefix}`;
  await fs.mkdir(destDir, { recursive: true });
  const destPath = `${destDir}/${thumbFileName}`;
  const thumbPath = await Thumnail.makeOne(file, size);
  await fs.rename(thumbPath, destPath);
  const s3Result = await S3.PutObject({ ...file, path: destPath }, s3Key);
  await fs.unlink(destPath);
  return s3Result.filename;
}

/**
 * Handle school-thumbnail category uploads (returns object format)
 * @param {Array<Express.Multer.File>} fileList
 * @param {object} thumbConfig
 * @param {string} folderPrefix
 * @returns {Promise<object>} {mobile: [], tablet: [], desktop: []}
 */
export async function handleSchoolThumbnail(
  fileList,
  thumbConfig,
  folderPrefix
) {
  const result = { mobile: [], tablet: [], desktop: [] };

  // Process MOBILE
  if (thumbConfig.mobile && Array.isArray(thumbConfig.mobile)) {
    const count = Math.min(fileList.length, thumbConfig.mobile.length);
    for (let fileIndex = 0; fileIndex < count; fileIndex++) {
      const file = fileList[fileIndex];
      const size = thumbConfig.mobile[fileIndex];
      const timestamp = Date.now();
      // Upload with device suffix but return clean filename
      const s3Filename = await processDeviceVariantWithTimestamp(
        file,
        folderPrefix,
        null,
        size,
        timestamp
      );
      // Return clean filename without device suffix
      const cleanFileName = buildFileName(file.originalname, null);
      const responseFilename = `${folderPrefix}/${timestamp}-${cleanFileName}`;
      result.mobile.push(s3Filename);
    }
  }

  // Process TABLET
  if (thumbConfig.tablet && Array.isArray(thumbConfig.tablet)) {
    const count = Math.min(fileList.length, thumbConfig.tablet.length);
    for (let fileIndex = 0; fileIndex < count; fileIndex++) {
      const file = fileList[fileIndex];
      const size = thumbConfig.tablet[fileIndex];
      const timestamp = Date.now();
      // Upload with device suffix but return clean filename
      const s3Filename = await processDeviceVariantWithTimestamp(
        file,
        folderPrefix,
        null,
        size,
        timestamp
      );
      // Return clean filename without device suffix
      const cleanFileName = buildFileName(file.originalname, null);
      const responseFilename = `${folderPrefix}/${timestamp}-${cleanFileName}`;
      result.tablet.push(s3Filename);
    }
  }

  // Process DESKTOP (no device suffix for school-thumbnail desktop)
  if (thumbConfig.desktop && Array.isArray(thumbConfig.desktop)) {
    const count = Math.min(fileList.length, thumbConfig.desktop.length);
    for (let fileIndex = 0; fileIndex < count; fileIndex++) {
      const file = fileList[fileIndex];
      const size = thumbConfig.desktop[fileIndex];
      const timestamp = Date.now();
      // Use null for device to avoid adding suffix for desktop school-thumbnail
      const s3Filename = await processDeviceVariantWithTimestamp(
        file,
        folderPrefix,
        null,
        size,
        timestamp
      );
      // Return actual S3 filename for desktop (no device suffix)
      result.desktop.push(s3Filename);
    }
  }

  // Cleanup original files
  const filePaths = new Set(fileList.map((f) => f.path));
  await cleanupFiles(filePaths);

  return result;
}

/**
 * Handle other categories uploads (returns array format)
 * @param {Array<Express.Multer.File>} fileList
 * @param {object} thumbConfig
 * @param {object} origConfig - Original image config
 * @param {string} folderPrefix
 * @returns {Promise<Array<string>>}
 */
export async function handleOtherCategories(
  fileList,
  thumbConfig,
  origConfig,
  folderPrefix
) {
  const processedFiles = new Set();
  const responseFilenames = [];

  // Process each file
  for (const file of fileList) {
    // Generate one timestamp per file
    const timestamp = Date.now();

    // Process original image if origConfig exists
    if (origConfig) {
      await processOriginalImage(file, folderPrefix, origConfig, timestamp);
    }

    // Process thumbnails for each device type
    if (thumbConfig) {
      if (thumbConfig.mobile) {
        // MOBILE
        const size = Array.isArray(thumbConfig.mobile)
          ? thumbConfig.mobile[0]
          : thumbConfig.mobile;
        await processDeviceVariantWithTimestamp(
          file,
          folderPrefix,
          "mobile",
          size,
          timestamp
        );
      }

      // TABLET
      if (thumbConfig.tablet) {
        const size = Array.isArray(thumbConfig.tablet)
          ? thumbConfig.tablet[0]
          : thumbConfig.tablet;
        await processDeviceVariantWithTimestamp(
          file,
          folderPrefix,
          "tablet",
          size,
          timestamp
        );
      }

      // DESKTOP
      if (thumbConfig.desktop) {
        const size = Array.isArray(thumbConfig.desktop)
          ? thumbConfig.desktop[0]
          : thumbConfig.desktop;
        await processDeviceVariantWithTimestamp(
          file,
          folderPrefix,
          "desktop",
          size,
          timestamp
        );
      }
    }
    processedFiles.add(file.path);

    // Create response filename without device suffix but with actual timestamp
    const cleanFileName = buildFileName(file.originalname, null);
    const responseFilename = `${folderPrefix}/${timestamp}-${cleanFileName}`;
    responseFilenames.push(responseFilename);
  }

  // Cleanup original files
  await cleanupFiles(processedFiles);

  return responseFilenames;
}
