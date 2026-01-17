import type { CollectionEntry } from 'astro:content';

/**
 * Sort posts by date in descending order (newest first)
 * @param posts Array of blog posts
 * @returns New array sorted by date (original array is not modified)
 */
export function sortPostsByDate(posts: CollectionEntry<'blog'>[]): CollectionEntry<'blog'>[] {
  return [...posts].sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/**
 * Sort posts by featured flag first, then by date
 * - Featured posts appear first (sorted by date within featured)
 * - Non-featured posts follow (sorted by date)
 * @param posts Array of blog posts
 * @returns New array sorted by featured then date (original array is not modified)
 */
export function sortPostsByFeaturedThenDate(
  posts: CollectionEntry<'blog'>[]
): CollectionEntry<'blog'>[] {
  return [...posts].sort((a, b) => {
    // Featured posts come first
    if (a.data.featured && !b.data.featured) return -1;
    if (!a.data.featured && b.data.featured) return 1;
    // Same featured status: sort by date (newest first)
    return b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
  });
}
