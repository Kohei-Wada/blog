import type { CollectionEntry } from 'astro:content';

export type Reads = Record<string, number>;

export interface RankedPost {
  post: CollectionEntry<'blog'>;
  reads: number;
}

export function getReads(id: string, reads: Reads): number {
  return reads[id] ?? 0;
}

export function rankByReads(
  posts: ReadonlyArray<CollectionEntry<'blog'>>,
  reads: Reads,
  limit: number
): RankedPost[] {
  return posts
    .map(post => ({ post, reads: getReads(post.id, reads) }))
    .filter(r => r.reads > 0)
    .sort(
      (a, b) => b.reads - a.reads || b.post.data.pubDate.valueOf() - a.post.data.pubDate.valueOf()
    )
    .slice(0, limit);
}
