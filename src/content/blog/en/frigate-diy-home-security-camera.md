---
title: 'In the Age of Yami Baito, I Built My Own Security Camera Instead of Buying One'
description: 'As security cameras multiply in my neighborhood, instead of paying a monthly cloud-AI fee I built a subscription-free 24/7 person-detection system with a cheap WiFi camera, Frigate, and a spare laptop. A tour of the current setup.'
pubDate: '2026-07-05T15:00'
tags: ['homelab', 'home-server', 'home-assistant', 'security']
seeAlso: ['diffusiongemma-vllm-rtx5090-local']
---

In Japan these past few years, there has been a wave of robberies and organized fraud scams driven by what's called _yami baito_ ("dark part-time jobs") — crime rings recruiting disposable perpetrators through social media, who then receive instructions over anonymous messaging apps to break into homes that someone else has already scouted. Security awareness is no longer just a big-city concern. I live outside the big cities, and walking around my neighborhood I see more and more houses with security cameras under their eaves. Detached houses are exactly the kind of target that gets scouted, so it makes sense.

So I decided to install one too. I bought a SwitchBot outdoor camera, which offers cloud-side AI features like person detection for a few hundred yen a month. Normally you'd subscribe and be done with it. But I already run Home Assistant, and the camera speaks RTSP. Which means I should be able to feed the video to a GPU inside my own house and build the whole notification pipeline myself — "how hard can it be?", I thought. If I was going to install a camera anyway, I'd rather build a 24/7 person-detection system from scratch and level up my skills along the way.

The result: when someone approaches the front door, the Echo devices in the house announce "person at the front door", and my phone receives a snapshot with a bounding box drawn around the person. No cloud, no subscription — everything runs inside the house. The camera cost just under 9,000 yen; the detection engine is a laptop that had been gathering dust in a closet. It took some detours to arrive at this setup (that's for another post), but let me describe the current state first.

## The big picture

```text
SwitchBot outdoor PTZ camera ──RTSP──▶ Frigate (dedicated laptop / YOLOv9 on GPU)
                                          │ person-detection events
                                          ▼
                                  MQTT (Mosquitto on HA)
                                          ▼
                             Home Assistant (binary_sensor)
                                ├─▶ announcements on every Echo
                                └─▶ phone snapshot with bounding box
```

The division of labor: **the camera just films, detection happens on an in-house GPU, and HA decides how to make noise.** None of the camera's cloud AI or notification features are used. Keeping things loosely coupled means I can swap the camera later without touching the notification side.

## The camera: separate streams for detection and viewing

The camera is SwitchBot's outdoor pan-tilt model. It speaks RTSP and ONVIF, so no vendor app is needed. There's one iron rule I learned about WiFi cameras in this price range:

**Keep direct connections to the camera down to exactly one.**

The SoC in a cheap camera gives up when asked to serve its high-resolution H265 main stream over multiple simultaneous sessions, and starts emitting corrupted frames. So the setup looks like this:

- Detection runs on the low-resolution H264 substream (detection doesn't need 4MP)
- All connections to the camera are funneled through a single go2rtc restream, and recording and live view branch off from there
- The only moment that needs high quality is the notification itself, so on each detection event I grab a single frame from the main stream, draw the detection box that Frigate reports using ffmpeg's drawbox, and send that to the phone

You could say I stopped "pulling 4MP continuously" and switched to "connecting for a few seconds and taking one frame, only when needed".

## The NVR: laptops are surprisingly good at this

The detection engine is a Dell Precision 5540 — a mobile workstation from around 2019 with a Xeon E-2276M, 16GB of RAM, and a Quadro T1000 4GB, which had been sitting unused as a Windows machine until I wiped it and installed NixOS.

Running a laptop as a 24/7 server looks like heresy, but for an NVR it's actually quite rational:

- **The battery is a built-in UPS.** A momentary power dip won't kill your recordings
- Quiet and low-power. Front-door detection doesn't justify firing up a desktop
- It sits on a shelf with the lid closed (I masked the lid switch and every suspend target in systemd — skip this and detection stops the moment you close the lid)

The T1000 is a modest 4GB GPU, but YOLOv9 onnx inference runs at 8ms and NVDEC offloads decoding to the GPU as well — plenty for one camera. Since Frigate officially stopped recommending the Coral USB for new installations, a "spare dGPU/iGPU you already own" has become the go-to detection accelerator.

The whole OS is managed declaratively (NixOS + GitOps): the container definition, the memory cap, the suspend masking — it's all in git. If the box dies, I can apply the config to a similar machine and restore it.

## Why a dedicated machine

At first, Frigate freeloaded on my home GPU server (the [RTX 5090 LLM experimentation box](/en/blog/diffusiongemma-vllm-rtx5090-local)). There was VRAM to spare and inference ran in a few milliseconds. **Then detection silently died four times in one month.**

An experimentation machine exists to run experiments: model loads devour RAM, and experimental code takes the GPU down with it. Housing a "production feature my family relies on" in the same box as "my playground" was the design mistake. The full story of those outages is dense enough to be its own post, but the punchline: after fixing every individual bug, the thing that actually worked was the move itself — getting production off the experimentation machine.

## HA integration: turned out HACS wasn't needed

The standard way to integrate Frigate is the HACS custom integration, but I don't use it. Frigate publishes events to MQTT; I pick them up directly with an MQTT binary_sensor in HA and wire up notifications with plain automations. If all you need is detection plus notifications, this minimal setup is enough.

Just two traps worth mentioning:

- **Frigate only expands environment variables prefixed with `FRIGATE_`** in its config. I crash-looped the container repeatedly with a naive `{MQTT_PASSWORD}` reference
- **Using an absolute URL for the tap-to-open image in phone notifications runs into hairpin NAT.** Switching to a relative path plus a cache buster fixed it

I launched with just a 60-second notification cooldown, planning to add detection zones if passersby made it too noisy — but with the camera angle at the front door, the cooldown alone turned out to be enough.

## Monitoring: watching the watcher

The failure mode I hate most in this system is **dying silently**. The camera is streaming, the container is running, but detection events have stopped — a state that looks healthy from the outside, which means you only notice when you think "come to think of it, I haven't had a notification lately".

So a monitoring Raspberry Pi (Prometheus) scrapes Frigate's metrics and alerts on camera fps dropping to zero, detection-process restart loops, and OOM kills. This alert design has grown wiser with every outage — that history is also for the incident post.

## Takeaways

- The best part of a DIY security camera: real security benefits and a skill-building excuse, in one project
- Just under 9,000 yen for the camera plus a spare laptop gets you person-detection notifications with no monthly fee
- With cheap WiFi cameras, keep connections to the camera down to one. Borrow high quality only for the moments that need it
- A laptop NVR is a built-in UPS, quiet, and low-power. Just remember to mask the lid switch and suspend targets
- Keep production and the playground in separate boxes. This was the most expensive lesson

Next up: the incident post — how detection died four times on the way to this setup.
