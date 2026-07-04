---
title: 'My Home Server Kept Freezing (Bonus) — The Disposable Server'
description: 'Preparing the RAM-defective machine for repair shipment revealed that of 304GB on disk, only 2.8GB of logs were worth saving. The story of GitOps / declarative configuration taking its final exam.'
pubDate: '2026-07-04'
tags: ['homelab', 'home-server', 'NixOS', 'gitops']
seeAlso: ['home-server-random-freeze-part3-memtest-verdict', 'nixos-home-ai-server-install-gotchas']
---

## After the Main Story

[The three main parts](/en/blog/home-server-random-freeze-part3-memtest-verdict) ended with the RAM defect confirmed and the warranty process underway. Which raised a practical problem: **the whole machine might have to ship out for repair.** What's on the SSD? What secrets need wiping? What needs backing up?

Spoiler: this inventory turned out to be the most anticlimactic task of the entire series. And that anticlimax might be the single biggest takeaway of the month.

## Taking Stock of 304GB

This server runs NixOS, configured via GitOps (pushes to a git repository deploy automatically), with dotfiles managed by yadm. Disk usage: about 304GB. Sorting the `du` output into categories:

| Category                    | Size      | Recovery path                    |
| --------------------------- | --------- | -------------------------------- |
| Container images            | ~95GB     | re-pull from registries          |
| LLM models                  | 177GB     | re-download                      |
| Remains of retired services | 50GB      | should be deleted anyway         |
| OS & service configuration  | ─         | rebuild from the git repository  |
| dotfiles                    | ─         | restore from yadm                |
| Experiment code             | 4.8GB     | throwaway load-testing scripts   |
| **Logs (`/var/log`)**       | **2.8GB** | **irreplaceable ← the only one** |

Out of 304GB, **the only data that exists nowhere else in the world was 2.8GB of logs.** And what logs: the journal (i.e., the forensic record this very series is based on), plus syslog from a network device involved in a separate ongoing investigation. The only unique data this machine ever owned was **its own medical history and evidence from someone else's case.** The backup was one `tar` command, done in minutes.

## The Secrets to Wipe Fit in a Five-Item List

The pre-shipment sweep for secrets also came out embarrassingly short:

1. The host's SSH key — top priority, because it **doubles as the secrets decryption key (the age key for sops-nix)**
2. The local clone of the config repository — it contains the encrypted secrets files, and together with item 1 the disk alone becomes sufficient to decrypt them
3. Git auth tokens and the like
4. Shell history and AI-agent tool histories
5. Runtime secrets — on tmpfs, gone at power-off (nothing to do)

The point isn't that the list is short. It's that I can say **"this is all of it" with confidence.** Because secrets management was consolidated into a single sops-nix pipeline, locating them required no searching. The flip side: this inventory was the first time I truly faced the fact that items 1 and 2 co-reside on one disk — so after the machine returns, regenerating the host key, re-keying the secrets, and rotating the tokens is mandatory. (**Deleting a file doesn't revoke an issued token** — invalidation is part of the set.)

## The Real Value of Declarative Configuration Is Being Able to Let Go

When I chose NixOS + GitOps + yadm, the value I expected was "reproducibility" and "painless deploys." After a month of real use, what actually paid off is a different property underneath those:

**You can let go of the machine at any moment.**

- Shipping a broken machine for repair becomes a 30-minute routine: save logs → wipe five secrets → ship
- The question "what would hurt to lose?" gets answered instantly — **from the design, not from a search**
- Even the diagnostic work (adding the memtest boot entry) lives in history as a PR, ready to show the vendor

A machine physically failing and leaving your hands — there is no harder final exam for declarative configuration. The result: "all we lose is logs, and only 2.8GB of them."

## Two Limits Also Became Visible

It wouldn't be fair to only sing praises, so here are the limits.

**"Recoverable" and "quickly recoverable" are different things.** Re-downloading 177GB of models and re-pulling containers takes as long as your line allows. The configuration comes back in tens of minutes; the data may take half a day.

**Truly unique state, like logs, never reaches zero.** This time it was 2.8GB, but run recordings or databases on the box and that layer grows. The essence is not "reduce unique data to zero" — it's **drawing the boundary between the disposable layer (OS, config) and the protected layer (data) in advance, as structure.** As next steps I'm considering physically separate SSDs for OS and data, and NixOS impermanence (explicitly enumerating persisted paths with a volatile root). At that point the "protected layer" is forced out into a config file, and an inventory like this one becomes unnecessary altogether.

## Closing the Series

Looking back on the month that started with random freezes:

1. [Journal forensics](/en/blog/home-server-random-freeze-part1-journal-forensics) produced the hypothesis
2. [A measurement crushed the wrong assumption](/en/blog/home-server-random-freeze-part2-hypothesis-correction)
3. [Memtest delivered the hard evidence in one minute](/en/blog/home-server-random-freeze-part3-memtest-verdict)
4. And the machine shipped out with nothing to fear losing

Drawing a defective DIMM was luck. Being able to answer it with those four moves was the configuration's doing. Design for hardware as something that breaks — even for a home server, that investment paid for itself.
