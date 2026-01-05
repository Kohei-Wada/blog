import { describe, it, expect } from 'vitest';
import type { CollectionEntry } from 'astro:content';
import {
  getTagCounts,
  getPostsByTag,
  getAllTags,
  getTagsSortedByCount,
} from '../../src/utils/content-aggregation';

// モックデータの作成
const createMockPost = (
  id: string,
  title: string,
  pubDate: string,
  tags: string[]
): CollectionEntry<'blog'> => ({
  id,
  slug: id,
  body: '',
  collection: 'blog' as const,
  data: {
    title,
    description: 'Test description',
    pubDate: new Date(pubDate),
    tags,
    featured: false,
  },
  render: async () => ({ Content: () => null, headings: [], remarkPluginFrontmatter: {} }),
});

const mockPosts = [
  createMockPost('post-1', '記事1', '2025-08-20', ['TypeScript', 'Astro']),
  createMockPost('post-2', '記事2', '2025-08-15', ['TypeScript', 'React']),
  createMockPost('post-3', '記事3', '2025-07-10', ['Astro', 'blog']),
  createMockPost('post-4', '記事4', '2025-06-05', ['TypeScript', 'Astro', 'blog']),
  createMockPost('post-5', '記事5', '2024-12-25', ['React']),
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
      const postsWithNoTags = [createMockPost('no-tags', 'No Tags', '2025-01-01', [])];
      const result = getTagCounts(postsWithNoTags);
      expect(result).toEqual({});
    });

    it('should handle single post with multiple tags', () => {
      const singlePost = [createMockPost('single', 'Single', '2025-01-01', ['a', 'b', 'c'])];
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
      const singleTagPosts = [createMockPost('single', 'Single', '2025-01-01', ['only'])];
      const result = getTagsSortedByCount(singleTagPosts);

      expect(result).toEqual(['only']);
    });
  });
});
