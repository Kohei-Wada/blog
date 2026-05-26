---
title: 'Dropping OpenSky to Receive It Myself — Feeding RTL-SDR ADS-B into My Terminal Globe ttymap'
description: "The aircraft plugin in ttymap, the terminal globe I built earlier, pulled overhead planes from OpenSky's public API. This time I replace that with real radio I receive on my own antenna. A reception journey: plug in an RTL-SDR, get past the DVB driver trap, catch raw frames with rtl_adsb, turn them into lat/lon with CPR decoding, and bridge a local JSON server so a ttymap user plugin can show them."
pubDate: 'May 26 2026'
tags: ['personal-projects', 'SDR', 'ADS-B', 'RTL-SDR', 'ttymap']
seeAlso: ['ttymap-terminal-scriptable-globe']
---

## I wanted to receive it myself

Earlier I wrote about building [ttymap, a globe you spin inside the terminal](/en/blog/ttymap-terminal-scriptable-globe). A braille-character globe with planes, earthquakes, the ISS and more layered on top. The `aircraft` plugin that shows those planes hit OpenSky Network's public ADS-B feed. Handy, but really you're just watching **the result someone else's server received and formatted**.

![ttymap showing locally-received ADS-B aircraft as labelled arrows over central Japan on the braille globe](../../../assets/ttymap-adsb-local.png)

The radio those overhead planes emit is raining down on my own room right now too. So I'd rather receive it on my own antenna and put it on my own globe. A receive-only RTL-SDR needs no radio license here. I bought a dongle and a dipole antenna.

This post is the record of what happened from plugging that dongle in to "planes I received myself" drifting across my homemade globe.

## Plug it in and it's a TV tuner

Plug it into USB, look at `lsusb`, and you get this.

```text
Bus 003 Device 007: ID 0bda:2838 Realtek Semiconductor Corp. RTL2838 DVB-T
```

`DVB-T`. A digital **terrestrial television** tuner. No surprise: the RTL2832U chip inside an RTL-SDR was originally sold in bulk as a "cheap USB digital-TV tuner," and only later did someone discover that "if you make it spit out raw, pre-demodulation I/Q samples you can receive any radio = it becomes an SDR," giving it a second life.

So the moment you plug it in, the Linux kernel grabs it **as a TV tuner**. A driver called `dvb_usb_rtl28xxu`. That's the problem:

```text
            ┌─ dvb_usb_rtl28xxu (kernel / for TV)   ← if it grabs the device, SDR can't open it
RTL2832U ───┤
            └─ librtlsdr (userspace / for SDR)       ← this is the one I want for reception
```

Two drivers can't grab one device at once. To use it as an SDR, you blacklist the TV driver so it doesn't claim it. Arch's `rtl-sdr` package, thankfully, does this out of the box in `/usr/lib/modprobe.d/rtlsdr.conf`.

```text
blacklist dvb_usb_rtl28xxu
blacklist e4000
blacklist rtl2832
```

Check the dongle and tuner model with `rtl_test`.

```text
$ rtl_test -t
Found 1 device(s):
  0:  Realtek, RTL2838UHIDIR, SN: 00000001
Found Rafael Micro R820T tuner
```

R820T. It reaches up to 1090MHz, so it picks up ADS-B (1090MHz) just fine. The hardware is alive.

## You can catch raw frames. But they aren't coordinates

The easiest way to catch ADS-B is to just run `rtl_adsb`, bundled with the `rtl-sdr` package.

```text
$ rtl_adsb
*8d8622ae58c906dd3078d6822f73;
*8d84b7b699088411219a359bb254;
*8d9632ae58c906dd...;
...
```

Lines starting with `*8d` are DF17 (ADS-B Extended Squitter), the payload messages carrying position and velocity. More than 30 of them in 20 seconds, across several aircraft. The dipole → R820T → librtlsdr reception chain works.

…but these aren't coordinates. They're raw Mode-S frames. Getting lat/lon out of here needs one more step: **CPR (Compact Position Reporting) decoding**.

Why isn't the raw lat/lon just sitting in there? An ADS-B message is only 112 bits, and packing full-precision latitude/longitude every time would eat too much bandwidth. So CPR encodes position split into two kinds, "even frames" and "odd frames." **Pair an even with an odd** and you can uniquely recover the position anywhere on Earth (global decoding). Alternatively, **if you roughly know the receiver's position**, you can recover it locally from a single frame. The latter is easier to implement. I know my receiver's (home) coordinates, so I use that one.

Writing CPR by hand is painful, so I throw it at pure-Python [pyModeS](https://github.com/junzis/pyModeS). v3 has an API where you hand it one message and it returns every field as a dict; pass a rough receiver position to `reference` and it decodes locally.

```python
import pyModeS as pms
r = pms.decode(msg, reference=(MY_LAT, MY_LON))
# r["latitude"], r["longitude"], r["altitude"], r["callsign"], r["crc_valid"] ...
```

Write a small script that just pipes `rtl_adsb`'s output into this, run it, and coordinates start scrolling in the terminal.

```text
21:29:39  89912B  EVA195    lat=  34.8097  lon= 136.9325  alt=37975ft
21:29:39  851826  JAL229    lat=  34.5754  lon= 136.7913  alt=27600ft
21:29:50  861F00  JAL616    lat=  34.3943  lon= 136.7036  alt=41000ft
```

Callsign, ICAO address, lat/lon, altitude. The same aircraft's coordinates move smoothly and consecutively (JAL616 heading south, JAL229 descending), so the decode is correct. A real plane I received on my own antenna has become coordinates.

## Feeding it into ttymap — bridge a JSON server in between

Now I want this on my homemade globe, ttymap. The intake a ttymap plugin uses for data is `ttymap.http:fetch(url)` — basically, **fetch JSON over HTTP**. The earlier `aircraft` plugin also did `http:fetch` against OpenSky's REST API and plotted points with `map:point(lon, lat, …)`.

But this `rtl_adsb | pyModeS` only spits text to stdout; it has no HTTP intake. The shapes don't match.

So I bridge a small thing in between. I wrote an HTTP server in Python's standard library that runs `rtl_adsb` as a child process, holds the aircraft state pyModeS decodes keyed by ICAO, and just serves it at `127.0.0.1:8888/aircraft.json`.

```text
rtl_adsb ──▶ serve.py (decode with pyModeS + hold aircraft state) ──HTTP /aircraft.json──▶ ttymap
```

The key was changing the decoder from "one frame → print one line" into "accumulate state per ICAO." Position arrives in position messages, callsign in identification messages, heading in velocity messages (velocity's `track`) — each comes in piecemeal from different messages, so you grow a record per aircraft and drop it once it goes unheard for a while. The JSON it serves looks like this.

```json
{
  "aircraft": [
    {
      "icao": "861f00",
      "callsign": "JAL616",
      "lat": 34.39,
      "lon": 136.7,
      "alt": 41000,
      "heading": 182.8,
      "on_ground": false
    }
  ]
}
```

## Writing the plugin — heading as an arrow

A ttymap user plugin goes in `~/.config/ttymap/lua/plugin/<name>.lua`, and you enable it with `require "plugin.<name>"` in `~/.config/ttymap/init.lua`. The body is almost entirely cribbed from the bundled `aircraft` plugin, with only the fetch target swapped for the local server.

The crux is, inside `on_tick` (called every frame), to fire `http:fetch` at a fixed interval, parse the returned JSON, and plot points. To match the earlier `aircraft`, I render the heading as an 8-direction arrow (↑↗→↘↓↙←↖).

```lua
local ARROWS = { "↑", "↗", "→", "↘", "↓", "↙", "←", "↖" }
local function heading_arrow(deg)
    local n = deg % 360
    return ARROWS[math.floor((n + 22.5) / 45) % 8 + 1]
end

-- inside on_tick:
for i, a in ipairs(state.aircraft) do
    map:point(a.lon, a.lat, heading_arrow(a.heading), "accent")
end
```

The sidebar lists callsign and altitude; select one and press Enter and the map flies to that aircraft (`anim.fly_to`). This card UI is just `ttymap.api.card.open` again — the machinery I built in the earlier post works as-is.

## My own radio drifts across the globe

Start the server, call `Toggle local ADS-B` from ttymap's command palette, and arrows appear over my home. Each arrow tilts toward its heading, and picking a callsign flies the camera to that plane. What used to be watching **someone else's server** called OpenSky has turned into **radio I received on the antenna I set up myself**. On the very same braille globe.

![A telescoping dipole antenna on a tripod, opened into a V to receive 1090MHz](../../../assets/rtlsdr-dipole-antenna.jpg)

What was quietly interesting was the range. Even just standing the cheap indoor dipole by the window and opening it into a V, high-altitude cruisers came through from around 100km out. It's not scattered all across the map — just a handful of nearby planes dotted on it — but seeing "how far my own antenna reaches" with my own eyes is fun.

## Gotchas, collected

- **Plug it in and it's recognized as a DVB-T tuner.** You can't open it as an SDR unless you blacklist the kernel TV driver (`dvb_usb_rtl28xxu`). Arch's `rtl-sdr` package handles it via modprobe.d.
- **Raw frames aren't coordinates.** ADS-B position is CPR-encoded and needs an even/odd pair or a receiver-position reference. Throwing it at pyModeS is the easy path.
- **ttymap's intake is HTTP JSON.** A decoder that only spits to stdout needs a local HTTP server bridged in between to match shapes.

## What's next

Receive-only already got me this far. A fun next direction: coherent reception across multiple antennas to get the **bearing (DF)** of a signal, draw bearing lines on the map, and locate the source from the intersection of two stations — that kind of thing (KrakenSDR and friends). `map:polyline` is the same primitive I used for traceroute hops in the earlier post.

When you can feed your own tools data you received yourself, the resolution of the world goes up a notch.
