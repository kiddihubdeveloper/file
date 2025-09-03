/**
 * Prefix configuration for uploads
 * Defines allowed prefixes for organizing files
 */
export const UPLOAD_PREFIXES = [
  "default",
  "1",
  "tieu-chi",
  "news",
  "avatars",
  "user",
  "avatar-review",
];

export const DEFAULT_PREFIX = "images";

/**
 * Validate if prefix is allowed
 * @param {string} prefix
 * @returns {boolean}
 */
export function isValidPrefix(prefix) {
  return UPLOAD_PREFIXES.includes(prefix);
}

/**
 * Get validated prefix or default
 * @param {string|null} prefix
 * @returns {string}
 */
export function getValidatedPrefix(prefix) {
  if (!prefix) return DEFAULT_PREFIX;
  return isValidPrefix(prefix) ? prefix : DEFAULT_PREFIX;
}
