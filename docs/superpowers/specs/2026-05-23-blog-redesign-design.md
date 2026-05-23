# Blog Redesign — Terminal × Man-Page Hybrid

**Date**: 2026-05-23
**Status**: Design approved, ready for implementation plan
**Target repo**: `GitHub.com/Kohei-Wada/blog` (Astro 5.x)

## Background

The blog at `wada-dev.com` is being repositioned (per vault decisions on 2026-05-23) as the publishing surface for OSS work (`taskdog`, `ttymap`, `knowledge-gardener`) — a leg of the GitHub → blog → GitHub flow. The current visual identity (Astro default-ish, accent-blue, light/dark toggle) does not signal that positioning. This redesign adopts a **terminal × man-page hybrid** aesthetic that visually telegraphs the engineer / OSS-maker positioning to GitHub visitors.

Related vault notes:

- `03_PermanentNotes/blogをやる目的はOSS作品の宣伝とGitHub誘導動線.md`
- `03_PermanentNotes/blogは英語をdefaultにしつつ日本語版も並走させる.md`
- `03_PermanentNotes/思考過程をvaultに外在化すればAI要約でも自分で書いた感覚は保てる.md`

## Goals

1. Full visual redesign of the existing Astro 5 blog to a **man-page × terminal** hybrid aesthetic.
2. **Paper / Amber** color scheme as the single starting palette: `#f4ecd8` background / `#2a2826` foreground / `#af3a03` accent. All-monospace typography.
3. **Bilingual infrastructure** wired in this pass: Astro built-in i18n routing, `/en/` prefix, language switcher UI. Content stays JP-only at ship time; EN content is added later in separate work.
4. **Article pages adopt man-page semantic structure**: NAME / SYNOPSIS / DESCRIPTION / TAGS / SEE ALSO sections plus a man-page-style footer line. Structure is derived from existing frontmatter without breaking it.
5. Preserve all existing URLs, RSS, search (fuse.js), sitemap, tags, archives, SEO, CI, tests, and lint config.

## In Scope

- Rewrite `src/styles/`, `src/layouts/`, `src/components/` against the new visual system.
- Restyle every page: home, blog list, blog post, tags, archives, about, contact, privacy, 404.
- Add Astro i18n routing (`defaultLocale: 'ja'`, `locales: ['ja', 'en']`, no prefix on default).
- Add a `[ja|en]` language switcher in the header.
- Move existing 14 posts from `src/content/blog/` to `src/content/blog/ja/`; derive `lang` from the path.
- Add optional `seeAlso?: string[]` to the blog frontmatter schema (backwards compatible).
- Switch `Astro-expressive-code` theme to a paper-friendly light theme.
- Keep `fuse.js` search, RSS, sitemap, featured-posts behavior, tags page, archives page; restyle only.
- Keep vitest, eslint, prettier, markdownlint-cli2, pre-commit, and the GitHub Actions CI working.

## Out of Scope

- Authoring EN content. New posts can be bilingual from now on; existing 14 stay JP-only.
- Pixel-perfect man-page emulation (e.g. enforced section-number footers, forced caps in body). Convention is applied with restraint where it aids reading.
- Search UX redesign (`man -k apropos` style). Keep current fuse.js behavior; restyle the input only.
- Dark mode. Ship with Paper (light) only. Reserve a future `prefers-color-scheme` extension as amber-on-black, not in this pass.
- Body rewrites of existing 14 posts. Only the chrome (frontmatter consumption, layout, styling) changes.

## Architecture

### File changes

#### Rewritten or substantially edited

| Path                                                           | Change                                                                                                                                              |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/styles/base/variables.CSS`                                | Replace tokens with Paper/Amber set                                                                                                                 |
| `src/styles/base/typography.CSS`                               | Monospace primary, man-page heading rules                                                                                                           |
| `src/styles/base/reset.CSS`                                    | Minor adjustments only                                                                                                                              |
| `src/styles/base/responsive.CSS`                               | Keep breakpoints, swap internal tokens                                                                                                              |
| `src/styles/components.CSS` + `components/*.CSS`               | Add `.man-section`, `.man-footer`, `.ls-listing`, `.man-prompt`, `.tag-pill`, `.man-rule` primitives; rewire existing components against new tokens |
| `src/layouts/BaseLayout.Astro`                                 | New header (man-page title bar + language switcher) and footer                                                                                      |
| `src/layouts/BlogPost.Astro`                                   | Restructure into NAME / SYNOPSIS / DESCRIPTION / TAGS / SEE ALSO with man-page footer                                                               |
| `src/layouts/BlogListLayout.Astro`                             | `ls -la`-style listing                                                                                                                              |
| `src/components/blog/content/PostsGrid.Astro` (and siblings)   | Replace grid with listing; add `PostsList.Astro` if cleaner than retrofitting                                                                       |
| `src/pages/index.Astro`                                        | Home rebuilt as NAME / SYNOPSIS / DESCRIPTION / RECENT POSTS / PROJECTS / SEE ALSO                                                                  |
| `src/pages/{about,contact,privacy,404}.Astro`                  | Restyle in man-page layout                                                                                                                          |
| `src/pages/blog/*`, `src/pages/tags/*`, `src/pages/archives/*` | Use the unified listing component                                                                                                                   |
| `Astro.config.mjs`                                             | Add `i18n: { defaultLocale: 'ja', locales: ['ja', 'en'], routing: { prefixDefaultLocale: false } }`                                                 |
| `src/content.config.ts`                                        | Add optional `seeAlso?: string[]`. Derive `lang` from path. Keep all existing fields.                                                               |
| `src/consts.ts`                                                | Add `DEFAULT_LANG`, `LOCALES`; route header/footer labels through i18n strings                                                                      |

#### Added

- `src/i18n/strings.ts` — UI strings keyed by locale.
- `src/utils/i18n.ts` — Locale resolution helpers (current locale from URL, link to other locale, etc).
- `src/components/shared/LangSwitcher.Astro` — `[ja|en]` toggle.

#### Untouched

- `src/content/blog/*.md` post bodies. Frontmatter receives only optional additive fields.
- `src/pages/RSS.xml.js`, `src/pages/search-index.JSON.ts`, sitemap config.
- `tests/`, `vitest.config.ts`, `eslint.config.js`, `.prettierrc`, `tsconfig.JSON`, `package.JSON` scripts.
- `Astro-expressive-code` integration (only its theme value changes).

### Visual system

#### Color tokens (`src/styles/base/variables.CSS`)

```css
:root {
  --bg: #f4ecd8; /* paper cream */
  --bg-alt: #ece4cf; /* slightly darker — code, hr, subtle blocks */
  --text: #2a2826; /* near-black */
  --text-dim: #928374; /* gray-brown — metadata, footer */
  --accent: #af3a03; /* burnt amber — links, highlights */
  --accent-2: #79740e; /* olive — secondary, tags */
  --border: rgba(42, 40, 38, 0.15);
  --link: var(--accent);
}
```

#### Typography

- Family: `'JetBrains Mono', 'Fira Code', ui-monospace, 'SF Mono', Menlo, monospace`. All text monospace, no serif/sans fallback.
- Base: `15px` body / `1.6` line-height / max width `80ch`.
- SECTION headings: `font-weight: bold; text-transform: uppercase; letter-spacing: 0.08em;`. No indent.
- Body under SECTION: `padding-left: 7ch` (man-page convention).
- Markdown headings inside DESCRIPTION (h2-h4) are styled distinctly from SECTION headings to avoid conflation: bold, no caps, small size step.

#### Layout primitives

| Class          | Purpose                                                      |
| -------------- | ------------------------------------------------------------ |
| `.man-section` | Section block: SECTION label + 7ch-indented body             |
| `.man-footer`  | Bottom rule + `WADA-DEV(7)   <pubDate>   <page>` line        |
| `.ls-listing`  | Posts list rendered as `-rw-r--r--  <size>  <date>  <title>` |
| `.man-prompt`  | `$` prefix for nav cues (lang switcher, search box)          |
| `.tag-pill`    | Tag chip (`--accent-2`, underline)                           |
| `.man-rule`    | `─────────────` horizontal rule utility                      |

#### Code blocks

- `Astro-expressive-code` theme set to a paper-friendly light theme (`solarized-light` or `GitHub-light`; the exact pick is deferred to implementation review).
- Inline code: `--bg-alt` background, slight size step down.

#### Responsive

- Single-column at all widths. Center within `80ch` on large screens.
- ≤ 600px: `padding-left` under SECTION drops from `7ch` to `2ch`.

## Page Layouts

### Home (`/`)

```
WADA-DEV(7)                                       [ja|en]  $ /
─────────────────────────────────────────────────────────────

NAME
       kohei-wada — engineer / oss maker / yokohama

SYNOPSIS
       $ blog [taskdog | ttymap | knowledge-gardener | ...]

DESCRIPTION
       Notes on building tools and what I learned in the process.
       Bilingual (ja / en).

RECENT POSTS
       -rw-r--r--  2025-12-29  taskdog CLI task management tool
       -rw-r--r--  2025-10-18  tar over ssh pipe technique
       ...                                         (see /blog)

PROJECTS
       taskdog              CLI task manager
       ttymap               tmux session viz
       knowledge-gardener   obsidian + ai

SEE ALSO
       GitHub(1), zenn(1), qiita(1), x(1)

─────────────────────────────────────────────────────────────
WADA-DEV(7)                                       2026 05 23
```

### Blog list (`/blog`)

```
WADA-DEV(7)                          [ja|en]  $ ls -la ~/posts/

NAME
       posts — all entries (14 ja / 0 en)

LISTING
       -rw-r--r--  4.2K  2025-12-29  taskdog CLI task management tool
       -rw-r--r--  3.1K  2025-10-18  tar over ssh pipe technique
       ...

NAVIGATION
       $ man -k <keyword>    [search box]
       $ ls --tags           [tags page]
       $ ls --archive        [archives page]
```

### Blog post (`/blog/<slug>`)

```
TASKDOG(7)                                   [ja|en]  $ man taskdog

NAME
       taskdog-CLI-task-management-tool

SYNOPSIS
       <description from frontmatter>

DESCRIPTION
       <markdown body>

TAGS
       <tags from frontmatter, as `.tag-pill` chips>

SEE ALSO
       <links from optional `seeAlso` frontmatter; section hidden if empty>

─────────────────────────────────────────────────────────────
WADA-DEV(7)                                       <pubDate>
```

### Tags (`/tags/<tag>`)

```
NAME
       <tag> — N entries

APROPOS
       -rw-r--r--  4.2K  2025-12-29  taskdog CLI task management tool

SEE ALSO
       all tags: $ ls --tags
```

### Archives (`/archives`)

Posts grouped by year, each year rendered as `.ls-listing` block.

### About (`/about`)

```
NAME
       whoami — Kohei Wada

DESCRIPTION
       <existing about page content>

ACHIEVEMENTS
       <existing achievements content>

CONTACT
       $ mail program3152019@gmail.com
       GitHub.com/Kohei-Wada
```

### 404

```
$ cat /this/page.md
cat: /this/page.md: No such file or directory

SEE ALSO
       $ cd /          [home]
       $ ls /blog      [posts]
```

## Bilingual Infrastructure

### Astro config

```js
i18n: {
  defaultLocale: 'ja',
  locales: ['ja', 'en'],
  routing: { prefixDefaultLocale: false },
}
```

### URL map

| Locale                  | Pattern                                                                           |
| ----------------------- | --------------------------------------------------------------------------------- |
| JP (default, no prefix) | `/`, `/blog/<slug>`, `/tags/<tag>`, `/archives`, `/about`, `/contact`, `/privacy` |
| EN                      | `/en/`, `/en/blog/<slug>`, `/en/tags/<tag>`, `/en/archives`, `/en/about`, …       |

All existing JP URLs are preserved (no prefix added to default locale).

### Content collection structure

```
src/content/blog/
├── ja/
│   ├── taskdog-CLI-task-management-tool.md
│   ├── tar-ssh-pipe-technique.md
│   └── ... (14 files moved here from src/content/blog/)
└── en/
    └── (empty initially)
```

`lang` is derived from the path segment (`ja/foo.md` → `lang: 'ja'`). Authors do not declare `lang` in frontmatter.

### Translation pairing

If `ja/<slug>.md` and `en/<slug>.md` both exist, the slug is treated as a translation pair and the language switcher on either page links to the other locale's version. If only one side exists, the switcher falls back to the locale's home (`/` or `/en/`) and the destination shows a `(post is JP-only)` notice.

### Language switcher

`src/components/shared/LangSwitcher.Astro`. Header right side, monospace `[ja|en]` text. Current locale is bold; the other locale is underlined link.

### UI strings

`src/i18n/strings.ts` with `{ ja: {…}, en: {…} }`. Translated strings cover footer labels, navigation cues, tag-page summary phrasing, language-fallback notice.

Note: man-page SECTION names (`NAME`, `SYNOPSIS`, `DESCRIPTION`, `SEE ALSO`, `TAGS`, `NAVIGATION`, `APROPOS`) stay **English** in both locales — this is man-page convention and is the visual signature of the design.

## Migration Plan

1. **File move**: `git mv src/content/blog/*.md src/content/blog/ja/`. 14 files.
2. **Content config update**: `glob` pattern becomes `**/*.md`; loader derives `lang` from path. Schema gets optional `seeAlso?: string[]`.
3. **URL preservation**: `getStaticPaths` for `/blog/[slug]` enumerates only the `ja/` collection and yields the same slugs as before. EN counterpart at `/en/blog/[slug]`. Outbound links / search engines see no URL change for existing JP posts.
4. **Frontmatter compatibility**: existing 14 posts are unchanged. `description` populates SYNOPSIS, body populates DESCRIPTION, `tags` populates TAGS, optional `seeAlso` populates SEE ALSO (section hidden if absent). `seeAlso` is `string[]`; each entry is the slug of another post in the same locale (e.g. `["taskdog-CLI-task-management-tool"]`). The layout resolves the slug to the post's title and URL at build time. Entries that do not resolve cause a build-time error.
5. **Featured-post behavior**: existing `featured: boolean` is preserved. Home's RECENT POSTS lists featured first, then date-desc.
6. **Tests**: existing vitest suite must pass green. New unit tests for: `LangSwitcher` link resolution, `/blog/<slug>` route stability, `i18n.strings` lookup, `seeAlso` rendering and omission.

## Deliberately Deferred

The following are intentionally underspecified at this stage and resolved during implementation:

- Exact `Astro-expressive-code` theme value (pick during PR review by comparing rendered samples).
- Wording of the man-page footer "page number" (e.g. `1` vs blank vs slug initials).
- Whether the search input gets a `$ man -k` cosmetic prefix or stays plain (current behavior fine if visually consistent with rest of chrome).
- Mobile-specific tweaks beyond the 7ch → 2ch indent collapse.

## Success Criteria

- Every page renders in the Paper/Amber palette with all-monospace typography.
- Blog posts display the NAME / SYNOPSIS / DESCRIPTION / TAGS / SEE ALSO structure derived from existing frontmatter.
- All 14 existing JP post URLs continue to resolve at the same paths they do today.
- `/en/` route tree exists and renders the EN locale chrome even with no EN posts authored yet; the EN home and EN blog list render gracefully empty.
- Language switcher is visible on every page and correctly resolves to the other locale's equivalent URL (or its home, as fallback).
- `npm run build`, `npm run test:run`, `npm run lint`, `npm run typecheck`, and `markdownlint-cli2` all succeed.
- pre-commit hooks on the repo continue to pass on every changed file.
