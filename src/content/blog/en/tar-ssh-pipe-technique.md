---
title: 'Notes on the tar + ssh pipe technique'
description: 'A practical streaming-transfer technique using tar + ssh pipes, for environments without rsync or when sudo is required to read the files'
pubDate: 'Jan 11 2026'
tags: ['Shell', 'Bash', 'SSH', 'Linux', 'Unix']
---

I can never quite recall the exact command when I actually need it, so I'm parking it here for copy-paste.

## TL;DR (for the impatient)

```bash
# Pull from remote to local (with sudo)
ssh host "sudo tar cz /var/log/nginx" | tar xzv --strip-components=3

# Push from local to remote
tar cz . | ssh host "tar xz -C /path/to/dest"
```

---

## What happened

I needed to pull logs off an old CentOS server.

Tried rsync:

```
-bash: rsync: command not found
```

The box is EOL and its repos are dead, so `yum install rsync` won't work either.

Tried scp:

```
scp: /var/log/nginx/access.log: Permission denied
```

The log directory needs root. scp has no way to slip a `sudo` in there.

This is exactly where the tar + ssh pipe earns its keep.

---

## When to reach for it

- rsync isn't installed (old servers, minimal containers)
- scp can't read the file because of permissions (sudo is required)
- You don't want to leave a temp file on the remote
- You want to compress on the fly to save bandwidth

---

## Basic patterns

### Remote → local

```bash
ssh host "tar cz /path/to/dir" | tar xz
```

The remote `/path/to/dir` gets extracted into your current local directory.

### When sudo is required

```bash
ssh host "sudo tar cz /var/log/nginx" | tar xzv --strip-components=3
```

`--strip-components=3` chops off the first three path components of `/var/log/nginx/...` so it extracts as `nginx/...`.

### Choosing the extraction target

```bash
ssh host "tar cz /path/to/data" | tar xz -C ./backup/
```

### Local → remote

**Send a directory and extract it on the other side:**

```bash
tar cz . | ssh host "tar xz -C /path/to/dest"
```

**Save as an archive file instead:**

```bash
tar cz directory | ssh host "cat > backup.tar.gz"
```

---

## Variations

### Show progress

```bash
tar cz /data | pv | ssh host "tar xz -C /backup"
```

Slotting `pv` into the pipe gives you a live transfer rate.

### Fan out to multiple servers at once

```bash
tar cz /deploy | tee >(ssh server1 "tar xz -C /app") \
                      >(ssh server2 "tar xz -C /app") > /dev/null
```

---

## Gotchas

### Counting `--strip-components`

It strips N leading path components.

```
/var/log/nginx/access.log
  │    │    │
  1    2    3  ← strip-components=3 leaves you with nginx/access.log
```

### Where `-C` goes

It belongs on the extracting side (right-hand side of the pipe).

```bash
# OK
ssh host "tar cz /path" | tar xz -C ./dest/

# Pointless — `-C` on the compression side doesn't change where it lands
ssh host "tar cz -C /path ." | tar xz
```

### Compression options

| Option | Format | When to use                          |
| ------ | ------ | ------------------------------------ |
| z      | gzip   | Usually all you need                 |
| j      | bzip2  | When you care about ratio over speed |
| J      | xz     | Best ratio, slowest                  |

---

## scp vs rsync vs tar + ssh

| Situation                          | Pick      |
| ---------------------------------- | --------- |
| One-off small file                 | scp       |
| Recurring sync / incremental       | rsync     |
| No rsync available / sudo required | tar + ssh |

---

## Wrap-up

- tar + ssh is the fallback when rsync isn't available
- It can grab files that are only readable through sudo
- `--strip-components` lets you trim the path depth
- Streaming transfer — no temp file left behind
