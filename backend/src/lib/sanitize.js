// Discord embed sanitization utilities

/**
 * Escape Discord mentions (@everyone, @here, user mentions, role mentions)
 * @param {string} text - Input text
 * @returns {string} - Text with mentions escaped
 */
export function escapeMentions(text) {
  if (!text) return text;

  return text
    // Escape @everyone and @here
    .replace(/@(everyone|here)/gi, '@\u200B$1')
    // Escape user mentions <@123456789> and <@!123456789>
    .replace(/<@!?(\d+)>/g, '<@\u200B$1>')
    // Escape role mentions <@&123456789>
    .replace(/<@&(\d+)>/g, '<@\u200B&$1>');
}

/**
 * Escape Discord markdown characters
 * @param {string} text - Input text
 * @returns {string} - Text with markdown escaped
 */
export function escapeMarkdown(text) {
  if (!text) return text;

  // Escape markdown characters: * _ ~ ` | \ > #
  return text.replace(/([*_~`|\\>#])/g, '\\$1');
}

/**
 * Truncate text to a maximum length, adding ellipsis if truncated
 * @param {string} text - Input text
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
export function truncate(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '…';
}

// Discord embed field limits
export const EMBED_LIMITS = {
  title: 256,
  description: 4096,
  fieldName: 256,
  fieldValue: 1024,
  footerText: 2048,
  authorName: 256,
  total: 6000
};

/**
 * Sanitize text for Discord embed title
 * - Escapes mentions
 * - Escapes markdown
 * - Truncates to Discord limit (256 chars)
 * @param {string} text - Input text
 * @returns {string} - Sanitized text
 */
export function sanitizeTitle(text) {
  if (!text) return text;

  let sanitized = escapeMentions(text);
  sanitized = escapeMarkdown(sanitized);
  sanitized = truncate(sanitized, EMBED_LIMITS.title);

  return sanitized;
}

/**
 * Sanitize text for Discord embed field value
 * - Escapes mentions
 * - Preserves markdown (users may want formatting)
 * - Truncates to Discord limit (1024 chars)
 * @param {string} text - Input text
 * @returns {string} - Sanitized text
 */
export function sanitizeFieldValue(text) {
  if (!text) return text;

  let sanitized = escapeMentions(text);
  sanitized = truncate(sanitized, EMBED_LIMITS.fieldValue);

  return sanitized;
}
