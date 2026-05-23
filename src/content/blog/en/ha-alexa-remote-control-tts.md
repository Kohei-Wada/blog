---
title: 'Back when there was no official integration, I drove the unofficial API to make Alexa talk'
description: "Before there was an easy official way to make an Echo Dot talk from Home Assistant, I had a self-built setup that drove Amazon's private Alexa API via alexa-remote-control. How I got the refresh token, the SSH-from-HA wiring, and why I eventually moved to the official integration."
pubDate: 'May 23 2026'
tags: ['home-assistant', 'alexa', 'reverse-engineering', 'personal-projects']
seeAlso: ['ha-claude-code-alexa-report']
---

## Introduction

These days Home Assistant has an official Alexa Devices integration — call `notify.<device>_announce` and the Echo Dot speaks. My [setup that has Claude Code read its progress aloud through Alexa](/en/blog/ha-claude-code-alexa-report) rides on that official path.

But until not long ago, there was no easy official way to make an Echo talk from HA. Amazon doesn't offer Alexa's TTS as a public API. What I ran back then was a **self-built setup that drove Amazon's private Alexa API via `alexa-remote-control`**. This post is the record of that "unofficial API era" configuration, and why I eventually moved to the official one.

## The mechanism: drive the private API with a refresh token

The core is [alexa-remote-control](https://blog.loetzimmer.de/2021/09/alexa-remote-control-shell-script.html) (loetzimmer's shell script). It drives the private API the Alexa app uses internally, with a refresh token obtained via a browser login. Since it's not an official API, it always carries the risk of breaking on an Amazon-side spec change.

The flow looked like this:

```text
HA → SSH (port 2222) → alexa-remote-control → Amazon private API → Echo Dot speaks
```

HA launches the script over SSH, and the script hits Amazon's private endpoints to make the Echo talk — a multi-stage setup. The idea: "if there's no official integration, just hit the same API the app does, myself."

## Getting the refresh token

To run the script you need a refresh token for the Amazon account. You get it by running the login flow with `cli.js` (which uses alexa-cookie internally), bundled with `alexa-remote-control`.

```bash
node cli.js -a "ja_JA"
```

Running it stands up a local login form at `http://127.0.0.1:8080/`; you enter your Amazon credentials there. On success you get output like this (real values masked):

```text
=======================================================================
Some of this data might be useful to you for additional token retrieval
 Please store in a safe place ...
=======================================================================
 macDms: {"device_private_key":"<...>"}{key:<...>}{iv:<...>}{name:<...>}{serial:<...>}
 ----------------------------------------------------------------------
 deviceSerial: <REDACTED>
=======================================================================
 refreshToken: <REDACTED>
=======================================================================
```

Wrapping the `refreshToken` in a script that passes it via environment variables makes it easier to handle.

```sh
#!/bin/sh
# alexa.sh wrapper script
export REFRESH_TOKEN='<REDACTED>'
export LANGUAGE='ja-JP'
export TTS_LOCALE='ja-JP'
export AMAZON='amazon.co.jp'
export ALEXA='alexa.amazon.co.jp'

$HOME/Projects/alexa/alexa-remote-control/alexa_remote_control.sh "$@"
```

Since it's a Japanese account, the key point is pointing `AMAZON` / `ALEXA` at the `amazon.co.jp` endpoints. Leave them on `.com` and auth won't go through.

## Why I moved to the official integration

This setup worked, but the fragility of an unofficial API was always there.

- **Token lifetime and 2FA**: a refresh token isn't permanent — Amazon-side session and 2FA spec changes force you to re-fetch it.
- **It breaks silently on API changes**: with no public contract, one day the Echo just stops talking.
- **The fragility of a multi-stage setup**: HA → SSH → shell script → private API has a lot of links, and if any one trips, the whole thing stops.

So I migrated as each option appeared, in order:

1. **alexa-remote-control (unofficial API / SSH)** ← this post
2. **Alexa Media Player (HACS, `alandtse/alexa_media_player`)** — also unofficial-API-based, but handled as an HA integration. I replaced the `shell_command` speech calls with `notify.alexa_media_echo_dot`.
3. **Alexa Devices (official integration)** — the official path that finally arrived. This is what I use now.

From "drive the unofficial API myself," to "a HACS integration," to finally "the official integration" — a migration that shed a layer of effort and fragility at each step.

## Wrap-up

- Back when there was no official integration, making Alexa talk meant driving Amazon's private API with `alexa-remote-control`.
- A multi-stage setup: get a refresh token with `cli.js`, launch it from HA over SSH via an env-var wrapper.
- Because it's an unofficial API, token expiry, spec changes, and multi-stage fragility were always present — so I eventually moved to the official Alexa Devices integration.
- The "just hit the same API the app does" shortcut was a useful bridge during the period when there was no official option.

## References

- [Alexa Remote Control Shell Script (loetzimmer)](https://blog.loetzimmer.de/2021/09/alexa-remote-control-shell-script.html)
- [Alexa Media Player (alandtse/alexa_media_player)](https://github.com/alandtse/alexa_media_player)
- [Alexa Devices integration (Home Assistant)](https://www.home-assistant.io/integrations/alexa_devices/)
