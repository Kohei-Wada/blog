---
title: "My Home Server Kept Freezing (Part 4) — Don't Trust the Replaced RAM"
description: 'The warranty swap brought new memory. But "replaced the part" is not "fixed." Proving its innocence with a layered check — memtest, stress-ng, a real LLM load, a 70B load — and then finding one ghost the bad RAM left behind.'
pubDate: '2026-07-08T13:00+09:00'
tags: ['homelab', 'home-server', 'linux', 'NixOS', 'troubleshooting']
seeAlso:
  [
    'home-server-random-freeze-part3-memtest-verdict',
    'home-server-random-freeze-extra-disposable-server',
  ]
---

## Previously

My home AI server froze every few days. [Journal forensics](/en/blog/home-server-random-freeze-part1-journal-forensics) produced the "DRAM bit-flip" hypothesis, and [memtest](/en/blog/home-server-random-freeze-part3-memtest-verdict) convicted the memory instantly — 705 errors in the first minute. I filed an infant-mortality claim with the vendor and got as far as [prepping the machine for shipment](/en/blog/home-server-random-freeze-extra-disposable-server). There the story paused.

The resolution was anticlimactic. The vendor shipped **two new sticks up front** as an infant-mortality replacement — no need to send the whole machine, just swap the DIMMs. Open the box, pull the old sticks, seat the new ones. Five minutes of work.

The real work starts here. **"Replaced the part" is not "fixed."** Last time's lesson 5 — a green memtest doesn't fully acquit, but a red one convicts instantly — was now mine to wield from the proving side.

## memtest First, on the Same Turf

Right after the swap, before booting the OS, I ran memtest86+. Beat it under the exact same conditions as before, and you get a direct comparison.

One full pass, **Errors 0**. The 50GB+ region that spat out 705 errors last time passed clean this time. Last time it didn't survive a minute in that same spot, so this is overwhelmingly significant.

But I couldn't fully relax on that alone — also a lesson from last time. memtest runs without an OS, a synthetic load that doesn't reproduce real-world heat and voltage. It can miss the "green in memtest but crashes under real load" failure mode — a weak IMC voltage margin, for instance. The bad DIMM was confirmed and replaced, so that thread is thin, but **if I'm going to prove it, I want it airtight.**

## Beat It on the OS, Under Real Heat

So with the OS up, I ran two stress tests.

### Test A — memtest, One Level Up

First, `stress-ng`'s memory verification. The same "write a pattern, read it right back, compare" as memtest, but **under the full heat and voltage of 32 CPU threads at 100%.**

```bash
stress-ng --vm 12 --vm-bytes 4G --vm-method all --verify --timeout 1800s
```

48GB of system RAM — including the ~50GB failure region from before — across every pattern for 30 minutes. Tctl peaked at 84°C. Load it with the heat and voltage memtest never applies, and see whether bits still flip.

Result: **1.19 billion verified operations, 0 mismatches, 0 failures.**

### Test B — Reproduce the Culprit

The other test was the exact workload that had been crashing. Every crash happened during LLM inference, so I recreated that on purpose. With ollama, I dialed `num_gpu` down to push most of the model off the GPU and **into system RAM (spill)**, then ran CPU-bound inference continuously for 30 minutes.

```bash
# dial num_gpu down to drop weights into system RAM
curl http://localhost:11434/api/generate -d '{
  "model": "qwen3:32b",
  "options": { "num_gpu": 8, "num_ctx": 16384, "num_predict": 900 }
}'
```

A synthetic tool going green (Test A) is a different question from whether the real app runs stably for a long stretch. All 6 requests returned normally, 0 errors. Load average sat around 16 for the full 30 minutes.

### For Good Measure, a 70B

Finally, I deliberately built the **heaviest memory placement** this machine can produce. A 42GB 70B model (Q4) doesn't fit in 32GB of VRAM. Inevitably ~12GB spills into system RAM — 42GB laid out straddling VRAM and RAM. Last time this placement was a guaranteed instant kill.

The load went through and generation ran. The performance story is for next time, but here the one fact that matters as evidence is: **it completed without crashing.**

### Verdict

Across every test, kernel MM errors (bad page / GPF / list_del / hard LOCKUP) were zero. `btrfs corruption_errs` stayed at 0 after reset. Hardware watchdog auto-reboots, zero.

Last time the same load region dropped the machine within minutes to tens of minutes, racking up 8 watchdog reboots and a BTRFS corruption counter of 1744 in June alone. This time it passed all of it untouched. **The memory defect is resolved — I'll say it flat out.**

## The Ghost — Corruption Left Fingerprints on Disk Too

The proof was done. Or so I thought. But one thing nagged at me.

**During the three weeks the broken RAM was alive, were the models I pulled in that window intact?**

Bit flips corrupt "data in memory." A downloaded model's weights pass through memory once before being written to disk. If they flip at that instant, they land on disk **already corrupt.** And the nasty part: the filesystem (BTRFS) scrub returns green — because it computes and stores a "correct" checksum for the corrupt data. What scrub guarantees is "hasn't changed since it was written," not "what was written is correct."

But ollama models are content-addressed: **the filename is the SHA-256 of the contents** — the upstream reference hash. So re-hash every blob and compare against its filename, and you surface exactly **the "flip at write time" that scrub can't see.**

```bash
for f in /path/to/ollama/blobs/sha256-*; do
  expect=$(basename "$f" | sed 's/^sha256-//')
  actual=$(sha256sum "$f" | cut -d' ' -f1)
  [ "$expect" != "$actual" ] && echo "CORRUPT: $f"
done
```

Among the completed blobs, **one was corrupt.** A 17GB layer of a 27B model. One product of the broken-RAM era, left behind as physical evidence. Consistent with everything the diagnosis said.

The repair had a small trap too. Naively re-running `ollama pull` just returns `success` in a few seconds and fixes nothing — because **ollama trusts an existing blob by filename alone and never re-verifies the contents.** Delete the broken blob by hand, then pull again, and only then does the 17GB actually re-download. Hash confirmed matching.

```bash
rm /path/to/ollama/blobs/sha256-<digest>   # delete the flipped blob first
ollama pull <model>                        # only now does it re-download
```

## Takeaways

- **A replacement is a starting line, not a finish line.** Once you swap the part, prove it on the same turf as before. Use the old failure mode (the 50GB region, 705 errors in a minute) as a reproduction condition and the pass/fail collapses to "can it get through that region untouched?"
- **Synthetic tests and real workloads answer different questions.** memtest / stress-ng ask "do the bits flip?"; a real ollama load asks "does the app run without falling over?" You need both.
- **`stress-ng --vm --verify` is memtest on the OS.** It detects bit corruption directly while adding the real heat, voltage, and IMC load a synthetic tool never reproduces.
- **A green checksum doesn't mean correct contents.** BTRFS scrub only sees "changes after the write." A flip at write time could only be caught by content-addressed data (the SHA-256 of an ollama blob).
- **A memory failure doesn't only dirty memory.** Bit flips travel through the page cache and leave fingerprints on disk and in your models. After swapping the broken part, auditing the **data** that part touched is what finally closes the case.

Next time: the experiment the healthy RAM finally unlocked — **the CPU offload that used to instantly kill the machine the moment it spilled** — measured from a performance angle. The data has a lesson: "half spilled" does not mean "half the speed."
