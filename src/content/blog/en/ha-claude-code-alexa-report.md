---
title: 'I built a way for Claude Code to report progress through my home Alexa'
description: 'I built a skill that reads the progress of a long-running Claude Code session aloud in Japanese from the Echo Dot next to me. A build log that hits all of it: the HA SSH add-on sshd constraints, the Amazon-side _speak API going silent, the JWT-mint path, and persisting a script that the tmpfs would otherwise wipe.'
pubDate: 'May 23 2026'
tags: ['home-assistant', 'claude-code', 'alexa', 'personal-projects']
seeAlso: ['roomba-lan-penetration-experiment']
---

## Introduction

When I hand a long-running job to Claude Code, I can't tell what's happening unless I'm watching the screen. So I built a skill that has the Echo Dot beside me read out "I'm about to do this" and "done" in Japanese. It looks simple, but the implementation hits a string of small traps: the HA SSH add-on's sshd constraints, the Amazon-side `_speak` APIs going silent, and `/tmp` being a tmpfs that wipes the script. Here's the configuration I landed on after stepping on all of them.

For what it's worth, this very post had its in-progress status ("writing the Japanese version," "verifying," "merging") read aloud from my study's Echo Dot by exactly this mechanism, while I was writing it.

When I hand Claude Code a multi-step job (edit files → wait for CI → open a PR, etc.), I lose track of progress the moment I switch to something else. Having "about to do X" and "X is done" arrive through my ears, without going to look at the CLI, lets me do other things with peace of mind.

There are several Echo Dots in the house, and HA can fire TTS. So this should have been "just call a script over `ssh homeassistant` and make the Echo talk." In practice it snags about three times.

## The configuration that finally worked

```text
Claude Code skill (alexa-report)
    ↓ ssh homeassistant
HA SSH add-on
    ↓ python3 /homeassistant/scripts/ha_speak.py
HA Core REST API (auth: JWT mint from .storage/auth)
    ↓ POST /api/services/notify/send_message
Alexa Devices integration
    ↓ notify.<device>_announce
Echo Dot speaks (chime + message)
```

Three design decisions:

| Decision                                        | Why                                                                                                           |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Use `_announce`, not `_speak`                   | The `Alexa.Speak` API is effectively deprecated on Amazon's side. It returns 200 OK but no sound.             |
| Mint a JWT, don't issue a new long-lived token  | You can mint a short-lived JWT with the `jwt_key` in `.storage/auth`, without growing extra tokens in the UI. |
| Keep the script under `/homeassistant/scripts/` | `/tmp` is tmpfs. Restart HA and the script is gone.                                                           |

## Implementation

### 1. Register the SSH key in the Advanced SSH add-on Configuration

Hand-appending to `~/.ssh/authorized_keys` doesn't stick. The add-on regenerates authorized_keys from its Configuration at startup, so a manual edit is wiped on add-on restart.

HA UI → Settings → Add-ons → Advanced SSH & Web Terminal → Configuration → add your public key to `authorized_keys:` → Save → Restart.

### 2. The SSH alias and the no-SFTP trap

Client `~/.ssh/config`:

```text
Host homeassistant
  HostName 192.168.0.15
  User wada
  IdentityFile ~/.ssh/id_rsa
```

The HA SSH add-on's sshd has the **SFTP subsystem disabled.** `scp` on OpenSSH 9+ assumes SFTP, so it fails with `subsystem request failed on channel 0`. Pipe it in with `ssh + cat` instead:

```bash
ssh homeassistant 'cat > /homeassistant/scripts/ha_speak.py' < /path/to/ha_speak.py
# or the legacy SCP protocol
scp -O /path/to/ha_speak.py homeassistant:/homeassistant/scripts/
```

### 3. The JWT-mint script

Using the refresh_token's `jwt_key` (a 128-char hex) in `.storage/auth`, mint a short-lived JWT with HS256. PyJWT isn't installed in the SSH add-on, so build it by hand with the standard library:

```python
import json, base64, hmac, hashlib, time, urllib.request, sys

CLIENT_NAME = "claude-code"  # key to select the refresh_token in .storage/auth
API = "http://homeassistant.local.hass.io:8123"

with open("/homeassistant/.storage/auth") as f:
    d = json.load(f)
tok = next(t for t in d["data"]["refresh_tokens"] if t.get("client_name") == CLIENT_NAME)

now = int(time.time())
b64 = lambda o: base64.urlsafe_b64encode(json.dumps(o, separators=(",", ":")).encode()).rstrip(b"=")
h = b64({"alg": "HS256", "typ": "JWT"})
p = b64({"iss": tok["id"], "iat": now, "exp": now + 300})
sig = base64.urlsafe_b64encode(
    hmac.new(tok["jwt_key"].encode(), h + b"." + p, hashlib.sha256).digest()
).rstrip(b"=")
token = (h + b"." + p + b"." + sig).decode()

def post(path, data):
    req = urllib.request.Request(
        API + path,
        data=json.dumps(data).encode(),
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        method="POST",
    )
    return urllib.request.urlopen(req, timeout=5).status

if sys.argv[1] == "speak":
    print(post("/api/services/notify/send_message",
               {"entity_id": sys.argv[3], "message": sys.argv[2]}))
```

### 4. The Claude Code skill itself

```bash
ssh homeassistant 'sudo python3 /homeassistant/scripts/ha_speak.py speak "writing the blog draft" notify.koheisannoecho_dot_max_announce'
```

If you put a wrapper that calls this shell at each `Before` / `After` step inside the skill, Claude Code automatically speaks up on every long-running task.

### 5. The Echo entity list

| Physical device        | entity                                   |
| ---------------------- | ---------------------------------------- |
| Echo Dot Max (study)   | `notify.koheisannoecho_dot_max_announce` |
| Echo Dot (living room) | `notify.echo_dot_announce`               |
| Upstairs               | `notify.er_jie_announce`                 |
| All rooms              | `notify.quan_bu_nobu_wu_announce`        |

A Japanese group name like "全部の部屋" (all rooms) gets pinyin-slugified on the HA side (`quan_bu_nobu_wu`). Renaming the group changes the slug, so when adding a new one, the reliable move is to hit `GET /api/services` for the notify domain and check.

## Gotchas

- **The `Alexa.Speak` API is silent**: calling `notify.<x>_speak` returns 200 OK but makes no sound. You have to switch to `_announce` (the downside is the chime, but there's no alternative right now).
- **`.storage/auth` is root:0600**: `sudo python3` is required.
- **`/tmp` is tmpfs**: the script disappears on HA restart. Put it under `/homeassistant/scripts/`.
- **`network-online.target` isn't re-evaluated on wake-from-suspend**: not directly about HA, but the trap where the DNS that TTS depends on falls over is common to systemd timers in general.
- **JWT lifetime is 5 minutes**: the premise is you mint one on every call. No need to extend it since it isn't reused.

## Results

- The "I have no idea what it's doing" feeling on long Claude Code sessions is gone.
- I can check progress by sound alone while working on something else next to it.
- Since it's a skill, it works on a new project just by calling `Skill alexa-report`.
- I realized the "read it aloud from the Echo Dot" interface generalizes beyond Claude Code, and started repurposing it for CI-completion notifications and long-running Bash command completions too.

## Wrap-up

- The mechanism is just "ssh homeassistant → JWT mint → REST API → Alexa announce."
- Three traps: SFTP disabled, `Alexa.Speak` silent, `/tmp` volatile.
- Making it a skill lets you repurpose it outside Claude Code too.

## References

- [Home Assistant REST API](https://developers.home-assistant.io/docs/api/rest/)
- [Authentication API — Home Assistant Developer Docs](https://developers.home-assistant.io/docs/auth_api/)
- [Alexa Devices integration](https://www.home-assistant.io/integrations/alexa_devices/)
