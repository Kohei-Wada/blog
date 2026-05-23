---
title: 'A "Damaged tar archive" pacman recovery war story — the day three causes converged'
description: 'sudo pacman -Syu kept failing endlessly with "Damaged tar archive (bad header checksum)". The mystery of why tar/bsdtar can read the DB but pacman alone chokes, the trap where HTTP 304 blocks a re-download, and systemd timer wake-from-suspend behavior. A record of chasing a three-cause convergence with pacman --debug and gzip format analysis.'
pubDate: 'May 23 2026'
tags: ['arch-linux', 'pacman', 'systemd', 'troubleshooting']
---

## Introduction

One morning `sudo pacman -Syu` started failing endlessly with `error: could not read db 'core' (Damaged tar archive (bad header checksum))`. Forcing a DB re-fetch with `-Syy` didn't fix it. Reinstalling pacman itself and libarchive from cache with `pacman -U` didn't fix it either. At first glance it looks like a plain "stale mirror" case, but as I dug in, three independent causes had converged on the same day.

This post is the record of chasing that incident to root cause with pacman --debug, gzip format analysis, byte comparison via `cmp`, and systemd-journald log tracing. It's packed with traps Arch users and systemd operators can hit — how `file` misjudges a corrupt gzip as "fine," and how `network-online.target` isn't re-evaluated on wake-from-suspend.

The conclusion in one sentence: **reflector was dying on a DNS failure right after wake-from-suspend, so the mirrorlist stayed stale, its top mirror was serving a corrupt DB, and it was incorrectly returning HTTP 304 so the DB couldn't be re-fetched** — a multi-stage convergence.

## What happened first

I ran `sudo pacman -Syu` as usual and got this:

```text
error: could not read db 'core' (Damaged tar archive (bad header checksum))
error: could not read db 'extra' (Damaged tar archive (bad header checksum))
...
```

My first reflex was "the download got cut off," so I forced a DB re-fetch with `sudo pacman -Syy`. No change. Next I suspected "maybe the pacman or libarchive binary got corrupted" and reinstalled both from cache with `pacman -U`. No change either.

`-U` doesn't consult the sync DB, so reinstalling from cache worked — which turns out to be foreshadowing.

## Some tools can read the DB file

To first determine whether the DB was physically broken, I tried reading it with something other than pacman.

```bash
tar tf /var/lib/pacman/sync/core.db | wc -l    # 589 entries, exit 0
bsdtar tf /var/lib/pacman/sync/extra.db | wc -l # 1496 entries, exit 0
```

Both GNU tar and bsdtar return the entries just fine. Feed it to `file` and it says `gzip compressed data` — it doesn't call it "corrupt." bsdtar uses libarchive 3.8.7, and pacman is linked against the same libarchive. **They should be using the same library, yet pacman alone chokes.** That was the first mystery.

## Compare byte-for-byte with the official mirror

I compared `core.db` from the first mirror in pacman.conf, `mirrors.cat.net`, against Arch's official `geo.mirror.pkgbuild.com`, using `curl -sI` and `cmp`.

| File          | mirrors.cat.net  | official         |
| ------------- | ---------------- | ---------------- |
| core.db size  | 127,304 bytes    | 127,296 bytes    |
| core.db mtime | Apr 20 08:56 UTC | Apr 20 13:59 UTC |
| core.db MD5   | efec2b0b...      | efe1e191...      |

The sizes differ by 8 bytes and the MD5s don't match at all. Looking from the start with `cmp`, there's already a difference at byte 28.

```text
core_cat.db core_official.db differ: byte 28, line 1
```

This isn't just lagging sync — the very byte stream cat.net is serving differs from the official one.

## Confirm the corruption is at the gzip layer

Feed it to `gzip -l` and the cat.net versions both clearly come back as "broken."

| File     | Error                                    |
| -------- | ---------------------------------------- |
| core.db  | invalid compressed data--crc error       |
| extra.db | invalid compressed data--format violated |

Back to the core question: **why does `file` say "gzip compressed data," tar/bsdtar can read it, and only pacman chokes?**

The `file` command only does magic-number detection. If the first 10 bytes of the gzip (`1f 8b 08 ...`) are correct, it reports "this is gzip." It inspects neither the compressed payload nor the trailing CRC32 / ISIZE. So a gzip whose header is fine but whose body is rotten looks perfectly normal to `file`.

A gzip has an 8-byte footer at the end: the first 4 bytes hold the CRC32 of the decompressed data, the last 4 the decompressed size (ISIZE). Comparing the cat.net and official versions from the tail looked like this:

```text
official : ... 22 45 8a [77 f0 1f f4 15 22 be] [00 00 0a 00]
cat.net  : ... 22 45 8a [14 ef e0 2f bc c4 4c fd] [00 00 0a 00]
                        ↑ garbled from here
```

- ISIZE (decompressed size) claims the same `0x000a0000` = 655360 bytes on both
- The CRC32s are completely different (`0xbe2215f4` vs `0xfd4cc4bc`)
- The trailing deflate block of the stream differs too

So the "the decompressed size should be exactly this" declaration matches, but the actual data is garbled and the CRC doesn't agree — textbook random-corruption behavior. The fact that the corruption types diverge (core.db is a CRC error, extra.db a format violation) further suggests random corruption (an attack or tampering would break things more systematically).

## Why tar/bsdtar read it but pacman can't

Here you can see why behavior diverges despite a shared libarchive.

- GNU tar / bsdtar treat the trailing CRC error as a warning and return the entries they can read (lenient)
- pacman (libalpm) strictly checks the tar header checksum and gzip integrity inside `sync_db_populate` and errors out immediately if anything's off

Run `pacman --debug -Sy` and you can confirm it fails right inside `sync_db_populate (be_sync.c: 489)`. Same library, different behavior depending on the caller's strictness.

## Re-download refused by HTTP 304

"Fine, just force a re-fetch with -Syy then" — and it jams right here too. The pacman --debug log shows cat.net returning 304 even though it should have new content.

```text
debug: core.db: using time condition 1776675365
debug: core.db: response code 304
debug: core.db: file met time condition
```

pacman fetches with an `If-Modified-Since`. Normally a server returns 200 and the new bytes if there's an update. But cat.net **returns 304 Not Modified even though it has new content**. pacman dutifully takes "nothing changed" at face value and keeps using the broken local DB. `-Syy` doesn't change it. So even if the mirror fixes itself, that never propagates to you.

## Why the mirror stayed pinned — reflector's silence

Normally the weekly `reflector.timer` updates the mirrorlist, so cat.net shouldn't be able to squat at the top that long. Going back through journalctl showed this:

```text
Mar 30 21:09:38 reflector: failed to retrieve mirrorstatus data:
Apr 06 22:04:45 reflector: URLError: Temporary failure in name resolution
Apr 13 19:16:29 reflector: URLError: Temporary failure in name resolution
Apr 20 22:03:58 reflector: URLError: Temporary failure in name resolution
```

Three weeks in a row it died failing DNS resolution. The `Apr 20 22:03:58` failure time was the same second as the laptop's wake-from-suspend.

Lined up as a timeline:

| Time            | Event                                                 |
| --------------- | ----------------------------------------------------- |
| Apr 20 02:26:13 | entered suspend                                       |
| Apr 20 22:03:58 | woke from suspend (opened the lid)                    |
| Apr 20 22:03:58 | reflector.service fired immediately (Persistent=true) |
| Apr 20 22:04:02 | NetworkManager reconnected WiFi / got DHCP lease      |

There's a 4-second gap between wake and WiFi reconnect. `reflector.timer` is `Persistent=true`, so the firing it should have done during suspend all fires at once the moment it wakes. **But at that point DNS isn't usable yet.** reflector can't resolve archlinux.org and dies instantly with URLError.

"But surely reflector.service has `After=network-online.target` and `Wants=network-online.target`?" — I checked, and it did. But here's the second trap: **`network-online.target` stays active from before suspend, so it isn't re-evaluated on wake.** As far as systemd is concerned, network-online was "achieved long ago," so the `After=` constraint sails right through.

This is a textbook pitfall when wake-from-suspend combines with timer carry-over.

## The convergence of three causes

Summarizing it all:

| Cause                                                              | Since                      |
| ------------------------------------------------------------------ | -------------------------- |
| reflector died weekly on DNS failure right after wake-from-suspend | around 2026-03-30          |
| mirrorlist pinned to its 2026-03-23 state, cat.net first           | no update since 2026-03-30 |
| cat.net serving a corrupt DB, and incorrectly returning 304        | around 2026-04-20          |

Drop any one and I wouldn't have hit it. If reflector were working, cat.net would have fallen off the top. Same if the mirrorlist had been updated by hand. If cat.net had returned 304 correctly, `-Syy` would have recovered it. Only when all three landed on the same day did `pacman -Syu` start spitting the same error forever.

## Recovery steps

Starting with the immediate recovery.

```bash
# Delete the broken DBs and re-fetch directly from the official mirror
sudo rm /var/lib/pacman/sync/core.db /var/lib/pacman/sync/extra.db
sudo curl -fLo /var/lib/pacman/sync/core.db \
  https://geo.mirror.pkgbuild.com/core/os/x86_64/core.db
sudo curl -fLo /var/lib/pacman/sync/extra.db \
  https://geo.mirror.pkgbuild.com/extra/os/x86_64/extra.db

# Exclude cat.net from the mirrorlist immediately
sudo sed -i 's|^Server = https://mirrors.cat.net|#Server = https://mirrors.cat.net|' \
  /etc/pacman.d/mirrorlist

# Now the upgrade goes through
sudo pacman -Syyu
```

There are two permanent fixes. I leaned toward option A.

**Option A: make reflector wait until DNS resolves.**

```bash
sudo systemctl edit reflector.service
```

```ini
[Service]
ExecStartPre=/bin/sh -c 'for i in $(seq 1 60); do getent hosts archlinux.org >/dev/null 2>&1 && exit 0; sleep 1; done; exit 1'
```

Wait up to 60 seconds for archlinux.org to resolve before running reflector itself. This also absorbs the WiFi-reconnect wait right after wake-from-suspend.

**Option B: stop the timer from carrying over.**

```bash
sudo systemctl edit reflector.timer
```

```ini
[Timer]
Persistent=false
```

Skip the firings that should have happened during suspend. Wait for the next weekly slot. Simple, but with a long suspend it risks leaving the mirrorlist stale for up to a week.

## Gotchas

- Don't trust `file`'s "gzip compressed data." It only looks at the gzip header magic number. It won't notice rotten contents. To check integrity, use `gzip -l` or `gzip -t`.
- tar / bsdtar reading it doesn't mean pacman can. Even with a shared libarchive, the caller (libalpm) checks strictly, so verifying with lenient CLI tools is unreliable.
- `pacman -U` doesn't look at the sync DB, so you can reinstall from cache even when the sync DB is broken. **Useful during recovery when you want to reinstall pacman itself or libarchive.**
- Mirrors sometimes return HTTP 304 incorrectly. Don't fully trust `-Syy`. When suspicious, switch mirrors or curl by hand.
- `network-online.target` isn't re-evaluated across suspend. Even with `After=network-online.target`, a service can fire in the DNS-not-ready state right after wake. For services that need DNS, explicitly wait in `ExecStartPre`.

## Results

- Immediate recovery: re-fetched the DBs by hand from the official mirror, removed cat.net from the mirrorlist, and `pacman -Syyu` went through.
- Permanent fix: added a DNS-wait `ExecStartPre` to reflector.service so it won't die on the DNS failure right after wake-from-suspend.
- Byproduct: I picked up three debugging techniques that pay off on other incidents too — pacman --debug, reading the gzip format by hand, and systemd's wake-from-suspend behavior.

## Wrap-up

- Even on a shared libarchive, strictness differs per tool — tar/bsdtar reading it doesn't mean pacman can.
- `file` only looks at the gzip header. To check integrity, use `gzip -l` or `gzip -t`.
- There exist mirrors that return HTTP 304 incorrectly — a trap where even `pacman -Syy` can't escape a broken DB.
- `network-online.target` isn't re-evaluated on wake — explicitly wait in ExecStartPre for DNS-dependent services.
- Compound incidents don't happen from a single cause. I hit this only because three causes happened to converge on the same day.

## References

- [Arch official mirror status](https://archlinux.org/mirrors/status/)
- [pacman(8) documentation](https://man.archlinux.org/man/pacman.8)
- [reflector(1)](https://man.archlinux.org/man/reflector.1)
- [systemd.timer(5) — Persistent= behavior](https://man.archlinux.org/man/systemd.timer.5)
- [RFC 1952 — GZIP file format specification](https://datatracker.ietf.org/doc/html/rfc1952)
