import Fuse, { type IFuseOptions, type FuseResult } from 'fuse.js';

export interface SearchItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  pubDate: string;
  url: string;
}

export type SearchResult = FuseResult<SearchItem>;

export const FUSE_OPTIONS: IFuseOptions<SearchItem> = {
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'description', weight: 0.3 },
    { name: 'tags', weight: 0.3 },
  ],
  threshold: 0.4,
  includeScore: true,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

export function createSearchIndex(items: SearchItem[]): Fuse<SearchItem> {
  return new Fuse(items, FUSE_OPTIONS);
}

export function search(fuse: Fuse<SearchItem>, query: string): SearchResult[] {
  if (!query.trim()) return [];
  return fuse.search(query);
}
