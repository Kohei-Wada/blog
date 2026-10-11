import { describe, it, expect } from 'vitest';
import { parsePost, devtoTags, rewriteBody, toDevtoArticle } from '../../scripts/lib/devto.mjs';

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
