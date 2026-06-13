---
title: 'Why I Picked NixOS for a 24/7 Home AI Server, and the 5 Gotchas That Bit Me During Install'
description: 'Building a 24/7 unattended AI server as a local-LLM playground, I dropped my original plan of Arch and went with NixOS. Here is why I chose declarative config and rollback, and — on a Blackwell GPU (RTX 5090), basically zero-precedent pioneer territory — the five things that actually tripped me up installing from the minimal ISO: the wpa_supplicant trap, btrfs mount options getting dropped, losing the network on a headless reboot, WiFi power save wrecking SSH latency, and remote sudo + glob expansion.'
pubDate: 'Jun 14 2026'
tags: ['NixOS', 'homelab', 'home-server', 'WiFi', 'btrfs', 'troubleshooting']
---

## Introduction

I built a home AI server that runs around the clock, as a playground to mess with local LLMs. The GPU is an RTX 5090 (32GB), and it's headless and unattended by design. The question was which OS to run. I use Arch on my daily machine, so I figured I'd go with Arch — but in the end I picked **NixOS**.

To cut to the chase: it was the right call. But because the GPU is a Blackwell-generation card — **basically zero community precedent, pioneer territory** — installing from the minimal ISO got me stuck a few times, as expected. This post is a write-up of "why NixOS" and "the gotchas I actually hit during install." It's not a generic NixOS intro; I'm only writing the parts where I personally got my hands dirty.

## Why I dropped Arch for NixOS

My laptop runs Arch and I have no complaints. But a **24/7 unattended server** has different requirements.

- **Declarative configuration**: the server's entire state lives in one `configuration.nix`. The "I installed something by hand and later forgot why it's here" failure mode can't happen by construction.
- **Easy rollback**: if a kernel or driver update breaks boot, `nixos-rebuild switch --rollback` puts me back on the previous generation instantly. I have a scar from an Arch kernel update that broke and left me stuck with no network ([separate post](/en/blog/arch-safe-kernel-upgrade-journey)), so this matters a lot.
- **Reproducibility**: keep the config in git, and if the SSD dies I can rebuild the same environment.

There's a learning cost to the Nix language, but with a Haskell/Lua background I judged it acceptable. It also fit my rule of thumb that "systems aligned with the grain of my interests (declarative, functional) are the ones I actually keep up."

### Why not Ubuntu

NixOS + RTX 5090 (Blackwell) has almost no precedent. Naturally you wonder, "wouldn't Ubuntu be safer, with more reports out there?" I did my homework here first.

The scariest thing about running Blackwell 24/7 is an unresolved hang bug called the **GSP heartbeat timeout** — and as far as I could find, it's **distro-independent** (reported on Mint, Fedora, etc. Blackwell forces the `nvidia-open` driver on every distro, so that part is shared). In other words, switching to Ubuntu would buy me **more anecdotes but not avoid the crash**. Giving up NixOS's rollback and declarative config for that isn't worth it.

So I landed on: "**stay on NixOS + design assuming a watchdog auto-recovers + keep a single Ubuntu Live USB for triage**." Just enough of a safety net to answer "is this a GPU problem or a Nix-config problem?" when something jams.

## The 5 gotchas during install

Now the main event. I did a base install from the NixOS 26.05 minimal ISO with a btrfs subvolume layout. I ran the whole thing remotely over SSH, so the traps specific to that are included.

### 1. WiFi: `nmcli` is the only way; poking `wpa_supplicant` directly is a trap

Since it's headless, the first thing I needed was WiFi up so I could open SSH. I followed the old wiki recipe of `wpa_passphrase > /etc/wpa_supplicant.conf` — and it **simply would not connect**.

The cause: the 26.05 installer ISO assumes NetworkManager. The ISO's `wpa_supplicant.service` starts with `-u` (D-Bus mode, no `-i`) as an **NM-only backend**, so writing your own conf never grabs the interface. Worse, even if you `kill` it, it **comes back via D-Bus activation**, so trying to drive it by hand just whiffs over and over.

The correct route is NetworkManager:

```bash
nmcli device wifi connect "<SSID>" password "<pass>"
```

One command and it connects. Trust the old recipe without questioning it and you're stuck at the very first step.

### 2. `nixos-generate-config` doesn't pick up btrfs mount options

I wanted `compress=zstd` and `noatime` on btrfs, so I mounted the subvolumes and ran `nixos-generate-config`. Looking at the generated `hardware-configuration.nix`, **`subvol=` was there but `compress=zstd` and `noatime` were gone**.

This is documented behavior in the official Wiki. Make it up on the `configuration.nix` side:

```nix
fileSystems."/".options = [ "compress=zstd" "noatime" ];
fileSystems."/nix".options = [ "compress=zstd" "noatime" ];
# ...one per subvolume
```

The lists get merged, so this adds on without dropping `subvol=`. A textbook case of "don't take the generated output at face value — diff it."

### 3. A headless reboot spawns a "server with no network"

This was the one that made me sweat. The WiFi connection info you set up on the ISO **does not carry over to the install target**. Reboot without noticing and the headless server comes up **with no networking** — and since there's no screen or keyboard attached, you are quite literally locked out.

You have to copy the NM profiles by hand before installing:

```bash
mkdir -p /mnt/etc/NetworkManager/system-connections
cp -a /etc/NetworkManager/system-connections/*.nmconnection \
      /mnt/etc/NetworkManager/system-connections/
chmod 600 /mnt/etc/NetworkManager/system-connections/*
```

(I later rewrote this declaratively with `networking.networkmanager.ensureProfiles` in `configuration.nix`, but to survive the first reboot you need this copy.)

### 4. WiFi power save makes SSH crawl

Once it came up, my **SSH keystrokes felt sluggish**. I suspected the hardware, but `time bash -lc true` showed shell startup at 0.002s. The shell was innocent.

Suspecting the network layer, I took a `ping`: **average 83ms, max 257ms on a LAN**. Normal LAN values are 2–5ms, so something was clearly off. This is the classic pattern of WiFi **power save** buffering packets until the next beacon.

The chip I was using (rtw89 / RTL8922AE) treats NetworkManager's `powersave: 0` not as "**disabled**" but as "**driver's choice**," and the driver happily turns power save on. Turn it off explicitly:

```bash
# runtime check + immediate fix
iw dev wlp7s0 get power_save
iw dev wlp7s0 set power_save off
```

On NixOS I made it permanent declaratively, adding `wifi.powersave = 2;` (2 = disable) to the profile. Result: **average 8ms, max 18ms** — about a 10x improvement. I learned in my bones that for a server, WiFi power save off is the default.

### 5. Remote `sudo` + glob expansion trap

Minor but quietly annoying. Firing a glob command remotely like `sudo cp ... *.nmconnection ...` **expands the glob in the non-root shell and fails**. You need the `sudo sh -c "cp ... *.ext ..."` form, so the glob expands in root's shell instead. A hazard specific to remote work.

## Wrap-up

Pioneer territory lived up to its name — the WiFi stuff especially did not go smoothly. But every mine I stepped on was the kind where first-hand sources exist if you look, and none were fatal. And the thing I actually wanted — **the peace of mind of declarative config + rollback** — delivered. After that, piling on drivers and services stopped being scary. Just knowing "if it breaks I can roll back to the previous generation" drops the psychological cost of tinkering with a server by an order of magnitude.

The real boss fight on the GPU (Blackwell) side — the GSP heartbeat timeout and watchdog design — is a separate story, so I'll split that into its own post.
