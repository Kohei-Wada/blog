import { describe, it, expect } from 'vitest';
import { sortPostsByDate, sortPostsByFeaturedThenDate } from '@/utils/sorting';
import type { CollectionEntry } from 'astro:content';

// Helper to create mock post data for testing
function createMockPost(
  id: string,
  pubDate: Date,
  featured: boolean = false
): CollectionEntry<'blog'> {
  return {
    id,
    collection: 'blog',
    data: {
      title: `Post ${id}`,
      description: `Description for ${id}`,
      pubDate,
      tags: ['test'],
      featured,
    },
  } as CollectionEntry<'blog'>;
}

describe('sorting', () => {
  describe('sortPostsByDate', () => {
    it('should sort posts by date in descending order', () => {
      const posts = [
        createMockPost('old', new Date('2024-01-01')),
        createMockPost('newest', new Date('2024-03-01')),
        createMockPost('middle', new Date('2024-02-01')),
      ];

      const sorted = sortPostsByDate(posts);

      expect(sorted[0].id).toBe('newest');
      expect(sorted[1].id).toBe('middle');
      expect(sorted[2].id).toBe('old');
    });

    it('should return empty array when given empty array', () => {
      const sorted = sortPostsByDate([]);
      expect(sorted).toEqual([]);
    });

    it('should return single post as-is', () => {
      const posts = [createMockPost('single', new Date('2024-01-01'))];
      const sorted = sortPostsByDate(posts);
      expect(sorted).toHaveLength(1);
      expect(sorted[0].id).toBe('single');
    });

    it('should maintain original order for posts with same date (stable sort)', () => {
      const sameDate = new Date('2024-01-01');
      const posts = [
        createMockPost('first', sameDate),
        createMockPost('second', sameDate),
        createMockPost('third', sameDate),
      ];

      const sorted = sortPostsByDate(posts);

      // Same date should maintain original order
      expect(sorted[0].id).toBe('first');
      expect(sorted[1].id).toBe('second');
      expect(sorted[2].id).toBe('third');
    });

    it('should not mutate original array (immutable)', () => {
      const posts = [
        createMockPost('old', new Date('2024-01-01')),
        createMockPost('new', new Date('2024-03-01')),
      ];
      const originalOrder = posts.map(p => p.id);

      sortPostsByDate(posts);

      expect(posts.map(p => p.id)).toEqual(originalOrder);
    });
  });

  describe('sortPostsByFeaturedThenDate', () => {
    it('should sort featured posts first, then by date', () => {
      const posts = [
        createMockPost('old-featured', new Date('2024-01-01'), true),
        createMockPost('newest-normal', new Date('2024-03-01'), false),
        createMockPost('new-featured', new Date('2024-02-01'), true),
        createMockPost('old-normal', new Date('2024-01-15'), false),
      ];

      const sorted = sortPostsByFeaturedThenDate(posts);

      // Featured posts first (sorted by date)
      expect(sorted[0].id).toBe('new-featured');
      expect(sorted[1].id).toBe('old-featured');
      // Then normal posts (sorted by date)
      expect(sorted[2].id).toBe('newest-normal');
      expect(sorted[3].id).toBe('old-normal');
    });

    it('should sort by date only when no featured posts', () => {
      const posts = [
        createMockPost('old', new Date('2024-01-01'), false),
        createMockPost('new', new Date('2024-03-01'), false),
      ];

      const sorted = sortPostsByFeaturedThenDate(posts);

      expect(sorted[0].id).toBe('new');
      expect(sorted[1].id).toBe('old');
    });

    it('should sort by date only when all posts are featured', () => {
      const posts = [
        createMockPost('old', new Date('2024-01-01'), true),
        createMockPost('new', new Date('2024-03-01'), true),
      ];

      const sorted = sortPostsByFeaturedThenDate(posts);

      expect(sorted[0].id).toBe('new');
      expect(sorted[1].id).toBe('old');
    });

    it('should return empty array when given empty array', () => {
      const sorted = sortPostsByFeaturedThenDate([]);
      expect(sorted).toEqual([]);
    });

    it('should not mutate original array (immutable)', () => {
      const posts = [
        createMockPost('normal', new Date('2024-03-01'), false),
        createMockPost('featured', new Date('2024-01-01'), true),
      ];
      const originalOrder = posts.map(p => p.id);

      sortPostsByFeaturedThenDate(posts);

      expect(posts.map(p => p.id)).toEqual(originalOrder);
    });
  });
});
