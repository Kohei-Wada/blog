---
title: 'Reproducing Copy Fail (CVE-2026-31431) in a disposable VM to feel what 732 bytes to root is like'
description: 'Rather than calling myself vulnerable or safe based on a version number, I stood up a disposable VM with a pre-patch kernel and actually ran the official Copy Fail PoC. A 732-byte Python one-shot took me from non-root to uid=0 — no race, 100% deterministic. Plus the realization that the circulating "check" is not a patch test, and verifying the mitigation.'
pubDate: 'May 25 2026'
tags: ['security', 'linux', 'kernel', 'cve', 'privilege-escalation', 'qemu']
seeAlso: ['arch-safe-kernel-upgrade-journey']
---

## Introduction

A kernel local privilege escalation (LPE) vulnerability called "Copy Fail" (CVE-2026-31431) made the rounds. Social media and articles were full of "affected range is ≤6.19.12" and "run this command, and if it prints X you're vulnerable" — but deciding "we're vulnerable / safe" off a number and a one-liner felt wrong.

So instead of touching a production machine, I stood up a **disposable VM carrying a pre-patch kernel**, ran the official PoC for real, and felt with my own hands how easily root gets taken. Bottom line: **a 732-byte Python one-shot took me from a non-root user to `uid=0(root)`, no race, 100% deterministic.** Along the way I verified, on the spot, that the widely circulated "check" isn't actually a patch test, and that the mitigation works.

## Don't relax over a number

When a flashy CVE like Copy Fail drops, the first things to circulate are an "affected versions list" and a one-liner that says "run this, and if X shows up you're vulnerable." Handy, but there are two traps.

1. **The affected-range number is about "pre-fix" and doesn't reflect distro backports.** On Arch you have to look up your installed package's fixed version in the tracker; the upstream number alone can't tell you.
2. **The circulating "check" isn't necessarily a patch test.** The one I saw checked "is `algif_aead` loaded?" But that only **looks at whether the module used in the attack is present — it says nothing about whether the kernel is patched.** Even if it's not loaded, the attack path can come back if you can `modprobe` it; even if it is loaded, a patched kernel won't escalate. So this check is a different thing from whether the vulnerability exists.

Once you notice this, you want to know "what's really true for my environment" from **behavior**, not command output. But running a root-escalation PoC on a production machine is a bad idea. That's where a disposable VM comes in.

## Isolate the pre-patch kernel in a VM and run the real thing

The plan is simple.

- **Don't touch the production machine (already patched).**
- Stand up a disposable VM carrying the **pre-patch** kernel.
- Bring in the **official PoC** (primary source, not a homemade snippet) and run it there.
- When done, throw the whole VM away.

The key point is "a VM, not a container." A kernel LPE like Copy Fail, on success, **also punches through container isolation** (the kernel is shared, so of course). If you want isolation, it has to be a VM that separates the kernel itself, or it's meaningless.

## Stand up a disposable VM and apply the PoC

I prepared a cloud-init `user-data` that seeds an SSH key into a cloud image, and booted it directly with KVM. `hostfwd` forwards host port 2222 to guest port 22, so I SSH to `localhost:2222`.

```bash
# Boot a disposable VM carrying a pre-patch kernel (user-mode, SLIRP networking)
qemu-system-x86_64 -enable-kvm -m 2048 -smp 2 \
  -drive file=sandbox.qcow2,format=qcow2,if=virtio \
  -drive file=seed.iso,format=raw,if=virtio \
  -netdev user,id=net0,hostfwd=tcp::2222-:22 \
  -device virtio-net-pci,netdev=net0 -nographic
```

Since it's disposable, turning off SSH host key verification makes it easier to handle (a setting you'd never use in production).

```bash
SSHOPT="-p 2222 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"
ssh $SSHOPT ubuntu@localhost
```

Once logged into the guest, first confirm with `uname -r` that it's the pre-patch kernel, then **obtain the official PoC from the primary source** and run it. Using a PoC of clear provenance rather than copy-paste from around the web matters for being able to accurately describe what was actually reproduced.

## Why "so easy"?

What unnerved me most when I ran it was its **plainness**.

- The PoC body is a single **732-byte Python** one-shot.
- The trick is **AF_ALG (the kernel crypto API) + splice**, rewriting the **page cache of `/usr/bin/su` 4 bytes at a time**.
- Run as the non-root `ubuntu` user, and **instantly `uid=0(root)`**. It escalates **with no race, 100% deterministically.**

When you hear "LPE" you picture "a timing-sensitive race condition you retry a few times and rarely hit." This was different. If the conditions are met, it always goes through. Once you understand in your body that this happens "on my own machine" "if it's pre-patch," it clicks just how bad a trade it is to pin the kernel and stop updating.

Another lesson: **don't aim your fear in the wrong direction.** "A random `make install` is dangerous" predates LPE, and `sudo make install` doesn't even need an LPE — you're root from the start. What an LPE adds is the "damage spreads to the whole machine even from a non-root run" part; the premise that running untrusted code already puts your keys, tokens, and data at risk (root or not) doesn't change.

## Confirming the mitigation actually works

After confirming escalation goes through, I tried the mitigation in the same VM: shutting down the attack path `algif_aead` with `modprobe`.

```bash
# Kill loading of the module used in the attack (works independently of the patch)
echo 'install algif_aead /bin/false' | sudo tee /etc/modprobe.d/copyfail.conf
```

With this in place, re-running the PoC no longer escalated. **Applying the patch is the real fix,** but if circumstances keep you from bumping the kernel right away, this mitigation is a fallback that works independently.

When verification is done, check that no VM process is left and clean up. Since it's disposable, you can throw away the disk image and all.

```bash
pgrep -af qemu-system   # confirm no leftovers before cleanup
```

## Wrap-up

- Don't swallow the affected-range number or a "run this" check whole. The check that was going around **wasn't a patch test — it just looks at whether the attack module is loaded.**
- If you're worried, don't touch production; run the real PoC in a **disposable VM with a pre-patch kernel** and confirm by behavior. Because it's a threat that punches through containers, isolation must be a **VM, not a container.**
- Copy Fail is **732 bytes, non-root → root**, deterministic with no race. I now understand in my body that an LPE is not a "happens if you're unlucky" thing.
- The real fix is the patch. If you can't bump right away, blocking `algif_aead` is a mitigation that works independently (verified effective in the VM).

## References

- [Copy Fail official site (primary source for CVE-2026-31431)](https://copy.fail/)
- [Arch Linux Security Tracker (look up your package's fixed version, not the upstream number)](https://security.archlinux.org/)
