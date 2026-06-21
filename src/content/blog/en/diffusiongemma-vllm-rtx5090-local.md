---
title: 'Running DiffusionGemma Locally on an RTX 5090 with vLLM: The One-Time Pioneer Cost of Bleeding-Edge Model × Bleeding-Edge GPU'
description: "I stood up Google's diffusion language model DiffusionGemma as a vLLM OpenAI-compatible server on my home RTX 5090 (Blackwell / 32GB), so Open WebUI could use it as just another model. Declarative, on-demand on NixOS. This is the write-up of the traps I hit (a VRAM precheck that kills startup instantly, a container that wedges in a crash loop, the 32GB constraint that leaves NVFP4 as the only quantization that fits) and the lesson I drew from it: mature models are a one-liner, bleeding-edge ones you pioneer by hand exactly once."
pubDate: 'Jun 21 2026'
tags: ['local-llm', 'vLLM', 'RTX5090', 'homelab', 'NixOS', 'AI']
seeAlso: ['rtx5090-blackwell-headless-gsp-watchdog']
---

## Introduction

In the [previous post](/en/blog/rtx5090-blackwell-headless-gsp-watchdog) I covered keeping a home RTX 5090 (Blackwell) alive 24/7 against the GSP hang. This time it's about the model that runs on top of it — a record of standing up Google's diffusion language model **DiffusionGemma** locally on that 5090.

Let me lead with the conclusion. **It's genuinely fast — roughly ~300 tok/s by feel.** But the surrounding ecosystem is still immature (Open WebUI's web search doesn't integrate, among other things), so it earned a place as **an "experiment to test the speed" rather than a daily driver**. So this post isn't a victory lap about landing the best local model — it's a record of the **one-time pioneer cost you pay when you run a bleeding-edge model on a bleeding-edge GPU**.

## Why not ollama, why vLLM

DiffusionGemma isn't a normal autoregressive model. It generates via **block diffusion** — autoregressive between blocks, parallel diffusion _within_ a block — and that's the source of the speed. It doesn't emit one token at a time left-to-right, so generation latency is inherently shorter.

The catch is that the serving stack gets correspondingly special.

- **ollama is out.** It's not in the official library, and ollama doesn't expose llama.cpp's diffusion decode path. The GGUF is for llama.cpp's diffusion CLI and won't become an OpenAI-compatible server.
- **vLLM was the only OpenAI-compatible path.** It's the only way to drop the model into Open WebUI as "just another model." Since Open WebUI is itself a multimodal hub, you don't add a new tool — you **just add one more backend**.

## NVFP4 is the only thing that fits 32GB

The RTX 5090 has 32GB of VRAM. Trying to fit DiffusionGemma into that narrows the quantization choices hard.

- bf16 is in the 96GB class; even INT8 needs 48GB. **The only thing that fits in 32GB is NVFP4.**
- I used `nvidia/diffusiongemma-26B-A4B-it-NVFP4`. Its license is gated=False, so you don't even need an HF token.

## The recipe that worked (raw podman)

Here's the launch command that finally came up:

```bash
podman run -d --name vllm-diffusiongemma \
  --device=nvidia.com/gpu=all --network=host \
  -v /srv/models/hf-cache:/root/.cache/huggingface \
  -e VLLM_USE_V2_MODEL_RUNNER=1 -e HF_HUB_DISABLE_XET=1 \
  docker.io/vllm/vllm-openai:gemma-x86_64-cu130 \
  nvidia/diffusiongemma-26B-A4B-it-NVFP4 \
  --host 0.0.0.0 --port 8000 --max-num-seqs 4 \
  --attention-backend TRITON_ATTN \
  --enable-auto-tool-choice --tool-call-parser gemma4 --reasoning-parser gemma4 \
  --gpu-memory-utilization 0.7
```

Two things to watch.

- **Match the image tag to the host's CUDA.** CUDA 13.x → `gemma-x86_64-cu130`.
- The architecture `DiffusionGemmaForBlockDiffusion` is **built into the gemma image**, so you don't need `--trust-remote-code`. It's a small thing but a real security point: you're not executing arbitrary code from the model repo — zero RCE exposure.

Cold start is ~140s (torch.compile + multimodal warmup; weights already cached). Once `/v1/models` and `/v1/chat/completions` answer, you're up.

## Trap 1: the VRAM precheck kills startup instantly

My first attempt was `--gpu-memory-utilization 0.9`, and it died before startup.

```text
ValueError: Free memory ... less than desired
```

vLLM requires `util × TOTAL(32GiB) ≤ current free VRAM` before it starts. But the baseline — nvidia-persistenced and friends — already takes ~4GiB, leaving only ~27GiB free. So 0.9 (asking for ~29GiB) dies at the precheck. **You have to pick a value that subtracts the baseline.** 0.7 (~22GiB) passed, and it still held a 256K context.

## Trap 2: a container that wedges in a crash loop

When startup failed and it entered a restart loop, a container that didn't get killed cleanly got stuck in "Stopping," and `podman rm -f` started timing out (main thread in `Z`, child threads in `S`).

I first suspected the GPU or driver had wedged, but **nvidia-smi was responding**, which ruled that out. The GPU was fine; only the container side was stuck. Here's the sequence that removed it without a reboot:

```bash
systemctl stop podman-vllm-diffusiongemma   # stop the restart loop
systemctl reset-failed podman-vllm-diffusiongemma
kill -9 <pid>
podman rm -f --time 1 vllm-diffusiongemma
```

The trick was distinguishing "the GPU broke" from "the container wedged" by whether nvidia-smi answers.

## Making it on-demand and declarative on NixOS

There's only one GPU, so it fights the big ollama models for VRAM. So I made it on-demand — dormant by default, started only when needed. Declared via `oci-containers`, with the exclusion enforced in systemd:

- `conflicts = ["ollama.service"]` — starting vLLM stops ollama, freeing the VRAM.
- `wantedBy = lib.mkForce []` — no auto-start at boot.

It's dormant most of the time. `systemctl start podman-vllm-diffusiongemma` wakes it; when I'm done I stop it and `start ollama` to go back. Open WebUI connects with a single env line (`OPENAI_API_BASE_URLS = "http://127.0.0.1:8000/v1"` plus a dummy key), and while vLLM is stopped that model simply drops off the list.

## Takeaways and the generalizable lesson

The speed (block diffusion) is real. But for daily use it has too many sharp edges — Open WebUI's web search doesn't work, penalty-family parameters are ignored, the default max_tokens is 256. So I decided to **leave it parked as an experiment, config and all** (resume is one `systemctl` away; image and weights are cached).

Here's the generalization I'd pull out of it:

> **Mature models are a one-liner; bleeding-edge ones you pioneer by hand exactly once — then declare it, and it's a one-liner forever after.**

A bleeding-edge model × a new-generation GPU is the intersection where the software stack is least mature. And the nasty part is that **even when the eval (can the model load at all) passes, it's the on-machine resource precheck where it first falls over**. This is the class of failure you can't see on paper — it only surfaces at runtime. Which is exactly why you pioneer it once by hand, freeze the working config declaratively, and reproduce it with a single `systemctl start` next time. Deciding whether that one-time pioneer cost is worth paying is, I think, the whole point of this kind of experiment.
