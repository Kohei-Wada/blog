#!/usr/bin/env node
// Enforce that every blog post exists in ALL locales (the directories under
// src/content/blog/). Run by the pre-commit hook and in CI so a post can
// never ship in only one language.
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const BLOG_DIR = 'src/content/blog';

const LOCALES = readdirSync(BLOG_DIR, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)
  .sort();

if (LOCALES.length < 2) {
  console.error(`✗ Expected at least two locale directories under ${BLOG_DIR}.`);
  process.exit(1);
}

function slugsFor(locale) {
  return new Set(
    readdirSync(join(BLOG_DIR, locale))
      .filter(f => /\.mdx?$/.test(f))
      .map(f => f.replace(/\.mdx?$/, ''))
  );
}

const slugSets = new Map(LOCALES.map(locale => [locale, slugsFor(locale)]));
const allSlugs = new Set([...slugSets.values()].flatMap(set => [...set]));

const missing = new Map();
for (const [locale, set] of slugSets) {
  const absent = [...allSlugs].filter(s => !set.has(s)).sort();
  if (absent.length > 0) missing.set(locale, absent);
}

if (missing.size === 0) {
  const counts = LOCALES.map(locale => `${slugSets.get(locale).size} ${locale}`).join(' / ');
  console.log(`✓ post locale parity OK (${counts})`);
  process.exit(0);
}

console.error('✗ Blog post locale parity check failed.\n');
for (const [locale, slugs] of missing) {
  console.error(`Missing ${locale} versions (add the file before committing):`);
  for (const s of slugs) console.error(`  - ${BLOG_DIR}/${locale}/${s}.md`);
  console.error('');
}
console.error(`Every post must exist in all locales (${LOCALES.join(', ')}).`);
process.exit(1);
