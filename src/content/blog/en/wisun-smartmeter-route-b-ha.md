---
title: "I gave up reading my smart meter with a homemade script — and Home Assistant's official integration had caught up"
description: 'In 2024 I started a homemade script to read the power smart meter (Route B) over a Wi-SUN dongle, then shelved it because of timeout and decode handling. Years later HA Core had an official Route B Smart Meter integration: plug in the dongle, enter the B-route ID and password, and instantaneous power and cumulative consumption just appear.'
pubDate: 'May 24 2026'
tags: ['home-assistant', 'wi-sun', 'smart-meter', 'energy']
seeAlso: ['ha-alexa-migration-journey', 'ha-claude-code-alexa-report']
---

## Introduction

In 2024, wanting the power smart meter's values in real time from inside the house, I started a homemade script to read Route B over a Wi-SUN USB dongle. But poking SK commands over serial, parsing ECHONET Lite, and the "I sent it but nothing comes back" timeout handling were tedious enough that I shelved it, vault notes and all. Years later, while messing with Home Assistant, I noticed a **`route_b_smart_meter` official integration** in Core that does the whole thing I never wrote. Plug in the dongle, enter the B-route ID and password, and instantaneous power and cumulative consumption appeared. A record of a tool catching up, after the fact, to something I'd given up on as "too tedious."

## Background — reading Route B yourself is quietly a pain

For a low-voltage smart meter, if you apply to your utility for **Route B** access, you can read ECHONET Lite directly over Wi-SUN from inside the house. The application issues an auth ID and password, and a Wi-SUN USB dongle lets you talk to the meter.

I understood that much. The problem was what came after. Talking to the dongle means poking **SK commands** (`SKVER` / `SKSCAN` / `SKSENDTO` …) over serial and assembling and parsing ECHONET Lite frames yourself. The requirements memo I left in the vault back then literally says:

- Timeout handling — required, because sometimes you send data and nothing comes back
- Decode handling — need to consider cases that won't decode as unicode

In short, you have to write endless tedious serial-comms error handling. It looked fun, but I put it off. That note sank into the Archive with a "someday" verdict.

## I left it alone, and the official one caught up

Years later, while messing with Home Assistant, I noticed a **`route_b_smart_meter` (Route B Smart Meter) integration** running.

At first I figured "I probably grabbed it from HACS." But checking, it's neither in `custom_components/` nor in the HACS installed list. In HA's startup log, the custom-integration warning ("We found a custom integration …") shows only for my other homemade things, not for `route_b_smart_meter`. The punchline: it's a **first-party core integration** with [official docs](https://www.home-assistant.io/integrations/route_b_smart_meter/).

In other words, the SK-command serial poking + ECHONET Lite parsing + retries that I'd skipped "because it's tedious" — HA core now does all of it internally.

## Implementation — three fields in a config form

1. **Apply for Route B access** (apply to the utility → an auth ID and password arrive). I'd done this long ago.
2. **Plug in the Wi-SUN USB dongle.** For a unit that shows up as an FTDI serial, the path looks like:

   ```text
   /dev/serial/by-id/usb-FTDI_FT230X_Basic_UART_XXXXXXXX-if00-port0
   ```

3. **Add the integration in HA** → just enter device (the serial path above) / B-route ID / password.
4. Sensors appear:

   | Sensor                            | Content              |
   | --------------------------------- | -------------------- |
   | Instantaneous power               | how many W right now |
   | Instantaneous current (R/T phase) | current per phase    |
   | Cumulative consumption            | running kWh total    |

I didn't write a single line of code. The processing I tried and abandoned in 2024 came down to three fields in a config form.

## Gotchas

- **The B-route ID goes straight into the entity ID.** The auth ID becomes part of the entity name, like `sensor.route_b_smart_meter_XXXXXXXX_total_consumption`. Leak it via a screenshot or a YAML copy-paste and it's exposed, so mask it when sharing or writing it up (I've replaced it with `XXXXXXXX` here too).
- **Connecting can take a while.** The "nothing comes back" problem I got stuck on is alive and well; the integration retries internally. Be patient with the first scan.
- **Route B basically allows one concurrent connection.** If another device (a HEMS, say) is holding the meter, it conflicts.
- **There's dongle / Wi-SUN version dependence.** I use a dongle that shows up as FTDI. Check whether yours is supported beforehand.

## Results

Once you have the sensors, the rest is HA's world. I wired it up like this:

- Aggregate the cumulative consumption daily with `utility_meter` to make "today's power use."
- Use that to have my Echo Dot announce, **every day at 21:00, "Here's today's power report. Today's electricity is about ¥◯◯,"** an automation (consumption × unit price for a rough estimate).
- And **if instantaneous power exceeds 2000W for 5 minutes, Alexa warns me.** Useful when the AC and microwave pile up, say.

I recovered the value of the script I never wrote in 2024 "because it was tedious," at zero code. The announcement side's build-out is continuous with another post (the HA × Alexa story).

## Wrap-up

- Reading a smart meter's Route B yourself needs SK-command serial poking + ECHONET Lite parsing + error handling. Tedious, so I'd shelved it.
- While I left it alone, an official `route_b_smart_meter` integration landed in HA Core, and a dongle + B-route ID / password is all it takes to get instantaneous power and cumulative consumption.
- Things you "wanted to do but gave up on as tedious" sometimes have a tool (HA core, this time) catch up later. Shelved notes are worth revisiting now and then.
- When publishing, don't forget to **mask the B-route ID (it sneaks into the entity ID) and the password.**

## References

- [Route B Smart Meter — Home Assistant official integration](https://www.home-assistant.io/integrations/route_b_smart_meter/)
