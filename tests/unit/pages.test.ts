import { describe, it, expect } from 'vitest';
import {
  createTestPost,
  sortPostsByDate,
  filterPostsByTag,
  countTagsFromPosts,
  getUniqueTagsFromPosts,
  testUrlEncoding,
  createTestDate,
} from '../../src/test/helpers';

describe('Page Logic', () => {
  describe('Blog Index Page', () => {
    it('should sort posts by date in descending order', () => {
      const posts = [
        createTestPost({ data: { pubDate: createTestDate('2023-01-01') } }),
        createTestPost({ data: { pubDate: createTestDate('2023-03-01') } }),
        createTestPost({ data: { pubDate: createTestDate('2023-02-01') } }),
      ];

      const sorted = sortPostsByDate(posts);

      expect(sorted[0].data.pubDate).toEqual(createTestDate('2023-03-01'));
      expect(sorted[1].data.pubDate).toEqual(createTestDate('2023-02-01'));
      expect(sorted[2].data.pubDate).toEqual(createTestDate('2023-01-01'));
    });

    it('should format blog post URL correctly', () => {
      const post = { id: 'my-awesome-post' };
      const url = `/blog/${post.id}`;
      expect(url).toBe('/blog/my-awesome-post');
    });
  });

  describe('Tag Page', () => {
    it('should filter posts by tag', () => {
      const posts = [
        createTestPost({ data: { tags: ['javascript', 'react'] } }),
        createTestPost({ data: { tags: ['python', 'django'] } }),
        createTestPost({ data: { tags: ['javascript', 'vue'] } }),
      ];

      const filtered = filterPostsByTag(posts, 'javascript');

      expect(filtered.length).toBe(2);
      expect(filtered[0].data.tags).toContain('javascript');
      expect(filtered[1].data.tags).toContain('javascript');
    });

    it('should generate tag URL correctly', () => {
      const tag = 'typescript';
      const url = `/tags/${tag}`;
      expect(url).toBe('/tags/typescript');
    });

    it('should handle special characters in tags', () => {
      const encoded = testUrlEncoding('c++');
      expect(encoded).toBe('c%2B%2B');
    });
  });

  describe('Tags Index Page', () => {
    it('should count posts per tag correctly', () => {
      const posts = [
        createTestPost({ data: { tags: ['javascript', 'react'] } }),
        createTestPost({ data: { tags: ['javascript', 'vue'] } }),
        createTestPost({ data: { tags: ['python'] } }),
      ];

      const tagCounts = countTagsFromPosts(posts);

      expect(tagCounts['javascript']).toBe(2);
      expect(tagCounts['react']).toBe(1);
      expect(tagCounts['vue']).toBe(1);
      expect(tagCounts['python']).toBe(1);
    });

    it('should get unique tags from posts', () => {
      const posts = [
        createTestPost({ data: { tags: ['javascript', 'react'] } }),
        createTestPost({ data: { tags: ['javascript', 'vue'] } }),
        createTestPost({ data: { tags: ['react', 'typescript'] } }),
      ];

      const uniqueTags = getUniqueTagsFromPosts(posts);

      expect(uniqueTags).toContain('javascript');
      expect(uniqueTags).toContain('react');
      expect(uniqueTags).toContain('vue');
      expect(uniqueTags).toContain('typescript');
      expect(uniqueTags.length).toBe(4);
    });
  });
});
