---
title: 'Parallel Development with Claude Code Without git worktree (container-use)'
description: 'How to run parallel development with Claude Code using Dagger''s MCP tool "container-use" without cluttering your directory structure'
pubDate: 'Jan 12 2026'
tags: ['Claude Code', 'MCP', 'container-use', 'Dagger', 'Git']
---

You want to run multiple tasks in parallel with Claude Code, but you'd rather not have git worktree spawn a new directory every time. This post introduces "container-use," a tool that solves exactly that.

## Who this article is for

- You use Claude Code and are interested in parallel development
- You know git worktree, but find its directory management cumbersome
- You keep your repositories tidy with ghq or similar tools

## What is container-use?

[container-use](https://github.com/dagger/container-use) is an MCP tool from Dagger. It creates isolated development environments inside containers on a per-branch basis, letting you do parallel development without polluting your local directory structure.

### Comparison with worktree

| Aspect                 | git worktree               | container-use                  |
| ---------------------- | -------------------------- | ------------------------------ |
| Directories            | A new directory is created | Isolated inside a container    |
| Environment isolation  | Files only                 | The whole environment          |
| Work log               | Only git history           | Operation history via `cu log` |
| Compatibility with ghq | Tends to get messy         | No impact                      |

## Setup

### 1. Installation

```bash
# Arch Linuxの場合
sudo pacman -S dagger
yay -S container-use
```

For other OSes, see the [official repository](https://github.com/dagger/container-use).

### 2. Add the MCP to Claude Code

```bash
# グローバルにMCPを追加
claude mcp add container-use -s user -- cu stdio

# 接続確認
claude mcp list
```

If you see the following, you're good to go.

```
container-use: cu stdio - ✓ Connected
```

### 3. Add the rules to CLAUDE.md (important)

The official docs mark this as "optional," but without it Claude won't actually use container-use.

```bash
curl https://raw.githubusercontent.com/dagger/container-use/main/rules/agent.md >> CLAUDE.md
```

### 4. Allow the tools (optional)

If you'd rather not get a confirmation prompt every time, launch with the following options.

```bash
claude --allowedTools mcp__container-use__environment_checkpoint,mcp__container-use__environment_create,mcp__container-use__environment_add_service,mcp__container-use__environment_file_delete,mcp__container-use__environment_file_list,mcp__container-use__environment_file_read,mcp__container-use__environment_file_write,mcp__container-use__environment_open,mcp__container-use__environment_run_cmd,mcp__container-use__environment_update
```

## Basic usage

### cu command reference

| Command                | Description                         |
| ---------------------- | ----------------------------------- |
| `cu list`              | List environments                   |
| `cu log <env_id>`      | View the work log                   |
| `cu checkout <env_id>` | Apply changes to a local branch     |
| `cu open <env_id>`     | Open an existing environment        |
| `cu config`            | Change settings like the base image |

### Pulling work back in

Once development is done, pull the changes from the container into your local repo with:

```bash
cu checkout <env_id>
```

## Parallel development workflow

Here's a concrete example.

### Example: running two tasks at once

Open two terminals and start a separate Claude Code session in each.

#### Terminal 1 (bug fix)

```
$ claude
> Issue #42のバグを修正して
```

#### Terminal 2 (new feature)

```
$ claude
> Issue #58の機能を実装して
```

Each Claude works inside its own container-use environment, so they don't step on each other.

### Flow after work is done

```
1. Claudeが作業完了を報告
   ↓
2. cu list で環境IDを確認
   ↓
3. cu checkout <env_id> で変更を取り込み
   ↓
4. 通常通りレビュー → マージ
```

## Things to watch out for

### Review becomes the bottleneck

The more efficient parallel development gets, the faster review requests pile up.

#### Countermeasures

- Keep issues small enough to be easy to review
- Ask Claude Code to self-review and generate a diff summary
- Set a rule to review in order of priority

### Don't forget the CLAUDE.md addition

As noted above, if you don't append the contents of `agent.md` to CLAUDE.md, Claude won't recognize container-use. Keep in mind that this has to be set up per project.

## Summary

With container-use, you can do parallel development in Claude Code without scattering directories the way git worktree does.

- Doesn't pollute your directory structure
- Environments are fully isolated
- Work logs are kept, which is handy for verification

Particularly recommended if you keep your repositories nicely organized with ghq.

## References

- [container-use - GitHub](https://github.com/dagger/container-use)
- [Dagger official site](https://dagger.io/)
- [Claude Code official documentation](https://docs.anthropic.com/en/docs/claude-code)
