#!/usr/bin/env node
// Cross-post published en posts that opt in with `devto: true` to dev.to as drafts, and keep them in sync.
// New posts are created unpublished; publishing is done by hand on dev.to.
// Updates keep the article's current published state.
// State (slug -> article id + content hash) lives in src/data/devto.json.
// Run by .github/workflows/devto-sync.yml. `--dry-run` skips the API.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { parsePost, shouldCrosspost, toDevtoArticle } from './lib/devto.mjs';

const API = 'https://dev.to/api';
const EN_DIR = 'src/content/blog/en';
const STATE = 'src/data/devto.json';
const dryRun = process.argv.includes('--dry-run');

const apiKey = process.env.DEV_TO_API_KEY;
if (!apiKey && !dryRun) {
  console.error('DEV_TO_API_KEY is not set');
  process.exit(1);
}

/** @type {Record<string, { id: number; hash: string }>} */
const state = JSON.parse(readFileSync(STATE, 'utf8'));
const saveState = () => writeFileSync(STATE, JSON.stringify(state, null, 2) + '\n');

async function api(method, path, body) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(API + path, {
      method,
      headers: {
        'api-key': apiKey,
        accept: 'application/vnd.forem.api-v1+json',
        'content-type': 'application/json',
      },
      body: body && JSON.stringify(body),
    });
    if (res.status === 429 && attempt < 3) {
      const wait = Number(res.headers.get('retry-after') ?? 30);
      console.log(`rate limited, waiting ${wait}s`);
      await sleep(wait * 1000);
      continue;
    }
    if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${await res.text()}`);
    return res.json();
  }
}

const posts = readdirSync(EN_DIR)
  .filter(f => /\.mdx?$/.test(f))
  .map(f => ({
    slug: f.replace(/\.mdx?$/, ''),
    ...parsePost(readFileSync(join(EN_DIR, f), 'utf8')),
  }))
  .filter(p => shouldCrosspost(p.data, Date.now()))
  .sort((a, b) => new Date(a.data.pubDate).valueOf() - new Date(b.data.pubDate).valueOf());

/** @type {Map<number, boolean>} */
const publishedById = new Map();
if (!dryRun) {
  for (let page = 1; ; page++) {
    const batch = await api('GET', `/articles/me/all?per_page=1000&page=${page}`);
    for (const a of batch) publishedById.set(a.id, a.published);
    if (batch.length < 1000) break;
  }
}

let created = 0;
let updated = 0;
for (const post of posts) {
  const hash = createHash('sha256')
    .update(JSON.stringify(toDevtoArticle(post, { published: false })))
    .digest('hex');
  const known = state[post.slug];
  if (known?.hash === hash) continue;

  if (dryRun) {
    console.log(`${known ? 'update' : 'create'} ${post.slug}`);
    continue;
  }

  if (known) {
    if (!publishedById.has(known.id)) {
      console.warn(`skip ${post.slug}: dev.to article ${known.id} not found`);
      continue;
    }
    const article = toDevtoArticle(post, { published: publishedById.get(known.id) });
    await api('PUT', `/articles/${known.id}`, { article });
    updated++;
  } else {
    const res = await api('POST', '/articles', {
      article: toDevtoArticle(post, { published: false }),
    });
    state[post.slug] = { id: res.id, hash };
    created++;
  }
  state[post.slug].hash = hash;
  saveState();
  console.log(`${known ? 'updated' : 'created'} ${post.slug}`);
}

console.log(
  `✓ dev.to sync: ${created} created, ${updated} updated, ${posts.length} opted-in posts`
);
