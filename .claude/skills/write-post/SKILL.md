---
name: write-post
description: Write or add a blog post (or projects entry) to this Astro blog (wada-dev.com). Use when asked to draft, translate, or publish a post — handles the bilingual ja/en pair, man-page house style, build/test/Playwright verification, and the worktree → PR → CI → squash-merge → deploy flow. Triggers on "write a post", "ブログ書いて", "記事化", "add to projects", "翻訳して公開".
---

# Write a blog post

This blog (`Kohei-Wada/blog`, prod https://wada-dev.com) is English-default, bilingual, Astro v5, man-page aesthetic. Every post exists in **both** locales or it cannot be committed.

## Non-negotiables

1. **ja + en parity is enforced.** Every slug must have BOTH `src/content/blog/ja/<slug>.md` and `src/content/blog/en/<slug>.md`. A pre-commit hook and CI step (`npm run check:posts`) block commits otherwise. Never commit only one locale.
2. **Verify in a browser before claiming done.** Build alone is not enough — render both locale URLs with Playwright.
3. **One worktree per change, PR, squash merge.** Don't commit to `main` directly.

## Content layout

| Path                              | What                                                                 |
| --------------------------------- | -------------------------------------------------------------------- |
| `src/content/blog/ja/<slug>.md`   | Japanese post (served at `/ja/blog/<slug>`)                          |
| `src/content/blog/en/<slug>.md`   | English post (served at `/en/blog/<slug>`)                           |
| `src/content/projects/<name>.md`  | Projects-page entry                                                  |
| `src/content/blog/` source drafts | often live in the Obsidian vault `$KG_VAULT/05_BlogDrafts/<slug>.md` |

## Frontmatter schema (blog)

Defined in `src/content.config.ts`. Only these keys exist:

```yaml
---
title: '...' # required
description: '...' # required (also the meta description)
pubDate: 'May 23 2026' # required (z.coerce.date accepts this or 2026-05-23)
tags: ['Claude Code', 'plugin'] # default []
seeAlso: ['other-slug'] # optional, default []; MUST resolve in the SAME locale
---
```

Frontmatter must be valid YAML (single-quote strings containing `:` or `'`).

## House style (man-page aesthetic)

- Plain `## Heading` / `### Subheading`. **No emoji section headers**, no template scaffolding like "📝 概要 / 🎯 この記事で学べること".
- Conversational, hands-on, occasionally wry voice. Match existing posts (e.g. `taskdog-cli-task-management-tool`, `container-use-parallel-development`).
- Tables, code blocks (```lang), and `[text](url)` links render fine.
- **Internal links are locale-prefixed.** Both locales are served under a prefix: en at `/en/...`, ja at `/ja/...`. Link to other posts/tags/archives with the **same locale** as the post you're in — `/en/blog/<slug>`, `/en/tags/<tag>/` from an en post; `/ja/blog/<slug>`, `/ja/tags/<tag>/` from a ja post. Never use a bare `/blog/<slug>` (it no longer exists and 404s).
- **Tag namespaces are per-locale.** Use Japanese-flavoured tags on ja posts (`個人開発`, `シェル芸`) and English on en posts (`personal-projects`, `shell-tricks`). They don't need to match across locales.
- Link text must be descriptive — markdownlint MD059 rejects bare `[here]`.

## Translation

- Write the post in one locale, then produce the other. Translate `title` / `description` / body; keep code blocks, file paths, external URLs, image refs verbatim (translate alt text only). **Exception: internal links must be re-pointed to the target locale** — an en `/en/blog/<slug>` becomes `/ja/blog/<slug>` in the ja version.
- Match the source tone. Don't summarize or restructure.
- For a batch (e.g. translating many existing posts), dispatch one general-purpose agent per file with tight "touch-up, minimal-diff, preserve code/frontmatter" instructions, then review the diffs.

## Process

1. **Pre-flight**: `cd ~/ghq/github.com/Kohei-Wada/blog && git pull --ff-only origin main`, then `git worktree add .worktrees/<name> -b <branch> origin/main`. Work in the worktree.
2. **Write both files**: `src/content/blog/{ja,en}/<slug>.md`. Same slug. Use plain headings.
3. **Verify locally** (in the worktree):
   - `npm run check:posts` → must say `parity OK (N ja / N en)`
   - `npm run build` → succeeds; `npx vitest run` → green
   - `npm run dev` (background to a logfile), then Playwright:
     - `/en/blog/<slug>` (en): title, English headings, no Japanese in `.post-body`, code blocks present, LangSwitcher → `/ja/blog/<slug>`
     - `/ja/blog/<slug>` (ja): Japanese, LangSwitcher → `/en/blog/<slug>`
     - Post is listed on `/en/blog` and `/ja/blog`
   - Kill the dev server when done (`pkill -f 'astro dev'`). If port 4321 is busy it falls back to 4322 — read the logfile for the real port.
4. **Ship**: `git add -A && git commit` (pre-commit runs lint-staged, typecheck, tests, build, **and the post-parity check**). Conventional commit message. `git push -u origin <branch>`, `gh pr create`.
5. **CI + merge**: watch `gh pr checks <PR> --watch`; the matrix is `test (18)` / `test (20)` plus lint/gitleaks/markdownlint and a Netlify deploy-preview. On green, `gh pr merge <PR> --squash --delete-branch`. CI checkout occasionally flakes with a git-auth error — just `gh run rerun <id>`.
6. **Worktree cleanup**: `gh pr merge` can't delete a branch that's checked out in a worktree — run `git worktree remove .worktrees/<name>` then `git branch -D <branch>`, then `git pull --ff-only origin main`.
7. **Deploy + verify**: production auto-deploys on push to main (Netlify GitHub integration). Wait ~a few minutes, then `curl -sL https://wada-dev.com/en/blog/<slug>` → 200 and `/ja/blog/<slug>` → 200. (A daily cron rebuild also exists for refreshing static data; manual trigger: `gh workflow run daily-netlify-deploy.yml --ref main`.) `curl` without `-L` shows a 301 trailing-slash redirect — follow it.

## Projects-page entry

`src/content/projects/<name>.md` — schema needs **both** `description` (ja) and `description_en` (en):

```yaml
---
name: <name>
description: 日本語の一文説明
description_en: One-line English description
repo: https://github.com/Kohei-Wada/<name>
stack: ['Lang', 'Tool']
status: active # active | maintenance | archived
order: 70 # higher = listed first; home shows top-3 active
relatedPosts: ['<slug>'] # optional
---
```

`/en/projects` renders `description_en`, `/ja/projects` renders `description`. The **home** PROJECTS section lists **all `status: active` projects, sorted by `order` (desc)** — bump `order` to move a project higher.

## Don't

- Don't add emoji headers (legacy draft template — strip them).
- Don't commit a single-locale post (parity check will block it).
- Don't claim it's live without `curl`-ing production.
