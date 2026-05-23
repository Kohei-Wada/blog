#!/usr/bin/env node
// Enforce that every blog post exists in BOTH locales (ja/ and en/).
// Run by the pre-commit hook and in CI so a post can never ship in only
// one language.
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const BLOG_DIR = 'src/content/blog';
const LOCALES = ['ja', 'en'];

function slugsFor(locale) {
  const dir = join(BLOG_DIR, locale);
  if (!existsSync(dir)) {
    console.error(`✗ Expected directory ${dir} does not exist.`);
    process.exit(1);
  }
  return new Set(
    readdirSync(dir)
      .filter(f => /\.mdx?$/.test(f))
      .map(f => f.replace(/\.mdx?$/, ''))
  );
}

const [ja, en] = LOCALES.map(slugsFor);

const missingEn = [...ja].filter(s => !en.has(s)).sort();
const missingJa = [...en].filter(s => !ja.has(s)).sort();

if (missingEn.length === 0 && missingJa.length === 0) {
  console.log(`✓ post locale parity OK (${ja.size} ja / ${en.size} en)`);
  process.exit(0);
}

console.error('✗ Blog post locale parity check failed.\n');
if (missingEn.length > 0) {
  console.error('Missing English versions (add the file before committing):');
  for (const s of missingEn) console.error(`  - ${BLOG_DIR}/en/${s}.md  (ja/ exists)`);
  console.error('');
}
if (missingJa.length > 0) {
  console.error('Missing Japanese versions (add the file before committing):');
  for (const s of missingJa) console.error(`  - ${BLOG_DIR}/ja/${s}.md  (en/ exists)`);
  console.error('');
}
console.error('Every post must exist in both ja/ and en/.');
process.exit(1);
