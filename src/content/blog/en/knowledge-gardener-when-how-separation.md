---
title: 'The plugin holds only WHEN, the vault holds HOW — designing a format-agnostic Claude Code plugin'
description: "How my knowledge-gardener plugin runs without hardcoding any of the vault's formatting conventions. The difference from existing Obsidian-for-Claude plugins, and what the separation of concerns buys you."
pubDate: 'May 23 2026'
tags: ['claude-code', 'obsidian', 'plugin-design', 'personal-projects']
---

## Introduction

My Claude Code plugin [knowledge-gardener](https://github.com/Kohei-Wada/knowledge-gardener) holds none of the Obsidian vault's formatting conventions (filename / frontmatter / link syntax / folder layout). Instead, it reads the vault's own `README.md` every time. This post is about why I did that, how it differs from existing plugins, and what properties fall out of it.

There are already several plugins that CRUD an Obsidian vault for Claude Code. Representative examples:

- `eugeniughelbur/obsidian-second-brain` — assumes its own wiki / PARA schema
- `AgriciDaniel/claude-obsidian` — fixes the Karpathy wiki pattern
- `dlutsyk/Obsidian-Zettelkasten-Claude` (MCP) — forces Luhmann IDs

These hardcode the format on the plugin side. So if your vault has its own conventions — "standard markdown links (no wikilinks)," "numeric-prefix folders (`01_FleetingNotes/` etc.)" — it conflicts outright. You could fork and fix it, but at that point the plugin's generality is gone.

## The plugin holds WHEN, the vault holds HOW

knowledge-gardener holds only **when** to CRUD the vault, and follows the vault's own README for **how to write**.

```text
[conventional plugin]              [knowledge-gardener]
plugin holds the format too        plugin: when to write / what to write
→ doesn't fit another vault        vault README: how to write
                                   → conventions concentrate in the vault
```

With this separation of concerns:

- **Change the conventions on the vault side and the plugin needs no edits**
- It can absorb format differences in someone else's vault via the README
- The plugin's logic can focus on "durable-insight detection / duplicate checking / propose-then-write"

## Implementation: read the README in pre-flight

I put a "Pre-flight Setup" at the top of every skill. The shared steps, abridged:

```text
1. Resolve the vault path from the KG_VAULT environment variable
2. Read $KG_VAULT/README.md (the vault-root convention document)
3. Also read $KG_VAULT/../README.md (in case the vault is a repo subdir)
4. If a folder-scoped README exists, consult it too
5. If conventions are unclear, stop and ask — don't silently invent a default
```

In implementation terms, each operational skill (plant / water / connect / prune / survey / recap) handles its own CRUD action, and they share the common "Pre-flight Setup" to eliminate duplication.

## Gotchas

- **For a vault with no README, "not running" is better.** Start writing with silent defaults and you mass-produce notes that don't follow that vault's conventions. Stop-and-ask isn't a limitation — it's a spec to prevent format drift.
- **The vault README can live in more than one place.** My vault has an `Obsidian/vault/` structure, so some conventions live in `Obsidian/README.md` (the parent) and some in `vault/README.md` (the vault root). Read both, and on conflict prefer the vault root.
- **Folder-scoped conventions** (e.g. a People folder with different frontmatter) get a separate layer that reads a folder-scoped README.

## Results

- The plugin runs as-is on my vault (numeric-prefix folders + standard markdown links + a custom tag namespace).
- The same plugin would, in principle, run on someone else's wiki-style vault or a Luhmann-ID vault as long as they write a README.
- The plugin's responsibilities are clear, so adding a new skill (garden-recap, etc.) needs no format-related decisions.

## Wrap-up

- It's not "the plugin holds the format" but "the vault holds the format, and the plugin reads it."
- Separation of concerns: **the plugin holds WHEN, the vault holds HOW.**
- If conventions are unclear, stop — not silently inventing a default is what prevents format drift.

## References

- [knowledge-gardener (GitHub)](https://github.com/Kohei-Wada/knowledge-gardener)
- [My Obsidian vault](https://github.com/Kohei-Wada/Obsidian)
