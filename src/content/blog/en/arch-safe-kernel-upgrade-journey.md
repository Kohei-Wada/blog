---
title: 'From the trauma of an unbootable kernel update to staying current safely instead of pinning'
description: 'Ever since an out-of-tree USB WiFi driver (8821au) broke on an Arch kernel update — leaving a machine that booted but had no network — I had pinned the kernel with IgnorePkg and stopped updating. This is how I fixed it at the root: dropped the culprit DKMS driver for in-tree only, added linux-lts as a fallback, removed the pin, and caught up to the latest. Includes the partial-upgrade trap and the linux-firmware split conflict.'
pubDate: 'May 25 2026'
tags: ['arch-linux', 'pacman', 'kernel', 'grub', 'dkms', 'troubleshooting']
seeAlso: ['pacman-damaged-tar-archive-debug']
---

## Introduction

Once, an Arch kernel update left my machine **unbootable** — or close to it. The cause was the driver for an external USB WiFi adapter (`8821au`, an out-of-tree DKMS module): it failed to build against the new kernel, so the system **booted but had no network**. Without network you can't pull the article that explains the fix, or the package that applies it, so I ended up reaching for a live USB. That trauma is why I had **pinned** the kernel at 6.13.8 with `IgnorePkg` and simply stopped updating it.

But after reproducing a kernel LPE in a disposable VM, it clicked that "pin and stop updating = leave the vulnerability sitting there" is not a trade worth making. So this time I rebuilt the setup to **stay current safely** instead. Three things: drop the culprit DKMS driver and rely on the in-tree one, add `linux-lts` as a fallback kernel, and remove the pin so `-Syu` catches the kernel up. After a reboot every device — WiFi, camera, mic — worked.

## The trap: it boots, but there's no network

"Unbootable" doesn't mean a black screen with nothing on it. **It boots. But the WiFi is dead.** That's the nastiest case.

- No network means you can't fetch the article that diagnoses the problem, nor the package that fixes it.
- Even though you know "just roll the kernel back," you can't download what that operation needs.
- You end up burning a live USB on another machine, chrooting in — a whole production.

The root cause was an **out-of-tree driver**. A USB WiFi driver like `8821au` is built per-kernel via DKMS, and when the kernel moves up it hits incompatibilities or build failures. When that driver is for an **essential device** (the network), it feeds straight into the vicious circle above.

After that incident I took the easy way out and "just pinned the kernel with `IgnorePkg`" to stop updates. That becomes the next problem.

## Pinning only the kernel is dangerous on Arch

"Just hold back the dangerous kernel and update everything else" — intuitive, but a landmine on Arch.

- Arch is rolling release, and **partial upgrades are unsupported**. A bare `pacman -Sy <pkg>`, or leaving just the kernel behind with `IgnorePkg`, invites **glibc / ABI skew**.
- Reboot in that skewed state for any reason, and now it breaks for a reason unrelated to the pin.

So while I thought I was "safe because it's pinned," I was actually sitting on a different piece of unexploded ordnance. The right direction is to **drop the pin and always do a full upgrade in a form that doesn't break.**

## The fix: remove the cause → stack a fallback → catch up

### 1. Drop the out-of-tree driver

The built-in Intel WiFi (`iwlwifi`) is **in-tree**, so it ships with the kernel and follows updates automatically. It doesn't break. Depending on the external USB WiFi was the root of the incident, so if in-tree is enough, remove the DKMS package.

```bash
sudo pacman -Rns <dkms-package>   # e.g. rtl8821au-dkms-git
```

This severs the very path of "kernel update kills the WiFi."

### 2. Make linux-lts a fallback kernel

If the latest kernel falls over but you can still boot `linux-lts` from GRUB's "Advanced options," you can get into a networked environment and recover **without a live USB**.

```bash
sudo pacman -S linux-lts linux-lts-headers
sudo grub-mkconfig -o /boot/grub/grub.cfg
```

### 3. Remove the pin and catch up

Drop `IgnorePkg` and bring the kernel all the way to the latest with a full upgrade.

```bash
sudo pacman -Syu      # never a bare -S / -Sy (that's a partial upgrade)
```

## A conflict hit during the upgrade

While catching up I hit a conflict stemming from the linux-firmware split.

```text
error: failed to commit transaction (conflicting files):
linux-firmware-nvidia: /usr/lib/firmware/... exists in filesystem
```

This is the fallout of linux-firmware being split into sub-packages; you get past it by removing the old linux-firmware once and reinstalling. **As long as you don't reboot, it's harmless.**

```bash
sudo pacman -Rdd linux-firmware
sudo pacman -Syu linux-firmware
```

Keep an escape hatch too. Don't delete the old packages in `/var/cache/pacman/pkg` (no `pacman -Scc`). If anything goes wrong, `sudo pacman -U <old-pkg>` rolls back to the previous version.

## Results

I removed the pin (6.13.8), caught `linux` up to the latest (7.0.10), and kept `linux-lts` alongside as a fallback. After a reboot, **WiFi / camera / mic all work on lts 6.18.33**. With the root of the "raising the kernel kills the WiFi" fear pulled out (the out-of-tree driver), I can now follow along with a plain `-Syu`.

- Identified and removed the root cause of the unbootable state (in-tree only).
- Even with the pin gone, if it falls over I can boot lts from GRUB — a built-in fallback.
- I'm now in a position to keep patching — which is the precondition for stopping a kernel LPE from **spreading damage across the whole machine**.

## Wrap-up

- The "boots but no network" dead end on a kernel update is usually caused by an **out-of-tree DKMS driver**. If in-tree is enough, ditch it.
- Pinning only the kernel with `IgnorePkg` makes it a **partial upgrade** and invites a different kind of breakage. On Arch, full upgrade is the rule.
- Stack `linux-lts` as a fallback and you can recover **without a live USB** even when the latest kernel falls over.
- Don't delete the old packages in `/var/cache/pacman/pkg`. They're your rollback lifeline.

## References

- [Arch Wiki — System maintenance (why partial upgrades are unsupported)](https://wiki.archlinux.org/title/System_maintenance#Partial_upgrades_are_unsupported)
- [Arch Wiki — Kernel (kernel packages like linux-lts)](https://wiki.archlinux.org/title/Kernel)
- [Arch news (announcements requiring manual intervention, e.g. the linux-firmware split)](https://archlinux.org/news/)
