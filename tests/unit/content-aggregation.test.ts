import { describe, it, expect } from 'vitest';
import {
  getTagCounts,
  getPostsByTag,
  getAllTags,
  getTagsSortedByCount,
} from '../../src/utils/content-aggregation';
import { createMockPost } from '../../src/test/helpers';

const mockPosts = [
  createMockPost({
    id: 'post-1',
    title: '記事1',
    pubDate: '2025-08-20',
    tags: ['TypeScript', 'Astro'],
  }),
  createMockPost({
    id: 'post-2',
    title: '記事2',
    pubDate: '2025-08-15',
    tags: ['TypeScript', 'React'],
  }),
  createMockPost({ id: 'post-3', title: '記事3', pubDate: '2025-07-10', tags: ['Astro', 'blog'] }),
  createMockPost({
    id: 'post-4',
    title: '記事4',
    pubDate: '2025-06-05',
    tags: ['TypeScript', 'Astro', 'blog'],
  }),
  createMockPost({ id: 'post-5', title: '記事5', pubDate: '2024-12-25', tags: ['React'] }),
];

describe('content-aggregation', () => {
  describe('getTagCounts', () => {
    it('should count tags correctly', () => {
      const result = getTagCounts(mockPosts);

      expect(result['TypeScript']).toBe(3);
      expect(result['Astro']).toBe(3);
      expect(result['React']).toBe(2);
      expect(result['blog']).toBe(2);
    });

    it('should handle empty array', () => {
      const result = getTagCounts([]);
      expect(result).toEqual({});
    });

    it('should handle posts with no tags', () => {
      const postsWithNoTags = [
        createMockPost({ id: 'no-tags', title: 'No Tags', pubDate: '2025-01-01', tags: [] }),
      ];
      const result = getTagCounts(postsWithNoTags);
      expect(result).toEqual({});
    });

    it('should handle single post with multiple tags', () => {
      const singlePost = [
        createMockPost({
          id: 'single',
          title: 'Single',
          pubDate: '2025-01-01',
          tags: ['a', 'b', 'c'],
        }),
      ];
      const result = getTagCounts(singlePost);

      expect(result['a']).toBe(1);
      expect(result['b']).toBe(1);
      expect(result['c']).toBe(1);
    });
  });

  describe('getPostsByTag', () => {
    it('should filter posts by tag', () => {
      const result = getPostsByTag(mockPosts, 'TypeScript');

      expect(result).toHaveLength(3);
      expect(result.every(post => post.data.tags.includes('TypeScript'))).toBe(true);
    });

    it('should return empty array for non-existent tag', () => {
      const result = getPostsByTag(mockPosts, 'NonExistent');
      expect(result).toEqual([]);
    });

    it('should handle empty posts array', () => {
      const result = getPostsByTag([], 'TypeScript');
      expect(result).toEqual([]);
    });

    it('should be case-sensitive', () => {
      const result = getPostsByTag(mockPosts, 'typescript');
      expect(result).toEqual([]);
    });
  });

  describe('getAllTags', () => {
    it('should return all unique tags', () => {
      const result = getAllTags(mockPosts);

      expect(result).toContain('TypeScript');
      expect(result).toContain('Astro');
      expect(result).toContain('React');
      expect(result).toContain('blog');
      expect(result).toHaveLength(4);
    });

    it('should return sorted tags', () => {
      const result = getAllTags(mockPosts);
      const sorted = [...result].sort();

      expect(result).toEqual(sorted);
    });

    it('should handle empty array', () => {
      const result = getAllTags([]);
      expect(result).toEqual([]);
    });
  });

  describe('getTagsSortedByCount', () => {
    it('should return tags sorted by count (descending)', () => {
      const result = getTagsSortedByCount(mockPosts);

      // TypeScript と Astro は両方3なので、どちらが先でも良い
      expect(result.slice(0, 2)).toContain('TypeScript');
      expect(result.slice(0, 2)).toContain('Astro');
      // React と blog は両方2
      expect(result.slice(2, 4)).toContain('React');
      expect(result.slice(2, 4)).toContain('blog');
    });

    it('should handle empty array', () => {
      const result = getTagsSortedByCount([]);
      expect(result).toEqual([]);
    });

    it('should handle single tag', () => {
      const singleTagPosts = [
        createMockPost({ id: 'single', title: 'Single', pubDate: '2025-01-01', tags: ['only'] }),
      ];
      const result = getTagsSortedByCount(singleTagPosts);

      expect(result).toEqual(['only']);
    });
  });
});
