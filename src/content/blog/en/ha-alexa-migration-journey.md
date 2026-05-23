---
title: "Walking Home Assistant's Alexa integration through three generations and consolidating the automations"
description: 'A record of migrating through alexa-remote-control (over SSH) → Alexa Media Player (HACS) → Alexa Devices (the official integration). I bulk-generated 75 automations (location notices, power reports, etc.), then consolidated 64 location notices into 2 with a dynamic zone trigger + Jinja. And the Alexa-ChatGPT skill walked me straight into an Amazon developer-account trap.'
pubDate: 'May 23 2026'
tags: ['home-assistant', 'alexa', 'personal-projects']
seeAlso: ['ha-claude-code-alexa-report', 'ha-alexa-remote-control-tts']
---

## Introduction

This is a record of migrating the "make an Echo Dot talk from Home Assistant (HA)" setup through three generations. First `alexa-remote-control` driven over SSH, then HACS's Alexa Media Player, finally the official `Alexa Devices` integration that landed in HA 2025.6. Around the same time I bulk-generated 75 automations with a Python script, then later consolidated 64 location notices down to 2 — a "proliferate then consolidate" operations phase. I also tried to build a custom skill calling ChatGPT from Alexa, and fell cleanly into an Amazon developer-account trap.

The "make an Echo Dot talk from HA" need was there from the start. Who entered or left which zone, did power consumption spike, is rain coming — I wanted those events spoken by the Echo Dot. But Amazon was long without an official "push TTS from local HA" API, so there's a history of bolting on community hacks, and I ended up walking three generations of migration in order.

## The three generations

| Generation | Mechanism                                                   | Source                             |
| ---------- | ----------------------------------------------------------- | ---------------------------------- |
| Gen 1      | Drive alexa-remote-control over SSH                         | community script                   |
| Gen 2      | Alexa Media Player's notify.alexa_media_echo_dot            | HACS (alandtse/alexa_media_player) |
| Gen 3      | Alexa Devices official integration's notify.<device>\_speak | HA Core 2025.6+                    |

### Gen 1: alexa-remote-control (over SSH)

```text
HA → SSH (port 2222) → alexa-remote-control → Amazon private API → Alexa speaks
```

Via `shell_command.alexa_speak`, SSH into the add-on and run `alexa-remote-control` inside. It works, but going over SSH adds latency, the shell-string escaping is fragile, and 2FA often jams it. (I've split the details of this generation into a separate post.)

### Gen 2: Alexa Media Player (HACS)

```text
HA → notify.alexa_media_echo_dot → Alexa speaks
```

Setup:

- Add `alandtse/alexa_media_player` as a custom repository in HACS
- Get the Amazon 2FA app key (52 chars) and paste it into the integration config
- Confirm the Echo Dot is recognized as `media_player.echo_dot` and that `notify.alexa_media_echo_dot` does TTS

Migrating the existing automations was simple: replace `shell_command.alexa_speak` with `notify.alexa_media_echo_dot` throughout `automations.yaml` (20 of them at the time).

### Gen 3: Alexa Devices (official integration)

HA Core 2025.6 added the official `Alexa Devices` integration, which provides a `notify.<device>_speak` entity. The upsides of switching to the official one are big:

- Configuration is done entirely in the GUI (no HACS repo to add)
- You get a motion sensor (`binary_sensor.<device>_motion`) and an illuminance sensor (`sensor.<device>_illuminance`) — extras Alexa Media Player didn't expose
- Maintenance rides on HA core, so it keeps up with Amazon-side spec changes faster

That said, `notify.<x>_speak` later went effectively deprecated on Amazon's `Alexa.Speak` API — it returns 200 OK but is silent. You now have to switch to `notify.<x>_announce` (with a chime) — but that's another post's territory.

## Bulk-generating 75 automations with Python

Right after switching to Gen 2, I bulk-generated automations with a Python script to have the Echo Dot announce every household event I could think of. The breakdown:

| Category                | Count | Content                                                                |
| ----------------------- | ----- | ---------------------------------------------------------------------- |
| Family location notices | 64    | 4 family members × each one's zones (home, stations, workplaces, etc.) |
| Low battery             | 5     | all phones + iPad (notify under 20%)                                   |
| Power anomaly           | 1     | notify if over 2000W for 5 minutes                                     |
| Weather change          | 2     | rain, heavy rain                                                       |
| Morning forecast        | 1     | every morning at 7:00                                                  |
| Time signal             | 1     | hourly from 8:00 to 22:00                                              |
| Power report            | 1     | daily at 21:00                                                         |

Location notices alone are 64. The approach emits one automation per "family member × zone" combination; that's fine for the initial batch, but it means manufacturing more automations every time you add a zone. I consolidate that later.

### Daily power-consumption sensor

To produce the 21:00 power report, I added a `utility_meter` to `configuration.yaml`:

```yaml
utility_meter:
  daily_energy_consumption:
    source: sensor.smart_meter_total_consumption
    name: "Today's power use"
    cycle: daily
```

This generates a daily consumption sensor that resets at midnight. The 21:00 report covers: today's energy (kWh) / current draw (W) / CO2 intensity (gCO2eq/kWh, via Electricity Maps) / fossil-fuel share (%).

## Consolidating 64 location notices into 2

After running it a while, I folded the per-"person × zone" automations into 2.

- `alexa_speak_person_enter_zone`
- `alexa_speak_person_leave_zone`

Both are `mode: parallel` / `max: 10`, subscribing in one shot to the state triggers of each family member's `person.*` entity. A Jinja template in the `variables` block fills in the person name and zone name dynamically, speaking it in one line.

The payoff of this pattern: adding a new zone requires no automation changes at all. Just add the zone to `zones.yaml` and enter/leave for the new zone is automatically spoken.

Not aiming for the consolidated form from the start was the right call — proliferating individually first, then consolidating once the zone data structure had settled, kept the abstraction on-target.

## The Alexa-ChatGPT skill and the Amazon developer trap

I also built a custom skill that sends what you say to Alexa to the OpenAI API (GPT-4o-mini) for an answer (based on `k4l1sh/alexa-gpt`; Alexa-hosted Python; `GptQueryIntent` + `AMAZON.SearchQuery` slot — note `{query}` alone isn't allowed in samples, a carrier phrase is required).

The thing that ate the most time here was the Amazon developer-account trap.

- `developer.amazon.co.jp` **does not exist** (DNS won't resolve)
- Logging into `developer.amazon.com` with an amazon.co.jp account gives a password error
- Cause: if you use the same email for amazon.com and amazon.co.jp, the passwords conflict
- Fix: change the amazon.co.jp password so it differs from the amazon.com one

Not knowing this burns hours of "but the password is definitely right and it won't go through."

## File ownership when touching HA from the SSH add-on

The SSH user (uid 1000) needs `sudo` to write under `/homeassistant/` (root-owned, 644). The equivalent `/config` is a read-only mount you can't write at all (the add-on sandbox); the real path is `/homeassistant/`.

The HA CLI (`ha core check` / `ha core reload`) errors out needing a token — `ha`'s auth isn't injected into the SSH add-on shell. To reload automations from SSH you have to hit the HA Core REST API directly; mint a short-lived JWT from the `jwt_key` in `.storage/auth` and Bearer auth goes through without issuing a new token.

## Wrap-up

- HA → Alexa speech reached the official integration through three generations of migration: alexa-remote-control → Alexa Media Player → Alexa Devices.
- Walking both a "mass-produce individual automations" phase and a "consolidate them with dynamic trigger + Jinja" phase is realistic (aim for consolidation from the start and the zone data structure never settles).
- If you're building a ChatGPT skill on Alexa, clear the amazon.com / amazon.co.jp password conflict on the Amazon developer account before you start.

## References

- [Alexa Devices — Home Assistant](https://www.home-assistant.io/integrations/alexa_devices/)
- [alandtse/alexa_media_player (HACS)](https://github.com/alandtse/alexa_media_player)
- [k4l1sh/alexa-gpt](https://github.com/k4l1sh/alexa-gpt)
- [Utility Meter — Home Assistant](https://www.home-assistant.io/integrations/utility_meter/)
- [Electricity Maps API](https://www.electricitymaps.com/)
