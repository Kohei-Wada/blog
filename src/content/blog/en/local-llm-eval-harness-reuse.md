---
title: 'Only the Design of My Eval Harness Survived'
description: 'Three weeks ago I wrote an RFC 6902 porting harness to decide whether to keep Ornith. I reused it to evaluate Qwen3.8 27B — except the script itself had vanished with /tmp, and rebuilding took minutes only because the design was written down. Plus a record of the two predictions it proved wrong.'
pubDate: '2026-08-15T13:00+09:00'
tags: ['local-llm', 'ollama', 'RTX5090', 'AI', 'homelab']
seeAlso: ['moe-vs-dense-local-llm-agent-tasks']
---

## Introduction

Three weeks ago, to settle whether Ornith 1.0 35B (MoE 35B/A3B) deserved to be opencode's default on my RTX 5090, I wrote a harness that makes a model port RFC 6902 (JSON Patch) to Rust ([The 3x faster local LLM that couldn't finish the job](/en/blog/moe-vs-dense-local-llm-agent-tasks)). It was three times faster and matched on quality for one-shot work, but went 0-5 on multi-step agent tasks, and Ornith ended up demoted to a speed lane.

Qwen3.8 27B came out, so I ran it through the same harness. I switched: the default moved from Qwen3.6 27B to Qwen3.8 27B.

But that isn't what I want to write about. What I want to write about is that **what survived was not the script but the design**. The script itself lived in `/tmp`, and `/tmp` was gone.

## What to measure

Last time's lesson fits on one line. **One-shot accuracy does not predict multi-step completion.** A model that looks fast and capable on a single answer drops its state on the fifth turn. Going 0-5 taught me that properly.

So published benchmark numbers are only a starting point. I looked at the official figures this time too, and they were good. But that decides "worth trying", not "make it the default". The second question can only be answered by whether it gets through my own task.

## What's in the harness

It isn't a benchmark — it's actual porting work. Port RFC 6902 and RFC 6901 from the Python reference implementation to Rust. Pass or fail is decided solely by the official conformance suite: 112 cases, 4 of them disabled. That's split into four phases, run **one phase per session**, with the model unloaded between phases so nothing carries over. The phase split (test runner → JSON Pointer → add/remove/replace → move/copy/test) is unchanged from the previous post.

What makes the design work is not how it measures performance but **how it prevents cheating**.

**The suite and the reference implementation are read-only.** `chmod a-w`, and after the run I `diff -r` them against the originals. That closes the path of loosening a test to go green.

**The model's words don't count as evidence.** The verdict always comes from me running `cargo test`. Last time I watched a model deliver a correct fix and then explain, at length, a function that did not exist — so this one is non-negotiable.

**One phase has "must be red" as its done condition.** The first phase is a stub implementation, so red is correct. If a model reports green there, that report is itself the evidence of cheating. It's a tripwire.

**First-attempt passes are recorded in a separate column from passes-with-retries.** That's new this time. A model that goes red and then succeeds when a human says "try again" is costing me something real, and I don't want that mixed into the same "passed".

## Results

Qwen3.6 got through this task in July. That's why it held the default. But back then I wasn't separating first-attempt from retried passes, so it can't be lined up rigorously against this round's numbers.

I ran Qwen3.8 three times.

```text
run A  suite/reference UNMODIFIED  total=112 pass=108 fail=0 skipped=4
run B  suite/reference UNMODIFIED  total=112 pass=108 fail=0 skipped=4
run C  suite/reference UNMODIFIED  total=112 pass=108 fail=0 skipped=4
```

All three green on the first attempt, no retries, tamper check clean.

More convincing than the numbers: **all three reached exactly `pass=88 fail=20` at the third phase**. 88 of 112 done, the remaining 20 belonging to the next phase — the same breakdown three times over. That isn't luck, it's a stable route into the problem. That's where the decision got made.

## Two predictions I got wrong

Worth recording the times my own read was wrong. Half the value of a harness is here.

**First, VRAM.** Qwen3.8 has a hybrid attention stack with full attention on only one layer in four, so I wrote in a config comment that the KV cache would shrink and it would sit lighter than Qwen3.6. Measured: 29.2GB. **Heavier** than the 26.7GB recorded for Qwen3.6 back in late June. The measurement conditions weren't perfectly matched, but either way it did not get lighter.

I assume the vision tower and the per-layer recurrent state on the linear-attention side are what cost the difference, but I never isolated them. All I measured was the total; the cause is speculation. What I know is that the prediction was wrong. The comment did say "not yet measured, check after deploy", so I rewrote it — prediction included — once the number came in. I had also written "this is now the tightest fit on the box", which was simply false: eight lines below sits another model at 31.8GB. I hadn't read my own table.

**Second, speed.** After upgrading the runtime and moving from an unofficial GGUF to the official tag, one-shot generation went from 72 tok/s to 143 tok/s. I changed the runtime version and the model artifact at the same time, so I can't separate them, but given that the newer runtime is the one with a native linear-attention implementation, I'd guess that's the main cause.

Either way it doubled. I assumed multi-step work would speed up too. It didn't. Each run took 1161-1879 seconds. Obvious in hindsight: what dominates multi-step wall-clock isn't token generation, it's the round trips — read and write files, run the tests, read the output, decide what's next. Doubling generation doesn't even get you 1.5x overall.

Everything I'd mentally credited to that tok/s number had to be written back down. **The reason to switch wasn't speed, it was the first-attempt pass rate.**

## The thing that vanished was the script

As I said up top, the old harness kept its inputs in `/tmp`, and `/tmp` was wiped. Only the output side survived.

Rebuilding still took minutes. The conformance suite is officially distributed and the reference implementation is public. The plan file and the agent instructions were still in the experiment directory. Everything needed to reproduce it was written down somewhere.

The part that mattered most: the plan file recorded the counts — "`tests.json` has 95 cases, `spec_tests.json` has 17, 112 total, 4 disabled". Count the files you fetched, match the numbers, and you know you didn't grab the wrong thing. I originally wrote that line as a pass condition ("a runner that loads fewer than 112 cases is broken"). Using it to validate the inputs themselves never occurred to me.

So "I reused the same script" isn't accurate. **What I reused was the design; the script was rewritten.** The counting rule changed too. What survived was the phase split, the machine-only-verdict principle, the anti-cheat construction, and the count invariant. Because those were in a document, losing the artifact cost almost nothing.

## Limits

Honestly, this measures **one task family**. Porting from Python to Rust is a fairly specific shape. How it handles images, the quality of its Japanese, whether it can actually recall something after 200K tokens — all outside this harness.

So I think it's enough to justify swapping the default, but not enough to justify deleting every other model. Qwen3.6 is still there.

And when the next model shows up, this round's script has probably vanished too. That's fine. **What I can't afford to lose isn't the artifact — it's why I chose to measure that way.**
