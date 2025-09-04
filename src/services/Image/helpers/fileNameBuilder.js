import path from "path";

/**
 * Extract filename parts from original filename
 * @param {string} originalname - Original filename
 * @returns {object} {baseName, ext}
 */
export function extractFilenameParts(originalname) {
  const lastDot = originalname.lastIndexOf(".");
  const baseName =
    lastDot !== -1 ? originalname.substring(0, lastDot) : originalname;
  const ext = lastDot !== -1 ? originalname.substring(lastDot + 1) : "";
  return { baseName, ext };
}

/**
 * Create response object for API
 * @param {string|null} folderPrefix - Folder prefix (can be null)
 * @param {number} timestamp - Timestamp
 * @param {string} baseName - Base filename
 * @param {string} ext - File extension
 * @param {string|null} category - Optional category
 * @returns {object} {k, e, c?}
 */
export function createResponseObject(
  folderPrefix,
  timestamp,
  baseName,
  ext,
  category = null
) {
  const keyPath = folderPrefix
    ? `${folderPrefix}/${timestamp}-${baseName}`
    : `${timestamp}-${baseName}`;

  const responseObject = {
    k: keyPath,
    e: `.${ext}`,
  };

  if (category) {
    responseObject.c = category;
  }

  return responseObject;
}

/**
 * Build filename with device suffix
 * @param {string} baseName - Base filename without extension
 * @param {string} ext - File extension (without dot)
 * @param {string|null} device - Device type (xs/md/lg)
 * @returns {string}
 */
export function buildFileName(baseName, ext, device = null) {
  const suffix = device ? `_${device}` : "";
  return `${baseName}${suffix}.${ext}`;
}

/**
 * Build response filename format for client
 * @param {string} base - Original filename
 * @param {string} folderPrefix - Folder prefix for response
 * @returns {string}
 */
export function buildResponseFileName(base, folderPrefix) {
  let ext = path.extname(base); // ".jpg"
  let name = path.basename(base, ext); // "test"
  return `${folderPrefix}/${Date.now()}-${name}${ext}`;
}
