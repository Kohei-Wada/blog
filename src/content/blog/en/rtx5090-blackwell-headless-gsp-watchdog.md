---
title: 'Running Blackwell (RTX 5090) Headless 24/7: The Real Boss Is the GSP Hang, and I Took It With a "Assume It Breaks" Watchdog'
description: 'Turning a latest-gen consumer RTX 5090 (Blackwell) into a 24/7 unattended AI server is near-zero-precedent pioneer territory. On top of known traps — nvidia-open being the only driver, the CUDA sm_120 gotcha — the real boss is the GSP heartbeat timeout hang, which cannot be reset in place. Before writing any GPU config I scouted the landmines with deep-research, then built a declarative NixOS watchdog that reboots on an unresponsive nvidia-smi, assuming the hang will eventually hit.'
pubDate: 'Jun 14 2026'
tags: ['NixOS', 'NVIDIA', 'RTX5090', 'homelab', 'home-server', 'troubleshooting']
---

## Introduction

In the [previous post](/en/blog/nixos-home-ai-server-install-gotchas) I covered picking NixOS for my home AI server and doing the base install. Once the OS is in, the next step is enabling the GPU and getting to the actual goal — running local LLMs 24/7. But this is where the hardest obstacle lives: the **GSP heartbeat timeout**, an as-yet-unresolved hang bug.

The GPU is an **RTX 5090 (Blackwell generation)**. Repurposing a latest-gen consumer card as a server is **pioneer territory** with almost no community precedent for stable operation. So this time, instead of "run it and deal with problems later," I decided to **scout the landmines before stepping on them**. This post is a write-up of the known issues that scouting surfaced, and the watchdog design I built assuming the hang _will_ eventually hit.

To be honest up front: this isn't a war story of "my GPU crashed a dozen times." It's the story of **scouting ahead and preparing a catch for when it breaks**. The first-hand part I'm writing about is that design decision.

## First, the settled facts: driver and CUDA

Let's clear the parts you can settle by just looking them up, before they bite.

### The driver is `nvidia-open`, no choice

Blackwell is **completely unsupported** by the proprietary driver (per NVIDIA). There's no alternative, and NixOS **enforces** declaring `open` via an assertion for driver >= 560. Headless operation also wants `nvidiaPersistenced` — the right setting to keep the GPU awake even when headless.

```nix
hardware.nvidia = {
  open = true;               # the only option on Blackwell
  nvidiaPersistenced = true; # keeps the GPU initialized while headless
};
```

### CUDA / inference-stack traps

- **sm_120 requires CUDA 12.8+**. nixpkgs' default `cudaPackages` is intentionally held back on the 12.x line, so you have to declare `cudaCapabilities = ["12.0"]` explicitly. The official docs' Blackwell example only covers sm_100 (datacenter); consumer sm_120 is a blind spot.
- **llama.cpp wants arch `120a`**. Plain `120` throws a ptxas error on MXFP4. Ollama is in the same blast radius, so assume you'll verify GPU offload empirically rather than trust it works.

That's the "look it up and the answer is settled" layer. The next part is the problem.

## The real boss: GSP heartbeat timeout

This is the scariest thing about 24/7 operation. The GPU's firmware (GSP) suddenly stops responding and takes the whole GPU down with it.

- Symptoms are **Xid 119/109/79/8**, plus **silent hangs that don't even emit an Xid**.
- It's **not load-dependent — there are reports of it happening at idle**. "Don't run heavy inference and you're safe" is false.
- NVIDIA's own `open-gpu-kernel-modules` has issues #1080 / #1111 open (as of 2026-06). In other words, **unresolved**.

And the part that really hurts is that **recovery after it happens is hell**.

- After a crash, **a normal reset doesn't work** ("WPR2 already up"). A PCI Secondary Bus Reset + module reload, or failing that a **power cycle**, are the only reliable ways back.
- On the `open` driver, the classic workaround of **disabling GSP is structurally impossible**. NixOS hard-fails it with an assertion, and `NVreg_EnableGpuFirmware=0` is ignored.

In short, "prevent it with config" isn't on the table — the reality is "**if it wedges, your only option is to reboot**."

## So I built a watchdog that assumes it breaks

If you can't prevent it, all you can do is **detect the wedge and recover automatically**. Since an in-place reset doesn't work, the only reliable recovery is a reboot. I wired a declarative systemd watchdog into NixOS:

```nix
systemd = {
  services.gpu-watchdog = {
    description = "Reboot if nvidia-smi stops responding (GSP wedge)";
    path = [config.hardware.nvidia.package.bin];
    script = ''
      if ! timeout 60 nvidia-smi > /dev/null 2>&1; then
        echo "nvidia-smi unresponsive for 60s — rebooting" \
          | systemd-cat -p err -t gpu-watchdog
        systemctl reboot
      fi
    '';
    serviceConfig.Type = "oneshot";
  };

  timers.gpu-watchdog = {
    wantedBy = ["timers.target"];
    timerConfig = {
      OnBootSec = "5min";
      OnUnitActiveSec = "5min";
    };
  };
};
```

Every 5 minutes it pokes `nvidia-smi`, and **if it doesn't come back within 60 seconds it declares the GPU wedged and runs `systemctl reboot`**. It's blunt, but against an opponent where a reset doesn't work, a reboot is the most reliable move, so I made peace with it. It's unattended, so "I woke up and it was frozen" is the only thing I really need to avoid.

I also added a mitigation (anecdote-level, n=1–3): a **power cap**.

```nix
# RTX 5090 TDP=575W. Inference and Frigate need well under 400W.
# Idle stays ~70W regardless. This only caps peak draw.
script = ''nvidia-smi -pl 400'';
```

There are **PSU-related Xid 119 reports** around the GSP hang (cases resolved by swapping the PSU), so suppressing power spikes is reasonable. This box already runs a native ATX 3.1 1300W Platinum PSU, but I capped peak draw to keep more headroom anyway.

## Would switching to Ubuntu avoid it? → No

"Wouldn't Ubuntu, with more reports out there, be more stable?" is the obvious thought, but my researched answer was No.

**The GSP issue is distro-independent.** It's reported on Mint, Fedora, and others, and Blackwell forces `nvidia-open` on every distro, so the landmine is shared. Switching to Ubuntu buys **more anecdotes but doesn't avoid the crash**. Trading away NixOS's rollback and declarative config for that isn't worth it.

The landing spot is the same as last time: **stay on NixOS + design assuming a watchdog recovers + keep one Ubuntu Live USB for triage**. Just enough of a safety net to tell "is this a GPU problem or a Nix-config problem?" when something jams.

## Wrap-up

Pioneer territory — putting a latest-gen consumer GPU in a server — turns out to have **reset-proof-grade landmines (the GSP heartbeat timeout)** sitting right there. Since you can't prevent it with config, aiming for "it won't break" is less realistic than "**assume it breaks and build automatic recovery**."

And in moments like this, declarative config quietly pays off. The watchdog and the power cap all live as code in `configuration.nix`, so **the recovery design itself becomes a reproducible asset**. If the SSD dies, I can rebuild the whole catch along with it. It's the same point as the "peace of mind of rollback" from last time — the harder the pioneer territory you're crossing, the more this property earns its keep.

Whether I actually hit the moment a GSP wedge happens is something I'll find out as I run it. Once the watchdog's trigger logs start showing up, I'll add an update.
