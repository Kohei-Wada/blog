import { describe, it, expect } from 'vitest';
import { getRelatedPosts, calculateSimilarityScore } from '@/utils/related-posts';
import type { CollectionEntry } from 'astro:content';

// モックデータの作成
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
    it('共通タグが多いほど高いスコアを返す', () => {
      const currentPost = createMockPost(
        'current',
        'Current Post',
        ['javascript', 'react', 'astro'],
        new Date('2025-01-15')
      );

      const relatedPost1 = createMockPost(
        'related1',
        'Related Post 1',
        ['javascript', 'react', 'astro'], // 3つ全て一致
        new Date('2025-01-15')
      );

      const relatedPost2 = createMockPost(
        'related2',
        'Related Post 2',
        ['javascript', 'vue'], // 1つだけ一致
        new Date('2025-01-15')
      );

      const score1 = calculateSimilarityScore(currentPost, relatedPost1);
      const score2 = calculateSimilarityScore(currentPost, relatedPost2);

      expect(score1).toBeGreaterThan(score2);
    });

    it('日付が近いほど高いスコアを返す', () => {
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
        new Date('2025-01-14') // 1日前
      );

      const oldPost = createMockPost(
        'old',
        'Old Post',
        ['javascript'],
        new Date('2024-12-01') // 1ヶ月以上前
      );

      const recentScore = calculateSimilarityScore(currentPost, recentPost);
      const oldScore = calculateSimilarityScore(currentPost, oldPost);

      expect(recentScore).toBeGreaterThan(oldScore);
    });

    it('タグの重みが日付の重みより大きい', () => {
      const currentPost = createMockPost(
        'current',
        'Current Post',
        ['javascript', 'react'],
        new Date('2025-01-15')
      );

      const sameTagsOldPost = createMockPost(
        'same-tags-old',
        'Same Tags Old Post',
        ['javascript', 'react'], // タグは完全一致
        new Date('2024-06-01') // 古い日付
      );

      const differentTagsRecentPost = createMockPost(
        'different-tags-recent',
        'Different Tags Recent Post',
        ['python', 'django'], // タグは一致しない
        new Date('2025-01-14') // 新しい日付
      );

      const sameTagsScore = calculateSimilarityScore(currentPost, sameTagsOldPost);
      const differentTagsScore = calculateSimilarityScore(currentPost, differentTagsRecentPost);

      expect(sameTagsScore).toBeGreaterThan(differentTagsScore);
    });

    it('タグがない記事でも動作する', () => {
      const noTagsPost1 = createMockPost('no-tags-1', 'No Tags Post 1', [], new Date('2025-01-15'));

      const noTagsPost2 = createMockPost('no-tags-2', 'No Tags Post 2', [], new Date('2025-01-14'));

      const score = calculateSimilarityScore(noTagsPost1, noTagsPost2);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('getRelatedPosts', () => {
    it('現在の記事を除外する', () => {
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

    it('指定した数の関連記事を返す', () => {
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

    it('利用可能な記事数より多く要求した場合、利用可能な数だけ返す', () => {
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

    it('スコアの高い順に記事を返す', () => {
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

    it('現在の記事のみの場合、空配列を返す', () => {
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

    it('スコアが0の記事も含める', () => {
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
