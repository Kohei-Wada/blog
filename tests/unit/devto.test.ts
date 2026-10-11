import { describe, it, expect } from 'vitest';
import {
  parsePost,
  shouldCrosspost,
  selectBacklog,
  devtoTags,
  rewriteBody,
  toDevtoArticle,
} from '../../scripts/lib/devto.mjs';

const SITE = 'https://wada-dev.com';
const RAW = 'https://raw.githubusercontent.com/Kohei-Wada/blog/main';
const DISCLOSURE = '_This post was written with AI assistance and reviewed by the author._';

describe('parsePost', () => {
  it('splits YAML frontmatter from the body', () => {
    const src = "---\ntitle: 'Hi'\ntags: ['a', 'b']\n---\n\n## Body\n";
    expect(parsePost(src)).toEqual({
      data: { title: 'Hi', tags: ['a', 'b'] },
      body: '## Body\n',
    });
  });
});

describe('shouldCrosspost', () => {
  const now = new Date('2026-10-11T00:00:00Z').valueOf();

  it('accepts published posts that opt in with devto: true', () => {
    expect(shouldCrosspost({ devto: true, pubDate: '2026-10-01' }, now)).toBe(true);
  });

  it('rejects posts without the opt-in', () => {
    expect(shouldCrosspost({ pubDate: '2026-10-01' }, now)).toBe(false);
    expect(shouldCrosspost({ devto: false, pubDate: '2026-10-01' }, now)).toBe(false);
  });

  it('rejects scheduled posts that are not live yet', () => {
    expect(shouldCrosspost({ devto: true, pubDate: '2026-10-12T15:00+09:00' }, now)).toBe(false);
  });
});

describe('selectBacklog', () => {
  const before = new Date('2026-10-11T00:00+09:00').valueOf();
  const post = (slug: string, pubDate: string) => ({ slug, data: { pubDate } });
  const posts = [
    post('old-a', '2026-01-01'),
    post('old-b', '2026-02-01'),
    post('old-c', '2026-03-01'),
    post('new', '2026-10-12'),
  ];
  const reads = { 'en/old-a': 1, 'ja/old-a': 2, 'en/old-b': 5, 'ja/old-c': 4 };

  it('picks the most-read uncreated stock posts first, up to the limit', () => {
    expect(selectBacklog(posts, { created: new Set(), before, reads, limit: 2 })).toEqual([
      'old-b',
      'old-c',
    ]);
  });

  it('skips posts already on dev.to', () => {
    const created = new Set(['old-b']);
    expect(selectBacklog(posts, { created, before, reads, limit: 1 })).toEqual(['old-c']);
  });

  it('never treats posts from the cutoff on as stock', () => {
    const created = new Set(['old-a', 'old-b', 'old-c']);
    expect(selectBacklog(posts, { created, before, reads, limit: 5 })).toEqual([]);
  });

  it('selects nothing when the limit is 0', () => {
    expect(selectBacklog(posts, { created: new Set(), before, reads, limit: 0 })).toEqual([]);
  });
});

describe('devtoTags', () => {
  it('lowercases and strips non-alphanumerics (dev.to rejects them)', () => {
    expect(devtoTags(['Claude Code', 'personal-projects'])).toEqual([
      'claudecode',
      'personalprojects',
    ]);
  });

  it('keeps at most four unique, non-empty tags', () => {
    expect(devtoTags(['a', 'A', '--', 'b', 'c', 'd', 'e'])).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('rewriteBody', () => {
  it('makes site-relative links absolute', () => {
    expect(rewriteBody('[post](/en/blog/foo/)')).toBe(`[post](${SITE}/en/blog/foo/)`);
  });

  it('points relative asset images at the raw GitHub file', () => {
    expect(rewriteBody('![alt](../../../assets/x.png)')).toBe(`![alt](${RAW}/src/assets/x.png)`);
  });

  it('leaves absolute URLs and anchors alone', () => {
    const md = '[a](https://example.com/x) [b](#top)';
    expect(rewriteBody(md)).toBe(md);
  });

  it('drops expressive-code fence meta that dev.to does not understand', () => {
    expect(rewriteBody('```bash frame="terminal"\nls\n```')).toBe('```bash\nls\n```');
  });

  it('does not rewrite links inside code fences', () => {
    const md = '```md\n[x](/en/blog/foo)\n```';
    expect(rewriteBody(md)).toBe(md);
  });
});

describe('toDevtoArticle', () => {
  const post = {
    slug: 'foo',
    data: {
      title: 'Foo',
      description: 'About foo',
      pubDate: '2026-10-03T15:00+09:00',
      tags: ['AI', 'Claude Code'],
    },
    body: 'See [bar](/en/blog/bar).\n',
  };

  it('builds the article payload with a canonical URL to the original post', () => {
    expect(toDevtoArticle(post, { published: false })).toEqual({
      title: 'Foo',
      description: 'About foo',
      body_markdown: `See [bar](${SITE}/en/blog/bar).\n\n---\n\n${DISCLOSURE}\n`,
      tags: 'ai,claudecode',
      canonical_url: `${SITE}/en/blog/foo`,
      published: false,
    });
  });

  it('passes the current published state through so updates never unpublish', () => {
    expect(toDevtoArticle(post, { published: true }).published).toBe(true);
  });
});
