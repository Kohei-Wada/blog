import { describe, it, expect } from 'vitest';
import type { CollectionEntry } from 'astro:content';
import {
  groupPostsByMonth,
  formatArchiveLabel,
  generateArchiveSlug,
  getRecentArchiveMonths,
} from '../../src/utils/archive-utils';

// モックデータの作成
const createMockPost = (id: string, title: string, pubDate: string): CollectionEntry<'blog'> => ({
  id,
  slug: id,
  body: '',
  collection: 'blog' as const,
  data: {
    title,
    description: 'Test description',
    pubDate: new Date(pubDate),
    tags: ['test'],
    featured: false,
  },
  render: async () => ({ Content: () => null, headings: [], remarkPluginFrontmatter: {} }),
});

const mockPosts = [
  createMockPost('post-1', '2025年8月の記事1', '2025-08-20'),
  createMockPost('post-2', '2025年8月の記事2', '2025-08-15'),
  createMockPost('post-3', '2025年7月の記事', '2025-07-10'),
  createMockPost('post-4', '2025年6月の記事', '2025-06-05'),
  createMockPost('post-5', '2024年12月の記事', '2024-12-25'),
];

describe('archive-utils', () => {
  describe('groupPostsByMonth', () => {
    it('should group posts by year and month', () => {
      const result = groupPostsByMonth(mockPosts);

      expect(result).toHaveLength(4);

      // 2025年8月 (2記事)
      expect(result[0]).toEqual({
        year: 2025,
        month: 8,
        posts: [mockPosts[0], mockPosts[1]],
        count: 2,
        label: '2025年8月',
        slug: '2025-08',
      });

      // 2025年7月 (1記事)
      expect(result[1]).toEqual({
        year: 2025,
        month: 7,
        posts: [mockPosts[2]],
        count: 1,
        label: '2025年7月',
        slug: '2025-07',
      });

      // 2025年6月 (1記事)
      expect(result[2]).toEqual({
        year: 2025,
        month: 6,
        posts: [mockPosts[3]],
        count: 1,
        label: '2025年6月',
        slug: '2025-06',
      });

      // 2024年12月 (1記事)
      expect(result[3]).toEqual({
        year: 2024,
        month: 12,
        posts: [mockPosts[4]],
        count: 1,
        label: '2024年12月',
        slug: '2024-12',
      });
    });

    it('should sort posts within each month by date (newest first)', () => {
      const result = groupPostsByMonth(mockPosts);
      const august2025 = result[0];

      expect(august2025.posts[0].data.pubDate.getTime()).toBeGreaterThan(
        august2025.posts[1].data.pubDate.getTime()
      );
    });

    it('should handle empty array', () => {
      const result = groupPostsByMonth([]);
      expect(result).toEqual([]);
    });

    it('should handle single post', () => {
      const singlePost = [createMockPost('single', 'Single Post', '2025-05-15')];
      const result = groupPostsByMonth(singlePost);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        year: 2025,
        month: 5,
        posts: [singlePost[0]],
        count: 1,
        label: '2025年5月',
        slug: '2025-05',
      });
    });
  });

  describe('formatArchiveLabel', () => {
    it('should format Japanese month labels correctly', () => {
      expect(formatArchiveLabel(2025, 1)).toBe('2025年1月');
      expect(formatArchiveLabel(2025, 8)).toBe('2025年8月');
      expect(formatArchiveLabel(2024, 12)).toBe('2024年12月');
    });

    it('should handle edge cases', () => {
      expect(formatArchiveLabel(2025, 1)).toBe('2025年1月');
      expect(formatArchiveLabel(2025, 12)).toBe('2025年12月');
    });
  });

  describe('generateArchiveSlug', () => {
    it('should generate URL-friendly slugs', () => {
      expect(generateArchiveSlug(2025, 1)).toBe('2025-01');
      expect(generateArchiveSlug(2025, 8)).toBe('2025-08');
      expect(generateArchiveSlug(2024, 12)).toBe('2024-12');
    });

    it('should zero-pad single digit months', () => {
      expect(generateArchiveSlug(2025, 1)).toBe('2025-01');
      expect(generateArchiveSlug(2025, 9)).toBe('2025-09');
    });
  });

  describe('getRecentArchiveMonths', () => {
    it('should return most recent archive months', () => {
      const archives = groupPostsByMonth(mockPosts);
      const recent = getRecentArchiveMonths(archives, 3);

      expect(recent).toHaveLength(3);
      expect(recent[0].slug).toBe('2025-08');
      expect(recent[1].slug).toBe('2025-07');
      expect(recent[2].slug).toBe('2025-06');
    });

    it('should handle limit larger than available archives', () => {
      const archives = groupPostsByMonth(mockPosts);
      const recent = getRecentArchiveMonths(archives, 10);

      expect(recent).toHaveLength(4); // 全てのアーカイブを返す
    });

    it('should handle empty archives', () => {
      const recent = getRecentArchiveMonths([], 5);
      expect(recent).toEqual([]);
    });

    it('should default to 6 months if no limit specified', () => {
      const manyPosts = Array.from({ length: 24 }, (_, i) => {
        const date = new Date(2025, 7 - i, 1); // 8月から遡って24ヶ月
        return createMockPost(`post-${i}`, `記事${i}`, date.toISOString().split('T')[0]);
      });

      const archives = groupPostsByMonth(manyPosts);
      const recent = getRecentArchiveMonths(archives);

      expect(recent).toHaveLength(6);
    });
  });
});
