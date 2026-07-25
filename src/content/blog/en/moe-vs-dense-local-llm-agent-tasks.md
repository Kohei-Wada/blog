---
title: "A 3x Faster Local LLM That Can't Finish the Job — Two Days of MoE vs Dense on Real Tasks"
description: 'The MoE coding model I put on my RTX 5090 was 3x faster with equal single-shot quality, so it became my opencode default. Then it went 0-for-5 on multi-step agent work. A record of porting RFC 6902 with a 112-case conformance suite as the machine judge, and the structural trade-off it exposed: the source of MoE speed and the cause of its failures are the same thing.'
pubDate: '2026-07-25'
tags: ['local-llm', 'ollama', 'RTX5090', 'AI', 'homelab']
seeAlso: ['diffusiongemma-vllm-rtx5090-local']
---

## Introduction

I run ollama on a home RTX 5090 (32GB) and use it through opencode. My default model
had long been the dense Qwen3.6 27B, but when I tried **Ornith 1.0 35B** (35B/A3B),
a coding-focused MoE model, the numbers were too good to ignore — single-shot code
generation at equal-or-better quality and **about 3x faster** (246 tok/s vs 71 tok/s).
I swapped the default immediately.

This post is the record of that decision **falling apart within two days**. The
conclusion up front: **the source of MoE's speed and the cause of its failures in
agent work turned out to be the same thing.**

## Day 1: Chosen by measurement, not benchmarks (or so I thought)

Benchmarks are mostly self-reported, so I lined the models up on my own tasks:
implementing a function from a spec (14 independently-scored cases), fixing a
planted bug, and reviewing a shell script.

| Task                           | Ornith 35B (MoE)    | Qwen3.6 27B (dense) |
| ------------------------------ | ------------------- | ------------------- |
| Implement from spec (14 cases) | **14/14, 22s**      | 14/14, 58s          |
| Fix planted bug                | correct, 24s        | correct, 55s        |
| Script review                  | **9 findings**, 19s | 6 findings, 96s     |

For one-shot work there was nothing to argue about. On review it even beat the
dense model on finding count. "MoE for coding, settled" — that's how it looked.

## Day 2, morning: cracks appear on general tasks

As the default, it also handles general tasks like looking things up. That's when
strange answers started coming back.

Asked "how many days until the next public holiday?", it did search — but then
**fabricated a holiday out of nothing but the search snippets**. "August 1st is a
substitute holiday for Children's Day," it said. Complete nonsense.

Adding prompt discipline (don't answer until you've read the page body, always
check the current date with a tool, do date arithmetic with shell `date`) corrected
the behavior — but it still misread the page and got the holiday's date wrong.
**Discipline reduces it; it doesn't eliminate it.**

The same question given to the dense Qwen3.6: it fetched the current date with a
tool, read the holiday-list page body, wrote and ran the day-count arithmetic in
Python, and got everything right. By this point I had a bad feeling.

## Day 2, afternoon: a port experiment with a machine as the judge

To settle it, I designed an experiment: **porting RFC 6902 (JSON Patch) to Rust**.
The subject was chosen deliberately:

- The spec and a reference implementation already exist — minimal room for the
  model to "judge" anything
- An official conformance suite exists (language-neutral JSON, 112 cases) —
  **completion can be decided by a machine**

I split the work into phases — T0 (build the test runner), T1 (JSON Pointer),
T2 (add/remove/replace), T3 (move/copy/test) — and fixed each phase's completion
criterion as "`cargo test` prints `total=112 pass=N fail=0`".
**The model's "done!" counts for nothing.** Only test output judges.

### Result: Ornith went 0 for 5

Across five sessions, Ornith failed to close a single phase. The failure modes are
the interesting part:

1. **Forgot to add the dependency and reported "done" with code that didn't compile**
2. Wrote a test runner with **contradictory asserts** (requiring `filename` to be
   both A and B — guaranteed panic if ever called). It also ran `cargo init` for a
   whole separate project inside `tests/`, unprompted
3. Wrote a file that **cut off mid-comment at line 238** — and at the truncation
   point, the leaked text read "let me reconcile:", **its chain of thought bleeding
   into the code**
4. Built itself a correct TODO list, then **abandoned the session partway through
   item one**
5. Wrote **calls to `op_add` / `op_remove` without ever writing the function
   bodies**, and finished

They share one trait: every failure left behind a **plausible-looking artifact and
a confident completion report**. Without the rule of only trusting test output, all
five would have passed as "done."

### The dense model finished every phase

Handing the same phases to Qwen3.6: slow, but it closed all of them. It wrote the
runner correctly on the first attempt, produced the 112-case tally, and eventually
reached **full conformance green** (pass=108 / fail=0 / skipped=4, the officially
disabled cases).

There was exactly one trick to the dense side: **cut tasks down until they fit in
one session**. At 71 tok/s with always-on reasoning it's slow, so putting diagnosis
and fix in the same session runs out the clock. Diagnose upstream, hand over the
established facts, and let it do only the fix — that's fast enough.

## Why this happens: the speed and the failures share one cause

Ornith is not stupid — recall that it beat the dense model on the one-shot review.
It's not smaller either: at 35B total it's bigger than Qwen3.6's 27B, and it still
lost.

MoE's 3x speed comes from waking only ~3B active parameters per token. And that
economy appears to be what thins out its ability to **carry state across turns** —
an inference drawn from five failures, but they line up cleanly. All
five happened in "decide the next step based on what you just did"
territory — wiring up the edit you just made, working through the TODO list you
just wrote, finishing the function you just started.

So the boundary is not "coding vs general tasks." It's
**"closes in one shot vs carries state."** Search-then-answer works.
Search-extract-compute falls over. Generate-wire-test falls over too.

## Where things landed

- **Default = Qwen3.6 27B (dense).** Make the model that survives multi-step work
  the standard. The nastiest failure mode — not realizing a task is multi-step,
  handing it to the fast model, and getting silently wrecked — disappears with the
  default
- **Ornith demoted to a named speed lane.** An opencode custom agent with "tasks
  that close in one or two tool calls only; if it turns out to need chaining, step
  aside" baked in. It keeps one-shot generation and device control
- **Completion judged by machines, fixed.** Tests, state read-backs, tally lines
  with fixed case counts. In this whole experiment the number of times I trusted a
  model's completion report was zero — and that's the only reason it worked

Not benchmark scores, not tok/s — **measuring where a model breaks, on your own
tasks**, is the real work of choosing a local LLM. The 3x speed stings to give up.
But speed that doesn't finish isn't speed.
