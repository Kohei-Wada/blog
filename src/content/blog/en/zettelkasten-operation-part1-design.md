---
title: 'Zettelkasten in Practice Part 1: Design'
description: 'The folder structure, tag design, and MOC workflow I settled on after two years of running a Zettelkasten'
pubDate: 'Jan 08 2026'
updatedDate: 'Jan 08 2026'
tags: ['Zettelkasten', 'Obsidian', 'Markdown', 'Knowledge Management']
---

I've been running a Zettelkasten for about two years. This post covers the folder structure and tag design.

Honestly, I'm not doing anything special. But after sticking with it for a while, I landed on a shape that feels right, so I'm writing it down as a record.

---

## Why Zettelkasten

I used to organize notes by directory structure — things like `programming/python/` or `infrastructure/docker/`.

That approach had a problem: related documents ended up scattered in completely different places.

A note like "operating Docker containers from Python" — does it go in `programming/python/` or `infrastructure/docker/`? Whichever you pick, it becomes hard to find from the other side.

Zettelkasten solves this by managing notes via "connections" instead. What matters isn't where you store something, but what it's connected to.

---

## Folder Structure

```
vault/
├── 01_FleetingNotes/
├── 02_ReferenceNotes/
├── 03_PermanentNotes/
├── 04_DailyNotes/
├── 05_BlogDrafts/
└── 99_Templates/
```

**FleetingNotes** holds temporary notes. Place to drop ideas like "look into this later" or "want to try this tool."

**ReferenceNotes** is the main one. I record technical information I've researched here. In Zettelkasten terminology this is the Literature Note, but I renamed it to match its actual role as a technical reference.

**PermanentNotes** holds MOCs (Map of Contents) and notes that consolidate my own takes. They bundle multiple Reference Notes together.

**DailyNotes** is for retrospectives. **BlogDrafts** holds blog drafts.

I keep the folder hierarchy shallow. Going deep brings back the "where should I put this?" problem.

---

## File Naming Convention

I name Reference Notes uniformly as `{tool}-{action}`.

```
curl-post-request.md
mysql-backup-restore.md
docker-compose-networking.md
```

With this naming, I can find things intuitively from the shell using `ls` or `rg`.

```bash
ls vault/02_ReferenceNotes/ | grep curl
rg "proxy" vault/
```

I don't have to rely on Obsidian's search to find things. This ties into the tool-agnostic design I'll cover later.

---

## Tag Design

I design tags along multiple axes.

```yaml
tags:
  - tool/curl
  - category/http
  - use-case/development
```

**tool/** is the tool axis: curl, docker, mysql, and so on.

**category/** is the functional axis: http, database, networking, etc.

**use-case/** is the situational axis: development, debugging, monitoring, etc.

Why multi-axis? Because I want multiple ways to slice my search.

- Want to see every curl note → `tool/curl`
- Want to look across all HTTP-related notes → `category/http`
- Want to find commands used during development → `use-case/development`

With single-axis tags, you can only search along one slice.

---

## MOC (Map of Contents)

Once notes on the same topic start piling up, I create an MOC.

```markdown
# curl MOC

## Network Diagnostics

- [curl-global-ip-check](../02_ReferenceNotes/curl-global-ip-check.md)
- [curl-via-proxy](../02_ReferenceNotes/curl-via-proxy.md)

## API Operations

- [curl-post-request](../02_ReferenceNotes/curl-post-request.md)
- [curl-JSON-request](../02_ReferenceNotes/curl-JSON-request.md)

## Related Tools

- [wget-basic](../02_ReferenceNotes/wget-basic.md)
- [httpie-usage](../02_ReferenceNotes/httpie-usage.md)
```

An MOC isn't just a table of contents — it's use-case-based navigation. You get a bird's-eye view of "what can I do with curl?"

As for when to create one: whenever notes start piling up. I don't have a strict rule. Usually I make one once I've accumulated around five.

---

## Tool-Agnostic Design

I use Obsidian, but I design things so they don't depend on Obsidian.

### No Wikilinks

```markdown
<!-- Don't use -->

[[curl-post-request]]

<!-- Do use -->

[curl-post-request](../02_ReferenceNotes/curl-post-request.md)
```

Standard Markdown relative links work in GitHub and VSCode too.

### Minimal Plugins

I only use the git sync plugin. There are tons of useful plugins out there, but leaning on them puts me in a state where I'm stuck without Obsidian.

### Search via nvim + telescope

I do use Obsidian's search, but my go-to is telescope in nvim. Filename search and full-text search, yank, paste into the shell, run — that flow is smooth.

For this workflow to work, commands in Reference Notes need to be written generically. Don't hardcode environment variables or paths — record them in a form that runs anywhere.

Because everything is plain text, `grep` and `rg` work fine. Even if Obsidian disappears, as long as I have my Markdown files and search commands, I'm not in trouble.

---

## A Note's Lifecycle

```
idea     → Fleeting Note
              ↓
research → Reference Note
              ↓
grows    → create MOC
              ↓
synthesize → Permanent Note
              ↓
publish    → Blog
```

Fleeting Notes are a temporary holding area. Once I've researched something, it gets promoted to a Reference Note. If it sits untouched, I delete it.

When Reference Notes start piling up, I create an MOC to organize them.

When I develop my own take on something, I consolidate it into a Permanent Note.

If it seems publishable, I push it out to the blog.

Having this flow lets me consciously ask "what stage is this note at?" as I write.

---

## Summary

- Keep folders shallow; prioritize "connections" over classification
- Use `{tool}-{action}` naming so files are easy to search
- Use multi-axis tags so you can search from multiple angles
- Use MOCs to get a bird's-eye view of topics
- Design so you're not locked into a single tool

Nothing fancy. But this structure has held up for two years, so I think it's working well enough.

---

## Related

I cover quality control (broken link checks, pre-commit, GitHub Actions) in detail in a separate post.

- [Automatically checking broken links in Obsidian with lychee](/blog/obsidian-lychee-link-checker/)

---

## Next

- [Zettelkasten in Practice Part 2: Analysis](/blog/zettelkasten-operation-part2-analysis/)
