---
title: 'Why Waybar Survives When You Quit Hyprland, and How exec start-hyprland Fixes It'
description: 'How Linux process management actually works, and the correct way to start Hyprland'
pubDate: 'Jan 07 2026'
tags: ['Linux', 'Hyprland', 'Arch Linux', 'wayland']
---

I've been playing with Hyprland recently and got tripped up by something silly, so I figured I'd share.

## I'd been launching Hyprland directly the whole time

From the Arch Linux tty, I'd always been starting Hyprland like this:

```bash
Hyprland
```

I think I just copied this from some wiki or article ages ago and never thought about it again.

## One day a "use start-hyprland" warning showed up

At some point, launching Hyprland started spitting out a warning saying I should launch it via `start-hyprland`.
Looking into it, this turned out to be a breaking change in 0.53. `start-hyprland` became the official launcher, and things like watchdog behavior are now managed there.

## Around that time, I noticed Waybar wasn't getting killed

I was bouncing in and out of Hyprland repeatedly trying to figure out what `start-hyprland` actually was, and I noticed that even after quitting Hyprland, Waybar and fcitx5 were still alive.
My `hyprland.conf` had this in `exec-once`:

```bash
exec-once = waybar & hyprpaper & fcitx5 & swaync & hypridle
```

Intuitively you'd expect: Hyprland exits → its child processes (Waybar and friends) exit too. But for some reason Waybar stuck around.

## exec start-hyprland makes everything exit together

I tried this from the tty:

```bash
exec start-hyprland
```

And the behavior changed. Quitting Hyprland now logs me out of the tty too, and Waybar and the rest all get killed together. Very satisfying.

## Why is it different? "Parent dying doesn't kill the child" is just how Linux works

This is the heart of it.

I had assumed "when a parent process exits, its child processes are killed automatically." Turns out that's wrong.

**On Linux, child processes are not automatically killed when their parent exits.** The orphaned child gets reparented to PID 1 (systemd) and keeps running.

```text
# Before the parent dies
Hyprland (PID 100)
 └── waybar (PID 101, PPID=100)

# After the parent dies
waybar (PID 101, PPID=1)  ← systemd adopted it
```

So Waybar surviving after Hyprland dies is actually normal behavior.

## Where did the "parent dies, children die" assumption come from?

I think it came from experiences like these:

- **Closing a terminal kills its children** — that's not because the parent exited; it's because the terminal sends SIGHUP.
- **Ctrl+C stops everything** — that's SIGINT going to the foreground process group.
- **A shell script ending stops its children** — sometimes the shell explicitly kills its children.

None of these are actually about "the parent process exiting" — they're about signals or shell cleanup logic.

## What exec start-hyprland actually does

When you log into a tty, a login shell (e.g. bash) is what runs first. Normally it looks like:

```text
login → bash → Hyprland
```

But with `exec start-hyprland`:

```text
login → exec start-hyprland → Hyprland
```

`exec` completely replaces the shell itself with another process. Which means:

- The login shell _is_ Hyprland now
- Hyprland becomes the "face" of the session
- When Hyprland exits, that counts as the session ending
- systemd kills everything else in that session

That's why Waybar dies too, and the tty gets logged out.

## You can see it clearly with loginctl

If you check `loginctl session-status`, everything is in the same session, like this:

```text
session-1.scope
 ├─ start-hyprland
 ├─ Hyprland
 ├─ waybar
 └─ ...
```

Session closes = everything exits together.

## Why start-hyprland is recommended

Starting with Hyprland 0.53, the launcher handles watchdog FD management, environment variable setup, and other wrapper duties. Going forward, `exec start-hyprland` is the official way to start it.

## Summary

- Waybar survives a direct `Hyprland` launch because, on Linux, parent exiting ≠ children automatically killed
- Orphaned processes get adopted by systemd (PID 1) and keep running
- `exec start-hyprland` makes the whole session terminate, so everything dies cleanly together
- My "parent dies, children die" intuition was actually conflating signals and shell cleanup with parent exit

## References

- [Hyprland Update 53](https://hypr.land/news/update53/)
