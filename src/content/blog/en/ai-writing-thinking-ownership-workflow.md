---
title: 'Letting AI write without losing the "I wrote this" feeling — drawing the line with vault provenance'
description: 'The core of "this feels AI-written" is the loss of thinking-ownership. Drawing the AI boundary per-prompt has too high a judgement cost. Fix it at the workflow level (vault → AI summary → blog) and thinking-ownership is preserved structurally.'
pubDate: 'May 23 2026'
tags: ['ai-workflow', 'writing', 'zettelkasten', 'personal-projects']
---

## Introduction

"Ban AI entirely" is too coarse a rule. I use AI at full throttle building `knowledge-gardener` / `supernemawashi` / `taskdog` / `ttymap`, and none of it gives off the "I'm not actually thinking" feeling. But ask AI to "write 1500 words about X" for a blog post and it instantly reads as AI-written.

What's the difference? Lay it out and you see that build and write **lose different layers**.

- **build**: AI handles typing / boilerplate / lookup / implementation detail. I handle what to build / how to design it / why it's needed → the thinking layer stays mine.
- **write**: AI handles the angle / examples / claims / conclusion → all of that is the thinking layer.

So the core of "feels AI-written" is the **loss of thinking-ownership**, not the use of AI itself. This post raises the resolution on that, and shifts the boundary from the prompt to the workflow. It's also itself one of the test pieces written with the workflow described below.

## Separate the thinking layer from the surface layer

Rewrite the rule and it becomes:

- ❌ **Hand the thinking layer to AI**: angle / claims / examples / comparisons / conclusion / the overall flow
- ✅ **Hand the surface layer to AI**: typos / grammar / translation / logic sanity-check / fact-checking / formatting / flagging repetition / asking about gaps

This isn't "relaxing the rule" — it's **raising the rule's resolution so you protect exactly what you meant to protect**.

But re-deriving this per-prompt leaves a judgement cost behind. Asking yourself "am I letting AI do the thinking right now?" on every write is tiring.

## Reverse the order — guard it at the workflow, not the prompt

```text
[before]                            [shifted to the workflow]
draw the boundary in prompt design  thinking is already pooled in the vault
→ control AI at the moment of        → by the time it reaches AI, thinking is done
   writing                           → AI is a summarizer, not a thinker
```

Instead of guarding the boundary with a temporal shift, guard it with **vault provenance**.

| Layer      | Content                           | Treatment in the workflow               |
| ---------- | --------------------------------- | --------------------------------------- |
| Felt sense | Did I type it with my own fingers | Discard it (AI summary is fine)         |
| Structural | Whose thinking is it recorded as  | The vault commit log secures provenance |

Discard the felt sense and lean on the structural. As long as the git history of my thinking lives in the vault, the fact that "I thought this" doesn't change even if AI writes the prose at the blog stage.

## The workflow for writing one blog post

```text
[1] Accumulate thinking through normal vault operation (fleeting → permanent)
[2] When I want to blog it, I pick the source notes myself      ← thinking layer
[3] I write the outline myself (angle, claims, order)           ← thinking layer
[4] Ask AI to "compress this outline + these notes into an N-word post"
[5] I check the AI output (is it on-angle / are any claims missing)  ← thinking layer
[6] Rewrite with my own fingers (intervene at the articulation stage)  ← thinking layer
[7] publish
```

Steps [1]-[3] and [5]-[6] are the thinking layer. AI only touches [4] and partial reference-material generation in [6].

As a side effect, it dogfoods my own [knowledge-gardener](https://github.com/Kohei-Wada/knowledge-gardener) plugin, and the vault → AI summary → blog workflow itself becomes **distribution material** (a post like this one).

## Gotchas

- **Don't let AI write a post the vault doesn't have enough thinking behind.** If the source is thin, AI fills in the thinking layer for you and the "AI-written" feeling comes right back.
- In other words, the vault's **accumulation density** is the precondition for whether something can become a post.
- The cadence problem (in my case, 4 posts in 9 months = 0.44/month) is less "do I use AI" and more likely **"I'm trying to blog in an area where the vault accumulation is thin."**
- Before lifting "ban AI entirely," build the habit of writing to the vault first.

## Results

- The judgement cost of deciding the AI boundary per-prompt is gone.
- A post that rides the vault → blog workflow feels like "mine" even with AI involved.
- "I write to the vault because I can't write directly" holds up, creating a natural path where the thinking I recorded later becomes a post.
- As a result, this post too is one of the first test pieces written with the workflow above.

## Wrap-up

- The core of "feels AI-written" is the **loss of thinking-ownership**, not the use of AI.
- Raise the rule's resolution: the thinking layer is mine, the surface layer is AI's.
- Fix it at the **workflow level**, not per-prompt: vault → AI summary → blog.
- What's protected is **vault provenance** — the git history secures "who did the thinking."

The thinking layer of this draft (angle, claims, examples, conclusion) comes from permanent notes in [my Obsidian vault](https://github.com/Kohei-Wada/Obsidian). AI was involved only in dressing up the surface layer — making this post one of the first test pieces of the workflow it describes.
