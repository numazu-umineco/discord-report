import { cleanXUrl } from './url.js';

const FXTWITTER_API_BASE = 'https://api.fxtwitter.com/status';

/**
 * Extract status ID from an X/Twitter URL
 * @param {string} url - X/Twitter URL
 * @returns {string|null} - Status ID or null if invalid
 */
export function extractStatusId(url) {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    if (!['x.com', 'twitter.com'].includes(urlObj.hostname)) return null;
    const match = urlObj.pathname.match(/\/status\/(\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Fetch X post metadata via fxtwitter API
 * @param {string} xUrl - Original X/Twitter URL (will be cleaned)
 * @returns {Promise<object|null>} - Metadata object or null on failure
 */
export async function fetchXPostMetadata(xUrl) {
  const cleanedUrl = cleanXUrl(xUrl);
  if (!cleanedUrl) return null;

  const statusId = extractStatusId(cleanedUrl);
  if (!statusId) return null;

  try {
    const response = await fetch(`${FXTWITTER_API_BASE}/${statusId}`, {
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) return null;

    const data = await response.json();

    if (data.code !== 200 || !data.tweet) return null;

    const tweet = data.tweet;
    const text = tweet.text || null;
    const images = getImages(tweet);

    if (!text && images.length === 0) return null;

    return {
      title: formatAuthorTitle(tweet.author),
      description: text,
      images,
      originalUrl: tweet.url || null,
      profileImageUrl: tweet.author?.avatar_url || null,
      createdAt: tweet.created_timestamp
        ? new Date(tweet.created_timestamp * 1000).toISOString()
        : null
    };
  } catch (error) {
    console.warn('Failed to fetch fxtwitter metadata:', error.message);
    return null;
  }
}

/**
 * Format author display title
 * @param {object} author - Author object from API
 * @returns {string|null}
 */
function formatAuthorTitle(author) {
  if (!author) return null;
  if (author.name && author.screen_name) {
    return `${author.name} (@${author.screen_name})`;
  }
  return author.name || null;
}

/**
 * Get all photo images from tweet media
 * @param {object} tweet - Tweet object from API
 * @returns {Array<{url: string, altText: string|null}>}
 */
function getImages(tweet) {
  if (!tweet.media?.photos?.length) return [];

  return tweet.media.photos.map(photo => ({
    url: photo.url,
    altText: photo.altText || null
  }));
}

/**
 * Build Discord embed objects from X post metadata
 * Returns multiple embeds when there are multiple images (Discord gallery display)
 * @param {object|null} metadata - Metadata from fetchXPostMetadata
 * @returns {Array<object>|null} - Array of Discord embed objects or null
 */
export function buildXPostEmbed(metadata) {
  if (!metadata) return null;

  const hasImages = metadata.images?.length > 0;
  if (!metadata.description && !hasImages) return null;

  const firstEmbed = {
    color: 0x1D9BF0
  };

  if (metadata.originalUrl) {
    firstEmbed.url = metadata.originalUrl;
  }

  if (metadata.title) {
    firstEmbed.author = {
      name: metadata.title,
      ...(metadata.profileImageUrl && { icon_url: metadata.profileImageUrl }),
      ...(metadata.originalUrl && { url: metadata.originalUrl })
    };
  }

  if (metadata.description) {
    firstEmbed.description = metadata.description.length > 4096
      ? metadata.description.slice(0, 4093) + '...'
      : metadata.description;
  }

  if (metadata.createdAt) {
    firstEmbed.timestamp = metadata.createdAt;
  }

  if (hasImages) {
    firstEmbed.image = { url: metadata.images[0].url };
  }

  const embeds = [firstEmbed];

  // Additional embeds for remaining images (Discord gallery)
  for (let i = 1; i < metadata.images.length; i++) {
    embeds.push({
      color: 0x1D9BF0,
      url: metadata.originalUrl,
      image: { url: metadata.images[i].url }
    });
  }

  return embeds;
}
