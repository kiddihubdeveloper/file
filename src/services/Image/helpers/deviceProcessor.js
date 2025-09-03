import fs from "fs/promises";
import Thumnail from "../Thumnail.js";
import S3 from "../../../clients/S3/index.js";
import { buildFileName } from "./fileNameBuilder.js";

/**
 * Process single file for one device type
 * @param {Express.Multer.File} file
 * @param {string} folderPrefix - Folder prefix for S3 storage
 * @param {string|null} device - mobile/tablet/desktop or null for no suffix
 * @param {object} size - {width, height}
 * @returns {Promise<string>} S3 result filename
 */
export async function processDeviceVariant(file, folderPrefix, device, size) {
  const thumbFileName = buildFileName(file.originalname, device);
  const s3Key = `${folderPrefix}/${Date.now()}-${thumbFileName}`;
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
