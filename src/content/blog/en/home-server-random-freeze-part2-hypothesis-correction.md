---
title: 'My Home Server Kept Freezing (Part 2) — When a Measurement Overturns Your Hypothesis'
description: 'First stop the bleeding with a hardware watchdog, then gather evidence. Then my "memory overclock is the culprit" assumption gets flattened by one dmidecode command, shifting suspicion to the hardware itself.'
pubDate: '2026-07-04'
tags: ['homelab', 'home-server', 'linux', 'NixOS', 'troubleshooting']
seeAlso: ['home-server-random-freeze-part1-journal-forensics']
---

## Previously

[In part 1](/en/blog/home-server-random-freeze-part1-journal-forensics), I read the journal of my home AI server that kept freezing solid every few days, and arrived at a hypothesis: DRAM bit flips. Damning circumstantial evidence, but no hard proof yet. This is what happened next.

## First, Stop the Bleeding

Before chasing the root cause, there's something more urgent: **ending the lifestyle of walking to the power button after every freeze.**

Linux has hardware watchdogs. A timer built into the chipset (on this board, AMD's SP5100 TCO) gets periodically fed by systemd; if the feeding stops, the hardware pulls the reset line on its own. Even if the kernel freezes solid, **the timer circuit keeps running independently** — it always fires.

On NixOS this is all it takes:

```nix
systemd.watchdog = {
  runtimeTime = "20s";  # reset if not fed for 20 seconds
  rebootTime = "30s";
};
```

Verify after deploying:

```console
$ systemctl show -p RuntimeWatchdogUSec
RuntimeWatchdogUSec=20s
```

Now a freeze means "auto-reset after 20 seconds, recovers by itself." This watchdog would go on to fire **eight times in total** — in other words, the problem was not remotely solved, but at least I no longer had to walk to the power button. Separating recovery automation from root-cause work is incident response 101.

## The Crashes Continue — and a Pattern Emerges

The crashes kept coming after the watchdog went in. But lining up the records, a pattern appears:

```text
kernel: list_del corruption. prev->next should be fffff7eac79a1808,
        but was fffff7eac39a1808. (prev=fffff7eac79a1848)
kernel: Oops: invalid opcode: 0000 [#1] SMP NOPTI
kernel: CPU: 1 ... Comm: llama-server ...
```

`fffff7eac79a1808` versus `fffff7eac39a1808`. **One bit apart, again** (c7 → c3, bit 26 dropped). This time it landed on a kernel linked-list pointer.

And the dying processes started clustering around `llama-server` and `ollama`. This server's main job is LLM inference — loading tens of gigabytes of model weights into RAM. **On idle days it stays up indefinitely; on days I run heavy models, it goes down.** It only breaks when memory usage climbs — which fits the bit-flip hypothesis neatly. (The actual answer to _why_ it depends on memory usage arrives next time, together with the hard evidence.)

## The Filesystem Gets Framed

Then came a more entertaining piece of evidence: BTRFS error counters.

```console
$ sudo btrfs device stats /
[/dev/nvme0n1p2].write_io_errs    0
[/dev/nvme0n1p2].read_io_errs     0
[/dev/nvme0n1p2].corruption_errs  1744
[/dev/nvme0n1p2].generation_errs  0
```

1,744 corruption errors. Normally a number that makes you go pale — "the SSD is dying." Except:

```console
$ sudo btrfs scrub status /
Status:           finished
Error summary:    no errors found
```

**Scrub — a checksum verification of every byte on disk — finds zero errors.** There's only one explanation for this contradiction: the data read from disk is fine, and it's getting corrupted **after landing in the page cache, in RAM**, where the checksum mismatch is then detected. The disk is innocent; the RAM was framing it. One more piece of corroborating evidence for the bit-flip hypothesis.

## "It's Obviously the Overclock" — the Assumption Collapses

At this point my working theory was: "DDR5-6000 EXPO on AM5 is out-of-spec overclocking. A 64GB two-stick dual-rank setup is hard on the IMC (the CPU's integrated memory controller). That must be it." The internet is full of AM5 + EXPO instability reports. Disable EXPO in the BIOS and it'll be fixed, surely.

Let's measure.

```console
$ sudo dmidecode -t 17 | grep -E "Speed|Part Number|Rank"
 Part Number: CT32G56C46U5.C16D
 Rank: 2
 Configured Memory Speed: 5600 MT/s
```

**5600. Not 6000.** Looking up the part number: it's Crucial's plain DDR5-5600 — not an overclock kit carrying an EXPO profile, but a **JEDEC-compliant stock module**. And I had never touched the BIOS since purchase (later confirmed on the actual BIOS screen: EXPO: Disabled).

Re-reading the spec sheets revealed a second misconception of mine: AMD's official AM5 memory spec for two dual-rank sticks (1DPC 2R) is DDR5-5600. This configuration sits **dead center inside the official spec**. Nothing aggressive anywhere.

The "overclock did it" hypothesis evaporated with one command. **Measuring before touching the BIOS was probably the single best decision of this whole investigation.** Hunting for an EXPO toggle that was already off would merely have wasted time — the truly bad timeline is "change something, get a few coincidentally stable days, declare victory."

## Does Stock-Spec RAM Actually Fail Like This? — Cross-Checking

I cross-checked community reports on whether memory-induced crashes really happen at stock JEDEC settings. Conclusion: absolutely.

- An AM5 system with EXPO explicitly disabled, running JEDEC spec, still throwing MEMORY_MANAGEMENT / PFN_LIST_CORRUPT blue screens
- Systems that pass memtest yet keep crashing under real load, eventually fixed by replacing the DIMMs
- Reports where adding sticks shrinks time-to-crash (one stick: ~27 hours, two: 6–12 hours, four: 1–2 hours) — a clean correlation between memory load and failure

So the suspicion moved from "settings" to "a defective piece of hardware": a bad DIMM, or a weak IMC sample. Either way, the next move is the same. **Hit the RAM directly with memtest86+.**

## Preparing the Experiment

On NixOS, adding memtest86+ to the boot menu is one line:

```nix
boot.loader.systemd-boot.memtest86.enable = true;
```

This went through the usual GitOps flow (PR → merge → auto-deploy), and from the next reboot the boot menu carries a `Memtest86+` entry. Even the preparation of a diagnostic session ends up in commit history — one of the quiet perks of declarative configuration.

One problem remains. Memtest runs without an OS, so **you can't see the results over SSH**. This headless server needs a physical monitor and keyboard. I ordered a portable monitor and waited for it to arrive—.

Next time: I plug in the monitor and boot memtest. **The answer took one minute.**
