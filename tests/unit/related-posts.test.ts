import { describe, it, expect } from 'vitest';
import { getRelatedPosts, calculateSimilarityScore } from '@/utils/related-posts';
import { SIMILARITY_WEIGHTS } from '@/constants/similarity';
import type { CollectionEntry } from 'astro:content';

// Create mock post data
const createMockPost = (
  id: string,
  title: string,
  tags: string[],
  pubDate: Date
): CollectionEntry<'blog'> => ({
  id,
  data: {
    title,
    description: `Description for ${title}`,
    pubDate,
    tags,
    featured: false,
  },
  collection: 'blog',
  render: async () => ({ Content: () => null, headings: [] }),
});

describe('Related Posts Utility', () => {
  describe('calculateSimilarityScore', () => {
    it('returns higher score for more common tags', () => {
      const currentPost = createMockPost(
        'current',
        'Current Post',
        ['javascript', 'react', 'astro'],
        new Date('2025-01-15')
      );

      const relatedPost1 = createMockPost(
        'related1',
        'Related Post 1',
        ['javascript', 'react', 'astro'], // All 3 match
        new Date('2025-01-15')
      );

      const relatedPost2 = createMockPost(
        'related2',
        'Related Post 2',
        ['javascript', 'vue'], // Only 1 match
        new Date('2025-01-15')
      );

      const score1 = calculateSimilarityScore(currentPost, relatedPost1);
      const score2 = calculateSimilarityScore(currentPost, relatedPost2);

      expect(score1).toBeGreaterThan(score2);
    });

    it('returns higher score for closer dates', () => {
      const currentPost = createMockPost(
        'current',
        'Current Post',
        ['javascript'],
        new Date('2025-01-15')
      );

      const recentPost = createMockPost(
        'recent',
        'Recent Post',
        ['javascript'],
        new Date('2025-01-14') // 1 day ago
      );

      const oldPost = createMockPost(
        'old',
        'Old Post',
        ['javascript'],
        new Date('2024-12-01') // Over 1 month ago
      );

      const recentScore = calculateSimilarityScore(currentPost, recentPost);
      const oldScore = calculateSimilarityScore(currentPost, oldPost);

      expect(recentScore).toBeGreaterThan(oldScore);
    });

    it('tag weight is higher than date weight', () => {
      const currentPost = createMockPost(
        'current',
        'Current Post',
        ['javascript', 'react'],
        new Date('2025-01-15')
      );

      const sameTagsOldPost = createMockPost(
        'same-tags-old',
        'Same Tags Old Post',
        ['javascript', 'react'], // Tags fully match
        new Date('2024-06-01') // Old date
      );

      const differentTagsRecentPost = createMockPost(
        'different-tags-recent',
        'Different Tags Recent Post',
        ['python', 'django'], // Tags don't match
        new Date('2025-01-14') // Recent date
      );

      const sameTagsScore = calculateSimilarityScore(currentPost, sameTagsOldPost);
      const differentTagsScore = calculateSimilarityScore(currentPost, differentTagsRecentPost);

      expect(sameTagsScore).toBeGreaterThan(differentTagsScore);
    });

    it('works with posts that have no tags', () => {
      const noTagsPost1 = createMockPost('no-tags-1', 'No Tags Post 1', [], new Date('2025-01-15'));

      const noTagsPost2 = createMockPost('no-tags-2', 'No Tags Post 2', [], new Date('2025-01-14'));

      const score = calculateSimilarityScore(noTagsPost1, noTagsPost2);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('allows custom weights to be injected', () => {
      const currentPost = createMockPost(
        'current',
        'Current Post',
        ['javascript'],
        new Date('2025-01-15')
      );

      const otherPost = createMockPost(
        'other',
        'Other Post',
        ['javascript'],
        new Date('2025-01-15')
      );

      // Tag only weights (100% tag, 0% date)
      const tagOnlyWeights = {
        TAG_WEIGHT: 1.0,
        DATE_WEIGHT: 0.0,
        RECENT_DAYS: 30,
        MAX_DAYS: 365,
      } as const;

      const scoreWithTagOnly = calculateSimilarityScore(currentPost, otherPost, tagOnlyWeights);

      // Date only weights (0% tag, 100% date)
      const dateOnlyWeights = {
        TAG_WEIGHT: 0.0,
        DATE_WEIGHT: 1.0,
        RECENT_DAYS: 30,
        MAX_DAYS: 365,
      } as const;

      const scoreWithDateOnly = calculateSimilarityScore(currentPost, otherPost, dateOnlyWeights);

      // Same tags, same date - tag only should give 1.0 (100% match)
      expect(scoreWithTagOnly).toBe(1.0);
      // Same date within RECENT_DAYS - date only should give 1.0
      expect(scoreWithDateOnly).toBe(1.0);
    });

    it('uses SIMILARITY_WEIGHTS as default', () => {
      const currentPost = createMockPost(
        'current',
        'Current Post',
        ['javascript', 'react'],
        new Date('2025-01-15')
      );

      const otherPost = createMockPost(
        'other',
        'Other Post',
        ['javascript', 'react'],
        new Date('2025-01-15')
      );

      const scoreDefault = calculateSimilarityScore(currentPost, otherPost);
      const scoreExplicit = calculateSimilarityScore(currentPost, otherPost, SIMILARITY_WEIGHTS);

      expect(scoreDefault).toBe(scoreExplicit);
    });
  });

  describe('getRelatedPosts', () => {
    it('excludes the current post', () => {
      const currentPost = createMockPost(
        'current',
        'Current Post',
        ['javascript'],
        new Date('2025-01-15')
      );

      const allPosts = [
        currentPost,
        createMockPost('other1', 'Other Post 1', ['javascript'], new Date('2025-01-14')),
        createMockPost('other2', 'Other Post 2', ['python'], new Date('2025-01-13')),
      ];

      const relatedPosts = getRelatedPosts(currentPost, allPosts, 3);

      expect(relatedPosts).not.toContainEqual(expect.objectContaining({ id: 'current' }));
    });

    it('returns the specified number of related posts', () => {
      const currentPost = createMockPost(
        'current',
        'Current Post',
        ['javascript'],
        new Date('2025-01-15')
      );

      const allPosts = [
        currentPost,
        createMockPost('other1', 'Other Post 1', ['javascript'], new Date('2025-01-14')),
        createMockPost('other2', 'Other Post 2', ['python'], new Date('2025-01-13')),
        createMockPost('other3', 'Other Post 3', ['react'], new Date('2025-01-12')),
        createMockPost('other4', 'Other Post 4', ['vue'], new Date('2025-01-11')),
      ];

      const relatedPosts = getRelatedPosts(currentPost, allPosts, 2);
      expect(relatedPosts).toHaveLength(2);
    });

    it('returns available posts when requesting more than available', () => {
      const currentPost = createMockPost(
        'current',
        'Current Post',
        ['javascript'],
        new Date('2025-01-15')
      );

      const allPosts = [
        currentPost,
        createMockPost('other1', 'Other Post 1', ['javascript'], new Date('2025-01-14')),
      ];

      const relatedPosts = getRelatedPosts(currentPost, allPosts, 5);
      expect(relatedPosts).toHaveLength(1);
    });

    it('returns posts sorted by score descending', () => {
      const currentPost = createMockPost(
        'current',
        'Current Post',
        ['javascript', 'react', 'astro'],
        new Date('2025-01-15')
      );

      const allPosts = [
        currentPost,
        createMockPost('low', 'Low Relevance', ['python'], new Date('2024-01-01')),
        createMockPost(
          'high',
          'High Relevance',
          ['javascript', 'react', 'astro'],
          new Date('2025-01-14')
        ),
        createMockPost('medium', 'Medium Relevance', ['javascript'], new Date('2025-01-10')),
      ];

      const relatedPosts = getRelatedPosts(currentPost, allPosts, 3);

      expect(relatedPosts[0].id).toBe('high');
      expect(relatedPosts[1].id).toBe('medium');
      expect(relatedPosts[2].id).toBe('low');
    });

    it('returns empty array when only current post exists', () => {
      const currentPost = createMockPost(
        'current',
        'Current Post',
        ['javascript'],
        new Date('2025-01-15')
      );

      const allPosts = [currentPost];

      const relatedPosts = getRelatedPosts(currentPost, allPosts, 3);
      expect(relatedPosts).toEqual([]);
    });

    it('includes posts with zero score', () => {
      const currentPost = createMockPost(
        'current',
        'Current Post',
        ['javascript'],
        new Date('2025-01-15')
      );

      const allPosts = [
        currentPost,
        createMockPost('no-match', 'No Match', ['python'], new Date('2024-01-01')),
      ];

      const relatedPosts = getRelatedPosts(currentPost, allPosts, 1);
      expect(relatedPosts).toHaveLength(1);
      expect(relatedPosts[0].id).toBe('no-match');
    });
  });
});
