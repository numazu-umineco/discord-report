/**
 * Clean X (Twitter) URL by removing tracking parameters
 * @param {string} url - The URL to clean
 * @returns {string|null} - Cleaned URL or null if invalid
 */
export function cleanXUrl(url) {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    if (!['twitter.com', 'x.com'].includes(urlObj.hostname)) {
      return null;
    }
    urlObj.search = '';
    return urlObj.toString();
  } catch {
    return null;
  }
}
