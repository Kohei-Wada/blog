---
title: 'My Home Server Kept Freezing (Part 5) — The Spill Cliff: tok/s Is Set by What Overflows'
description: 'The experiment the healthy RAM finally unlocked: how much does spilling a model out of VRAM into CPU actually cost? A num_gpu sweep drew not a proportional curve but a cliff. The law tok/s ≈ RAM bandwidth ÷ spilled GB, and the practical size limit where a 70B still runs.'
pubDate: '2026-07-08T15:00'
tags: ['local-llm', 'RTX5090', 'ollama', 'homelab', 'home-server']
seeAlso:
  [
    'home-server-random-freeze-part4-proving-the-repair',
    'home-server-random-freeze-part3-memtest-verdict',
  ]
---

## Previously

[Last time](/en/blog/home-server-random-freeze-part4-proving-the-repair), I proved the replaced RAM innocent with a layered check. The now-healthy RAM unlocked, as a side effect, one experiment.

Back when it was broken, pushing a model out of VRAM and down into system RAM — **spill** — was off-limits. The defect clustered right around the 50GB region, and spilling into it meant an instant crash. Now I can measure it safely. The question that always nagged me — how much slower does spill actually make things — gets pinned down with data for the first time.

## What Spill Is

LLM inference normally keeps the model weights in the GPU's VRAM. It's fast because VRAM bandwidth is enormous. But when the model doesn't fit in VRAM, the overflow layers go to system RAM and the CPU computes them. That's spill (CPU offload).

Everyone knows it gets slower. What I wanted to know was the "how much" and the "how." Does it slow down linearly, or in some other shape?

## The num_gpu Sweep

With `qwen3:32b` (64 layers total), I swept the number of layers placed on the GPU (`num_gpu`) and measured generation speed. tok/s can be computed precisely from `eval_count` (tokens generated) and `eval_duration` (generation time) in ollama's response.

| num_gpu | weights on CPU | gen tok/s | VRAM used |
| ------: | -------------: | --------: | --------: |
|       0 |         ~20 GB |      2.99 |     2 MiB |
|      16 |         ~15 GB |      3.76 |    5.9 GB |
|      32 |         ~10 GB |      5.43 |   10.5 GB |
|      48 |          ~5 GB |      9.64 |   15.1 GB |
|      64 |              0 |     49.61 |   19.9 GB |
|     999 |              0 |     63.78 |   20.2 GB |

(`num_gpu:999` puts all layers plus the output layer on the GPU.)

## The Cliff

Look at the numbers. Raising `num_gpu` from 0 to 48 only crawls tok/s from 3.0 to 9.6. Put more than half the layers on the GPU and it's still that slow.

Then 48 → 64 produces a **9.6 → 49.6 tok/s jump, roughly 5×.** Not a proportional curve. A **cliff.**

Why? Generating one token requires passing through all layers in order. Layers on the GPU are fast; layers on the CPU are slow. Time per token is roughly:

```
time per token ≈ (layers on CPU × CPU time per layer)
               + (layers on GPU × GPU time per layer)
```

A CPU layer is orders of magnitude slower than a GPU one, so **the layers left on the CPU dominate. If even one layer stays on the CPU, it becomes the bottleneck.** So it stays slow right up until the last layer moves to the GPU, and the instant the bottleneck clears, it jumps. That's the cliff.

## The Law: tok/s ≈ RAM Bandwidth ÷ Spilled GB

You can push one step further. Generation reads each weight once per token, so the CPU side is purely **RAM-bandwidth bound.** View each sweep point as "tok/s × GB on CPU" and the value is nearly constant:

```
num_gpu 48:  9.64 tok/s × ~5 GB  ≈ 48
num_gpu 32:  5.43 tok/s × ~10 GB ≈ 54
num_gpu 16:  3.76 tok/s × ~15 GB ≈ 56
num_gpu 0:   2.99 tok/s × ~20 GB ≈ 60
```

So **tok/s ≈ effective RAM bandwidth ÷ (GB spilled to CPU).** That ~60 GB/s coefficient is this machine's effective DDR5-5600 dual-channel bandwidth (just under 70% of the 89.6 GB/s theoretical — a reasonable real figure). GPU layers are essentially free, so **only the spilled portion kills the speed** — not the total model size. That's the counterintuitive part.

## The Practical Model-Size Limit

If speed is set by the spill amount alone, you can back out the ceiling on model size too. Take VRAM's effective capacity as 28GB (subtracting headroom for KV cache etc.): **model size ≈ 28GB + tolerable spill.**

| Feel       | tolerable tok/s | max spill | model that fits (Q4)             |
| ---------- | --------------: | --------: | -------------------------------- |
| Snappy     |              10 |     ~6 GB | ~34 GB (32B Q6 / 49B Q4)         |
| Usable     |               5 |    ~12 GB | **~40 GB (70B Q4, just barely)** |
| Patient    |               3 |    ~20 GB | ~48 GB (70B Q5)                  |
| Batch only |               1 |    ~60 GB | ~78 GB (capacity limit)          |

The table also implies that a half-hearted spill is the worst place to be: the moment you overflow a little, you drop off the cliff.

## Checking Against a 70B

To test whether the theory holds, I ran the real thing. I loaded `llama3.3:70b` (Q4, 42GB). 42GB doesn't fit in 32GB of VRAM, so ollama auto-placed it 73% GPU / 27% CPU — ~12GB spilled into system RAM.

The law predicts 60 ÷ 12 ≈ 5 tok/s. Measured: **4.93 tok/s.** Right on the nose.

And this is the heaviest memory placement this machine can make — 42GB spread straddling VRAM and RAM. As I wrote [last time](/en/blog/home-server-random-freeze-part4-proving-the-repair), back when it was broken this layout was an instant kill. Now it runs a 70B, slowly but normally.

## The Exception: MoE

The one case where this law breaks is MoE (Mixture of Experts). MoE doesn't read all parameters per token — it reads only **the active subset of experts.** So even at a huge nominal size, the amount actually read each token (and thus the spill cost) is small. If you want to run a big model via spill, MoE is the only real option — that's the takeaway the data suggests.

## Takeaways

- **Speed is set not by total model size but by what overflows VRAM.** `tok/s ≈ effective RAM bandwidth ÷ spilled GB`. On this machine, effective bandwidth is ~60 GB/s (DDR5-5600 dual-channel).
- **So performance is a cliff.** Half spilled is not half the speed. It's nearly a binary bet on whether the whole thing fits on the GPU.
- **The practical limit is effective VRAM + tolerable spill.** With 32GB VRAM + DDR5-5600, a 70B Q4 (~40GB) is the usable line, measured at ~5 tok/s. Plenty for patient use.
- **To go beyond that, reach for MoE.** It reads only the active subset, so its spill cost is low.
- And above all — the experiment itself was proof the RAM was fixed. I got to measure the heaviest memory placement this machine can make, without it falling over.
