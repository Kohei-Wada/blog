import { describe, it, expect } from 'vitest';
import { getReads, rankByReads } from '../../src/utils/reads';
import { createMockPost } from '../helpers';

const reads = { 'ja/a': 5, 'ja/b': 12, 'ja/c': 5, 'en/a': 2 };

describe('getReads', () => {
  it('returns the count for a post id', () => {
    expect(getReads('ja/b', reads)).toBe(12);
  });

  it('returns 0 for a post with no data', () => {
    expect(getReads('ja/missing', reads)).toBe(0);
  });
});

describe('rankByReads', () => {
  const posts = [
    createMockPost({ id: 'ja/a', pubDate: '2026-01-01' }),
    createMockPost({ id: 'ja/b', pubDate: '2026-02-01' }),
    createMockPost({ id: 'ja/c', pubDate: '2026-03-01' }),
    createMockPost({ id: 'ja/d', pubDate: '2026-04-01' }),
  ];

  it('orders by reads desc, newer post first on ties', () => {
    const out = rankByReads(posts, reads, 10).map(r => [r.post.id, r.reads]);
    expect(out).toEqual([
      ['ja/b', 12],
      ['ja/c', 5],
      ['ja/a', 5],
    ]);
  });

  it('leaves out posts with zero reads', () => {
    expect(rankByReads(posts, reads, 10).some(r => r.post.id === 'ja/d')).toBe(false);
  });

  it('caps the list at the limit', () => {
    expect(rankByReads(posts, reads, 1)).toHaveLength(1);
  });
});
