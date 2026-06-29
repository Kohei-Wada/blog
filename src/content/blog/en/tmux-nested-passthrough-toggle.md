---
title: 'Keeping my auto-tmux muscle memory while also touching tmux over SSH — taming the nesting with prefix+T'
description: 'Once you get used to auto-starting tmux in your terminal, the moment you run tmux on an SSH host it nests and your keys never reach the inner session. The canonical F12 toggle works but is an awkward reach, so I settled on prefix+T to silence the outer session and pass keys straight through. Plus why I dropped the popular "native splits locally" answer because I also use Alacritty, hiding the outer status bar as the visual cue, and the ControlMaster + NixOS /bin/bash gotchas.'
pubDate: 'Jun 30 2026'
tags: ['tmux', 'terminal', 'ssh', 'dotfiles', 'shell-tricks']
---

I've gotten used to my terminal dropping me straight into tmux on open. With Ghostty it's one line.

```
command = tmux new-session -A -s 0
```

There's always one session, and it survives closing the window. Comfortable. But once you're used to that, the moment you also use tmux on an SSH host, the pain starts.

## Symptom: keys don't reach the inner session

When I want to settle in and work on a remote GPU box, of course I want tmux there too — I want it to survive a disconnect. So I run `ssh -t gpubox 'tmux new -A -s main'`, and now the **local (outer) tmux and the SSH-host (inner) tmux are nested**.

The problem is that both are listening for the prefix `C-b`. Press `C-b %` to split a pane in the inner session and the **outer one eats it first**, so it never reaches the inner. The inner tmux becomes nearly unusable.

## What do other people do?

Reading around, people clearly split into two camps.

**Camp 1: native terminal splits locally, tmux for remote only.** If you don't use tmux locally, there's no nesting to begin with. Ghostty and WezTerm native splits need no prefix and share the clipboard. "Local splits are UI sugar, tmux is infrastructure" is the framing.

**Camp 2: keep the local auto-tmux and tame the nesting.** Handle it with an F12 toggle or dual prefixes.

Camp 1 appealed to me at first. But I **also use Alacritty on another machine, not just Ghostty**. Alacritty by design has no splits or tabs (delegating multiplexing to tmux is its official stance). So Camp 1 means only the Alacritty machine has a different workflow, and my fingers get confused.

If I want the same muscle memory on every machine, the answer flips and becomes clear. **Use local tmux everywhere, and just tame the nesting.** Dotfiles get written once and shipped to every machine anyway.

## F12 is an awkward reach

Camp 2's canonical move is Samoshkin's F12 toggle. Press F12 and the outer tmux puts its prefix and key tables entirely "to sleep," so every key passes straight through to the inner session. Press again to return. The selling point is a prefix-free single key that round-trips.

I wrote it and tried it. It works. It works fine — but **F12 is far**. Reaching up to the function row for a key I toggle constantly is not kind to the fingers. I want it where my fingers already are.

The prefix is already under my fingers anyway (`C-b`). So I might as well move the toggle onto the prefix.

## Settling on prefix+T

The final form looks like this. `C-b T` silences the outer session, plain `T` returns.

```tmux
# C-b T silences the outer tmux so every key passes through to the inner (SSH) one
bind T \
  set prefix None \;\
  set key-table off \;\
  set status off \;\
  refresh-client -S
# While silenced the prefix is disabled, so the return key lives in the off table directly
bind -T off T \
  set -u prefix \;\
  set -u key-table \;\
  set -u status \;\
  refresh-client -S
```

One catch. **The "enter" and "return" can't be the same action.** After you silence the outer session, the prefix (`C-b`) is disabled, so the prefix+key entrance can't be pressed anymore. So the return is a bare `T` with no prefix, bound via `bind -T off`. While you're in the `off` key table, that's what gets caught.

The reason F12 could be a single round-trip key is that it's prefix-free, so it's still pressable while silenced. The moment you move onto the prefix, you have to split the entrance and the exit.

## Showing which side you're on

At first I showed a red ● on the left of the status bar while the outer session was off. But there's a more straightforward move: **just hide the outer status bar entirely** (`set status off`).

That way, while the outer is off its bar disappears and **only the inner tmux's bar is visible**. It also kills the double-bar problem, and "I'm driving the inner session right now" is obvious at a glance. Return and the outer bar comes back. The config above already does this.

If your theme is catppuccin, reference theme variables like `@thm_red` instead of hardcoding colors, and it follows along when you change the flavor. That matters if you go the banner route instead.

## Companion tricks: re-login and portability

Once the nesting is solved, two more things made it pleasant.

**Kill the re-login on every pane split.** The original complaint was that "splitting a pane in local tmux re-SSHes every time and it's slow." With SSH's ControlMaster reusing one connection, a new pane's ssh connects instantly.

```
Host gpubox
  HostName 192.168.1.50
  User myuser
  ControlMaster auto
  ControlPath ~/.ssh/cm-%r@%h:%p
  ControlPersist 10m
```

The first connection sets up the master; subsequent ones ride along with no auth and no handshake. On my machine the second connection came up in 0.03 s.

**Make the config portable.** My server runs NixOS, and I had `default-shell /bin/bash` in tmux.conf — which broke on the server. NixOS has no `/bin/bash` (it does have `/bin/sh`). Drop the hardcode for a PATH-resolved `bash` and it works on both Arch and NixOS.

```tmux
# Stop hardcoding /bin/bash. A PATH bash works on both
set-option -g default-command 'bash -i'
```

## Wrap-up

- Local auto-tmux × remote tmux nests. The outer eats the prefix and the inner never sees it.
- Pushing local splits onto native terminal panes is a popular answer, but if you also use Alacritty (which has no splits), matching every machine on tmux is easier on the fingers.
- `C-b T` silences the outer, plain `T` returns. F12 works too, but if you toggle often the prefix side is within reach. The trick is that the entrance and exit live in different key tables (prefix table vs off table).
- Hiding the outer status bar makes "I'm on the inner side" visible.
- Killing the re-login with ControlMaster and dropping the `/bin/bash` hardcode for portability gives you the same experience on every machine.

The tmux.conf from this post lives in my [dotfiles repository](https://github.com/Kohei-Wada/dotfiles) (the SSH config isn't there — it carries real hostnames).
