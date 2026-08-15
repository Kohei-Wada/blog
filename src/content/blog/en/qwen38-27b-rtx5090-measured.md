---
title: "Qwen3.8 27B Measured on an RTX 5090 — and Why vLLM Didn't Work"
description: 'Running Qwen3.8 27B on a 32GB card on launch day: the runtime version wall, VRAM measured at each context length, and the full account of trying to move it to vLLM for concurrency and failing. Includes a size survey of the "4-bit" builds — none came in under 18GB — and the image input that a client was quietly discarding.'
pubDate: '2026-08-15T15:00+09:00'
tags: ['local-llm', 'ollama', 'RTX5090', 'AI', 'homelab']
seeAlso: ['local-llm-eval-harness-reuse']
---

## Introduction

Qwen3.8 27B came out, so I put it on my RTX 5090 (32GB). How it did on multi-step agent work is in [Only the Design of My Eval Harness Survived](/en/blog/local-llm-eval-harness-reuse); this post is the numbers and the walls I hit along the way.

On ollama, generation came out roughly twice as fast as the previous generation. **I could not move it to vLLM.**

## First, a runtime version wall

`ollama pull qwen3.8:27b` gets rejected with this:

```text
Error: pull model manifest: 412:
The model you are attempting to pull requires a newer version of Ollama.
```

You need **0.32.12 or later** — that's the release that added support for the architecture, and 0.32.13 adds handling for its developer instructions.

I manage this box with NixOS, and when I checked a few days ago nixpkgs was on 0.32.3 with master only at 0.32.7. I pinned 0.32.13 through an overlay. One trap here: ollama pins llama.cpp per version, and `LLAMA_CPP_VERSION` points at `b10380` for 0.32.13. Leave nixpkgs' pin (b10091) in place and the compatibility patch fails to apply, so that has to move too.

An unofficial GGUF (unsloth's) did pull on 0.32.9. That matters later.

## Speed

Measured on the same box, same runtime (0.32.13), same four prompts.

| Model            | Generation        |
| ---------------- | ----------------- |
| Qwen3.6 27B      | 72-73 tok/s       |
| Muse Glimmer 30B | 75 tok/s          |
| **Qwen3.8 27B**  | **124-149 tok/s** |

About double. What caught my attention: **the same Qwen3.8 only managed 72 tok/s when run as the unofficial GGUF on 0.32.9**. I changed the runtime and the artifact at the same time so I can't separate them (and that first figure came from a 28-token generation, which is a coarse basis). Still, with a gap that close to 2x, I think it's fair to say running this model on an old runtime costs you a large part of what makes it worth running.

### Thinking length

This was the bigger difference in practice. Asked to output three local specialties of a given city as a JSON array only, no prose and no markdown, Qwen3.6 burned thousands of tokens inside its thinking block, looping through `Wait, ... Actually, ... Let's double-check` for 29.3 seconds. Qwen3.8 settled it in about ten lines and 2.7 seconds.

Both respected the output format. Both were dubious on the content.

## VRAM at each context length

Same model (q4, 17GB), varying only `num_ctx`.

| num_ctx | Total VRAM | Delta  |
| ------- | ---------- | ------ |
| 32,768  | 19.7GB     | —      |
| 131,072 | 23.6GB     | +3.9GB |
| 262,144 | 29.2GB     | +9.5GB |

Weights are 17GB, so **asking for 256K hands roughly 12GB to the KV cache** (and activations). Run native context on a 32GB card and you're left with a bit over 3GB of headroom.

Note that I confirmed `num_ctx` was taking effect from how VRAM responds to it, not from the CONTEXT column in `ollama ps` — some ollama versions ignore a `num_ctx` below the model's native ceiling.

If a model feels heavier than you expected, the context setting is usually why. If you never actually reach 256K, dropping to 128K frees 5.6GB.

## Trying to move to vLLM, and failing

The **motivation** was concurrency. On my box ollama's `OLLAMA_NUM_PARALLEL` sits at 1, so it handles one request at a time. Measured, two concurrent requests means one of them waits out the other completely:

```text
alone       2577ms
two at once  A = 1874ms   ← served first
             B = 4164ms   ← waited for A
```

vLLM's continuous batching makes that genuinely parallel. There's an official recipe, vLLM itself is at 0.27.1 against a 0.17.0 requirement, and there's even a day-zero build tagged `qwen38-x86_64-cu130`. I thought this was going to work.

### Wall 1: "4-bit" isn't 4-bit

I pulled the NVFP4 weights for vLLM and **they occupied about 23GB after loading**. A 4-bit 27B should be 14-15GB. That's clearly heavy.

Curious, I compared the sizes of the 4-bit-family builds of Qwen3.8 27B on HuggingFace.

| Build                              | safetensors total |
| ---------------------------------- | ----------------- |
| philbert440/…W4A16-AWQ             | 18.21 GiB         |
| gittensor-model-hub/…NVFP4-RTX5090 | 19.18 GiB         |
| cyankiwi/…AWQ-INT4                 | 19.57 GiB         |
| unsloth/…NVFP4                     | 21.81 GiB         |
| goldhub/…INT4-W4A16-AutoRound      | 26.37 GiB         |

**Across the five I actually measured, nothing came close to 15GB.** Apparently the vision tower and parts of the DeltaNet stack stay at high precision; everything lands between 18 and 26 GiB.

ollama's q4, meanwhile, is 17GB — though that's the on-disk size from `ollama list`, which is not the same measurement as the safetensors totals above. Either way, the NVFP4 build I actually pulled took 23GB of VRAM, so **the same model starts 5-6GB heavier** on the vLLM side.

### Wall 2: CUDA graphs don't fit

Starting with `--gpu-memory-utilization 0.9` dies before KV is even allocated.

```text
torch.OutOfMemoryError: CUDA out of memory. Tried to allocate 784.00 MiB.
GPU 0 has a total capacity of 31.36 GiB of which 195.69 MiB is free.
```

Dropping `--max-model-len` from 256K to 64K **failed at the identical allocation in the identical place**. The stack trace explains why — summarised:

```text
determine_available_memory()
  └ profile_cudagraph_memory()        ← gpu_model_runner.py:6722
      └ _init_minimal_kv_cache_for_profiling()   ← :6606
```

CUDA graph memory profiling runs _inside_ `determine_available_memory` — that is, **before KV is sized**. So no amount of lowering the context length changes what this stage needs.

### Wall 3: eager mode is slow

`--enforce-eager` disables CUDA graphs and it starts. vLLM then tells you exactly how much KV is left:

```text
Available KV cache memory: 5.42 GiB
(204800 needs 6.56 GiB)
→ estimated maximum model length is 167776
```

163840 started successfully. Generation there measured **27.8 tok/s** — a fifth of ollama's 143. And:

```text
GPU KV cache size: 165,316 tokens
Maximum concurrency for 163,840 tokens per request: 1.01x
```

**Concurrency 1.01x.** At full context exactly one request fits. I went to vLLM for concurrency, and concurrency was the first thing sacrificed.

### Which to use

|             | ollama        | vLLM (the one config that worked) |
| ----------- | ------------- | --------------------------------- |
| Generation  | **143 tok/s** | 27.8 tok/s                        |
| Context     | **262,144**   | 163,840                           |
| Concurrency | serial        | 1.01x                             |

The remaining option is the lightest AWQ (18.21 GiB); given the OOM was short by about 100MB, shedding 4.8 GiB would likely clear graph capture. But the only payoff is concurrency, and buying it means trusting a stranger's quantization — checking it hadn't gotten dumber would mean re-running the whole evaluation. I stopped there.

Some things did work. `--served-model-name` flattens the repo path into a plain alias (some clients can't handle the slash), and `--tool-call-parser qwen3_coder` returned correct `tool_calls`. vLLM's startup log also shows the Triton/FLA kernels for Gated DeltaNet being selected.

## Aside: the images weren't arriving

Qwen3.8 is multimodal, but sending it an image through an agent CLI came back with "this model does not support image input".

Hitting ollama directly, images work correctly on both the native API and the OpenAI-compatible endpoint. Neither the model nor the server was at fault.

The cause was client-side configuration: `attachment: true` is not enough, you also need **`modalities`**. Without it the image part gets swapped for the text "this model does not support image input" before it's sent. The sentence that looked like the model's answer was written by the client.

```json
"modalities": { "input": ["text", "image"], "output": ["text"] }
```

Adding it fixed things. The same gap was present for another vision model I'd been using for months. Given the mechanism is purely configuration-driven and that key was never there, **it was most likely broken the whole time**. There are several upstream issues about this, so it's worth checking if you use vision models through an OpenAI-compatible provider.

## Summary

- The runtime must be 0.32.12 or later; older ones cost you a lot of speed
- Native 256K fits on a 32GB card, but roughly 12GB of it goes to KV
- When multimodal doesn't work, suspect the client configuration first

And what the vLLM attempt actually showed is that **the problem was neither vLLM nor the model — it was simply that the vLLM-side weights are a few GB heavier**. Inside a 32GB budget those few GB squeeze the KV cache and the CUDA graphs at the same time, and context, speed and concurrency all fall over together. Card capacity is something you never think about while you have enough of it, and then you don't run short of one thing — you run short of everything at once.
