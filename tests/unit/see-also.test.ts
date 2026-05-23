import { describe, it, expect } from 'vitest';
import { resolveSeeAlso } from '../../src/utils/see-also';
import { createMockPost } from '../../src/test/helpers';

const makeFixture = (id: string, title: string) => createMockPost({ id, title });

const jaFixtures = [makeFixture('ja/post-a', 'Post A'), makeFixture('ja/post-b', 'Post B')];

describe('resolveSeeAlso', () => {
  it('resolves slugs in the same locale to { title, href }', () => {
    const out = resolveSeeAlso(['post-b'], 'ja/post-a', jaFixtures);
    expect(out).toEqual([{ title: 'Post B', href: '/blog/post-b' }]);
  });

  it('produces /en/blog/<slug> for en-locale source posts', () => {
    const enFixtures = [makeFixture('en/post-c', 'Post C')];
    const out = resolveSeeAlso(['post-c'], 'en/post-a', enFixtures);
    expect(out).toEqual([{ title: 'Post C', href: '/en/blog/post-c' }]);
  });

  it('throws when a slug does not resolve in the same locale', () => {
    expect(() => resolveSeeAlso(['missing'], 'ja/post-a', jaFixtures)).toThrow(/seeAlso.*missing/i);
  });

  it('returns an empty array for an empty input', () => {
    expect(resolveSeeAlso([], 'ja/post-a', jaFixtures)).toEqual([]);
  });
});
