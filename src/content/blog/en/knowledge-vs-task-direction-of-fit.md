---
title: 'The urge to put tasks in my notes vault, and what made it feel wrong'
description: 'While rewriting my own task manager I leaned toward folding tasks into my notes vault ("I keep all my conversations there anyway — isn''t a separate system wasteful?"), but it felt deeply wrong. This is me naming that discomfort with direction of fit (true/false vs done/undone), following the ick-spectrum (knowledge → blog draft → pure task), and ripping the blog area out of the vault.'
pubDate: 'May 30 2026'
tags: ['personal-projects', 'Obsidian', 'task-management']
seeAlso: ['knowledge-gardener-when-how-separation', 'zettelkasten-purpose-output']
---

## Intro

I keep my own task manager, and I'd been itching to rewrite it as file-based (one task per file + an index, editable directly in vim, greppable, git-able). While digging into that, a thought showed up:

> I keep all my conversations and thinking in a Markdown vault anyway — isn't it wasteful that task management is a separate system? If tasks were just vault notes too, everything would be in one greppable place, which is convenient even for the AI.

The logic holds. And yet it felt **deeply wrong before I'd even tried it**. This post is what happened when I tried to put that wrongness into words — and ended up dragging the question of where blog drafts live into it, and rebuilding the vault.

## Knowledge and tasks split along the direction of fit

The discomfort finally had a name: **direction of fit** (Anscombe / Searle). Which side — mind or world — is authoritative, and which one do you bring into line with the other?

- **Knowledge = belief. Mind → world.** The world is authoritative; you fit your description to it. When they diverge, you fix the **description** (the knowledge). Evaluated `true / false`. There is no "done"; it accretes as you revise. **Durable.**
- **Task = intention. World → mind.** The intention is authoritative; you bring the world into line with it. When they diverge (incomplete), you fix the **world** (not the intention). Evaluated `done / undone`. It disappears once achieved. **Stateful.**

That yields a one-shot test:

> Before saving anything, ask: "**Is this evaluated true/false, or done/undone?**" true/false → knowledge (vault). done/undone → task (a dedicated store).

Mixing a high-churn state machine (tasks) into a knowledge graph is like **binding a TODO list into an encyclopedia**. The git history gets muddied by done/undone toggles, and links to finished tasks break. What I'd felt as "separation is wasteful" was really just **the overhead of running two systems** — and solving that by merging breaks things. The efficiency I actually wanted comes from a **link**, not a dirtying merge.

## The ick-spectrum — where blog comes in

The interesting part is that the ickiness isn't binary; it's a **continuum**. Things line up by which evaluation axes (true/false / done/undone) ride along:

- **Permanent note** … true/false only → clean as-is (pure knowledge)
- **Blog draft** … true/false + done/undone → partially icky (hybrid)
- **Pure task** … done/undone only → maximally icky (lives outside the vault, full stop)

A blog draft, which looks unrelated to tasks, sits right in the **middle** of the same ruler. As content it's true/false (is the post any good?), but it also carries a publish lifecycle (draft/published/rejected) — a done/undone. So it's not as clean as pure knowledge.

And my vault had exactly that middle thing sitting in it, unaddressed: an `05_Blog/` folder (`draft/` `published/` `rejected/`). Only once I'd named the task case did I see it: "this is a mild case of the same disease."

## What I actually did — clearing the middle thing into a pipe

Tasks already live in my dedicated tool. What was left over was the spectrum's middle case — the blog drafts — so that's what I cleaned up.

- Deleted `05_Blog/` **entirely**. Posts now live only in the blog repo.
- Stripped the blog lifecycle conventions out of the vault README, leaving just a gather convention: "bundle the relevant permanent notes."
- Built a **stateless pipe** from knowledge to published artifact: gather material from the vault (source), shape the post in a dialogue, mask it, and emit into the blog repo (artifact). **No draft artifact is kept anywhere — the draft is the conversation itself.**

This is where a durability axis earns its keep (**source / cache / artifact**). The test: "if I delete this, do I lose something irreversibly?" Vault knowledge is source; a published post is an artifact (a derivative that, once emitted, has its own existence outside); a draft is neither — it's in-progress working state. So it isn't persisted.

## Outcome

- The vault is back to a clean "true/false only" knowledge base; the task-smell of lifecycle state is gone.
- Deciding where something goes became mechanical: just ask "**true/false or done/undone?**" and "**irreversible if deleted?**" before saving.
- Incidentally, **this very post is the first thing that came out through that new pipe.**

## Takeaways

- Knowledge and tasks split along the direction of fit: **true/false (knowledge, vault) vs done/undone (tasks, a dedicated store).**
- The ickiness is a continuum: **pure knowledge → blog draft (hybrid) → pure task.** Blog sits in the middle of it.
- A draft is neither knowledge nor task — it's in-progress state built from a source. **Don't persist it.**
- Separation isn't wasteful. You get proximity from a **link, not a merge.**

## See also

- [A plugin holds WHEN, the vault holds HOW](/en/blog/knowledge-gardener-when-how-separation) — the same "separate responsibilities to stay drift-proof" principle, applied elsewhere
- [The real purpose of a Zettelkasten was output](/en/blog/zettelkasten-purpose-output) — the tug-of-war of over-tending the vault until the means becomes the end
