---
title: "yadm + Neovim Git plugins didn't work, so I built yadm-git.nvim (and fixed the Bazzite symlink three times)"
description: 'Dotfiles managed by yadm live in $HOME with no .git, so gitsigns / fugitive / lazygit refuse to recognize them. I built a tiny Neovim plugin whose only job is to make them "just work" — the design decisions, plus the saga of fixing home-directory resolution three times for the symlink on an immutable distro like Bazzite.'
pubDate: 'May 23 2026'
tags: ['neovim', 'yadm', 'dotfiles', 'plugin', 'lua', 'experiment']
---

## Introduction

Dotfiles managed by [yadm](https://yadm.io) live directly under `$HOME`, and there is no `$HOME/.git`. yadm's own git directory sits at `~/.local/share/yadm/repo.git`. So Git-aware Neovim plugins like `gitsigns.nvim` / `fugitive` / `lazygit.nvim` decide "this isn't under git control" even while you're editing a file under `$HOME`.

I built a tiny plugin whose only job is to make them "just work": [yadm-git.nvim](https://github.com/Kohei-Wada/yadm-git.nvim). This post covers three things:

- The minimal design for letting yadm-managed dotfiles and nvim's Git plugins coexist
- Why detecting yadm with a filesystem check beats a shell call (perf + testability)
- How `vim.env.HOME` / `vim.uv.os_homedir()` / `vim.fn.expand("~")` diverge on an immutable distro, and which one I ended up choosing

The last point — the Bazzite symlink — made me fix home-directory resolution three times over.

## What was the problem

yadm is "a wrapper for managing dotfiles with git": it uses `$HOME` as the work tree and `~/.local/share/yadm/repo.git` as the git directory. From the CLI, the `yadm` command calls `git` while passing `GIT_DIR` and `GIT_WORK_TREE` behind the scenes.

But Neovim's Git plugins like `gitsigns.nvim` don't know about any of that. Open `$HOME/.config/nvim/init.lua` and, since there's no `.git` anywhere up that directory tree, it's judged "outside git control" — no diff, no blame.

Typing `GIT_DIR=... GIT_WORK_TREE=... nvim` in the shell every time is tedious, and I want it to switch as I `cd` around. I just wanted a plugin to automate that.

## How I solved it

The design decisions are simple.

| Decision                                          | Why                                                                            |
| ------------------------------------------------- | ------------------------------------------------------------------------------ |
| No commands, no user interaction                  | It should just work with zero config. Whether you're under yadm is detectable. |
| Filesystem check only (no shell call)             | Good perf, stays in Lua, tests need a single mock                              |
| Only set the env vars `GIT_DIR` / `GIT_WORK_TREE` | Minimal intervention — touches nothing in the existing Git plugins             |
| Driven by autocmds (VimEnter / DirChanged)        | Set / clear as you `cd` in and out of yadm-managed paths                       |

The detection logic is three steps:

1. If there's a `.git` (directory or file) anywhere up the current directory tree, treat it as a normal git repo and skip
2. Check whether the yadm repo exists at `~/.local/share/yadm/repo.git` (v3+) or `~/.yadm/repo.git` (legacy)
3. Check whether the current directory is under `$HOME`

If all three are true, treat it as yadm-managed and set `vim.env.GIT_DIR` and `vim.env.GIT_WORK_TREE`. On `DirChanged` out, clear them.

## How the implementation evolved

The main PRs in chronological order.

| When       | PR        | What                                                                                                                                        |
| ---------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 2025-06-02 | initial   | First cut. Detected yadm with a shell call                                                                                                  |
| 2025-06    | #6        | Dropped the shell call for a pure-Lua filesystem check. Better perf + testability                                                           |
| 2025-06    | #7        | Kept plugin state internally and exposed `is_active()` / `get_yadm_repo_path()` / `get_state()` as a public API                             |
| 2025-06    | #9        | Added a DirChanged autocmd. Clears the env vars when leaving the yadm dir. Bundled a refactor splitting state / event into separate modules |
| 2025-06    | #10       | Added a lualine status component. Shows a house icon and "dotfiles" while yadm is active                                                    |
| 2025-06    | #11       | Moved activation logic from init to event handling. Unified on autocmds so teardown is event-driven too                                     |
| 2025-07    | #14       | Fixed a detection miss when `.git` is a file (a worktree)                                                                                   |
| 2026-04    | #19 / #20 | Discovered that `$HOME` becomes a symlink on Bazzite-style immutable distros. Switched to going through `vim.uv.os_homedir()`               |
| 2026-05    | #22       | A further fix on top of #20. Unified on `vim.fn.expand("~")`                                                                                |

The current file layout.

```text
lua/yadm-git/
├── init.lua    -- entry point (exports setup())
├── yadm.lua    -- core: detection and env-var set/clear
├── state.lua   -- plugin activation state
├── event.lua   -- VimEnter / DirChanged autocmds
├── logger.lua  -- debug logging
└── options.lua -- config
```

## Where it bit me

### 1. Env vars left behind after you cd out (#9)

The first implementation only fired on `VimEnter`. So it worked if you were under yadm when nvim started, but after `:cd ~/work/project` (an ordinary git repo, not under yadm), `GIT_DIR` stayed pointed at `~/.local/share/yadm/repo.git` and gitsigns kept showing a broken view of yadm.

The fix: re-evaluate `is_yadm_managed()` in a `DirChanged` autocmd and, if false, set the env vars back to `nil` via `clear_yadm_env()`. At the same time I split state / event into separate modules so init.lua only exports `setup()`.

### 2. A worktree exists as a `.git` file (#14)

I was only checking `vim.fn.finddir(".git", ...)`, so a worktree created with `git worktree add` (where `.git` is a text file rather than a directory) was judged "not git," and the yadm environment was set by mistake. Fixed by checking both `finddir` and `findfile`.

### 3. `$HOME` is a symlink on Bazzite (#19 → #20 → #22)

This was the nastiest one. On immutable Fedora derivatives like Bazzite, `/home/user` is a symlink to `/var/home/user`.

- `$HOME` is `/var/home/user` (physical path)
- `/etc/passwd` says `/home/user` (symlink path)
- Neovim's `vim.fn.fnamemodify(":p")` and `vim.fn.getcwd()` resolve the symlink → `/home/user/...`
- `vim.uv.os_homedir()` reads `$HOME` via libuv, so it's `/var/home/user`

So you get "the current directory is under `/home/user/...`, but `$HOME` is `/var/home/user`," which makes `vim.startswith(cwd, home .. "/")` false and the path isn't recognized as yadm-managed.

The three fixes in sequence.

| Attempt | Approach                                                           | Result                                                                                               |
| ------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| #19     | Was using `vim.env.HOME` → the symlink-resolution problem surfaced | Reported                                                                                             |
| #20     | Switched to `vim.uv.os_homedir()`                                  | libuv doesn't resolve the symlink either, so same problem                                            |
| #22     | Unified on `vim.fn.expand("~")`                                    | Goes through Neovim, so it rides the same symlink-resolution path as `fnamemodify` / `getcwd`. Fixed |

The lesson: **which "get the home directory" function you use changes the behavior.** Whether it resolves symlinks is the key, and it has to match the side you compare against (the function that gets the cwd). In a Neovim plugin, `vim.fn.expand("~")` was the safest.

The relevant source (with the comment).

```lua
-- Resolve the user's home directory.
-- Prefer `vim.fn.expand("~")` over `vim.uv.os_homedir()` or $HOME because on immutable distros
-- (Bazzite, etc.) the folder /home/ is a symlink to /var/home/ which is resolved by Neovim
-- in the functions `vim.fn.fnamemodify()` and `vim.fn.getcwd()` but not when using $HOME
-- or libuv's `os_homedir()`.
-- See issue #19 for more information.
local function get_home()
  return vim.fn.expand "~"
end
```

## Results

- gitsigns / fugitive / lazygit just work while editing files under yadm
- It switches automatically as you cd in and out
- lualine can now show "yadm mode is on," which cut down on mistakes
- The core is around 110 lines. Even with tests it's 234 lines + tests. It stays small.

## Wrap-up

- The yadm × nvim Git-plugin coexistence problem is solved just by "setting and clearing `GIT_DIR` / `GIT_WORK_TREE` from autocmds"
- A filesystem check instead of a shell call buys you both perf and testability
- Home-directory resolution on an immutable distro is full of traps; I fixed it three times. In a Neovim plugin, `vim.fn.expand("~")` is the current right answer

## References

Source and PRs.

- [Kohei-Wada/yadm-git.nvim (GitHub)](https://github.com/Kohei-Wada/yadm-git.nvim)
- [PR #6 Optimize external commands](https://github.com/Kohei-Wada/yadm-git.nvim/pull/6) — shell call → filesystem
- [PR #7 plugin state management and tests](https://github.com/Kohei-Wada/yadm-git.nvim/pull/7) — public API
- [PR #9 env vars not cleared on cd out](https://github.com/Kohei-Wada/yadm-git.nvim/pull/9) — DirChanged handling + module split
- [PR #10 lualine component](https://github.com/Kohei-Wada/yadm-git.nvim/pull/10)
- [PR #11 event-driven refactor](https://github.com/Kohei-Wada/yadm-git.nvim/pull/11)
- [PR #14 worktree detection](https://github.com/Kohei-Wada/yadm-git.nvim/pull/14)
- [PR #19 / #20 Bazzite symlink (os_homedir)](https://github.com/Kohei-Wada/yadm-git.nvim/pull/20)
- [PR #22 expand("~") final fix](https://github.com/Kohei-Wada/yadm-git.nvim/pull/22)

Related tools.

- [yadm](https://yadm.io)
- [gitsigns.nvim](https://github.com/lewis6991/gitsigns.nvim)
- [vim-fugitive](https://github.com/tpope/vim-fugitive)
- [lazygit.nvim](https://github.com/kdheepak/lazygit.nvim)
- [Bazzite (immutable Fedora)](https://bazzite.gg)
