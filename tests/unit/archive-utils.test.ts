import { describe, it, expect } from 'vitest';
import {
  groupPostsByMonth,
  formatArchiveLabel,
  generateArchiveSlug,
  getRecentArchiveMonths,
  parseArchiveSlug,
} from '../../src/utils/archive-utils';
import { createMockPost } from '../../src/test/helpers';

const mockPosts = [
  createMockPost({ id: 'post-1', title: '2025年8月の記事1', pubDate: '2025-08-20' }),
  createMockPost({ id: 'post-2', title: '2025年8月の記事2', pubDate: '2025-08-15' }),
  createMockPost({ id: 'post-3', title: '2025年7月の記事', pubDate: '2025-07-10' }),
  createMockPost({ id: 'post-4', title: '2025年6月の記事', pubDate: '2025-06-05' }),
  createMockPost({ id: 'post-5', title: '2024年12月の記事', pubDate: '2024-12-25' }),
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
      const singlePost = [
        createMockPost({ id: 'single', title: 'Single Post', pubDate: '2025-05-15' }),
      ];
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

  describe('parseArchiveSlug', () => {
    it('should parse valid year-month slugs', () => {
      expect(parseArchiveSlug('2025-08')).toEqual({ year: 2025, month: 8 });
      expect(parseArchiveSlug('2024-12')).toEqual({ year: 2024, month: 12 });
      expect(parseArchiveSlug('2000-01')).toEqual({ year: 2000, month: 1 });
    });

    it('should return null for invalid formats', () => {
      expect(parseArchiveSlug('2025-8')).toBeNull(); // 月が0埋めされていない
      expect(parseArchiveSlug('25-08')).toBeNull(); // 年が4桁でない
      expect(parseArchiveSlug('2025/08')).toBeNull(); // 区切り文字が違う
      expect(parseArchiveSlug('invalid')).toBeNull(); // 完全に無効
      expect(parseArchiveSlug('')).toBeNull(); // 空文字
    });

    it('should return null for invalid years', () => {
      expect(parseArchiveSlug('1899-08')).toBeNull(); // 1900年未満
      expect(parseArchiveSlug('2101-08')).toBeNull(); // 2100年超過
      expect(parseArchiveSlug('abcd-08')).toBeNull(); // 年が数値でない
    });

    it('should return null for invalid months', () => {
      expect(parseArchiveSlug('2025-00')).toBeNull(); // 月が0
      expect(parseArchiveSlug('2025-13')).toBeNull(); // 月が13
      expect(parseArchiveSlug('2025-ab')).toBeNull(); // 月が数値でない
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
        return createMockPost({
          id: `post-${i}`,
          title: `記事${i}`,
          pubDate: date.toISOString().split('T')[0],
        });
      });

      const archives = groupPostsByMonth(manyPosts);
      const recent = getRecentArchiveMonths(archives);

      expect(recent).toHaveLength(6);
    });
  });
});
