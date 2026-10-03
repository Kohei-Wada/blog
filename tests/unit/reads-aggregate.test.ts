import { describe, it, expect } from 'vitest';
import { pathToPostId, aggregateReads } from '../../scripts/lib/reads.mjs';

describe('pathToPostId', () => {
  it('maps locale-prefixed post paths to <lang>/<slug>', () => {
    expect(pathToPostId('/ja/blog/foo')).toBe('ja/foo');
    expect(pathToPostId('/en/blog/foo/')).toBe('en/foo');
  });

  it('maps bare /blog/<slug> (pre English-default flip) to ja', () => {
    expect(pathToPostId('/blog/foo/')).toBe('ja/foo');
  });

  it('ignores query strings and fragments', () => {
    expect(pathToPostId('/ja/blog/foo/?utm_source=x#top')).toBe('ja/foo');
  });

  it('returns null for non-post paths', () => {
    expect(pathToPostId('/ja/blog/')).toBeNull();
    expect(pathToPostId('/en/tags/nixos/')).toBeNull();
    expect(pathToPostId('/')).toBeNull();
    expect(pathToPostId('/ja/blog/foo/bar')).toBeNull();
  });
});

describe('aggregateReads', () => {
  const known = new Set(['ja/foo', 'en/foo', 'ja/bar']);

  it('sums counts of paths that map to the same post', () => {
    const rows = [
      { path: '/ja/blog/foo', count: 3 },
      { path: '/ja/blog/foo/', count: 2 },
      { path: '/blog/foo/', count: 1 },
      { path: '/en/blog/foo/', count: 4 },
    ];
    expect(aggregateReads(rows, known)).toEqual({ 'ja/foo': 6, 'en/foo': 4 });
  });

  it('drops paths that are not known posts (listings, pagination, removed posts)', () => {
    const rows = [
      { path: '/ja/blog/2', count: 9 },
      { path: '/ja/blog/gone/', count: 5 },
      { path: '/ja/blog/bar/', count: 1 },
    ];
    expect(aggregateReads(rows, known)).toEqual({ 'ja/bar': 1 });
  });

  it('returns keys in sorted order so the JSON diff stays stable', () => {
    const rows = [
      { path: '/ja/blog/foo/', count: 1 },
      { path: '/en/blog/foo/', count: 1 },
    ];
    expect(Object.keys(aggregateReads(rows, known))).toEqual(['en/foo', 'ja/foo']);
  });
});
