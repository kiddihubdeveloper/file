import path from "path";

/**
 * Build filename with device suffix only (no prefix in filename)
 * @param {string} base - Original filename
 * @param {string|null} device - Device type (mobile/tablet/desktop)
 * @returns {string}
 */
export function buildFileName(base, device = null) {
  let ext = path.extname(base); // ".jpg"
  let name = path.basename(base, ext); // "test"
  let suffix = "";
  if (device === "mobile") suffix = "_xs";
  if (device === "tablet") suffix = "_md";
  if (device === "desktop") suffix = "_lg";
  let fileName = name + suffix;
  return `${fileName}${ext}`;
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
