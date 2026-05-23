---
title: 'I built supernemawashi — a Claude Code plugin that manages psychological profiles for talking to colleagues'
description: 'A Claude Code plugin that kills the fatigue of figuring out "how do I phrase this for that person" every time, by managing profiles as data. It gathers facts from Slack / Gmail / Calendar, classifies them with psychology frameworks, and returns situation-specific DO / DON''T rules.'
pubDate: 'May 23 2026'
tags: ['Claude Code', 'plugin', 'MCP', 'communication', 'personal-projects']
---

## Introduction

In conversations with colleagues and stakeholders, working out "will this phrasing land with this person, or step on a landmine?" from scratch every time is quietly exhausting. There's a limit to how many people I can keep in my head, and I forget anyway.

So I built [supernemawashi](https://github.com/Kohei-Wada/supernemawashi), a Claude Code plugin that solves this by **managing profiles as data**.

The workflow: collect facts from Slack / Gmail / Calendar / GitHub, classify them with psychology frameworks, generate situation-specific DO / DON'T rules, and call them up when I'm writing a reply. Everything runs locally — nothing is sent anywhere.

## Why I built it

Saying "most of an engineer's job is talking to people" is blunt, but it's true. I spend more time asking, reporting, arguing, and persuading than I do writing code. And for all of it, I'm working out the optimal phrasing for each person's type, every single time. That wears you down.

Concretely, situations like these:

- I phrased something "too bluntly" for someone and stepped on a landmine. I tell myself I'll be careful next time, then forget.
- One person is convinced by numbers; another responds better to a story. Do it backwards and you get ignored.
- One person acts when you push in a meeting; another shuts down when you push in a meeting.

"Remembering it from experience" breaks down as the number of people grows. With someone I don't have committed to memory, I start from zero every time — and even with people I think I remember, I forget things.

## How it solves the problem

The idea itself is simple:

1. Record **facts** about the person (who said what, when) as data
2. Classify the facts with **psychology frameworks** (defense mechanisms / conflict modes / ego states / motivators / biases / attachment style)
3. From the classification, generate **situation-specific DO / DON'T rules**
4. When writing a reply, pull up that person's profile plus the rules for the relevant situation

In other words, **pre-compute "how do I talk to this person" and keep it in a file** — so I don't re-derive it on every reply.

Profiles live in `~/.local/share/supernemawashi/profiles/<person-name>/`, entirely local. Even when it reads Slack / Gmail over MCP, the collected data never leaves the machine.

## Skills

The operational skills are all verb-first under a `nemawashi-` prefix:

| Skill                | What it does                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------- |
| `nemawashi-collect`  | Collect facts from MCP sources (Slack / Gmail / Calendar / GitHub) into a profile           |
| `nemawashi-analyze`  | Classify the gathered facts with psychology frameworks, generate situation DO / DON'T rules |
| `nemawashi-show`     | View profiles (list / drill into one / aggregated situation rules)                          |
| `nemawashi-discover` | Find people you talk to but haven't profiled yet, from MCP sources                          |
| `nemawashi-check`    | Dashboard of stale profiles (analyses gone old)                                             |
| `nemawashi-note`     | Manually add a one-line fact MCP can't see (1on1, phone, hallway chat)                      |
| `nemawashi-reply`    | Load only the frameworks relevant to the situation, generate 2–3 reply drafts               |
| `nemawashi-migrate`  | Convert old-format profiles to the new format                                               |
| `nemawashi-issue`    | Shape an improvement idea into the house style and file it as a GitHub issue                |

A basic workflow looks like this:

```text
[1] /nemawashi-collect "John"
        ↓ collect facts from MCP sources
[2] /nemawashi-analyze "John"
        ↓ classify per framework, generate DO/DON'T
[3] /nemawashi-reply "How should I reply to John about the deadline?"
        ↓ load John's profile + only the relevant frameworks
[4] 2–3 drafts come back
```

Install is via the marketplace:

```text
/plugin marketplace add Kohei-Wada/supernemawashi
/plugin install supernemawashi@supernemawashi
```

Restart the Claude Code session and the `using-supernemawashi` entry-point skill is injected via a SessionStart hook — from there it runs in natural language.

## Gotchas

- **The discomfort of "turning people into data"**: profiles are for _people you talk to_, not surveillance targets. This isn't built for profiling random coworkers behind their backs (and the MCP sources only run through your own account).
- **MCP rate limits**: hammering Slack or Gmail hits limits. The `--all` bulk operations are throttled to batches of 5.
- **Stale profiles**: a profile not analyzed for a month is less trustworthy. `nemawashi-check` surfaces staleness, and `nemawashi-update --all` re-analyzes everything at once.
- **"Collect everyone" is heavy**: collect is MCP-bound and slow, while analyze is local-file-only and fast — so the two are split into separate skills, letting you re-run just the analysis.

## Results

- For someone I have a profile on, the time spent figuring out "how do I phrase this" dropped from ~5 minutes to ~30 seconds.
- For "someone I haven't talked to in a while" or "someone I rarely talk to," facts auto-collect from past Slack / Gmail, so the first-contact cost went down.
- I built a profile of myself and ran analyze on it — my own coping patterns became visible, which turned out to be a bit therapeutic (an unexpected side effect).

## Wrap-up

- The cost of figuring out "how to talk to this person" from scratch every time can be cut down by turning it into data
- supernemawashi wires fact collection / psychological analysis / situation-rule generation / reply drafting into a single plugin
- Profile data never leaves your machine; MCP sources are read only through your own account
- It installs as a Claude Code plugin

The repo is here: [supernemawashi (GitHub)](https://github.com/Kohei-Wada/supernemawashi)
