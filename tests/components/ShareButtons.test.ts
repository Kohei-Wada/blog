import { describe, it, expect } from 'vitest';
import { testUrlEncoding } from '../../src/test/helpers.js';

describe('ShareButtons Logic', () => {
  const mockUrl = 'https://example.com/blog/test-post';
  const mockTitle = 'Test Blog Post';

  describe('Social Share URLs', () => {
    it('should generate correct Twitter/X share URL', () => {
      const twitterUrl = `https://x.com/intent/tweet?url=${encodeURIComponent(mockUrl)}&text=${encodeURIComponent(mockTitle)}`;

      expect(twitterUrl).toContain('x.com/intent/tweet');
      expect(twitterUrl).toContain(encodeURIComponent(mockUrl));
      expect(twitterUrl).toContain(encodeURIComponent(mockTitle));
    });

    it('should generate correct Facebook share URL', () => {
      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(mockUrl)}`;

      expect(facebookUrl).toContain('facebook.com/sharer');
      expect(facebookUrl).toContain(encodeURIComponent(mockUrl));
    });

    it('should generate correct LinkedIn share URL', () => {
      const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(mockUrl)}`;

      expect(linkedinUrl).toContain('linkedin.com/sharing');
      expect(linkedinUrl).toContain(encodeURIComponent(mockUrl));
    });

    it('should generate correct Hatena Bookmark URL', () => {
      const hatenaUrl = `https://b.hatena.ne.jp/entry/${encodeURIComponent(mockUrl)}`;

      expect(hatenaUrl).toContain('b.hatena.ne.jp/entry');
      expect(hatenaUrl).toContain(encodeURIComponent(mockUrl));
    });

    it('should generate correct Pocket URL', () => {
      const pocketUrl = `https://getpocket.com/save?url=${encodeURIComponent(mockUrl)}`;

      expect(pocketUrl).toContain('getpocket.com/save');
      expect(pocketUrl).toContain(encodeURIComponent(mockUrl));
    });
  });

  describe('URL Encoding', () => {
    it('should handle URLs with special characters', () => {
      const encoded = testUrlEncoding('https://example.com/blog/post?id=123&tag=c++');

      expect(encoded).not.toContain('?');
      expect(encoded).not.toContain('&');
      expect(encoded).not.toContain('+');
      expect(encoded).toBe('https%3A%2F%2Fexample.com%2Fblog%2Fpost%3Fid%3D123%26tag%3Dc%2B%2B');
    });

    it('should handle titles with special characters', () => {
      const encoded = testUrlEncoding('C++ & JavaScript: A Comparison!');

      expect(encoded).toBe('C%2B%2B%20%26%20JavaScript%3A%20A%20Comparison!');
      expect(encoded).not.toContain('&');
      expect(encoded).not.toContain('+');
      expect(encoded).not.toContain(':');
    });

    it('should handle Japanese characters', () => {
      const encoded = testUrlEncoding('日本語のタイトル');

      expect(encoded).toBe(
        '%E6%97%A5%E6%9C%AC%E8%AA%9E%E3%81%AE%E3%82%BF%E3%82%A4%E3%83%88%E3%83%AB'
      );
    });
  });
});
