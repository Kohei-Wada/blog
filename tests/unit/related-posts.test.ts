import { describe, it, expect } from 'vitest';
import { getRelatedPosts, calculateSimilarityScore } from '@/utils/related-posts';
import { SIMILARITY_WEIGHTS } from '@/constants/similarity';
import { createMockPost } from '../../src/test/helpers';

describe('Related Posts Utility', () => {
  describe('calculateSimilarityScore', () => {
    it('returns higher score for more common tags', () => {
      const currentPost = createMockPost({
        id: 'current',
        title: 'Current Post',
        tags: ['javascript', 'react', 'astro'],
        pubDate: new Date('2025-01-15'),
      });

      const relatedPost1 = createMockPost({
        id: 'related1',
        title: 'Related Post 1',
        tags: ['javascript', 'react', 'astro'], // All 3 match
        pubDate: new Date('2025-01-15'),
      });

      const relatedPost2 = createMockPost({
        id: 'related2',
        title: 'Related Post 2',
        tags: ['javascript', 'vue'], // Only 1 match
        pubDate: new Date('2025-01-15'),
      });

      const score1 = calculateSimilarityScore(currentPost, relatedPost1);
      const score2 = calculateSimilarityScore(currentPost, relatedPost2);

      expect(score1).toBeGreaterThan(score2);
    });

    it('returns higher score for closer dates', () => {
      const currentPost = createMockPost({
        id: 'current',
        title: 'Current Post',
        tags: ['javascript'],
        pubDate: new Date('2025-01-15'),
      });

      const recentPost = createMockPost({
        id: 'recent',
        title: 'Recent Post',
        tags: ['javascript'],
        pubDate: new Date('2025-01-14'), // 1 day ago
      });

      const oldPost = createMockPost({
        id: 'old',
        title: 'Old Post',
        tags: ['javascript'],
        pubDate: new Date('2024-12-01'), // Over 1 month ago
      });

      const recentScore = calculateSimilarityScore(currentPost, recentPost);
      const oldScore = calculateSimilarityScore(currentPost, oldPost);

      expect(recentScore).toBeGreaterThan(oldScore);
    });

    it('tag weight is higher than date weight', () => {
      const currentPost = createMockPost({
        id: 'current',
        title: 'Current Post',
        tags: ['javascript', 'react'],
        pubDate: new Date('2025-01-15'),
      });

      const sameTagsOldPost = createMockPost({
        id: 'same-tags-old',
        title: 'Same Tags Old Post',
        tags: ['javascript', 'react'], // Tags fully match
        pubDate: new Date('2024-06-01'), // Old date
      });

      const differentTagsRecentPost = createMockPost({
        id: 'different-tags-recent',
        title: 'Different Tags Recent Post',
        tags: ['python', 'django'], // Tags don't match
        pubDate: new Date('2025-01-14'), // Recent date
      });

      const sameTagsScore = calculateSimilarityScore(currentPost, sameTagsOldPost);
      const differentTagsScore = calculateSimilarityScore(currentPost, differentTagsRecentPost);

      expect(sameTagsScore).toBeGreaterThan(differentTagsScore);
    });

    it('works with posts that have no tags', () => {
      const noTagsPost1 = createMockPost({
        id: 'no-tags-1',
        title: 'No Tags Post 1',
        tags: [],
        pubDate: new Date('2025-01-15'),
      });

      const noTagsPost2 = createMockPost({
        id: 'no-tags-2',
        title: 'No Tags Post 2',
        tags: [],
        pubDate: new Date('2025-01-14'),
      });

      const score = calculateSimilarityScore(noTagsPost1, noTagsPost2);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('allows custom weights to be injected', () => {
      const currentPost = createMockPost({
        id: 'current',
        title: 'Current Post',
        tags: ['javascript'],
        pubDate: new Date('2025-01-15'),
      });

      const otherPost = createMockPost({
        id: 'other',
        title: 'Other Post',
        tags: ['javascript'],
        pubDate: new Date('2025-01-15'),
      });

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
      const currentPost = createMockPost({
        id: 'current',
        title: 'Current Post',
        tags: ['javascript', 'react'],
        pubDate: new Date('2025-01-15'),
      });

      const otherPost = createMockPost({
        id: 'other',
        title: 'Other Post',
        tags: ['javascript', 'react'],
        pubDate: new Date('2025-01-15'),
      });

      const scoreDefault = calculateSimilarityScore(currentPost, otherPost);
      const scoreExplicit = calculateSimilarityScore(currentPost, otherPost, SIMILARITY_WEIGHTS);

      expect(scoreDefault).toBe(scoreExplicit);
    });
  });

  describe('getRelatedPosts', () => {
    it('excludes the current post', () => {
      const currentPost = createMockPost({
        id: 'current',
        title: 'Current Post',
        tags: ['javascript'],
        pubDate: new Date('2025-01-15'),
      });

      const allPosts = [
        currentPost,
        createMockPost({
          id: 'other1',
          title: 'Other Post 1',
          tags: ['javascript'],
          pubDate: new Date('2025-01-14'),
        }),
        createMockPost({
          id: 'other2',
          title: 'Other Post 2',
          tags: ['python'],
          pubDate: new Date('2025-01-13'),
        }),
      ];

      const relatedPosts = getRelatedPosts(currentPost, allPosts, 3);

      expect(relatedPosts).not.toContainEqual(expect.objectContaining({ id: 'current' }));
    });

    it('returns the specified number of related posts', () => {
      const currentPost = createMockPost({
        id: 'current',
        title: 'Current Post',
        tags: ['javascript'],
        pubDate: new Date('2025-01-15'),
      });

      const allPosts = [
        currentPost,
        createMockPost({
          id: 'other1',
          title: 'Other Post 1',
          tags: ['javascript'],
          pubDate: new Date('2025-01-14'),
        }),
        createMockPost({
          id: 'other2',
          title: 'Other Post 2',
          tags: ['python'],
          pubDate: new Date('2025-01-13'),
        }),
        createMockPost({
          id: 'other3',
          title: 'Other Post 3',
          tags: ['react'],
          pubDate: new Date('2025-01-12'),
        }),
        createMockPost({
          id: 'other4',
          title: 'Other Post 4',
          tags: ['vue'],
          pubDate: new Date('2025-01-11'),
        }),
      ];

      const relatedPosts = getRelatedPosts(currentPost, allPosts, 2);
      expect(relatedPosts).toHaveLength(2);
    });

    it('returns available posts when requesting more than available', () => {
      const currentPost = createMockPost({
        id: 'current',
        title: 'Current Post',
        tags: ['javascript'],
        pubDate: new Date('2025-01-15'),
      });

      const allPosts = [
        currentPost,
        createMockPost({
          id: 'other1',
          title: 'Other Post 1',
          tags: ['javascript'],
          pubDate: new Date('2025-01-14'),
        }),
      ];

      const relatedPosts = getRelatedPosts(currentPost, allPosts, 5);
      expect(relatedPosts).toHaveLength(1);
    });

    it('returns posts sorted by score descending', () => {
      const currentPost = createMockPost({
        id: 'current',
        title: 'Current Post',
        tags: ['javascript', 'react', 'astro'],
        pubDate: new Date('2025-01-15'),
      });

      const allPosts = [
        currentPost,
        createMockPost({
          id: 'low',
          title: 'Low Relevance',
          tags: ['python'],
          pubDate: new Date('2024-01-01'),
        }),
        createMockPost({
          id: 'high',
          title: 'High Relevance',
          tags: ['javascript', 'react', 'astro'],
          pubDate: new Date('2025-01-14'),
        }),
        createMockPost({
          id: 'medium',
          title: 'Medium Relevance',
          tags: ['javascript'],
          pubDate: new Date('2025-01-10'),
        }),
      ];

      const relatedPosts = getRelatedPosts(currentPost, allPosts, 3);

      expect(relatedPosts[0].id).toBe('high');
      expect(relatedPosts[1].id).toBe('medium');
      expect(relatedPosts[2].id).toBe('low');
    });

    it('returns empty array when only current post exists', () => {
      const currentPost = createMockPost({
        id: 'current',
        title: 'Current Post',
        tags: ['javascript'],
        pubDate: new Date('2025-01-15'),
      });

      const allPosts = [currentPost];

      const relatedPosts = getRelatedPosts(currentPost, allPosts, 3);
      expect(relatedPosts).toEqual([]);
    });

    it('includes posts with zero score', () => {
      const currentPost = createMockPost({
        id: 'current',
        title: 'Current Post',
        tags: ['javascript'],
        pubDate: new Date('2025-01-15'),
      });

      const allPosts = [
        currentPost,
        createMockPost({
          id: 'no-match',
          title: 'No Match',
          tags: ['python'],
          pubDate: new Date('2024-01-01'),
        }),
      ];

      const relatedPosts = getRelatedPosts(currentPost, allPosts, 1);
      expect(relatedPosts).toHaveLength(1);
      expect(relatedPosts[0].id).toBe('no-match');
    });
  });
});
