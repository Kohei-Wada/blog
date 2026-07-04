---
title: 'My Home Server Kept Freezing (Part 3) — Memtest Answers in One Minute'
description: 'memtest86+ racked up 705 errors within the first minute, and 26 minutes in, froze itself. The flipped bits seen in the journal match the ones memtest measures — and every symptom collapses into one defect.'
pubDate: '2026-07-04'
tags: ['homelab', 'home-server', 'linux', 'NixOS', 'troubleshooting']
seeAlso:
  [
    'home-server-random-freeze-part1-journal-forensics',
    'home-server-random-freeze-part2-hypothesis-correction',
  ]
---

## Previously

My home AI server froze solid every few days. [Journal forensics](/en/blog/home-server-random-freeze-part1-journal-forensics) produced the "DRAM bit-flip" hypothesis, and [last time](/en/blog/home-server-random-freeze-part2-hypothesis-correction) the "it's the overclock" assumption collapsed under an actual measurement, narrowing the suspects to a defective piece of hardware — a bad DIMM or a weak IMC. The portable monitor arrived. Time to collect hard evidence.

## One Last Check in the BIOS

Before memtest, I confirmed last part's inferences on the actual BIOS screen:

- **EXPO: Disabled** — as inferred. No overclock had ever been active
- **DIMM_A2 / DIMM_B2, 32GB × 2 at 5600MHz** — sticks in the manual-specified slots

Stock settings, correct slots. The only suspect left is the hardware itself.

## Booting Memtest (and a Small Incident)

I picked Memtest86+ from the boot menu. And **nothing appeared on screen.** After a few minutes of black, I seriously started wondering: "is the memory so broken that even memtest can't start?" The anticlimactic resolution: a reboot and re-select made it display fine (apparently a video-output routing quirk on a dual-GPU system). Bad for the heart.

One minute after the screen came alive, it looked like this:

```text
Memtest86+ v8.00        AMD Ryzen 9 9950X 16-Core Processor
IMC: DDR5-5600 / CAS 46-45-45-90

Time: 0:01:00    Status: Failed!
Pass: 0          Errors: 705

pCPU  Pass  Test  Failing Address        Expected            Found
 22    0     3    000cac773148 (50.6GB)  0000000000000000    2000000020000000
  1    0     3    000c82264140 (50GB)    ffffffffffffffff    dfffffffdfffffff
 24    0     3    000cb037a540 (50.7GB)  ffffffffffffffff    dfffffffdfffffff
```

**705 errors in the first minute.** I had braced myself for an overnight hunt for a once-every-few-hours intermittent fault; instead the answer was almost embarrassingly instant.

The errors themselves speak volumes. Write all zeros, read back `2000000020000000` — **bits 61 and 29 turn themselves on**. Write all ones, read back `dfffffffdfffffff` — **the same positions turn themselves off**. The same bits flipping in both directions: the textbook face of a physical defect.

## "Pass Is 0 — Am I Doing This Wrong?"

Confession time: this screen briefly worried me. `Pass: 0` — not a single pass? Did I mess something up?

It's just how the UI reads. `Pass:` counts **completed full passes**; one pass over 64GB takes close to an hour, so of course it's 0 after one minute. The `Pass 3%` at the top is the current pass's progress. And `Status: Failed!` doesn't mean the test malfunctioned — it means **the memory failed the test**, which is exactly the diagnosis I came for. The checkup found the disease; the checkup itself worked fine.

## 26 Minutes In, the Doctor Collapses

Left running, the error count kept climbing:

```text
Time: 0:26:23    Status: Failed!
Pass: 0          Errors: 5823
```

And then, at Pass 88% — just short of completing its first full pass — **memtest itself froze.** No response to any key.

Which, on reflection, is perfectly logical: memtest keeps its own code and working data in the very RAM it's testing. If that RAM is broken, **the test tool's own state gets corrupted too**. The doctor collapsed from the same disease as the patient. At this point there is no room left for doubt. (Note that during memtest there's no OS, so the hardware watchdog I so carefully set up doesn't help either. One final long-press of the power button.)

## The Cross-Check — Journal Bits and Memtest Bits Match

Here is the single most satisfying moment of this whole investigation. Scanning the error rows, pairs like these show up:

```text
Expected            Found
3118348ee32ae000    3318348ee32ae000   ← bit 57 set
3118348ee32ae000    3518348ee32ae000   ← bit 58 set
```

Familiar bits. [Back in part 1](/en/blog/home-server-random-freeze-part1-journal-forensics), the corruptions pulled out of the journal were:

- GPF: `0xffff...` → `0xfdff...` — **bit 57** dropped
- Bad page state: `0400000000000000` — **bit 58** set

**The exact bits from independently recorded kernel crashes reappear in memtest's measurements.** It's not a rigorous proof down to the address interleaving, but as coincidences go, this is far too good. The culprit that spent a month rampaging in disguise, and the one just caught in the exam room, share the same fingerprints.

## Everything Connects

With hard evidence in hand, every symptom folds into one picture:

```text
Physical defect (bits 57/58/61/29 family, roughly the 43–56GB region)
     │ the face changes depending on where the flipped bit lands
     ├─ high bit of a kernel pointer  → GPF non-canonical (part 1, crash 2)
     ├─ page bookkeeping              → Bad page state (part 1, crash 3)
     ├─ linked-list pointer           → list_del corruption (part 2)
     ├─ lock variable                 → spinlock deadlock → total freeze (part 1, crash 1)
     ├─ page cache                    → BTRFS "corruption" false alarm (part 2's framing)
     └─ memtest's own working memory  → the diagnostic tool freezes (this part)
```

And the answer to "why only on days I ran LLMs" was sitting right there too: **the failing addresses cluster around 50GB.** Idle memory usage is a few gigabytes and never reaches that region. Only loading tens of gigabytes of model weights marches into the minefield. The mystery of the trigger condition was explained by the physical location of the defect.

## Aftermath and Lessons

This machine is a BTO build, and the first freeze hit five days after delivery — a textbook infant-mortality failure. It reportedly passed the vendor's pre-shipment tests, which is no surprise if the defect lives in the 50GB region: **ordinary test workloads never fill the upper reaches of 64GB.** For the same reason, a Windows desktop user might not have noticed for months. It took an LLM server — a workload that actually exhausts RAM — to flush it out in three weeks.

I've sent the vendor the evidence bundle (journal crash signatures, BIOS screen, memtest photos) and the warranty process is underway.

The lessons of this series, condensed:

1. **Hardware failures arrive wearing software faces.** Random crashes in random places with a different face each time — put bit flips on the suspect list
2. **Non-ECC memory fails silently.** Nothing detects, corrects, or records it. For server duty, ECC deserves serious consideration
3. **Persistent journals are forensic gold.** Just set `Storage=persistent` and you can investigate across power cycles
4. **Measure before you act.** Fiddling with the BIOS on the "it's obviously the overclock" hunch would have wasted time — or worse, produced a fake fix
5. **A green memtest doesn't fully acquit, but a red one convicts instantly.** And sometimes the answer takes one minute, not one night

Next up, a bonus part: preparing this machine for repair shipment revealed that **of 304GB on disk, only 2.8GB of logs were worth saving** — a story about GitOps getting its final exam.
