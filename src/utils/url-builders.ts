/**
 * URL Builder Utilities
 * Centralized URL generation to prevent manual URL construction errors
 */

/**
 * Generate URL for a blog post
 * @param postId Post ID (filename without extension)
 * @returns Blog post URL (e.g., /blog/my-first-post/)
 */
export function getBlogPostUrl(postId: string): string {
  return `/blog/${postId}/`;
}

/**
 * Generate URL for a tag page
 * @param tag Tag name
 * @returns Tag page URL (e.g., /tags/typescript/)
 */
export function getTagUrl(tag: string): string {
  return `/tags/${tag}/`;
}

/**
 * Generate URL for a monthly archive page
 * @param year Year (4 digits)
 * @param month Month (1-12)
 * @returns Archive page URL (e.g., /archives/2024-01/)
 */
export function getArchiveUrl(year: number, month: number): string {
  const monthStr = month.toString().padStart(2, '0');
  return `/archives/${year}-${monthStr}/`;
}
