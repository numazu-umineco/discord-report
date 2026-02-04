import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractStatusId, fetchXPostMetadata, buildXPostEmbed } from './fixupx.js';

describe('fixupx', () => {
  describe('extractStatusId', () => {
    it('should extract status ID from x.com URL', () => {
      expect(extractStatusId('https://x.com/user/status/1234567890123456789'))
        .toBe('1234567890123456789');
    });

    it('should extract status ID from twitter.com URL', () => {
      expect(extractStatusId('https://twitter.com/user/status/123456'))
        .toBe('123456');
    });

    it('should return null for URL without status ID', () => {
      expect(extractStatusId('https://x.com/user')).toBeNull();
    });

    it('should return null for non-X URLs', () => {
      expect(extractStatusId('https://facebook.com/post/123')).toBeNull();
    });

    it('should return null for null input', () => {
      expect(extractStatusId(null)).toBeNull();
    });

    it('should return null for invalid URL', () => {
      expect(extractStatusId('not-a-url')).toBeNull();
    });
  });

  describe('fetchXPostMetadata', () => {
    const sampleApiResponse = {
      code: 200,
      message: 'OK',
      tweet: {
        url: 'https://x.com/example_user/status/1234567890123456789',
        id: '1234567890123456789',
        text: '第10回 サンプル活動報告会🎉\n\n参加者のみなさま\nお集まりありがとうございました！\n#サンプルタグ',
        created_timestamp: 1769825156,
        author: {
          name: 'テスト太郎🐱',
          screen_name: 'example_user',
          avatar_url: 'https://pbs.twimg.com/profile_images/123/avatar_200x200.jpg'
        },
        media: {
          photos: [
            { type: 'photo', url: 'https://pbs.twimg.com/media/img1.jpg?name=orig', width: 3910, height: 3024 }
          ],
          mosaic: {
            type: 'mosaic_photo',
            formats: {
              jpeg: 'https://mosaic.fxtwitter.com/jpeg/1234567890123456789/img1/img2',
              webp: 'https://mosaic.fxtwitter.com/webp/1234567890123456789/img1/img2'
            }
          }
        }
      }
    };

    let originalFetch;

    beforeEach(() => {
      originalFetch = global.fetch;
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should parse metadata from fxtwitter API response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(sampleApiResponse)
      });

      const metadata = await fetchXPostMetadata('https://x.com/example_user/status/1234567890123456789');

      expect(metadata).toEqual({
        title: 'テスト太郎🐱 (@example_user)',
        description: '第10回 サンプル活動報告会🎉\n\n参加者のみなさま\nお集まりありがとうございました！\n#サンプルタグ',
        images: [
          { url: 'https://pbs.twimg.com/media/img1.jpg?name=orig', altText: null }
        ],
        originalUrl: 'https://x.com/example_user/status/1234567890123456789',
        profileImageUrl: 'https://pbs.twimg.com/profile_images/123/avatar_200x200.jpg',
        createdAt: '2026-01-31T02:05:56.000Z'
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.fxtwitter.com/status/1234567890123456789',
        expect.objectContaining({
          signal: expect.any(AbortSignal)
        })
      );
    });

    it('should return single image in images array', async () => {
      const responseWithSinglePhoto = {
        code: 200,
        message: 'OK',
        tweet: {
          ...sampleApiResponse.tweet,
          media: {
            photos: [
              { type: 'photo', url: 'https://pbs.twimg.com/media/single.jpg?name=orig', width: 2048, height: 1536 }
            ]
          }
        }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(responseWithSinglePhoto)
      });

      const metadata = await fetchXPostMetadata('https://x.com/user/status/123');
      expect(metadata.images).toEqual([
        { url: 'https://pbs.twimg.com/media/single.jpg?name=orig', altText: null }
      ]);
    });

    it('should return multiple images with altText', async () => {
      const responseWithMultiplePhotos = {
        code: 200,
        message: 'OK',
        tweet: {
          ...sampleApiResponse.tweet,
          media: {
            photos: [
              { type: 'photo', url: 'https://pbs.twimg.com/media/photo1.jpg?name=orig', width: 1024, height: 539 },
              { type: 'photo', url: 'https://pbs.twimg.com/media/photo2.jpg?name=orig', width: 1536, height: 2048, altText: '集合写真の様子' }
            ],
            mosaic: {
              type: 'mosaic_photo',
              formats: {
                jpeg: 'https://mosaic.fxtwitter.com/jpeg/123/photo1/photo2',
                webp: 'https://mosaic.fxtwitter.com/webp/123/photo1/photo2'
              }
            }
          }
        }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(responseWithMultiplePhotos)
      });

      const metadata = await fetchXPostMetadata('https://x.com/user/status/123');
      expect(metadata.images).toEqual([
        { url: 'https://pbs.twimg.com/media/photo1.jpg?name=orig', altText: null },
        { url: 'https://pbs.twimg.com/media/photo2.jpg?name=orig', altText: '集合写真の様子' }
      ]);
    });

    it('should handle tweet without media', async () => {
      const responseWithoutMedia = {
        code: 200,
        message: 'OK',
        tweet: {
          ...sampleApiResponse.tweet,
          media: undefined
        }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(responseWithoutMedia)
      });

      const metadata = await fetchXPostMetadata('https://x.com/user/status/123');
      expect(metadata).not.toBeNull();
      expect(metadata.images).toEqual([]);
      expect(metadata.description).toBeTruthy();
    });

    it('should preserve newlines in tweet text', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(sampleApiResponse)
      });

      const metadata = await fetchXPostMetadata('https://x.com/example_user/status/1234567890123456789');
      expect(metadata.description).toContain('\n');
    });

    it('should return null for invalid X URL', async () => {
      const metadata = await fetchXPostMetadata('https://facebook.com/post/123');
      expect(metadata).toBeNull();
    });

    it('should return null for null URL', async () => {
      const metadata = await fetchXPostMetadata(null);
      expect(metadata).toBeNull();
    });

    it('should return null on network error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const metadata = await fetchXPostMetadata('https://x.com/user/status/123');
      expect(metadata).toBeNull();
    });

    it('should return null on non-200 HTTP response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404
      });

      const metadata = await fetchXPostMetadata('https://x.com/user/status/123');
      expect(metadata).toBeNull();
    });

    it('should return null when API returns non-200 code', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ code: 404, message: 'Not Found' })
      });

      const metadata = await fetchXPostMetadata('https://x.com/user/status/123');
      expect(metadata).toBeNull();
    });

    it('should return null when tweet has no text and no media', async () => {
      const emptyTweet = {
        code: 200,
        message: 'OK',
        tweet: {
          url: 'https://x.com/user/status/123',
          id: '123',
          text: '',
          author: { name: 'User', screen_name: 'user' }
        }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(emptyTweet)
      });

      const metadata = await fetchXPostMetadata('https://x.com/user/status/123');
      expect(metadata).toBeNull();
    });

    it('should return null createdAt when created_timestamp is missing', async () => {
      const responseWithoutTimestamp = {
        code: 200,
        message: 'OK',
        tweet: {
          ...sampleApiResponse.tweet,
          created_timestamp: undefined
        }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(responseWithoutTimestamp)
      });

      const metadata = await fetchXPostMetadata('https://x.com/user/status/123');
      expect(metadata.createdAt).toBeNull();
    });

    it('should clean tracking parameters from the URL', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(sampleApiResponse)
      });

      await fetchXPostMetadata('https://x.com/user/status/123?s=20&t=abc');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.fxtwitter.com/status/123',
        expect.any(Object)
      );
    });
  });

  describe('buildXPostEmbed', () => {
    const fullMetadata = {
      title: 'テスト太郎🐱 (@example_user)',
      description: '第10回 サンプル活動報告会🎉',
      images: [
        { url: 'https://pbs.twimg.com/media/img1.jpg?name=orig', altText: null }
      ],
      originalUrl: 'https://x.com/example_user/status/123',
      profileImageUrl: 'https://pbs.twimg.com/profile_images/123/avatar.jpg',
      createdAt: '2026-01-31T02:05:56.000Z'
    };

    it('should return array of embeds from full metadata', () => {
      const embeds = buildXPostEmbed(fullMetadata);

      expect(embeds).toHaveLength(1);
      expect(embeds[0]).toEqual({
        color: 0x1D9BF0,
        url: 'https://x.com/example_user/status/123',
        author: {
          name: 'テスト太郎🐱 (@example_user)',
          icon_url: 'https://pbs.twimg.com/profile_images/123/avatar.jpg',
          url: 'https://x.com/example_user/status/123'
        },
        description: '第10回 サンプル活動報告会🎉',
        timestamp: '2026-01-31T02:05:56.000Z',
        image: { url: 'https://pbs.twimg.com/media/img1.jpg?name=orig' }
      });
    });

    it('should return null for null metadata', () => {
      expect(buildXPostEmbed(null)).toBeNull();
    });

    it('should return null when no description and no images', () => {
      expect(buildXPostEmbed({
        title: 'User',
        description: null,
        images: [],
        originalUrl: 'https://x.com/user/status/123',
        profileImageUrl: null
      })).toBeNull();
    });

    it('should build embed without image', () => {
      const embeds = buildXPostEmbed({
        ...fullMetadata,
        images: []
      });

      expect(embeds).toHaveLength(1);
      expect(embeds[0].image).toBeUndefined();
      expect(embeds[0].description).toBe('第10回 サンプル活動報告会🎉');
    });

    it('should build embed without description', () => {
      const embeds = buildXPostEmbed({
        ...fullMetadata,
        description: null
      });

      expect(embeds).toHaveLength(1);
      expect(embeds[0].description).toBeUndefined();
      expect(embeds[0].image).toEqual({ url: fullMetadata.images[0].url });
    });

    it('should build embed without profileImageUrl', () => {
      const embeds = buildXPostEmbed({
        ...fullMetadata,
        profileImageUrl: null
      });

      expect(embeds[0].author.icon_url).toBeUndefined();
    });

    it('should preserve newlines in multiline description', () => {
      const multilineDescription = '#サンプル部活動\nフィールドワーク会を開催しました！\n#テストイベント';
      const embeds = buildXPostEmbed({
        ...fullMetadata,
        description: multilineDescription
      });

      expect(embeds[0].description).toBe(multilineDescription);
      expect(embeds[0].description).toContain('\n');
    });

    it('should truncate long description to 4096 characters', () => {
      const longDescription = 'a'.repeat(5000);
      const embeds = buildXPostEmbed({
        ...fullMetadata,
        description: longDescription
      });

      expect(embeds[0].description.length).toBe(4096);
      expect(embeds[0].description.endsWith('...')).toBe(true);
    });

    it('should not include timestamp when createdAt is null', () => {
      const embeds = buildXPostEmbed({
        ...fullMetadata,
        createdAt: null
      });

      expect(embeds[0].timestamp).toBeUndefined();
    });

    it('should return multiple embeds for multiple images', () => {
      const multiImageMetadata = {
        ...fullMetadata,
        images: [
          { url: 'https://pbs.twimg.com/media/photo1.jpg?name=orig', altText: null },
          { url: 'https://pbs.twimg.com/media/photo2.jpg?name=orig', altText: '集合写真の様子' }
        ]
      };

      const embeds = buildXPostEmbed(multiImageMetadata);

      expect(embeds).toHaveLength(2);

      // First embed has full content
      expect(embeds[0]).toEqual({
        color: 0x1D9BF0,
        url: 'https://x.com/example_user/status/123',
        author: {
          name: 'テスト太郎🐱 (@example_user)',
          icon_url: 'https://pbs.twimg.com/profile_images/123/avatar.jpg',
          url: 'https://x.com/example_user/status/123'
        },
        description: '第10回 サンプル活動報告会🎉',
        timestamp: '2026-01-31T02:05:56.000Z',
        image: { url: 'https://pbs.twimg.com/media/photo1.jpg?name=orig' }
      });

      // Second embed has only image and shared url for gallery display
      expect(embeds[1]).toEqual({
        color: 0x1D9BF0,
        url: 'https://x.com/example_user/status/123',
        image: { url: 'https://pbs.twimg.com/media/photo2.jpg?name=orig' }
      });
    });

    it('should share the same url across all embeds for Discord gallery', () => {
      const multiImageMetadata = {
        ...fullMetadata,
        images: [
          { url: 'https://pbs.twimg.com/media/photo1.jpg?name=orig', altText: null },
          { url: 'https://pbs.twimg.com/media/photo2.jpg?name=orig', altText: null },
          { url: 'https://pbs.twimg.com/media/photo3.jpg?name=orig', altText: 'テスト画像' }
        ]
      };

      const embeds = buildXPostEmbed(multiImageMetadata);

      expect(embeds).toHaveLength(3);
      embeds.forEach(embed => {
        expect(embed.url).toBe('https://x.com/example_user/status/123');
      });
    });
  });
});
