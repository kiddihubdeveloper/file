import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import uploadImage from "./uploadImage.js";

/**
 * Download image from URL and save to temporary file
 * @param {string} url - Image URL
 * @param {string} tempDir - Temporary directory path
 * @returns {Promise<Object>} - File object similar to multer file
 */
async function downloadImageFromUrl(url, tempDir) {
  try {
    // Validate URL format
    let validUrl;
    try {
      validUrl = new URL(url);
    } catch (urlError) {
      throw new Error(`Invalid URL format: ${url}`);
    }

    // Check if URL is HTTP/HTTPS
    if (!["http:", "https:"].includes(validUrl.protocol)) {
      throw new Error(`URL must use HTTP or HTTPS protocol: ${url}`);
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "ImageTransfer/1.0",
      },
      timeout: 30000, // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(
        `Failed to download image from ${url}: ${response.status} ${response.statusText}`
      );
    }

    // Check content type
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      console.warn(
        `Warning: Content-Type is not image/* for URL: ${url} (got: ${contentType})`
      );
    }

    const buffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    // Extract filename from URL or generate one
    const urlPath = validUrl.pathname;
    const originalname = path.basename(urlPath) || `image_${Date.now()}.jpg`;

    // Ensure we have an extension
    const ext = path.extname(originalname) || ".jpg";
    const nameWithoutExt =
      path.basename(originalname, path.extname(originalname)) ||
      `image_${Date.now()}`;
    const finalFilename = nameWithoutExt + ext;

    // Create temp file path
    const tempFilePath = path.join(tempDir, finalFilename);

    // Write file to temp directory
    await fs.writeFile(tempFilePath, uint8Array);

    // Get file stats
    const stats = await fs.stat(tempFilePath);

    // Create file object similar to multer file
    const fileObject = {
      fieldname: "files",
      originalname: finalFilename,
      encoding: "7bit",
      mimetype: contentType || "image/jpeg",
      path: tempFilePath,
      size: stats.size,
      buffer: uint8Array,
    };

    return fileObject;
  } catch (error) {
    throw new Error(`Failed to download image from ${url}: ${error.message}`);
  }
}

/**
 * Transfer images from URLs to S3 using existing upload logic
 * @param {Array<string>} urls - Array of image URLs
 * @param {string} category - Upload category
 * @param {string} [prefix] - Optional prefix
 * @returns {Promise<Array<string>|object>} - Upload result
 */
export default async function transferUrl(urls, category, prefix = null) {
  if (!Array.isArray(urls) || urls.length === 0) {
    throw new Error("URLs array is required and cannot be empty");
  }

  // Create temporary directory for downloads
  const tempDir = `tmp/downloads/${Date.now()}`;
  await fs.mkdir(tempDir, { recursive: true });

  try {
    // Download all images to temporary files
    const downloadPromises = urls.map((url) =>
      downloadImageFromUrl(url, tempDir)
    );
    const files = await Promise.all(downloadPromises);

    // Use existing uploadImage service with downloaded files
    const result = await uploadImage(files, category, prefix);

    return result;
  } catch (error) {
    throw error;
  } finally {
    // Cleanup temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.warn(
        `Failed to cleanup temp directory ${tempDir}:`,
        cleanupError.message
      );
    }
  }
}
