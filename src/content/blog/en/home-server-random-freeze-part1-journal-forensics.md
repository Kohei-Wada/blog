---
title: 'My Home Server Kept Freezing (Part 1) — Hunting the Culprit in the Journal'
description: 'My home AI server went SSH-unresponsive every few days. How I identified three hangs from the persistent journal, read the crash signatures, and arrived at the "DRAM bit-flip" hypothesis.'
pubDate: '2026-07-04'
tags: ['homelab', 'linux', 'NixOS', 'troubleshooting']
seeAlso: ['nixos-home-ai-server-install-gotchas']
---

## The Incident

[The home AI server I built earlier](/en/blog/nixos-home-ai-server-install-gotchas) (Ryzen 9 9950X + RTX 5090, NixOS) started going SSH-unresponsive every few days after it went into service. No ping, no display attached, nothing I could do. Each time I had to hold the power button to force a reboot. After the third time, I snapped and started a serious investigation — this is that record.

It turned into a long story, so I'm making it a series. This part is about how far you can chase a culprit with nothing but logs.

## The Suspect List

When a headless Linux server freezes solid, the usual suspects are:

- GPU driver (the RTX 5090 is Blackwell-generation, and the nvidia driver's GSP timeout issue is well known)
- Kernel / driver bugs
- Storage failure
- Power / thermals
- Memory

My initial favorite was the GSP timeout. New GPU, new driver, obviously suspicious. **That guess turns out to be wrong.**

## Finding the Hangs from Boot Boundaries

I keep journald persistent (`/var/log/journal`), so every past boot is retained. First, list the boots with `journalctl --list-boots` and look at **the gap between one boot's last log line and the next boot's first**:

```text
-16 5b6a5ff0... Sun 2026-06-14 11:47 — Tue 2026-06-16 22:22
-15 3af95980... Tue 2026-06-16 22:23 — Thu 2026-06-18 21:01
```

A clean reboot leaves a 30–60 second gap. **A hang followed by a long-press power cycle leaves minutes to tens of minutes of silence** after the last log line. This method pinpointed all three hangs.

## Reading the Three Crash Signatures

At the tail of each identified boot, a crash with a different face was waiting.

### Crash 1: CPU 0 Takes a Lock and Never Comes Back

```text
kernel: rcu: INFO: rcu_preempt detected stalls on CPUs/tasks:
kernel: rcu:     (detected by 3, t=21002 jiffies, g=5283881, q=116 ncpus=32)
kernel: Sending NMI from CPU 3 to CPUs 0:
kernel: RIP: 0010:native_queued_spin_lock_slowpath+0x64/0x2c0
kernel:  _raw_spin_lock_irqsave+0x3d/0x50
(one minute later)
kernel: rcu:     (detected by 17, t=84007 jiffies, g=5283881, q=224 ncpus=32)
```

CPU 0 is wedged trying to acquire a spinlock, and RCU is firing NMIs at it because it stopped responding. The wait time just keeps growing (`t=21002 → 84007 jiffies`) and never recovers. The log goes silent after this; the next entry is the boot banner after my long-press.

### Crash 2: An Access to an Impossible Address

```text
kernel: Oops: general protection fault, probably for non-canonical address
        0xfdff8e2e2cffe130: 0000 [#1] SMP NOPTI
kernel: CPU: 2 UID: 62392 PID: 4230 Comm: .wyoming-faster Tainted: G  O  6.18.34 #1-NixOS
kernel: RIP: 0010:__lruvec_stat_mod_folio+0x55/0xd0
kernel: RAX: fdff8e2e2cffdb00 RBX: ffff8e3cfdd7a780 ...
kernel: Call Trace:
kernel:  folio_remove_rmap_ptes+0x42/0x220
kernel:  unmap_page_range+0xdeb/0x14e0
kernel:  unmap_vmas+0xa1/0x180
kernel:  exit_mmap+0xe5/0x3c0
kernel:  __mmput+0x41/0x150
kernel:  do_exit+0x283/0xac0
```

A speech-recognition service (wyoming-faster-whisper) was merely exiting, and died while giving its memory back (`exit_mmap`). Look at the addresses. Kernel pointers should start with `0xffff...`, but both the fault address and the RAX register hold `0xfdff...`. **The difference between `ffff` and `fdff` is exactly one dropped bit — bit 57.** Compare with the healthy `ffff8e3c...` sitting right next to it in RBX, and you can literally see "one high bit of a pointer got flipped."

### Crash 3: Page Bookkeeping Corruption Detected

```text
kernel: BUG: Bad page state in process bash  pfn:31e8c3
kernel: page: refcount:0 mapcount:0 mapping:000000007ebbe801 index:0x748932ae8 pfn:0x31e8c3
kernel: raw: 017fffc000000000 dead000000000100 dead000000000122 0400000000000000
kernel: page dumped because: non-NULL mapping
```

A freed page's `mapping` field should be NULL, yet the fourth word of the raw dump holds `0400000000000000`. **`0x0400000000000000` is a value with only bit 58 set.** Everything else is zero. Far too clean for anything to have written it — this is the shape of "a bit turned itself on." The victim, by the way, was a plain bash process.

## Deduction: Finding the Common Thread

Line the three up and the pattern emerges:

1. **All in unrelated processes** (systemd / speech recognition / bash). An app bug would reproduce in the same process
2. **All inside generic kernel memory-management code** (spinlock / `exit_mmap` / page free). The same kernel bug would die in the same function
3. **All are single-bit corruptions of 64-bit values** (bit 57 dropped, bit 58 set)
4. And the prime suspect — **the nvidia module never appears in a single call trace**

Software bugs break the same place under the same conditions. This breakage is "a random bit, at a random place, at a random time." That is not the face of software. **It's the face of DRAM bit flips.**

It's a consumer build without ECC despite being used as a server (a choice I made knowingly), so nothing detects or corrects a flipped bit. If the flipped bit lands on a kernel pointer you get a GPF; on the page bookkeeping, Bad page state; on a lock variable, a deadlock — **one defect wearing a different face depending on where it lands** would explain all three crashes.

## But There's No Hard Evidence

The circumstantial evidence is damning. But at this point, all I can say is "the memory is suspicious." No amount of re-reading logs will tell me which DIMM, which bit.

Hard evidence means hammering the RAM directly with memtest86+. Except there's a rather silly obstacle: a headless server has no physical console — and after that, **the premise of my hypothesis gets overturned by an actual measurement**.

Next time: correcting a misdiagnosis, and preparing the experiment.
