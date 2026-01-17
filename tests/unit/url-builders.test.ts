import { describe, it, expect } from 'vitest';
import { getBlogPostUrl, getTagUrl, getArchiveUrl } from '@/utils/url-builders';

describe('url-builders', () => {
  describe('getBlogPostUrl', () => {
    it('should generate blog post URL from post ID', () => {
      expect(getBlogPostUrl('my-first-post')).toBe('/blog/my-first-post/');
    });

    it('should handle Japanese characters in ID', () => {
      expect(getBlogPostUrl('日本語タイトル')).toBe('/blog/日本語タイトル/');
    });

    it('should maintain URL format for empty string', () => {
      expect(getBlogPostUrl('')).toBe('/blog//');
    });

    it('should handle IDs containing slashes', () => {
      expect(getBlogPostUrl('2024/01/post')).toBe('/blog/2024/01/post/');
    });
  });

  describe('getTagUrl', () => {
    it('should generate tag page URL from tag name', () => {
      expect(getTagUrl('typescript')).toBe('/tags/typescript/');
    });

    it('should handle Japanese tags', () => {
      expect(getTagUrl('プログラミング')).toBe('/tags/プログラミング/');
    });

    it('should handle tags containing spaces', () => {
      expect(getTagUrl('web development')).toBe('/tags/web development/');
    });
  });

  describe('getArchiveUrl', () => {
    it('should generate archive URL from year and month', () => {
      expect(getArchiveUrl(2024, 1)).toBe('/archives/2024-01/');
      expect(getArchiveUrl(2024, 12)).toBe('/archives/2024-12/');
    });

    it('should zero-pad single digit months', () => {
      expect(getArchiveUrl(2024, 1)).toBe('/archives/2024-01/');
      expect(getArchiveUrl(2024, 9)).toBe('/archives/2024-09/');
    });

    it('should handle months 10 and above correctly', () => {
      expect(getArchiveUrl(2024, 10)).toBe('/archives/2024-10/');
      expect(getArchiveUrl(2024, 11)).toBe('/archives/2024-11/');
    });
  });
});
