// Turn an en blog post into a dev.to (Forem API v1) article payload.
import { parse } from 'yaml';

const SITE = 'https://wada-dev.com';
const RAW = 'https://raw.githubusercontent.com/Kohei-Wada/blog/main';
// Required by dev.to's guidelines for AI-assisted articles.
const DISCLOSURE = '_This post was written with AI assistance and reviewed by the author._';
const FRONTMATTER = /^---\n([\s\S]*?)\n---\n+/;

/** @param {string} source */
export function parsePost(source) {
  const m = FRONTMATTER.exec(source);
  if (!m) throw new Error('missing frontmatter');
  return { data: parse(m[1]), body: source.slice(m[0].length) };
}

/**
 * @param {Record<string, any>} data
 * @param {number} now
 */
export function shouldCrosspost(data, now) {
  return data.devto === true && new Date(data.pubDate).valueOf() <= now;
}

/**
 * Stock posts (published before `before`) not yet on dev.to, most-read first.
 * @param {Array<{ slug: string; data: Record<string, any> }>} posts
 * @param {{ created: Set<string>; before: number; reads: Record<string, number>; limit: number }} opts
 */
export function selectBacklog(posts, { created, before, reads, limit }) {
  const total = slug => (reads[`en/${slug}`] ?? 0) + (reads[`ja/${slug}`] ?? 0);
  return posts
    .filter(p => !created.has(p.slug) && new Date(p.data.pubDate).valueOf() < before)
    .map(p => p.slug)
    .sort((a, b) => total(b) - total(a))
    .slice(0, limit);
}

/** @param {string[]} tags */
export function devtoTags(tags) {
  const cleaned = tags.map(t => t.toLowerCase().replace(/[^a-z0-9]/g, '')).filter(Boolean);
  return [...new Set(cleaned)].slice(0, 4);
}

/** @param {string} url */
function absolutize(url) {
  if (url.startsWith('/')) return SITE + url;
  // Posts live in src/content/blog/en/, so ../../../ is src/.
  if (url.startsWith('../../../')) return `${RAW}/src/${url.slice('../../../'.length)}`;
  return url;
}

/** @param {string} body */
export function rewriteBody(body) {
  return body
    .split(/(^```[^\n]*\n[\s\S]*?^```$)/m)
    .map((chunk, i) =>
      i % 2 === 1
        ? chunk.replace(/^```(\S*)[^\n]*/, '```$1')
        : chunk.replace(/(!?\[[^\]]*\]\()([^)\s]+)/g, (_, head, url) => head + absolutize(url))
    )
    .join('');
}

/**
 * @param {{ slug: string; data: Record<string, any>; body: string }} post
 * @param {{ published: boolean }} state
 */
export function toDevtoArticle({ slug, data, body }, { published }) {
  return {
    title: data.title,
    description: data.description,
    body_markdown: `${rewriteBody(body).trimEnd()}\n\n---\n\n${DISCLOSURE}\n`,
    tags: devtoTags(data.tags ?? []).join(','),
    canonical_url: `${SITE}/en/blog/${slug}`,
    published,
  };
}
