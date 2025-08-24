import type { CollectionEntry } from 'astro:content';

/**
 * 2つの記事間の類似度スコアを計算する
 * @param currentPost 現在の記事
 * @param otherPost 比較対象の記事
 * @returns 0から1の間のスコア（1が最も類似）
 */
export function calculateSimilarityScore(
  currentPost: CollectionEntry<'blog'>,
  otherPost: CollectionEntry<'blog'>
): number {
  // タグベースのスコア（重み: 70%）
  const currentTags = currentPost.data.tags || [];
  const otherTags = otherPost.data.tags || [];

  let tagScore = 0;
  if (currentTags.length > 0 && otherTags.length > 0) {
    const commonTags = currentTags.filter(tag => otherTags.includes(tag));
    const uniqueTags = new Set([...currentTags, ...otherTags]);
    tagScore = commonTags.length / uniqueTags.size;
  }

  // 日付の近さベースのスコア（重み: 30%）
  const currentDate = currentPost.data.pubDate.getTime();
  const otherDate = otherPost.data.pubDate.getTime();
  const daysDiff = Math.abs(currentDate - otherDate) / (1000 * 60 * 60 * 24);

  // 30日以内を1.0、365日で0.0になるような減衰関数
  let dateScore = 0;
  if (daysDiff <= 30) {
    dateScore = 1.0;
  } else if (daysDiff <= 365) {
    dateScore = 1.0 - (daysDiff - 30) / 335;
  } else {
    dateScore = 0;
  }

  // 重み付けされた総合スコア
  const totalScore = tagScore * 0.7 + dateScore * 0.3;

  return Math.max(0, Math.min(1, totalScore)); // 0から1の範囲に制限
}

/**
 * 現在の記事に関連する記事を取得する
 * @param currentPost 現在の記事
 * @param allPosts すべての記事
 * @param limit 取得する関連記事の最大数
 * @returns 関連度の高い順にソートされた記事の配列
 */
export function getRelatedPosts(
  currentPost: CollectionEntry<'blog'>,
  allPosts: CollectionEntry<'blog'>[],
  limit: number = 3
): CollectionEntry<'blog'>[] {
  // 現在の記事を除外
  const otherPosts = allPosts.filter(post => post.id !== currentPost.id);

  // 各記事のスコアを計算
  const postsWithScores = otherPosts.map(post => ({
    post,
    score: calculateSimilarityScore(currentPost, post),
  }));

  // スコアの高い順にソート
  postsWithScores.sort((a, b) => b.score - a.score);

  // 指定された数だけ取得
  return postsWithScores.slice(0, limit).map(item => item.post);
}
