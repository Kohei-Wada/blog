import Fuse, { type IFuseOptions, type FuseResult } from 'fuse.js';

export interface SearchItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  pubDate: string;
  url: string;
  body: string;
}

export type SearchResult = FuseResult<SearchItem>;

export const FUSE_OPTIONS: IFuseOptions<SearchItem> = {
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'tags', weight: 0.25 },
    { name: 'description', weight: 0.2 },
    { name: 'body', weight: 0.15 },
  ],
  threshold: 0.4,
  includeScore: true,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

const BODY_INDEX_MAX_CHARS = 2000;

export function truncateBody(body: string): string {
  return body.length > BODY_INDEX_MAX_CHARS ? body.slice(0, BODY_INDEX_MAX_CHARS) : body;
}

const MARKDOWN_STRIP_PATTERNS: Array<[RegExp, string]> = [
  [/```[\s\S]*?```/g, ' '],
  [/`([^`]+)`/g, '$1'],
  [/!\[[^\]]*\]\([^)]+\)/g, ' '],
  [/\[([^\]]+)\]\([^)]+\)/g, '$1'],
  [/^#{1,6}\s+/gm, ''],
  [/^>\s?/gm, ''],
  [/^[-*+]\s+/gm, ''],
  [/\*\*([^*]+)\*\*/g, '$1'],
  [/\*([^*]+)\*/g, '$1'],
  [/__([^_]+)__/g, '$1'],
  [/_([^_]+)_/g, '$1'],
  [/<!--[\s\S]*?-->/g, ' '],
  [/<\/?[a-zA-Z][^>]*>/g, ''],
];

export function stripMarkdown(input: string): string {
  let out = input;
  for (const [pattern, replacement] of MARKDOWN_STRIP_PATTERNS) {
    out = out.replace(pattern, replacement);
  }
  return out.replace(/\s+/g, ' ').trim();
}

export function createSearchIndex(items: SearchItem[]): Fuse<SearchItem> {
  return new Fuse(items, FUSE_OPTIONS);
}

export function search(fuse: Fuse<SearchItem>, query: string): SearchResult[] {
  if (!query.trim()) return [];
  return fuse.search(query);
}
