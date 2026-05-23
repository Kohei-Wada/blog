---
title: 'I built a plugin to grow my vault — but the real purpose of a Zettelkasten was output'
description: 'Diagnosing why 9 months yielded only 4 posts: a Zettelkasten has exactly one purpose — output (C); searchability (A) and insight crystallization (B) are means, and a decision log (D) is foreign. The more I built knowledge-gardener to grow the vault, the more the means tried to become the end. A record of that tug-of-war.'
pubDate: 'May 24 2026'
tags: ['zettelkasten', 'pkm', 'personal-projects']
seeAlso: ['knowledge-gardener-when-how-separation', 'blog-axis-curious-driven-tester']
---

## Introduction

To grow my vault (an Obsidian Zettelkasten), I went as far as building my own Claude Code plugin to automate the CRUD. And yet I've published only 4 posts in 9 months. Diagnosing that "accumulation grows but output won't move" feeling, I arrived at this: a Zettelkasten has exactly **one purpose — output (C)**; searchability (A) and insight crystallization (B) are the _means_ that support it, and a decision log (D) is a bolted-on _foreign element_. And the more you build tools to grow the vault, the more the means side tries to become the end. This is the story of that tug-of-war.

I've done Zettelkasten in Obsidian for a few years. I separate the stages fleeting → reference → permanent, link notes with standard markdown links rather than wikilinks, and have a tidy tag namespace. Recently I even built a plugin ([knowledge-gardener](https://github.com/Kohei-Wada/knowledge-gardener)) to CRUD it from Claude Code — plant (new) / water (append) / connect (link) / prune / survey.

By the toolset alone, things look healthy. Permanent notes grow every month. Search reaches my past self instantly.

And yet **only 4 posts in 9 months**. And a nagging sense that "the vault is bloating, but I don't feel like I'm actually using it." Accumulation grows. Searchability improves. I built tools. Output still won't move. Where does this asymmetry come from?

## 1 purpose + 2 means + 1 foreign

Going back to the origin made it quick.

- Niklas Luhmann wrote 70 books and 400+ papers from ~90,000 Zettel. In his words, "the Zettelkasten did the writing."
- Sönke Ahrens's _How to Take Smart Notes_ (2017) frames it as always writing from accumulation to eliminate "writing from a blank page." Separating fleeting / literature / permanent is nothing but **staging the writing pipeline.**

Both have the same purpose: **writing = output.** Permanent notes exist as material for output.

From here you can re-line the elements of a Zettelkasten as "1 purpose + 2 means + 1 foreign."

| Role          | Content                                     | Success metric             |
| ------------- | ------------------------------------------- | -------------------------- |
| **Purpose C** | Output (producing external artifacts)       | published posts / month    |
| **Means A**   | Searchability (reach past notes instantly)  | time-to-reach              |
| **Means B**   | Insight crystallization (atomic permanents) | permanent net gain / month |
| **Foreign D** | Recording decisions                         | (not handled by ZK)        |

A corresponds to the ZK **infrastructure** (sequential IDs, cross-references); B to the **mechanism** (1 note = 1 idea atomicity). Both are the operation of ZK itself, so dropping them isn't an option. But **making either one the primary goal gets it backwards.** No matter how high permanents stack, without output the real benefit of ZK never shows.

Re-examining my own tool here, its place became clear. **What knowledge-gardener does is almost entirely A and B.**

- survey / connect → A (maintaining searchability and reachability)
- plant / water → B (accumulating and crystallizing atomic notes)
- prune → maintenance of A/B (removing rotten notes)

In other words, I'd been **diligently building tools to sharpen the means (A/B).** The part that turns purpose (C) — that had stayed outside the tool, on the blog side, neglected the whole time. The asymmetry where accumulation grows but output won't move was the obvious consequence. The tooling was only ever on the means side.

## Every complaint was a "C isn't visible" symptom

This framework cleanly re-explains the "ZK operation complaints" I'd been piling up in the vault. They weren't separate problems — they were all symptoms of "purpose (C) isn't visible / the means has become the end."

- **Permanents have turned into reference memos** → B isn't working. Instead of atomic crystallizations of thought, copies of the web sit there. The cause: not being connected to C, so there's no motivation to refine.
- **The publish-and-get-feedback loop won't turn** → C dysfunction itself. This is ZK's true purpose, so when it stalls the whole thing collapses.
- **Burning time fixing tags and MOCs** → maintenance of A. Necessary, but if the maintenance itself becomes the goal, that's not ZK — it's library cataloging.

You can draw the same line on the tool. knowledge-gardener actually has skills for turning C too (garden-recap, and the path of starting a blog draft via plant). But C isn't something "the tool does for you" — it only moves by **you writing.** All the tool can do is keep the material in a writable state via A/B.

And this very post is that C. From a permanent note I'd accumulated — "the real purpose of a Zettelkasten is output" — I'm turning out one piece. Finally harvesting from the field the tools tilled.

## Gotchas

- **The more tools you build, the easier the means becomes the end.** Writing a plugin to grow the vault is fun, and polishing permanents feels good. But that's optimizing A/B, not output. If your tooling is rich but posts don't ship, time is usually being siphoned to the means side.
- **You don't need to agonize over "which is the vault's primary purpose."** The moment you adopt Zettelkasten, the purpose is fixed to C (output). Promote accumulation to the primary goal and the pipeline's decision criteria break.
- **Don't mix the decision log (D) into permanents.** Decisions are tied to a specific point-in-time context; permanents are atomic and have no timeline. They can't coexist, so if you want to handle D, do it outside ZK (a separate directory / tool).
- **The cure for the "bloat" feeling is to produce output, not to cut accumulation.** Means (B) is working, so trimming it is the wrong move. What's missing is a destination for output.

## Results

- The true nature of "the vault is bloating and I'm not using it" turned out to be not over-accumulation but **output dysfunction.** The move changed from "organize" to "write."
- I internalized, as roles, that my knowledge-gardener leans on A/B and that C can only be turned by me outside the tool. I can judge that raising output frequency beats building the tool out further.
- This post itself is the first output along that judgment.

## Wrap-up

- A Zettelkasten has exactly **one purpose — output (C)**. Searchability (A) and insight crystallization (B) are means; the decision log (D) is foreign.
- The tools that grow the vault (my own plugin) do almost only A/B. C is outside the tool, moved only by you writing.
- The "bloating and unused" feeling is output dysfunction, not over-accumulation. Solve it with output, not organizing.
- The more you build tools, the more the means becomes the end. The rein is always returning to the single point: "the purpose (C) is output."

## References

- [knowledge-gardener (GitHub)](https://github.com/Kohei-Wada/knowledge-gardener) — the Claude Code plugin I built to grow the vault (turn A/B)
- Sönke Ahrens, _How to Take Smart Notes_ (2017) — the modern framing of ZK with writing as the purpose
