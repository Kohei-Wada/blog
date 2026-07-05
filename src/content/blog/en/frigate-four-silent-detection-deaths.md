---
title: 'Person Detection Died Silently Four Times in One Month — Same Symptom, Different Culprit Every Time'
description: 'The incident post for my DIY security camera. Four times the camera kept streaming, the container kept running, and only the detection events stopped. The culprits: a self-poisoning watchdog, a camera choking on concurrent sessions, a 59-second JIT vs a 20-second watchdog, and an OOM kill.'
pubDate: '2026-07-05T17:00+09:00'
tags: ['homelab', 'home-server', 'home-assistant', 'troubleshooting']
seeAlso: ['frigate-diy-home-security-camera']
---

[Last time](/en/blog/frigate-diy-home-security-camera) I described the current state of my DIY security camera and mentioned that "detection died four times on the way to this setup". This is that incident post.

All four deaths wore the same face. The camera is streaming. The container is running. CPU and GPU are quiet, and nothing on the dashboard is red. Only the detection events have stopped — no Echo announcements, nothing on the phone. **A silent death that looks perfectly healthy from the outside.** You notice it the moment you think "come to think of it, I haven't had a notification lately", and by then you've already lost half a day to a full day.

And the root cause was different every single time.

## Case file 1: thirteen hours of silence, and the first wrongful conviction

One morning I realized person detection had been at zero for thirteen hours, since the previous evening. The stats signature looked like this:

```text
camera_fps    = 5.0    # camera → ffmpeg is alive
process_fps   ≈ 0      # the motion-processing loop has stopped
detection_fps = 0.0    # zero detections
inference     = a few ms  # the detector itself looks healthy
```

And the log repeated this on a 20-second cycle, forever:

```text
Detection appears to be stuck. Restarting detection process...
```

At the time, an LLM runtime shared this GPU, and it had been segfaulting repeatedly in the early morning. "A cohabiting process corrupted the GPU context" — a plausible story. And indeed, stopping the LLM side made detection stable (or so it seemed), so I recorded the LLM runtime as the culprit and went to bed.

The next day's follow-up overturned the verdict. The real culprit was **my own watchdog**. A version that judged liveness by whether `latest.jpg` had changed was running — and in a motionless garden at night, latest.jpg doesn't change. It was misjudging an idle night as "stream frozen" and restarting the container every 2–4 minutes. Each restart triggered the heavy first inference, which Frigate's _internal_ watchdog then misjudged as stuck and killed. **The tools meant for monitoring were poisoning the system twice over.**

Worse: I had written and pushed a fixed watchdog six days earlier, but the GitOps deployment had silently stalled and the fix never reached the machine. I was being killed by a bug I had already fixed. From that day on, deployment landing checks became a monitoring target too.

As for the "LLM runtime did it" theory — there's an epilogue. Hold that thought until the bonus case.

## Case file 2: the camera corrupts itself

Tangled up behind case 1 was another confounder: the stream itself was corrupting. Broken HEVC NAL errors appeared sporadically in the logs. I suspected codecs and WiFi bandwidth, but what settled it was a controlled experiment: stop detection and pull the main stream **alone** — 150 consecutive frames, zero errors. Restore the concurrent connections — corruption reproduces.

In other words, the SoC in this class of WiFi camera **cannot serve its 4MP H265 main stream over multiple concurrent sessions**. A topology where recording, detection, and HA's live view each hang directly off the camera is itself a corruption generator.

The "keep connections to the camera down to one" iron rule from the previous post is a lesson from this case.

## Case file 3: 59 seconds vs 20 seconds

Having slain the watchdog the day before, I relaxed — and the next morning detection was at zero all day again. This time the signature was strange. The model loaded successfully in 0.3 seconds, and then **exactly 20 seconds later** it was killed as stuck, every time. Reading the processes' kernel stacks: capture, process, and detector were all in `futex_wait`, each waiting for someone else. Nobody had crashed. A deadlock where everyone looks innocent.

Running the same model directly, outside the watchdog, finally revealed the culprit:

```text
CUDAExecutionProvider: first=59.4s  second=2.9ms
```

**Only the first inference takes 59 seconds.** onnxruntime doesn't ship prebuilt kernels for the new GPU generation (Blackwell/sm_120), so the first inference JIT-compiles every kernel from PTX to SASS. But Frigate's detector watchdog is hardcoded at 20 seconds. The warmup gets killed at 20 seconds, every time.

The truly vicious part: the CUDA JIT cache lives on the container's rootfs, so it's wiped every time the container is recreated. And since the warmup is killed before it completes, **the cache never gets written at all**. From zero to 59 seconds every time → killed at 20 seconds every time — a perfect infinite loop. The reason it "worked until yesterday" was that I had merely been lucky enough to catch boots where the cache happened to be warm.

The fix is one line: point `CUDA_CACHE_PATH` at a persistent volume. The JIT runs once, and from then on 59.4 seconds becomes 0.3 seconds — comfortably inside the watchdog's patience. Detection came back the moment the fix deployed and this failure has never recurred.

## Case file 4: twenty-two hours at the new address

Detection then moved to its dedicated machine (the laptop NVR). Three of the four deaths belong to the GPU-server cohabitation era, and the move really did cut off the cohabitation-borne layer. But the fourth death happened at the new address — the camera-borne layer follows you no matter the box. Peace lasted two weeks. Then came a 22-hour silent death.

The causal chain was a row of dominoes. ① The H265 stream corrupts occasionally and ffmpeg stalls → ② while waiting for a graceful exit, the capture process balloons to 13.4GB of memory → ③ on a 16GB box with zero swap, the kernel OOM killer fires → ④ right after the OOM, the internal watchdog freezes silently at "waiting for ffmpeg to exit", deadlocking the pipeline. camera_fps stayed at 5, inference stayed at healthy values, and only the events were at zero for 22 hours.

The infuriating part: **all three existing alerts sailed right past it.** The camera_fps alert didn't fire because fps only dropped for under a minute. The inference alert didn't fire because inference stayed normal. The process_fps alert — the net aimed at restart loops and wedges — didn't fire because process_fps stayed alive this time. Alerts only remember the face of the previous culprit.

The response: a cgroup memory cap on the container (a runaway gets reaped inside the container instead of taking down the host), swap on the host, and monitoring of the OOM counter. A repeat of this pattern now pages me within minutes.

## Bonus case: retrial after the verdict

In July, it was confirmed that [this GPU server's DRAM was physically failing](/en/blog/home-server-random-freeze-part3-memtest-verdict). memtest hit 705 errors within the first minute. The faulty region sits in the 43–56GB band — a place you only step on **when something allocates a lot of memory**.

Which meant I had to reread June's verdicts. How much can you trust incident investigations conducted on top of corrupted RAM?

On retrial, the segfaults from case 1 — once blamed on the cohabiting LLM runtime — now look **much more like the RAM's doing**. Loading tens of gigabytes of model weights is precisely the act of stepping into the faulty region, and the kernel crashes that followed clustered on the LLM processes. Meanwhile, the watchdog self-poisoning (preserved in logs), the camera's concurrent-session limit (settled by a controlled experiment), and the 59-second JIT (reproduced and measured outside the watchdog) stand no matter how badly the RAM flips bits.

**Only conclusions backed by an intervention, a controlled experiment, or a reproducible measurement can be carried home from broken hardware.** Conclusions built on temporal correlation and a plausible story quietly fall over later.

## Same symptom, different culprit every time

Lining up the four cases reveals an unpleasant law:

- The symptom was identical every time: "only the detection events stop"
- The root causes were in completely different layers every time: a watchdog design flaw / a camera's hardware limit / an upstream library meeting a new GPU / memory exhaustion
- And every time, the monitoring was bypassed **right next to where I had reinforced it after the previous incident**

Still, there's a harvest. With every death the alerts got one rule wiser, and the window of silence went from 13 hours → 22 hours (post-move complacency) → likely minutes today. The triage procedure has hardened into a runbook, so the next death should have its layer identified within the first ten minutes.

A security camera, it turns out, is not something you install and forget. **The system that watches my front door is now watched by me.** The most high-maintenance resident of this house is the security camera.
