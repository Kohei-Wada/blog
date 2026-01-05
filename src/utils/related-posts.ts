import type { CollectionEntry } from 'astro:content';
import { SIMILARITY_WEIGHTS, type SimilarityWeights } from '../constants/similarity';

/**
 * Calculate similarity score between two posts
 * @param currentPost The current post
 * @param otherPost The post to compare against
 * @param weights Scoring weights (injectable for testing)
 * @returns Score between 0 and 1 (1 being most similar)
 */
export function calculateSimilarityScore(
  currentPost: CollectionEntry<'blog'>,
  otherPost: CollectionEntry<'blog'>,
  weights: SimilarityWeights = SIMILARITY_WEIGHTS
): number {
  // Tag-based score
  const currentTags = currentPost.data.tags || [];
  const otherTags = otherPost.data.tags || [];

  let tagScore = 0;
  if (currentTags.length > 0 && otherTags.length > 0) {
    const otherTagsSet = new Set(otherTags);
    const commonTags = currentTags.filter(tag => otherTagsSet.has(tag));
    const uniqueTags = new Set([...currentTags, ...otherTags]);
    tagScore = commonTags.length / uniqueTags.size;
  }

  // Date proximity score
  const currentDate = currentPost.data.pubDate.getTime();
  const otherDate = otherPost.data.pubDate.getTime();
  const daysDiff = Math.abs(currentDate - otherDate) / (1000 * 60 * 60 * 24);

  // Decay function: 1.0 within RECENT_DAYS, 0.0 at MAX_DAYS
  const decayRange = weights.MAX_DAYS - weights.RECENT_DAYS;
  let dateScore = 0;
  if (daysDiff <= weights.RECENT_DAYS) {
    dateScore = 1.0;
  } else if (daysDiff <= weights.MAX_DAYS) {
    dateScore = 1.0 - (daysDiff - weights.RECENT_DAYS) / decayRange;
  } else {
    dateScore = 0;
  }

  // Weighted total score
  const totalScore = tagScore * weights.TAG_WEIGHT + dateScore * weights.DATE_WEIGHT;

  return Math.max(0, Math.min(1, totalScore)); // Clamp to 0-1 range
}

/**
 * Get related posts for the current post
 * @param currentPost The current post
 * @param allPosts All available posts
 * @param limit Maximum number of related posts to return
 * @returns Posts sorted by relevance score (highest first)
 */
export function getRelatedPosts(
  currentPost: CollectionEntry<'blog'>,
  allPosts: CollectionEntry<'blog'>[],
  limit: number = 3
): CollectionEntry<'blog'>[] {
  // Exclude current post
  const otherPosts = allPosts.filter(post => post.id !== currentPost.id);

  // Calculate score for each post
  const postsWithScores = otherPosts.map(post => ({
    post,
    score: calculateSimilarityScore(currentPost, post),
  }));

  // Sort by score descending
  postsWithScores.sort((a, b) => b.score - a.score);

  // Return top N posts
  return postsWithScores.slice(0, limit).map(item => item.post);
}
