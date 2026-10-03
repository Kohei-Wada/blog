#!/usr/bin/env node
// Fetch per-post engaged sessions (all time) from GA4 and write
// src/data/reads.json. Run weekly by .github/workflows/weekly-reads.yml.
// Auth: GOOGLE_APPLICATION_CREDENTIALS pointing at the ga4-reader key.
import { readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { aggregateReads } from './lib/reads.mjs';

const PROPERTY = 'properties/493101723';
const BLOG_DIR = 'src/content/blog';
const OUT = 'src/data/reads.json';

const knownIds = new Set(
  readdirSync(BLOG_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .flatMap(({ name: lang }) =>
      readdirSync(join(BLOG_DIR, lang))
        .filter(f => /\.mdx?$/.test(f))
        .map(f => `${lang}/${f.replace(/\.mdx?$/, '')}`)
    )
);

const client = new BetaAnalyticsDataClient();
const [report] = await client.runReport({
  property: PROPERTY,
  dimensions: [{ name: 'pagePath' }],
  metrics: [{ name: 'engagedSessions' }],
  dateRanges: [{ startDate: '2015-08-14', endDate: 'today' }],
  limit: 100000,
});

const rows = (report.rows ?? []).map(row => ({
  path: row.dimensionValues[0].value,
  count: Number(row.metricValues[0].value),
}));
const reads = aggregateReads(rows, knownIds);

writeFileSync(
  OUT,
  JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), reads }, null, 2) + '\n'
);
console.log(`✓ wrote ${Object.keys(reads).length} posts to ${OUT}`);
