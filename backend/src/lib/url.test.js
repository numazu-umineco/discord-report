import { describe, it, expect } from 'vitest';
import { cleanXUrl } from './url.js';

describe('cleanXUrl', () => {
  describe('valid X/Twitter URLs', () => {
    it('should clean x.com URL with tracking parameters', () => {
      const url = 'https://x.com/user/status/123456?s=20&t=abc123';
      expect(cleanXUrl(url)).toBe('https://x.com/user/status/123456');
    });

    it('should clean twitter.com URL with tracking parameters', () => {
      const url = 'https://twitter.com/user/status/789?ref_src=twsrc';
      expect(cleanXUrl(url)).toBe('https://twitter.com/user/status/789');
    });

    it('should return URL as-is if no tracking parameters', () => {
      const url = 'https://x.com/user/status/123456';
      expect(cleanXUrl(url)).toBe('https://x.com/user/status/123456');
    });

    it('should handle URLs with trailing slash', () => {
      const url = 'https://x.com/user/status/123456/?s=20';
      expect(cleanXUrl(url)).toBe('https://x.com/user/status/123456/');
    });
  });

  describe('invalid URLs', () => {
    it('should return null for non-X/Twitter domains', () => {
      expect(cleanXUrl('https://example.com/page')).toBeNull();
      expect(cleanXUrl('https://facebook.com/post/123')).toBeNull();
    });

    it('should return null for malformed URLs', () => {
      expect(cleanXUrl('not-a-url')).toBeNull();
      expect(cleanXUrl('://invalid')).toBeNull();
    });

    it('should return null for empty or null input', () => {
      expect(cleanXUrl('')).toBeNull();
      expect(cleanXUrl(null)).toBeNull();
      expect(cleanXUrl(undefined)).toBeNull();
    });
  });
});
