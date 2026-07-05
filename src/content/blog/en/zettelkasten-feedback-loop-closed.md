---
title: 'Closing the Zettelkasten → Blog → Feedback Loop with giscus'
description: 'The knowledge loop — an idea → fleeting note → permanent note → article → reader feedback → new fleeting note — now exists end to end as a system. A record of each component, and of the final missing piece: a comment box.'
pubDate: '2026-07-05'
tags: ['zettelkasten', 'blogging', 'personal-projects']
seeAlso: ['blog-axis-curious-driven-tester', 'ai-writing-thinking-ownership-workflow']
---

## The loop, complete

```text
my own ideas ──→ fleeting note → permanent note → article → reader feedback
                     ↑                                            │
                     └────────────────────────────────────────────┘
```

The original purpose of a Zettelkasten is output. The loop starts with my own ideas: they enter as fleeting notes, crystallize into permanent notes, and become raw material for articles. Reader reactions to those articles flow back into fleeting notes as a **second input stream**, joining my own ideas. Only when outside input merges into what was previously a closed circle in my own head does the loop actually complete a lap.

In May 2025 I wrote a problem note in my vault: "the loop isn't turning — and not having a blog is part of the problem." Today I added the last missing piece, a comment box on this blog, and every segment of the loop now exists as a system. This article is a record of each component.

## The components

### Accumulation: Obsidian vault

Standard Zettelkasten practice — fleeting notes refined into permanent notes. This part had been working all along. Every article's raw material accumulates here.

### Articles: garden-harvest

A Claude Code skill that bundles permanent notes from the vault and compresses them into an article. I don't renegotiate the AI boundary per prompt; it's fixed at the workflow level — the thinking (notes, claims, structure) is mine and lives in the vault, the compression into prose is the AI's. I wrote about that boundary design in [a separate post](/en/blog/ai-writing-thinking-ownership-workflow).

### Distribution: a self-built blog

A static site built with Astro, styled after man(7). The deciding factor for building my own instead of using an existing platform was being able to wire the vault-to-article pipeline with my own tools. The story of re-centering this blog around process rather than topic is in [another post](/en/blog/blog-axis-curious-driven-tester).

### Return flow: giscus comments

The final piece, added today. Articles were going out, but there was no inlet for reader reactions — the return path simply didn't exist. Now every post ends with a comment box and emoji reactions, and any reaction that arrives merges with my own ideas as the seed of a new fleeting note.

## Notes on the giscus setup

Adding comments to a static site does not require migrating to a database. giscus is a comment widget backed by GitHub Discussions, and installing it is a single script tag.

Why giscus:

- The comments themselves are stored in the repository's GitHub Discussions. If the widget ever dies, the data survives
- It's less a new external dependency than piggybacking on GitHub, which the site already depends on
- It ships emoji reactions, a much lower bar than writing a comment
- Free, no tracking, no ads

Setup is three steps: enable Discussions on the repository, install the giscus app, paste the generated script tag into the template.

Decisions made along the way:

- **Announcements-type category.** Readers can't create Discussions directly; they only come in through giscus (the officially recommended setup)
- **One thread shared across locales.** Every post on this blog is a ja/en pair; with `mapping: specific` + `term: <slug>`, both locale versions of a post share a single Discussion
- **A custom theme stylesheet.** giscus accepts any CSS URL via `data-theme`, so I wrote a man-page-flavored theme matching the site's palette — monospace, no rounded corners, transparent background. One gotcha: giscus fetches the theme CSS in CORS mode, so the file must be served with `Access-Control-Allow-Origin: https://giscus.app`

The whole thing, from setup to theme tweaking, took half a day.

## About this article

This article is itself a product of the pipeline described above (raw material: five permanent notes from the vault; structure and claims: mine; compression into prose: Claude). And right below it sits the comment box I added today.

As a matter of fact, there is no feedback yet — zero comments, zero reactions. If you're reading this, a comment or even a single emoji reaction would make my day: it would be the first lap of this loop.
