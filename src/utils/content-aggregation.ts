import type { CollectionEntry } from 'astro:content';

/**
 * Sort posts by publication date (newest first)
 */
export function sortPostsByDate(posts: CollectionEntry<'blog'>[]): CollectionEntry<'blog'>[] {
  return [...posts].sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/**
 * Count the number of posts for each tag
 * @param posts Array of blog posts
 * @returns Object with tag names as keys and counts as values
 */
export function getTagCounts(posts: CollectionEntry<'blog'>[]): Record<string, number> {
  return posts.reduce(
    (acc, post) => {
      post.data.tags.forEach(tag => {
        acc[tag] = (acc[tag] ?? 0) + 1;
      });
      return acc;
    },
    {} as Record<string, number>
  );
}

/**
 * Filter posts by a specific tag
 * @param posts Array of blog posts
 * @param tag Tag to filter by
 * @returns Array of posts that contain the specified tag
 */
export function getPostsByTag(
  posts: CollectionEntry<'blog'>[],
  tag: string
): CollectionEntry<'blog'>[] {
  return posts.filter(post => post.data.tags.includes(tag));
}

/**
 * Get all unique tags from posts, sorted alphabetically
 * @param posts Array of blog posts
 * @returns Array of unique tag names, sorted alphabetically
 */
export function getAllTags(posts: CollectionEntry<'blog'>[]): string[] {
  return Array.from(new Set(posts.flatMap(post => post.data.tags))).sort();
}

/**
 * Get tags sorted by post count (descending)
 * @param posts Array of blog posts
 * @returns Array of tag names, sorted by count (most posts first)
 */
export function getTagsSortedByCount(posts: CollectionEntry<'blog'>[]): string[] {
  const tagCounts = getTagCounts(posts);
  return Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([tag]) => tag);
}
