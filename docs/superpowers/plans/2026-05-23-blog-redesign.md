# Blog Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current Astro 5 blog's visual identity with a paper / amber terminal × man-page hybrid, add bilingual (ja default, /en/) routing infrastructure, and restructure article pages around man-page semantic sections — while preserving every existing JP URL, RSS feed, search, sitemap, tags, archives, tests, and CI.

**Architecture:** Two-layer adoption: keep the existing Astro 5 repository, its content collection, its `fuse.js` search, its RSS / sitemap output, its CI / test / lint stack — and rewrite the visual layer (`src/styles/`, `src/layouts/`, `src/components/`, the `src/pages/` route files) against a new monospace, paper-cream design system. Astro's built-in i18n routing handles locale prefixes (`defaultLocale: 'ja'` with `prefixDefaultLocale: false`); content is split into `src/content/blog/ja/` and `src/content/blog/en/` directories so the loader derives `lang` from the file path.

**Tech Stack:** Astro 5.x · TypeScript · `@astrojs/mdx`, `@astrojs/rss`, `@astrojs/sitemap` · `astro-expressive-code` · `fuse.js` · vitest + `happy-dom` + `@testing-library/dom` · ESLint · Prettier · markdownlint-cli2 · pre-commit (gitleaks, yamllint, actionlint).

**Spec:** `docs/superpowers/specs/2026-05-23-blog-redesign-design.md`.

---

## File Structure

### Created

| Path | Responsibility |
|---|---|
| `src/i18n/strings.ts` | UI string catalog keyed by locale (`ja`, `en`) |
| `src/utils/i18n.ts` | Locale-from-URL, sibling-URL, fallback resolution helpers |
| `src/components/shared/LangSwitcher.astro` | `[ja\|en]` toggle component |
| `src/components/blog/content/PostsList.astro` | `ls -la`-style listing component (replaces / complements `PostsGrid.astro`) |
| `src/styles/components/man-page.css` | Layout primitives (`.man-section`, `.man-footer`, `.ls-listing`, `.man-prompt`, `.tag-pill`, `.man-rule`) |
| `src/utils/see-also.ts` | Resolve `seeAlso` slug entries to post titles + URLs at build time |
| `src/pages/en/index.astro` | EN locale home (empty state initially) |
| `src/pages/en/blog/[...slug].astro` | EN locale individual post route |
| `src/pages/en/blog/[...page].astro` | EN locale paginated blog list |
| `src/pages/en/tags/index.astro` | EN locale tags index |
| `src/pages/en/tags/[tag]/[...page].astro` | EN locale per-tag listing |
| `src/pages/en/archives/index.astro` | EN locale archive index |
| `src/pages/en/archives/[yearmonth]/[...page].astro` | EN locale per-year-month archive |
| `src/pages/en/about.astro` | EN locale about page (placeholder) |
| `tests/unit/i18n-strings.test.ts` | Strings lookup behavior |
| `tests/unit/i18n-utils.test.ts` | Locale helpers (current from URL, sibling URL, fallback) |
| `tests/unit/see-also.test.ts` | `seeAlso` resolution + missing-entry error |
| `tests/unit/blog-url-stability.test.ts` | Asserts all 14 existing JP slugs still resolve at `/blog/<slug>` |
| `tests/components/LangSwitcher.test.ts` | Switcher renders, active locale bold, link to sibling |

### Modified

| Path | Change |
|---|---|
| `astro.config.mjs` | Add `i18n: { defaultLocale: 'ja', locales: ['ja','en'], routing: { prefixDefaultLocale: false } }` |
| `src/content.config.ts` | Glob `**/*.md`; loader derives `lang` from path; add optional `seeAlso?: string[]` |
| `src/consts.ts` | Add `DEFAULT_LANG`, `LOCALES`; route header / footer labels through `i18n/strings.ts` |
| `src/styles/base/variables.css` | Replace tokens with Paper / Amber set |
| `src/styles/base/typography.css` | All-monospace stack, man-page heading rules |
| `src/styles/base/reset.css` | Minor token-only adjustments |
| `src/styles/base/responsive.css` | Keep breakpoints; SECTION indent collapses 7ch → 2ch at ≤ 600px |
| `src/styles/components.css` + `components/*.css` | Rewire against new tokens; import `man-page.css` |
| `src/layouts/BaseLayout.astro` | New header (man-page title bar + LangSwitcher) and footer |
| `src/layouts/BlogPost.astro` | Restructure to NAME / SYNOPSIS / DESCRIPTION / TAGS / SEE ALSO + footer |
| `src/layouts/BlogListLayout.astro` | Render `PostsList` instead of `PostsGrid` |
| `src/components/blog/content/PostsGrid.astro` | Deleted after callers switch to `PostsList` |
| `src/components/shared/layout/HeroSection.astro` | Deleted (home gets NAME / SYNOPSIS / DESCRIPTION instead) |
| `src/pages/index.astro` | Home: NAME / SYNOPSIS / DESCRIPTION / RECENT POSTS / PROJECTS / SEE ALSO |
| `src/pages/about.astro` | `whoami` man-page layout |
| `src/pages/contact.astro` | Man-page layout |
| `src/pages/privacy.astro` | Man-page layout |
| `src/pages/404.astro` | `command not found` style |
| `src/pages/blog/[...slug].astro` | `getStaticPaths` enumerates only `ja/` collection |
| `src/pages/blog/[...page].astro` | Use `PostsList`; man-page wrapper |
| `src/pages/tags/index.astro` | Man-page wrapper |
| `src/pages/tags/[tag]/[...page].astro` | Use `PostsList`; man-page wrapper |
| `src/pages/archives/index.astro` | Man-page wrapper |
| `src/pages/archives/[yearmonth]/[...page].astro` | Use `PostsList`; man-page wrapper |

### Moved

| From | To |
|---|---|
| `src/content/blog/<slug>.md` (× 14) | `src/content/blog/ja/<slug>.md` |

### Deleted

| Path | Reason |
|---|---|
| `src/components/blog/content/PostsGrid.astro` | Replaced by `PostsList.astro` |
| `src/components/shared/layout/HeroSection.astro` | Replaced by inline NAME / SYNOPSIS / DESCRIPTION on home |

---

## Phase 0 — Branch & Baseline

### Task 0: Create implementation branch and verify baseline green

**Files:**

- N/A (git operations)

- [ ] **Step 0.1: Verify clean working tree**

Run:

```bash
cd /home/kohei/ghq/github.com/Kohei-Wada/blog
git status
```

Expected: `nothing to commit, working tree clean` (the four spec / config commits from 2026-05-23 are already pushed).

- [ ] **Step 0.2: Create feature branch from current main**

Run:

```bash
git checkout -b feat/blog-redesign-man-page
```

- [ ] **Step 0.3: Verify baseline build, lint, test, typecheck all pass**

Run:

```bash
npm run build && npm run test:run && npm run lint && npm run typecheck
```

Expected: all four commands exit 0. If any fail, stop and fix on main first — don't carry pre-existing breakage into the redesign branch.

---

## Phase 1 — Visual Tokens & Primitives

These tasks change the CSS variable system and add man-page primitive classes. **No layout file consumes them yet**, so the rendered UI continues to look (mostly) like the old design. The goal is to ship a buildable intermediate state.

### Task 1: Replace `variables.css` with Paper / Amber token set

**Files:**

- Modify: `src/styles/base/variables.css`

- [ ] **Step 1.1: Read existing file**

Run:

```bash
cat src/styles/base/variables.css
```

Note the old token names so the rest of the codebase still resolves (the file currently exposes `--color-bg`, `--color-text`, `--accent`, etc — keep those names; only change the values).

- [ ] **Step 1.2: Replace token values**

Edit `src/styles/base/variables.css` so the `:root` block (and any `[data-theme=dark]` block, if present) reads:

```css
:root {
  /* Paper / Amber palette — primary tokens */
  --bg:        #f4ecd8;
  --bg-alt:    #ece4cf;
  --text:      #2a2826;
  --text-dim:  #928374;
  --accent:    #af3a03;
  --accent-2:  #79740e;
  --border:    rgba(42, 40, 38, 0.15);
  --link:      var(--accent);

  /* Back-compat aliases — kept until callers migrate */
  --color-bg:           var(--bg);
  --color-bg-secondary: var(--bg-alt);
  --color-text:         var(--text);
  --color-text-secondary: var(--text-dim);
  --color-border:       var(--border);
  --color-border-light: var(--border);
  --color-link:         var(--link);
  --color-link-hover:   var(--accent);
  --accent-dark:        var(--accent);
  --accent-light:       var(--accent);
  --header-bg:          var(--bg);
  --header-shadow:      none;
  --code-bg:            var(--bg-alt);
  --code-text:          var(--text);
  --toc-bg:             var(--bg);
  --toc-border:         var(--border);
}
```

Delete any `[data-theme=dark]` selector block — the new design is Paper-only.

- [ ] **Step 1.3: Build to confirm no token is dangling**

Run:

```bash
npm run build
```

Expected: exit 0. The rendered output now uses Paper colors everywhere it previously used the old tokens.

- [ ] **Step 1.4: Commit**

```bash
git add src/styles/base/variables.css
git commit -m "refactor(styles): replace color tokens with Paper/Amber palette"
```

### Task 2: Rewrite `typography.css` for all-monospace + man-page heading rules

**Files:**

- Modify: `src/styles/base/typography.css`

- [ ] **Step 2.1: Replace the file body**

Edit `src/styles/base/typography.css` to:

```css
:root {
  --font-mono:
    'JetBrains Mono', 'Fira Code', ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
  --font-size-base: 15px;
  --font-size-sm:   13px;
  --font-size-lg:   17px;
  --line-height:    1.6;
  --line-height-tight: 1.4;
  --max-content:    80ch;
  --indent-section: 7ch;
  --indent-section-sm: 2ch;
}

html, body {
  font-family: var(--font-mono);
  font-size: var(--font-size-base);
  line-height: var(--line-height);
  color: var(--text);
  background: var(--bg);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-mono);
  line-height: var(--line-height-tight);
  margin: 1.5em 0 0.5em;
  color: var(--text);
}

h1 { font-size: 24px; }
h2 { font-size: 19px; }
h3 { font-size: 16px; }
h4 { font-size: 15px; font-weight: 600; }

p, ul, ol, blockquote, pre, table {
  margin: 0 0 1em;
}

a {
  color: var(--link);
  text-decoration: underline;
}

a:hover { color: var(--accent); }
```

- [ ] **Step 2.2: Build**

Run:

```bash
npm run build
```

Expected: exit 0. The site now renders in monospace at 15px base.

- [ ] **Step 2.3: Commit**

```bash
git add src/styles/base/typography.css
git commit -m "refactor(styles): switch to all-monospace typography"
```

### Task 3: Update `responsive.css` to consume the new tokens and add SECTION indent collapse

**Files:**

- Modify: `src/styles/base/responsive.css`

- [ ] **Step 3.1: Inspect existing breakpoints**

Run:

```bash
cat src/styles/base/responsive.css
```

- [ ] **Step 3.2: Replace any references to old `--color-*` tokens with the new `--bg`, `--text`, etc**

Inside the existing file, change every `--color-bg` → `--bg`, `--color-text` → `--text`, `--color-border` → `--border`, etc. The back-compat aliases from Task 1 keep the old names valid, but use the canonical new names so future grep is honest.

- [ ] **Step 3.3: Append SECTION indent collapse**

At the end of the file, add:

```css
@media (max-width: 600px) {
  :root {
    --indent-section: var(--indent-section-sm);
  }
}
```

- [ ] **Step 3.4: Build**

Run:

```bash
npm run build
```

Expected: exit 0.

- [ ] **Step 3.5: Commit**

```bash
git add src/styles/base/responsive.css
git commit -m "refactor(styles): retoken responsive.css and add section indent collapse"
```

### Task 4: Add `man-page.css` with layout primitives

**Files:**

- Create: `src/styles/components/man-page.css`
- Modify: `src/styles/components.css` (import the new file)

- [ ] **Step 4.1: Create `src/styles/components/man-page.css`**

Write the file with:

```css
/* ---- man-page semantic primitives ------------------------------------ */

.man-page {
  max-width: var(--max-content);
  margin: 0 auto;
  padding: 0 1rem;
}

.man-section {
  margin: 1.5em 0;
}

.man-section > h2 {
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: var(--font-size-base);
  margin: 0 0 0.5em;
  padding: 0;
}

.man-section > :not(h2) {
  padding-left: var(--indent-section);
}

.man-section :where(h3, h4, h5, h6) {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 600;
}

.man-footer {
  margin-top: 3em;
  padding-top: 1em;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  color: var(--text-dim);
  font-size: var(--font-size-sm);
}

.man-rule {
  border: 0;
  border-top: 1px solid var(--border);
  margin: 1.5em 0;
}

.man-prompt::before {
  content: '$ ';
  color: var(--text-dim);
}

.ls-listing {
  list-style: none;
  padding: 0;
  margin: 0;
}

.ls-listing li {
  display: grid;
  grid-template-columns: 12ch 8ch 12ch 1fr;
  gap: 1ch;
  align-items: baseline;
  padding: 0.15em 0;
}

.ls-listing .perms { color: var(--text-dim); }
.ls-listing .size  { color: var(--text-dim); text-align: right; }
.ls-listing .date  { color: var(--text-dim); }
.ls-listing .title a { color: var(--text); }
.ls-listing .title a:hover { color: var(--accent); }

@media (max-width: 600px) {
  .ls-listing li {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .ls-listing .perms,
  .ls-listing .size { display: none; }
}

.tag-pill {
  color: var(--accent-2);
  text-decoration: underline;
  margin-right: 0.5ch;
}
```

- [ ] **Step 4.2: Import from `components.css`**

Append to `src/styles/components.css`:

```css
@import './components/man-page.css';
```

If `components.css` already uses `@import` for siblings, follow the existing convention. If it doesn't, the `BaseLayout.astro` work in Task 23 will import `man-page.css` directly instead — drop this step and rely on Task 23.

- [ ] **Step 4.3: Build**

Run:

```bash
npm run build
```

Expected: exit 0. No primitive is consumed yet; this just registers the rules.

- [ ] **Step 4.4: Commit**

```bash
git add src/styles/components/man-page.css src/styles/components.css
git commit -m "feat(styles): add man-page layout primitives"
```

---

## Phase 2 — i18n Strings & Utils (TDD)

### Task 5: `src/i18n/strings.ts` — string catalog with locale lookup

**Files:**

- Create: `src/i18n/strings.ts`
- Test: `tests/unit/i18n-strings.test.ts`

- [ ] **Step 5.1: Write the failing test**

Create `tests/unit/i18n-strings.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { t, type Locale } from '../../src/i18n/strings';

describe('i18n strings', () => {
  it('returns the requested locale value for a known key', () => {
    expect(t('recentPosts', 'ja')).toBe('最近の記事');
    expect(t('recentPosts', 'en')).toBe('Recent posts');
  });

  it('falls back to ja when the en value is missing', () => {
    // For a key that we deliberately leave en-undefined, ja should be returned.
    // (Use a key seeded only on ja in strings.ts.)
    expect(t('jaOnlyFixture' as Parameters<typeof t>[0], 'en')).toBe(
      t('jaOnlyFixture' as Parameters<typeof t>[0], 'ja'),
    );
  });

  it('exposes the Locale type as the union of supported locales', () => {
    const ja: Locale = 'ja';
    const en: Locale = 'en';
    expect([ja, en]).toEqual(['ja', 'en']);
  });
});
```

- [ ] **Step 5.2: Run test to verify it fails**

Run:

```bash
npx vitest run tests/unit/i18n-strings.test.ts
```

Expected: FAIL with "Cannot find module '../../src/i18n/strings'".

- [ ] **Step 5.3: Implement `src/i18n/strings.ts`**

Create the file:

```ts
export type Locale = 'ja' | 'en';

const strings = {
  recentPosts:        { ja: '最近の記事',           en: 'Recent posts' },
  allEntries:         { ja: '全エントリ',           en: 'All entries' },
  navigation:         { ja: 'ナビゲーション',       en: 'Navigation' },
  searchPlaceholder:  { ja: 'キーワード検索',       en: 'Search posts' },
  tagsPage:           { ja: 'タグ一覧',             en: 'All tags' },
  archivesPage:       { ja: 'アーカイブ',           en: 'Archives' },
  homeLink:           { ja: 'ホーム',               en: 'Home' },
  blogLink:           { ja: '記事',                 en: 'Posts' },
  aboutLink:          { ja: 'about',                en: 'About' },
  jaOnlyNotice:       { ja: '(この記事は日本語のみ)', en: '(post is JP-only)' },
  enOnlyNotice:       { ja: '(この記事は英語のみ)',   en: '(post is EN-only)' },
  fallbackHomeNotice: { ja: '対応する翻訳がないためホームに移動しました', en: 'No translation — taken to the home page' },
  projects:           { ja: 'プロジェクト',         en: 'Projects' },
  // Test fixture: deliberately ja-only so the fallback test in i18n-strings.test.ts has something to assert.
  jaOnlyFixture:      { ja: 'fixture値' },
} as const;

export type StringKey = keyof typeof strings;

export function t(key: StringKey, locale: Locale): string {
  const entry = strings[key] as Partial<Record<Locale, string>>;
  return entry[locale] ?? entry.ja ?? key;
}
```

- [ ] **Step 5.4: Run test to verify it passes**

Run:

```bash
npx vitest run tests/unit/i18n-strings.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 5.5: Commit**

```bash
git add src/i18n/strings.ts tests/unit/i18n-strings.test.ts
git commit -m "feat(i18n): add string catalog with locale lookup and fallback"
```

### Task 6: `src/utils/i18n.ts` — locale-from-URL, sibling-URL, default-fallback helpers

**Files:**

- Create: `src/utils/i18n.ts`
- Test: `tests/unit/i18n-utils.test.ts`

- [ ] **Step 6.1: Write the failing test**

Create `tests/unit/i18n-utils.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { localeFromUrl, siblingUrl, otherLocale } from '../../src/utils/i18n';

describe('i18n utils', () => {
  describe('localeFromUrl', () => {
    it('returns ja for URLs without an /en/ prefix', () => {
      expect(localeFromUrl(new URL('http://x/'))).toBe('ja');
      expect(localeFromUrl(new URL('http://x/blog/foo'))).toBe('ja');
      expect(localeFromUrl(new URL('http://x/tags/'))).toBe('ja');
    });

    it('returns en for URLs that begin with /en/ (or are exactly /en)', () => {
      expect(localeFromUrl(new URL('http://x/en/'))).toBe('en');
      expect(localeFromUrl(new URL('http://x/en/blog/foo'))).toBe('en');
      expect(localeFromUrl(new URL('http://x/en'))).toBe('en');
    });
  });

  describe('otherLocale', () => {
    it('toggles ja <-> en', () => {
      expect(otherLocale('ja')).toBe('en');
      expect(otherLocale('en')).toBe('ja');
    });
  });

  describe('siblingUrl', () => {
    it('adds /en prefix when going from ja to en', () => {
      expect(siblingUrl('/', 'ja', 'en')).toBe('/en/');
      expect(siblingUrl('/blog/taskdog', 'ja', 'en')).toBe('/en/blog/taskdog');
    });

    it('strips /en prefix when going from en to ja', () => {
      expect(siblingUrl('/en/', 'en', 'ja')).toBe('/');
      expect(siblingUrl('/en/blog/taskdog', 'en', 'ja')).toBe('/blog/taskdog');
    });

    it('returns the same path when target locale equals current locale', () => {
      expect(siblingUrl('/blog/foo', 'ja', 'ja')).toBe('/blog/foo');
      expect(siblingUrl('/en/blog/foo', 'en', 'en')).toBe('/en/blog/foo');
    });
  });
});
```

- [ ] **Step 6.2: Run test to verify it fails**

Run:

```bash
npx vitest run tests/unit/i18n-utils.test.ts
```

Expected: FAIL with "Cannot find module '../../src/utils/i18n'".

- [ ] **Step 6.3: Implement `src/utils/i18n.ts`**

```ts
import type { Locale } from '../i18n/strings';

export const DEFAULT_LOCALE: Locale = 'ja';
export const LOCALES: readonly Locale[] = ['ja', 'en'] as const;

export function localeFromUrl(url: URL): Locale {
  const segments = url.pathname.split('/').filter(Boolean);
  return segments[0] === 'en' ? 'en' : 'ja';
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'ja' ? 'en' : 'ja';
}

export function siblingUrl(pathname: string, from: Locale, to: Locale): string {
  if (from === to) return pathname;
  if (to === 'en') {
    // ja → en: prepend /en
    return pathname === '/' ? '/en/' : `/en${pathname}`;
  }
  // en → ja: strip leading /en
  if (pathname === '/en' || pathname === '/en/') return '/';
  return pathname.replace(/^\/en/, '');
}
```

- [ ] **Step 6.4: Run test to verify it passes**

Run:

```bash
npx vitest run tests/unit/i18n-utils.test.ts
```

Expected: PASS (7 assertions across 4 describe blocks).

- [ ] **Step 6.5: Commit**

```bash
git add src/utils/i18n.ts tests/unit/i18n-utils.test.ts
git commit -m "feat(i18n): add locale-from-URL and sibling-URL helpers"
```

---

## Phase 3 — Content Collection Split

### Task 7: Move all 14 existing posts into `src/content/blog/ja/`

**Files:**

- Move: `src/content/blog/*.md` → `src/content/blog/ja/`

- [ ] **Step 7.1: Inspect current posts**

Run:

```bash
ls src/content/blog/*.md | wc -l
ls src/content/blog/*.md
```

Expected: 14 files listed. The bare `*.md` glob should not match `blog-template.md` if it lives at the same level — verify by listing.

- [ ] **Step 7.2: Move with `git mv`**

Run:

```bash
mkdir -p src/content/blog/ja src/content/blog/en
git mv src/content/blog/*.md src/content/blog/ja/
ls src/content/blog/ja | wc -l
```

Expected: `15` (or `14` if `blog-template.md` is not at the same level as posts). If `blog-template.md` got moved by mistake, move it back:

```bash
git mv src/content/blog/ja/blog-template.md src/content/blog/blog-template.md
```

- [ ] **Step 7.3: Build to confirm collection still resolves**

Run:

```bash
npm run build
```

Expected: build may fail with "Cannot find collection entries" — that's expected; Task 8 fixes it by updating the loader glob.

- [ ] **Step 7.4: Do NOT commit yet**

The repository is in a partially-broken state until Task 8 updates the content config. Commit at the end of Task 8 as a single logical change.

### Task 8: Update `content.config.ts` to glob `**/*.md`, derive `lang` from path, add optional `seeAlso`

**Files:**

- Modify: `src/content.config.ts`

- [ ] **Step 8.1: Replace the file**

Edit `src/content.config.ts` to:

```ts
import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  loader: glob({
    base: './src/content/blog',
    pattern: 'ja/**/*.{md,mdx},en/**/*.{md,mdx}',
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    updatedDate: z.coerce.date().optional(),
    featured: z.boolean().default(false),
    seeAlso: z.array(z.string()).default([]),
  }),
});

export const collections = { blog };
```

The pattern intentionally excludes `blog-template.md` at the top level (the template is a non-content authoring helper).

The `lang` field is **not** in the schema — it is derived from `entry.id` at consumption time (entries land with ids like `ja/taskdog-cli-task-management-tool`). A helper in Task 9 reads it.

- [ ] **Step 8.2: Build**

Run:

```bash
npm run build
```

Expected: build still fails — the existing `src/pages/blog/[...slug].astro` calls `post.id` which previously was just the slug, but now is `ja/<slug>`. Task 10 fixes the route. Continue.

- [ ] **Step 8.3: Commit the move + schema together**

Run:

```bash
git add src/content/blog src/content.config.ts
git commit -m "refactor(content): move JP posts to ja/ subdirectory and add seeAlso/en scaffolding"
```

### Task 9: Add `getPostLang` and `getPostSlug` helpers on top of the collection

**Files:**

- Create: `src/utils/post-locale.ts`
- Test: `tests/unit/post-locale.test.ts`

- [ ] **Step 9.1: Write the failing test**

Create `tests/unit/post-locale.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getPostLang, getPostSlug } from '../../src/utils/post-locale';

describe('post-locale', () => {
  it('extracts ja from a JP-locale entry id', () => {
    expect(getPostLang('ja/taskdog-cli-task-management-tool')).toBe('ja');
  });

  it('extracts en from an EN-locale entry id', () => {
    expect(getPostLang('en/taskdog-cli-task-management-tool')).toBe('en');
  });

  it('returns the slug without the locale prefix', () => {
    expect(getPostSlug('ja/taskdog-cli-task-management-tool')).toBe(
      'taskdog-cli-task-management-tool',
    );
    expect(getPostSlug('en/taskdog-cli-task-management-tool')).toBe(
      'taskdog-cli-task-management-tool',
    );
  });

  it('throws for an id that lacks a recognised locale prefix', () => {
    expect(() => getPostLang('no-prefix')).toThrow(/locale prefix/);
  });
});
```

- [ ] **Step 9.2: Verify failure**

Run:

```bash
npx vitest run tests/unit/post-locale.test.ts
```

Expected: FAIL with module-not-found.

- [ ] **Step 9.3: Implement `src/utils/post-locale.ts`**

```ts
import type { Locale } from '../i18n/strings';
import { LOCALES } from './i18n';

export function getPostLang(id: string): Locale {
  const prefix = id.split('/')[0];
  if (LOCALES.includes(prefix as Locale)) return prefix as Locale;
  throw new Error(`Post id "${id}" lacks a recognised locale prefix (expected one of: ${LOCALES.join(', ')})`);
}

export function getPostSlug(id: string): string {
  return id.split('/').slice(1).join('/');
}
```

- [ ] **Step 9.4: Verify pass**

Run:

```bash
npx vitest run tests/unit/post-locale.test.ts
```

Expected: PASS (4 assertions).

- [ ] **Step 9.5: Commit**

```bash
git add src/utils/post-locale.ts tests/unit/post-locale.test.ts
git commit -m "feat(content): add getPostLang/getPostSlug helpers"
```

### Task 10: Update `src/pages/blog/[...slug].astro` to restore JP URL stability

**Files:**

- Modify: `src/pages/blog/[...slug].astro`
- Test: `tests/unit/blog-url-stability.test.ts`

- [ ] **Step 10.1: Write the URL-stability test first**

Create `tests/unit/blog-url-stability.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getCollection } from 'astro:content';
import { getPostLang, getPostSlug } from '../../src/utils/post-locale';

describe('blog URL stability', () => {
  it('preserves every existing JP slug at /blog/<slug>', async () => {
    const all = await getCollection('blog');
    const ja = all.filter(p => getPostLang(p.id) === 'ja');

    // Known JP slugs from the original (pre-redesign) flat layout.
    const expected = [
      'bread-compression-calorie-reduction',
      'container-use-parallel-development',
      'first-post',
      'github-actions-netlify-scheduled-deploy',
      'haskell-unix-pipelines',
      'hyprland-waybar-exec-start-hyprland',
      'obsidian-lychee-link-checker',
      'shell-functional-programming',
      'tar-ssh-pipe-technique',
      'taskdog-cli-task-management-tool',
    ];

    const actualSlugs = ja.map(p => getPostSlug(p.id)).sort();

    for (const slug of expected) {
      expect(actualSlugs).toContain(slug);
    }
  });
});
```

Note: the `expected` list above is the 10 slugs visible in the directory listing at the start of this plan; if your local clone has additional posts not yet pushed, extend the array before running.

- [ ] **Step 10.2: Replace `src/pages/blog/[...slug].astro`**

```astro
---
import { type CollectionEntry, getCollection } from 'astro:content';
import BlogPost from '../../layouts/BlogPost.astro';
import { render } from 'astro:content';
import { getRelatedPosts } from '../../utils/related-posts';
import { getPostLang, getPostSlug } from '../../utils/post-locale';

export async function getStaticPaths() {
  const all = await getCollection('blog');
  const ja = all.filter(p => getPostLang(p.id) === 'ja');
  return ja.map(post => ({
    params: { slug: getPostSlug(post.id) },
    props: post,
  }));
}

type Props = CollectionEntry<'blog'>;

const post = Astro.props;
const { Content, headings } = await render(post);

const all = await getCollection('blog');
const sameLang = all.filter(p => getPostLang(p.id) === getPostLang(post.id));
const relatedPosts = getRelatedPosts(post, sameLang, 3);
---

<BlogPost {...post.data} headings={headings} relatedPosts={relatedPosts}>
  <Content />
</BlogPost>
```

- [ ] **Step 10.3: Run the URL-stability test**

Run:

```bash
npx vitest run tests/unit/blog-url-stability.test.ts
```

Expected: PASS.

- [ ] **Step 10.4: Build**

Run:

```bash
npm run build
```

Expected: exit 0.

- [ ] **Step 10.5: Commit**

```bash
git add src/pages/blog/\[...slug\].astro tests/unit/blog-url-stability.test.ts
git commit -m "fix(routes): restore /blog/<slug> after locale-prefixed ids"
```

### Task 11: Update `src/pages/blog/[...page].astro`, `tags/`, `archives/` to filter on JP locale

**Files:**

- Modify: `src/pages/blog/[...page].astro`
- Modify: `src/pages/tags/[tag]/[...page].astro`
- Modify: `src/pages/tags/index.astro`
- Modify: `src/pages/archives/index.astro`
- Modify: `src/pages/archives/[yearmonth]/[...page].astro`

- [ ] **Step 11.1: Inspect each file's `getStaticPaths` / `getCollection` usage**

Run:

```bash
grep -n "getCollection" src/pages/blog/\[...page\].astro src/pages/tags/\[tag\]/\[...page\].astro src/pages/tags/index.astro src/pages/archives/index.astro src/pages/archives/\[yearmonth\]/\[...page\].astro
```

- [ ] **Step 11.2: In each file, add a JP-only filter immediately after the `getCollection('blog')` call**

Pattern to apply (adapt to each file's variable names):

```ts
import { getPostLang } from '../../utils/post-locale';
// ...
const allPosts = await getCollection('blog');
const posts = allPosts.filter(p => getPostLang(p.id) === 'ja');
```

For files nested two levels deep (e.g. `tags/[tag]/[...page].astro`), the import path is `'../../../utils/post-locale'`. Use the correct relative depth per file.

- [ ] **Step 11.3: Also update `src/pages/index.astro` to filter on `ja`**

If `src/pages/index.astro` calls `getCollection('blog')` directly, apply the same JP filter. (The home redesign in Task 25 will rewrite this file end-to-end; this step keeps the build green in the interim.)

- [ ] **Step 11.4: Build**

Run:

```bash
npm run build
```

Expected: exit 0. All listing pages now show JP posts only and continue to use existing URLs.

- [ ] **Step 11.5: Existing test suite**

Run:

```bash
npm run test:run
```

Expected: PASS. The existing test suite (search, related-posts, content-aggregation, etc) should be unaffected as long as the JP filter is applied before those utilities run.

- [ ] **Step 11.6: Commit**

```bash
git add src/pages/blog/\[...page\].astro src/pages/tags src/pages/archives src/pages/index.astro
git commit -m "fix(routes): filter listing pages to JP locale until i18n routing is wired"
```

---

## Phase 4 — Astro i18n Routing & EN Scaffold

### Task 12: Add `i18n` config to `astro.config.mjs`

**Files:**

- Modify: `astro.config.mjs`

- [ ] **Step 12.1: Inspect current config**

Run:

```bash
cat astro.config.mjs
```

- [ ] **Step 12.2: Add `i18n` to the `defineConfig` object**

Inside the top-level `defineConfig({ ... })` call, add:

```js
i18n: {
  defaultLocale: 'ja',
  locales: ['ja', 'en'],
  routing: {
    prefixDefaultLocale: false,
  },
},
```

- [ ] **Step 12.3: Build**

Run:

```bash
npm run build
```

Expected: exit 0. Astro now recognises `ja` (default, no prefix) and `en` (`/en/` prefix). No `/en/` routes exist yet — they are created in Task 13.

- [ ] **Step 12.4: Commit**

```bash
git add astro.config.mjs
git commit -m "feat(i18n): enable Astro built-in i18n routing (ja default, /en for English)"
```

### Task 13: Create EN locale route scaffold

**Files:**

- Create: `src/pages/en/index.astro`
- Create: `src/pages/en/blog/[...slug].astro`
- Create: `src/pages/en/blog/[...page].astro`
- Create: `src/pages/en/tags/index.astro`
- Create: `src/pages/en/tags/[tag]/[...page].astro`
- Create: `src/pages/en/archives/index.astro`
- Create: `src/pages/en/archives/[yearmonth]/[...page].astro`
- Create: `src/pages/en/about.astro`

- [ ] **Step 13.1: Create `src/pages/en/index.astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { SITE_TITLE } from '../../consts';
---

<BaseLayout title={`${SITE_TITLE} — en`} description="English posts (none yet)">
  <section class="man-section">
    <h2>NAME</h2>
    <p>kohei-wada — engineer / oss maker / yokohama</p>
  </section>
  <section class="man-section">
    <h2>STATUS</h2>
    <p>No English posts yet. Check back soon.</p>
  </section>
</BaseLayout>
```

- [ ] **Step 13.2: Create `src/pages/en/blog/[...slug].astro`**

Mirror of the JP version but filtering on `'en'`:

```astro
---
import { type CollectionEntry, getCollection } from 'astro:content';
import BlogPost from '../../../layouts/BlogPost.astro';
import { render } from 'astro:content';
import { getRelatedPosts } from '../../../utils/related-posts';
import { getPostLang, getPostSlug } from '../../../utils/post-locale';

export async function getStaticPaths() {
  const all = await getCollection('blog');
  const en = all.filter(p => getPostLang(p.id) === 'en');
  return en.map(post => ({
    params: { slug: getPostSlug(post.id) },
    props: post,
  }));
}

type Props = CollectionEntry<'blog'>;

const post = Astro.props;
const { Content, headings } = await render(post);
const all = await getCollection('blog');
const sameLang = all.filter(p => getPostLang(p.id) === getPostLang(post.id));
const relatedPosts = getRelatedPosts(post, sameLang, 3);
---

<BlogPost {...post.data} headings={headings} relatedPosts={relatedPosts}>
  <Content />
</BlogPost>
```

- [ ] **Step 13.3: Create the rest of the EN route shells**

For `[...page].astro`, `tags/`, `archives/`, `about.astro`: copy the JP equivalent verbatim, then replace `getPostLang(p.id) === 'ja'` with `=== 'en'` in every `getCollection` filter. Update relative import paths to match the new nesting depth.

`src/pages/en/about.astro`:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
---

<BaseLayout title="About" description="About Kohei Wada">
  <section class="man-section">
    <h2>NAME</h2>
    <p>whoami — Kohei Wada</p>
  </section>
  <section class="man-section">
    <h2>DESCRIPTION</h2>
    <p>Software engineer in Yokohama, Japan. Building tools.</p>
  </section>
</BaseLayout>
```

- [ ] **Step 13.4: Build**

Run:

```bash
npm run build
```

Expected: exit 0. Inspect `dist/en/` to confirm:

```bash
ls dist/en
```

Expected: at minimum `index.html`, `about.html` plus the empty `blog/`, `tags/`, `archives/` directory trees.

- [ ] **Step 13.5: Commit**

```bash
git add src/pages/en
git commit -m "feat(i18n): scaffold /en route tree (placeholder home, mirrored route shells)"
```

---

## Phase 5 — LangSwitcher Component

### Task 14: `LangSwitcher.astro` component with tests

**Files:**

- Create: `src/components/shared/LangSwitcher.astro`
- Test: `tests/components/LangSwitcher.test.ts`

- [ ] **Step 14.1: Write the failing component test**

Create `tests/components/LangSwitcher.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import LangSwitcher from '../../src/components/shared/LangSwitcher.astro';

async function render(url: string, props: Record<string, unknown> = {}): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(LangSwitcher, {
    request: new Request(`http://x${url}`),
    props,
  });
}

describe('LangSwitcher', () => {
  it('marks ja as active and links to /en/ from /', async () => {
    const html = await render('/');
    expect(html).toContain('aria-current="true"');
    expect(html).toMatch(/<a [^>]*href="\/en\/"/);
    expect(html).toContain('ja');
    expect(html).toContain('en');
  });

  it('marks en as active and links to / from /en/', async () => {
    const html = await render('/en/');
    expect(html).toMatch(/<a [^>]*href="\/"/);
  });

  it('strips /en prefix when current is /en/blog/foo', async () => {
    const html = await render('/en/blog/foo');
    expect(html).toMatch(/href="\/blog\/foo"/);
  });

  it('adds /en prefix when current is /blog/foo', async () => {
    const html = await render('/blog/foo');
    expect(html).toMatch(/href="\/en\/blog\/foo"/);
  });

  it('honours an explicit siblingHref override (used when translation is absent)', async () => {
    const html = await render('/blog/jp-only-post', { siblingHref: '/en/' });
    expect(html).toMatch(/href="\/en\/"/);
    expect(html).not.toMatch(/href="\/en\/blog\/jp-only-post"/);
  });
});
```

- [ ] **Step 14.2: Verify failure**

Run:

```bash
npx vitest run tests/components/LangSwitcher.test.ts
```

Expected: FAIL with module-not-found.

- [ ] **Step 14.3: Implement `src/components/shared/LangSwitcher.astro`**

```astro
---
import { localeFromUrl, otherLocale, siblingUrl, LOCALES } from '../../utils/i18n';
import type { Locale } from '../../i18n/strings';

interface Props {
  /** Override the auto-computed sibling URL. Pass the other-locale home (e.g. '/en/') when no translation exists. */
  siblingHref?: string;
}

const current: Locale = localeFromUrl(Astro.url);
const other: Locale = otherLocale(current);
const computedHref = siblingUrl(Astro.url.pathname, current, other);
const siblingHref = Astro.props.siblingHref ?? computedHref;
---

<nav class="lang-switcher" aria-label="Language">
  [{LOCALES.map((loc, i) => (
    <>
      {loc === current ? (
        <span class="lang-active" aria-current="true">{loc}</span>
      ) : (
        <a href={siblingHref}>{loc}</a>
      )}
      {i < LOCALES.length - 1 ? <span class="lang-sep">|</span> : null}
    </>
  ))}]
</nav>

<style>
  .lang-switcher {
    font-family: var(--font-mono);
    color: var(--text-dim);
  }
  .lang-active {
    font-weight: bold;
    color: var(--text);
  }
  .lang-sep {
    padding: 0 0.25ch;
    color: var(--text-dim);
  }
  .lang-switcher a {
    color: var(--text-dim);
    text-decoration: underline;
  }
  .lang-switcher a:hover { color: var(--accent); }
</style>
```

- [ ] **Step 14.4: Run the component test**

Run:

```bash
npx vitest run tests/components/LangSwitcher.test.ts
```

Expected: PASS (4 assertions).

- [ ] **Step 14.5: Build**

Run:

```bash
npm run build
```

Expected: exit 0.

- [ ] **Step 14.6: Commit**

```bash
git add src/components/shared/LangSwitcher.astro tests/components/LangSwitcher.test.ts
git commit -m "feat(i18n): add LangSwitcher component"
```

---

## Phase 6 — Base Layout Chrome

### Task 15: Rewrite `BaseLayout.astro` with man-page header + footer + LangSwitcher

**Files:**

- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Step 15.1: Inspect current implementation**

Run:

```bash
cat src/layouts/BaseLayout.astro
```

Note which `<slot />` positions exist, which props the page-level files pass (e.g. `title`, `description`, `showSidebar`), and which `<head>` SEO blocks are present — preserve every existing behavior except header / footer chrome and theme toggle.

- [ ] **Step 15.2: Rewrite the layout**

Skeleton — port over the existing `<head>` SEO content (meta tags, OG tags, canonical URL, sitemap link, RSS link) without changing it. Replace only the visible header and footer:

```astro
---
import '../styles/base/reset.css';
import '../styles/base/variables.css';
import '../styles/base/typography.css';
import '../styles/base/responsive.css';
import '../styles/components.css';
import '../styles/components/man-page.css';
import LangSwitcher from '../components/shared/LangSwitcher.astro';
import { SITE_TITLE } from '../consts';
import { localeFromUrl } from '../utils/i18n';
import { t } from '../i18n/strings';

interface Props {
  title: string;
  description: string;
  showSidebar?: boolean;  // kept for back-compat; ignored by new design
  /** Override the LangSwitcher sibling URL when the current page has no translation in the other locale. */
  siblingHref?: string;
}

const { title, description, siblingHref } = Astro.props;
const locale = localeFromUrl(Astro.url);
const pathname = Astro.url.pathname;
const sectionName = 'WADA-DEV(7)';
const today = new Date().toISOString().slice(0, 10);
---

<!doctype html>
<html lang={locale}>
  <head>
    {/* PORT EXISTING <head> CONTENTS HERE verbatim:
        - meta charset, viewport
        - title, description, OG tags
        - canonical link
        - sitemap + RSS <link> tags
        - favicon
        - any SEO structured data <script type="application/ld+json">
       Do not change them. */}
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
  </head>
  <body>
    <header class="man-header">
      <span class="hdr-section">{sectionName}</span>
      <span class="hdr-prompt">$ {pathname === '/' || pathname === '/en/' ? '/' : pathname}</span>
      <LangSwitcher siblingHref={siblingHref} />
    </header>
    <hr class="man-rule" />
    <main class="man-page">
      <slot />
    </main>
    <hr class="man-rule" />
    <footer class="man-footer">
      <span>{sectionName}</span>
      <span>{today}</span>
    </footer>
    <style>
      .man-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        max-width: var(--max-content);
        margin: 1.5em auto 0;
        padding: 0 1rem;
        color: var(--text-dim);
        font-size: var(--font-size-sm);
      }
      .hdr-section { font-weight: bold; color: var(--text); letter-spacing: 0.08em; }
    </style>
  </body>
</html>
```

The "PORT EXISTING `<head>` CONTENTS" block is **not optional**. Copy every `<meta>`, `<link>`, and `<script>` tag from the current file into the new file's `<head>` so SEO / RSS / sitemap / canonical / OG do not regress.

- [ ] **Step 15.3: Build**

Run:

```bash
npm run build
```

Expected: exit 0.

- [ ] **Step 15.4: Sanity check via dev server**

Run:

```bash
npm run dev
```

Open `http://localhost:4321/` (or whichever port Astro reports). Verify:

- Paper-cream background, near-black monospace text
- Header has `WADA-DEV(7)`, `$ /`, `[ja|en]` switcher (ja bold)
- Footer has section label + today's date

Stop dev server with Ctrl-C.

- [ ] **Step 15.5: Existing tests still pass**

Run:

```bash
npm run test:run
```

Expected: PASS.

- [ ] **Step 15.6: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "feat(layout): redesign BaseLayout with man-page chrome and language switcher"
```

---

## Phase 7 — Blog Post Layout

### Task 16: `see-also.ts` resolver with tests

**Files:**

- Create: `src/utils/see-also.ts`
- Test: `tests/unit/see-also.test.ts`

- [ ] **Step 16.1: Write the failing test**

Create `tests/unit/see-also.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { resolveSeeAlso } from '../../src/utils/see-also';
import { createMockPost } from '../../src/test/helpers';

const fixtures = [
  createMockPost({ id: 'ja/post-a', title: 'Post A' }),
  createMockPost({ id: 'ja/post-b', title: 'Post B' }),
];

describe('resolveSeeAlso', () => {
  it('resolves slugs in the same locale to { title, href }', () => {
    const out = resolveSeeAlso(['post-b'], 'ja/post-a', fixtures);
    expect(out).toEqual([{ title: 'Post B', href: '/blog/post-b' }]);
  });

  it('produces /en/blog/<slug> for en-locale source posts', () => {
    const enFixtures = [createMockPost({ id: 'en/post-c', title: 'Post C' })];
    const out = resolveSeeAlso(['post-c'], 'en/post-a', enFixtures);
    expect(out).toEqual([{ title: 'Post C', href: '/en/blog/post-c' }]);
  });

  it('throws when a slug does not resolve in the same locale', () => {
    expect(() => resolveSeeAlso(['missing'], 'ja/post-a', fixtures)).toThrow(
      /seeAlso.*missing/i,
    );
  });

  it('returns an empty array for an empty input', () => {
    expect(resolveSeeAlso([], 'ja/post-a', fixtures)).toEqual([]);
  });
});
```

If `createMockPost` doesn't accept `id` directly, inspect `src/test/helpers.ts` and adjust the fixture shape:

```bash
cat src/test/helpers.ts
```

- [ ] **Step 16.2: Verify failure**

Run:

```bash
npx vitest run tests/unit/see-also.test.ts
```

Expected: FAIL with module-not-found.

- [ ] **Step 16.3: Implement `src/utils/see-also.ts`**

```ts
import type { CollectionEntry } from 'astro:content';
import { getPostLang, getPostSlug } from './post-locale';

export interface SeeAlsoEntry {
  title: string;
  href: string;
}

export function resolveSeeAlso(
  slugs: string[],
  sourceId: string,
  allPosts: ReadonlyArray<CollectionEntry<'blog'>>,
): SeeAlsoEntry[] {
  const sourceLang = getPostLang(sourceId);
  return slugs.map(slug => {
    const found = allPosts.find(
      p => getPostLang(p.id) === sourceLang && getPostSlug(p.id) === slug,
    );
    if (!found) {
      throw new Error(
        `seeAlso entry "${slug}" did not resolve in locale "${sourceLang}". ` +
          `Either add the post or remove the entry from frontmatter.`,
      );
    }
    const prefix = sourceLang === 'en' ? '/en' : '';
    return { title: found.data.title, href: `${prefix}/blog/${slug}` };
  });
}
```

- [ ] **Step 16.4: Verify pass**

Run:

```bash
npx vitest run tests/unit/see-also.test.ts
```

Expected: PASS (4 assertions).

- [ ] **Step 16.5: Commit**

```bash
git add src/utils/see-also.ts tests/unit/see-also.test.ts
git commit -m "feat(content): resolve seeAlso slugs to title + locale-aware href"
```

### Task 17: Rewrite `BlogPost.astro` with man-page sections

**Files:**

- Modify: `src/layouts/BlogPost.astro`

- [ ] **Step 17.1: Inspect current implementation**

Run:

```bash
cat src/layouts/BlogPost.astro
```

Note which props arrive (`title`, `description`, `pubDate`, `tags`, `headings`, `relatedPosts`, `seeAlso` once Task 8's schema is in).

- [ ] **Step 17.2: Replace the body**

```astro
---
import BaseLayout from './BaseLayout.astro';
import { getCollection } from 'astro:content';
import { resolveSeeAlso } from '../utils/see-also';
import { getPostLang, getPostSlug } from '../utils/post-locale';

interface Props {
  title: string;
  description: string;
  pubDate: Date;
  tags: string[];
  featured?: boolean;
  updatedDate?: Date;
  seeAlso?: string[];
  headings?: { depth: number; slug: string; text: string }[];
  relatedPosts?: unknown;
}

const { title, description, pubDate, tags, seeAlso = [] } = Astro.props;
const pubIso = pubDate.toISOString().slice(0, 10);

// Build the SEE ALSO list — resolve at build time so missing slugs error loudly.
const all = await getCollection('blog');
// Astro renders this layout from per-locale [...slug] routes that pass `post.id`
// through to the slot; if it's not available, we derive from the URL.
const sourceId =
  (Astro.props as { id?: string }).id ??
  (() => {
    const seg = Astro.url.pathname.replace(/^\/(en\/)?blog\//, '').replace(/\/$/, '');
    const lang = Astro.url.pathname.startsWith('/en/') ? 'en' : 'ja';
    return `${lang}/${seg}`;
  })();
const seeAlsoEntries = resolveSeeAlso(seeAlso, sourceId, all);
const lang = getPostLang(sourceId);
const slug = getPostSlug(sourceId);
const manTitle = slug.toUpperCase().replace(/-/g, '_');

// Translation pairing: if the same slug exists in the other locale, link to it.
// Otherwise fall back to the other-locale home so the LangSwitcher does not 404.
const otherLang = lang === 'ja' ? 'en' : 'ja';
const hasTranslation = all.some(p => getPostLang(p.id) === otherLang && getPostSlug(p.id) === slug);
const siblingHref = hasTranslation
  ? (otherLang === 'en' ? `/en/blog/${slug}` : `/blog/${slug}`)
  : (otherLang === 'en' ? '/en/' : '/');
---

<BaseLayout title={title} description={description} siblingHref={siblingHref}>
  <article>
    <section class="man-section">
      <h2>NAME</h2>
      <p>{slug}</p>
    </section>

    <section class="man-section">
      <h2>SYNOPSIS</h2>
      <p>{description}</p>
    </section>

    <section class="man-section man-description">
      <h2>DESCRIPTION</h2>
      <div class="post-body">
        <slot />
      </div>
    </section>

    {tags.length > 0 && (
      <section class="man-section">
        <h2>TAGS</h2>
        <p>
          {tags.map((tag, i) => (
            <>
              <a class="tag-pill" href={`${lang === 'en' ? '/en' : ''}/tags/${encodeURIComponent(tag)}/`}>{tag}</a>
              {i < tags.length - 1 ? <span class="tag-sep"> · </span> : null}
            </>
          ))}
        </p>
      </section>
    )}

    {seeAlsoEntries.length > 0 && (
      <section class="man-section">
        <h2>SEE ALSO</h2>
        <ul class="see-also">
          {seeAlsoEntries.map(e => (
            <li><a href={e.href}>{e.title}</a></li>
          ))}
        </ul>
      </section>
    )}

    <footer class="post-bottom-rule">
      <hr class="man-rule" />
      <div class="man-footer">
        <span>{manTitle}(7)</span>
        <span>{pubIso}</span>
      </div>
    </footer>
  </article>

  <style>
    .post-body :where(h2, h3, h4) {
      text-transform: none;
      letter-spacing: 0;
    }
    .see-also { list-style: none; padding: 0; margin: 0; }
    .see-also li { padding: 0.15em 0; }
    .tag-sep { color: var(--text-dim); }
  </style>
</BaseLayout>
```

- [ ] **Step 17.3: Build**

Run:

```bash
npm run build
```

Expected: exit 0.

- [ ] **Step 17.4: Dev server check**

Run:

```bash
npm run dev
```

Open `http://localhost:4321/blog/taskdog-cli-task-management-tool` (or any post slug). Confirm:

- NAME section shows the slug
- SYNOPSIS section shows the post description
- DESCRIPTION section shows the body
- TAGS section shows tag pills if tags exist
- SEE ALSO section is absent (no frontmatter `seeAlso` yet)
- Footer at the bottom shows `TASKDOG_CLI_TASK_MANAGEMENT_TOOL(7)` + pub date

Stop dev server.

- [ ] **Step 17.5: All tests still green**

Run:

```bash
npm run test:run
```

Expected: PASS.

- [ ] **Step 17.6: Commit**

```bash
git add src/layouts/BlogPost.astro
git commit -m "feat(layout): restructure BlogPost as man-page sections"
```

---

## Phase 8 — Listing Layouts

### Task 18: `PostsList.astro` — `ls -la`-style listing component

**Files:**

- Create: `src/components/blog/content/PostsList.astro`

- [ ] **Step 18.1: Look at the existing `PostsGrid.astro` for the prop shape**

Run:

```bash
cat src/components/blog/content/PostsGrid.astro
```

Note which props it accepts (likely `posts: CollectionEntry<'blog'>[]` plus optional pagination context). Match that shape.

- [ ] **Step 18.2: Create `PostsList.astro`**

```astro
---
import type { CollectionEntry } from 'astro:content';
import { getPostLang, getPostSlug } from '../../../utils/post-locale';

interface Props {
  posts: CollectionEntry<'blog'>[];
}

const { posts } = Astro.props;

function formatSize(post: CollectionEntry<'blog'>): string {
  // Rough "K" approximation from rendered body — for visual flavor only.
  const length = post.body?.length ?? 0;
  const kb = Math.max(1, Math.round(length / 1024));
  return `${kb}.0K`;
}

function postHref(post: CollectionEntry<'blog'>): string {
  const lang = getPostLang(post.id);
  const slug = getPostSlug(post.id);
  return lang === 'en' ? `/en/blog/${slug}` : `/blog/${slug}`;
}
---

<ul class="ls-listing">
  {posts.map(post => (
    <li>
      <span class="perms">-rw-r--r--</span>
      <span class="size">{formatSize(post)}</span>
      <span class="date">{post.data.pubDate.toISOString().slice(0, 10)}</span>
      <span class="title"><a href={postHref(post)}>{post.data.title}</a></span>
    </li>
  ))}
</ul>
```

- [ ] **Step 18.3: Build (no caller yet)**

Run:

```bash
npm run build
```

Expected: exit 0. Component compiles but is unused.

- [ ] **Step 18.4: Commit**

```bash
git add src/components/blog/content/PostsList.astro
git commit -m "feat(components): add ls-la-style PostsList component"
```

### Task 19: Switch every listing page to `PostsList` and wrap with man-page chrome

**Files:**

- Modify: `src/pages/blog/[...page].astro`
- Modify: `src/pages/tags/index.astro`
- Modify: `src/pages/tags/[tag]/[...page].astro`
- Modify: `src/pages/archives/index.astro`
- Modify: `src/pages/archives/[yearmonth]/[...page].astro`
- Modify (or replace usage of): `src/layouts/BlogListLayout.astro` — switch its inner grid render to `<PostsList posts={posts} />`

- [ ] **Step 19.1: Update `BlogListLayout.astro`**

Open the file, locate the place that renders `PostsGrid`, replace with `PostsList`. The remaining structure (title, description, pagination controls) stays. Wrap the listing in a `<section class="man-section">` with the appropriate SECTION heading (`LISTING`, `APROPOS`, `BY YEAR`, etc — pick per caller; default to `LISTING`).

If `BlogListLayout` is used by multiple page types with different headings, accept a `sectionLabel` prop (default `'LISTING'`) and let callers override.

- [ ] **Step 19.2: For each `src/pages/.../*.astro` listing page, update the wrapping**

Each page should now look (sketch — adapt to existing pagination context):

```astro
---
// ...existing getStaticPaths + filter logic from Task 11
const { posts /* + pagination */ } = Astro.props;
---

<BaseLayout title={pageTitle} description={pageDescription}>
  <section class="man-section">
    <h2>NAME</h2>
    <p>{nameLine}</p>
  </section>
  <section class="man-section">
    <h2>{sectionLabel /* LISTING / APROPOS / BY YEAR */}</h2>
    <PostsList posts={posts} />
  </section>
  <section class="man-section">
    <h2>NAVIGATION</h2>
    <p>
      <span class="man-prompt"></span><a href="/blog">blog index</a> ·
      <span class="man-prompt"></span><a href="/tags/">tags</a> ·
      <span class="man-prompt"></span><a href="/archives/">archives</a>
    </p>
  </section>
</BaseLayout>
```

Apply with locale-correct hrefs (`/en/...` for EN-tree pages).

For dynamic listing pages (`tags/<tag>`, `archives/<yearmonth>`) where there is no clean per-page translation pairing, pass the other-locale home as the `siblingHref` to `BaseLayout` to keep the LangSwitcher from 404-ing:

```astro
<BaseLayout title={...} description={...} siblingHref={isEnTree ? '/' : '/en/'}>
```

For chrome pages (`tags/index`, `archives/index`, `blog index`) the parallel page exists on both sides; omit `siblingHref` and let the auto-computed sibling URL stand.

- [ ] **Step 19.3: Build**

Run:

```bash
npm run build
```

Expected: exit 0.

- [ ] **Step 19.4: Dev check**

Run:

```bash
npm run dev
```

Visit `/blog`, `/tags/`, `/tags/Python/`, `/archives/`, `/archives/2025-12/`. Confirm each shows a `LISTING` (or analogous) section with the `ls -la` rows and works for pagination.

Stop dev server.

- [ ] **Step 19.5: Tests still green**

Run:

```bash
npm run test:run
```

Expected: PASS.

- [ ] **Step 19.6: Commit**

```bash
git add src/layouts/BlogListLayout.astro src/pages/blog src/pages/tags src/pages/archives
git commit -m "feat(pages): wrap listing pages with man-page sections and switch to PostsList"
```

### Task 20: Delete `PostsGrid.astro` and `HeroSection.astro`

**Files:**

- Delete: `src/components/blog/content/PostsGrid.astro`
- Delete: `src/components/shared/layout/HeroSection.astro`

- [ ] **Step 20.1: Confirm no consumer remains**

Run:

```bash
grep -rn "PostsGrid\|HeroSection" src/ tests/
```

Expected: zero matches. If any remain, fix them first.

- [ ] **Step 20.2: Delete**

Run:

```bash
git rm src/components/blog/content/PostsGrid.astro src/components/shared/layout/HeroSection.astro
```

- [ ] **Step 20.3: Build + test**

Run:

```bash
npm run build && npm run test:run
```

Expected: both exit 0.

- [ ] **Step 20.4: Commit**

```bash
git commit -m "chore: remove unused PostsGrid and HeroSection components"
```

---

## Phase 9 — Page-Specific Redesigns

### Task 21: Rewrite `src/pages/index.astro` (home)

**Files:**

- Modify: `src/pages/index.astro`

- [ ] **Step 21.1: Replace contents**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import PostsList from '../components/blog/content/PostsList.astro';
import { getCollection } from 'astro:content';
import { getPostLang } from '../utils/post-locale';
import {
  SITE_TITLE,
  SITE_DESCRIPTION,
  GITHUB_URL,
  ZENN_URL,
  QIITA_URL,
  X_URL,
} from '../consts';
import { sortPostsByDate } from '../utils/content-aggregation';

const all = await getCollection('blog');
const ja = all.filter(p => getPostLang(p.id) === 'ja');
const featured = ja.filter(p => p.data.featured);
const others = ja.filter(p => !p.data.featured);
const recent = [...sortPostsByDate(featured), ...sortPostsByDate(others)].slice(0, 6);
---

<BaseLayout title={SITE_TITLE} description={SITE_DESCRIPTION}>
  <section class="man-section">
    <h2>NAME</h2>
    <p>kohei-wada — engineer / oss maker / yokohama</p>
  </section>

  <section class="man-section">
    <h2>SYNOPSIS</h2>
    <p><code>$ blog [taskdog | ttymap | knowledge-gardener | ...]</code></p>
  </section>

  <section class="man-section">
    <h2>DESCRIPTION</h2>
    <p>{SITE_DESCRIPTION}</p>
    <p>Notes on building tools and what I learned in the process. Bilingual (ja / en).</p>
  </section>

  <section class="man-section">
    <h2>RECENT POSTS</h2>
    <PostsList posts={recent} />
    <p><a href="/blog">$ ls /blog → all posts</a></p>
  </section>

  <section class="man-section">
    <h2>PROJECTS</h2>
    <ul class="projects">
      <li><a href="https://github.com/Kohei-Wada/taskdog">taskdog</a> — cli task manager</li>
      <li><a href="https://github.com/Kohei-Wada/ttymap">ttymap</a> — tmux session viz</li>
      <li><a href="https://github.com/Kohei-Wada/knowledge-gardener">knowledge-gardener</a> — obsidian + ai</li>
    </ul>
  </section>

  <section class="man-section">
    <h2>SEE ALSO</h2>
    <p>
      <a href={GITHUB_URL}>github(1)</a>,
      <a href={ZENN_URL}>zenn(1)</a>,
      <a href={QIITA_URL}>qiita(1)</a>,
      <a href={X_URL}>x(1)</a>
    </p>
  </section>

  <style>
    .projects { list-style: none; padding: 0; margin: 0; }
    .projects li { padding: 0.15em 0; }
  </style>
</BaseLayout>
```

- [ ] **Step 21.2: Build + dev check**

Run:

```bash
npm run build
npm run dev
```

Visit `/`. Verify all six sections render. Stop dev server.

- [ ] **Step 21.3: Tests still green**

Run:

```bash
npm run test:run
```

Expected: PASS.

- [ ] **Step 21.4: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat(home): redesign home as man-page sections (NAME/SYNOPSIS/DESCRIPTION/RECENT/PROJECTS/SEE ALSO)"
```

### Task 22: Restyle `src/pages/about.astro`

**Files:**

- Modify: `src/pages/about.astro`

- [ ] **Step 22.1: Inspect existing content**

Run:

```bash
cat src/pages/about.astro
```

Identify the user-facing content (achievements, bio, skills) — that text stays. Only the layout chrome / class names change.

- [ ] **Step 22.2: Rewrite the page wrapper**

Replace the page's render-tree (keeping the text content) with:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { AUTHOR_NAME, AUTHOR_BIO, AUTHOR_JOB_TITLE } from '../consts';
---

<BaseLayout title="About" description={AUTHOR_BIO}>
  <section class="man-section">
    <h2>NAME</h2>
    <p>whoami — {AUTHOR_NAME}</p>
  </section>

  <section class="man-section">
    <h2>DESCRIPTION</h2>
    <p>{AUTHOR_JOB_TITLE}. {AUTHOR_BIO}</p>
  </section>

  {/* PORT existing achievements / credentials content here, wrapped in
      <section class="man-section"><h2>ACHIEVEMENTS</h2>...</section> */}

  <section class="man-section">
    <h2>CONTACT</h2>
    <p>
      <span class="man-prompt"></span>mail program3152019@gmail.com<br />
      <a href="https://github.com/Kohei-Wada">github.com/Kohei-Wada</a>
    </p>
  </section>
</BaseLayout>
```

- [ ] **Step 22.3: Build + dev verify**

```bash
npm run build
npm run dev
```

Visit `/about`. Stop dev server.

- [ ] **Step 22.4: Commit**

```bash
git add src/pages/about.astro
git commit -m "feat(about): restyle about page as man-page sections"
```

### Task 23: Restyle `src/pages/404.astro` (command-not-found)

**Files:**

- Modify: `src/pages/404.astro`

- [ ] **Step 23.1: Replace contents**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="404" description="Page not found">
  <section class="man-section">
    <h2>ERROR</h2>
    <pre class="terminal-block"><span class="man-prompt"></span>cat {Astro.url.pathname}
cat: {Astro.url.pathname}: No such file or directory</pre>
  </section>
  <section class="man-section">
    <h2>SEE ALSO</h2>
    <p>
      <span class="man-prompt"></span><a href="/">cd /</a>          [home]<br />
      <span class="man-prompt"></span><a href="/blog">ls /blog</a>  [posts]
    </p>
  </section>
  <style>
    .terminal-block {
      background: var(--bg-alt);
      padding: 1em;
      border-left: 2px solid var(--accent);
      white-space: pre-wrap;
    }
  </style>
</BaseLayout>
```

- [ ] **Step 23.2: Build + check by visiting any nonsense URL**

```bash
npm run build
npm run dev
```

Visit `/does-not-exist`. Stop dev server.

- [ ] **Step 23.3: Commit**

```bash
git add src/pages/404.astro
git commit -m "feat(404): redesign as command-not-found style"
```

### Task 24: Restyle `src/pages/contact.astro` and `src/pages/privacy.astro`

**Files:**

- Modify: `src/pages/contact.astro`
- Modify: `src/pages/privacy.astro`

- [ ] **Step 24.1: Inspect each file**

Run:

```bash
cat src/pages/contact.astro
cat src/pages/privacy.astro
```

- [ ] **Step 24.2: Wrap existing text content in man-page sections**

For each file, replace the render tree skeleton (keeping the text content) with `<BaseLayout>` + one or more `<section class="man-section">` blocks. Use `NAME` and `DESCRIPTION` sections at minimum. Privacy may benefit from sub-sections (`COLLECTION`, `THIRD PARTIES`, etc) — keep the existing structure but re-tag the headings as `<h2>` inside `<section class="man-section">`.

- [ ] **Step 24.3: Build + commit**

```bash
npm run build
git add src/pages/contact.astro src/pages/privacy.astro
git commit -m "feat(pages): restyle contact and privacy pages in man-page format"
```

---

## Phase 10 — Code-Block Theme

### Task 25: Switch `astro-expressive-code` to a paper-friendly theme

**Files:**

- Modify: `astro.config.mjs`

- [ ] **Step 25.1: Inspect existing `astro-expressive-code` config**

Run:

```bash
grep -nA 10 expressiveCode astro.config.mjs
```

- [ ] **Step 25.2: Set the theme**

In the `astro-expressive-code` integration options, set:

```js
{
  themes: ['solarized-light'],  // or ['github-light'] — pick during PR review
  styleOverrides: {
    borderRadius: '4px',
    frames: {
      shadowColor: 'transparent',
    },
  },
}
```

- [ ] **Step 25.3: Build + dev verify**

```bash
npm run build
npm run dev
```

Open any post with code blocks (e.g. `/blog/haskell-unix-pipelines`). Confirm code blocks no longer have the dark slate background and now blend with Paper.

Stop dev server.

- [ ] **Step 25.4: Commit**

```bash
git add astro.config.mjs
git commit -m "style(code-blocks): switch expressive-code to paper-friendly light theme"
```

---

## Phase 11 — Final Verification

### Task 26: Full sweep — typecheck, lint, test, build, markdownlint, dev-server smoke test

**Files:**

- N/A (verification)

- [ ] **Step 26.1: Run every gate**

```bash
npm run typecheck
npm run lint
npm run test:run
npm run build
npm run markdown:lint
```

Each must exit 0. If any fail, fix and re-run the failing one.

- [ ] **Step 26.2: pre-commit on all changed files**

```bash
pre-commit run --all-files
```

Expected: PASS.

- [ ] **Step 26.3: Dev-server smoke test (manual)**

```bash
npm run dev
```

Visit at minimum:

- `/`
- `/blog` (page 1)
- `/blog/taskdog-cli-task-management-tool`
- `/tags/`
- `/tags/Python/`
- `/archives/`
- `/about`
- `/contact`
- `/privacy`
- `/does-not-exist` (404)
- `/en/`
- `/en/about`
- `/en/blog/` (empty list — should render gracefully)

For each page, confirm:

- Paper-cream background, monospace text
- Header shows `WADA-DEV(7)`, current path as prompt, `[ja|en]` switcher with the correct active locale
- Footer shows section + date
- Clicking `[ja|en]` toggles to the sibling URL (or falls back to home if no translation)

Stop dev server.

- [ ] **Step 26.4: Final commit (if any cleanup was needed)**

If steps 26.1–26.3 surfaced fixes, commit them:

```bash
git add -A
git commit -m "fix: address final-sweep findings"
```

### Task 27: Open PR and merge

**Files:**

- N/A (PR / merge)

- [ ] **Step 27.1: Push the branch**

```bash
git push -u origin feat/blog-redesign-man-page
```

- [ ] **Step 27.2: Open PR**

```bash
gh pr create --title "feat: terminal × man-page hybrid redesign + bilingual infrastructure" --body "$(cat <<'EOF'
## Summary

- Full visual redesign of the blog to a terminal × man-page hybrid aesthetic (Paper/Amber palette, all-monospace).
- Article pages restructured into NAME / SYNOPSIS / DESCRIPTION / TAGS / SEE ALSO sections.
- Bilingual infrastructure wired in: Astro built-in i18n routing (`/` = ja, `/en/` = en), LangSwitcher component, content collection split into `ja/` and `en/`.
- All 14 existing JP post URLs preserved.

Spec: `docs/superpowers/specs/2026-05-23-blog-redesign-design.md`
Plan: `docs/superpowers/plans/2026-05-23-blog-redesign.md`

## Test plan

- [ ] `npm run typecheck && npm run lint && npm run test:run && npm run build` all green
- [ ] pre-commit run --all-files green
- [ ] manual dev-server smoke: `/`, `/blog`, `/blog/<slug>`, `/tags`, `/archives`, `/about`, `/contact`, `/privacy`, `/404`, `/en/`, `/en/about`
- [ ] language switcher round-trips on each page and falls back to home where no translation exists

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 27.3: Merge (squash) once CI is green**

Per personal preference (default squash merge):

```bash
gh pr merge --squash --delete-branch
```

---

## Notes for the executor

- **Visual / layout tasks** (Phases 1, 6, 8, 9) cannot be meaningfully unit-tested at the DOM level. Use the dev-server smoke check after each task and rely on Phase 11's full sweep at the end. The existing snapshot / component tests cover sibling behavior (search, RSS, related-posts, content-aggregation) and **must remain green throughout** — if any breaks mid-plan, treat it as a regression to fix before continuing.
- **TDD-friendly tasks** (Tasks 5, 6, 9, 14, 16) all start with a failing test. Do not skip the failure verification step — it confirms the test is actually exercising the code.
- **URL preservation** is load-bearing. Task 10's `blog-url-stability.test.ts` is the safety net; if it ever turns red, stop and find the regression.
- **Commit granularity**: one commit per task (the plan does this implicitly via the final "commit" step of each task). If a task's diff is genuinely two unrelated changes, split into two commits — but resist the urge to bundle.
- **`blog-template.md`** at the top of `src/content/blog/` is an authoring helper, not content; the content config in Task 8 deliberately excludes it via the locale-prefixed glob.
- **Spec gap left for follow-up**: the spec mentions a `(post is JP-only)` notice rendered on the destination when the LangSwitcher fell back to the home page. This plan implements the fallback link but does not render the notice (requires destination-side detection that the visit came via fallback). Track as a follow-up issue once EN content authoring begins — the missing notice does not break navigation in the meantime.
