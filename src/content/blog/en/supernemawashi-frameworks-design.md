---
title: 'Integrating 6 psychology frameworks in supernemawashi — 1 framework = 1 file × parallel agents'
description: "supernemawashi's analyze skill runs 6 psychology frameworks (defense mechanisms / TKI / TA / motivators / biases / attachment) as 1 framework = 1 file × 1 parallel agent. Why I dropped the monolithic profile and split per framework, making the registry the single source of truth, all the way to situation-indexed rule generation."
pubDate: 'May 24 2026'
tags: ['claude-code', 'supernemawashi', 'psychology', 'personal-projects']
seeAlso: ['supernemawashi-intro']
---

## Introduction

[supernemawashi](https://github.com/Kohei-Wada/supernemawashi)'s `nemawashi-analyze` skill stopped holding the profile as a single monolithic file and moved to **1 framework = 1 file × 1 parallel agent**. Six psychology frameworks (defense mechanisms / Thomas-Kilmann / Transactional Analysis / Core Motivators / Cognitive Biases / Attachment Style) are each analyzed independently by an agent running in parallel. Here's why, and how I implemented it.

The first supernemawashi (v1.x) wrote the profile to a single markdown file (`profile.md`). The psychological analysis was one section inside it. That causes problems:

- "I want to add one new framework" means rewriting the structure inside the monolithic file
- Every re-run of analyze **wipes and overwrites all the other frameworks' analyses too**
- The independent signals (facts) per framework get mixed, and you lose track of which judgment came from which evidence
- Even if you want to parallelize, you get write contention on the one file

## 1 framework = 1 file × 1 agent

Decompose the profile per framework.

```text
PROFILE_DIR/<person-name>/
├── profile.md                          ← slim index (Core Pattern + summary table only)
├── facts.jsonl                          ← facts (collect's output)
└── frameworks/
    ├── defense-mechanisms.md            ← per-framework classification + evidence + DO/DON'T
    ├── thomas-kilmann-tki.md
    ├── transactional-analysis-ta.md
    ├── core-motivators.md
    ├── cognitive-biases.md
    └── attachment-style.md
```

Each framework file is **fully independent**. Updating one doesn't touch the other five.

### Make the framework registry the single source of truth

The frameworks' slug / display name / tier have **one table** as the source of truth:

| Slug                        | Display name        | Tier |
| --------------------------- | ------------------- | ---- |
| `defense-mechanisms`        | Defense Mechanisms  | 1    |
| `thomas-kilmann-tki`        | Conflict Mode (TKI) | 1    |
| `transactional-analysis-ta` | Ego States (TA)     | 1    |
| `core-motivators`           | Core Motivators     | 1    |
| `cognitive-biases`          | Cognitive Biases    | 1    |
| `attachment-style`          | Attachment Style    | 2    |

Tier 1 = analyzed by default; Tier 2 = analyzed only when signal density is sufficient (if thin, surfaced explicitly as a Data Gap). Steps to add a new framework:

1. Add a row to the registry table
2. Create `frameworks/<slug>.md` following the contract
3. Update the situation→framework priority mapping in `nemawashi-reply` (if needed)
4. Confirm the registry matches the actual files with `scripts/check-frameworks.sh`

Because a script detects drift between the registry and the real files, you can't break things by adding only one side.

### Parallel agent dispatch

`nemawashi-analyze`'s flow:

```text
[1] Read the shared inputs (profile.md + facts.jsonl)
        ↓
[2] Dispatch one agent per framework in the registry, in parallel
    ┌─ agent: defense-mechanisms     ──┐
    ├─ agent: thomas-kilmann-tki     ──┤
    ├─ agent: transactional-analysis ──┤  run in parallel
    ├─ agent: core-motivators        ──┤
    ├─ agent: cognitive-biases       ──┤
    └─ agent: attachment-style       ──┘
        ↓ wait for all agents to finish
[3] Synthesis pass (synchronous)
    - Update profile.md's Framework Summary table
    - Re-derive the Core Pattern
```

Each agent only **reads `facts.jsonl` and writes its own framework's `frameworks/<slug>.md`**. It shares no state with the other agents. The synthesis pass only aggregates results — it doesn't re-analyze.

## What goes in a framework file

Each `frameworks/<slug>.md` follows the same contract:

```text
---
framework: Defense Mechanisms
tier: 1
output_label: Defense Mechanisms
---

# Defense Mechanisms

## Purpose
(what this framework reveals)

## Classification Guidance
(how to extract signals from facts)

## Reference Table
(mechanism / definition / observable signals / DO / DON'T)

## Rule Generation
(classification → situation-indexed rules)

## Signal Tags
(the tag format embedded in the facts jsonl)
```

As an example, two rows from the defense-mechanisms file's reference table:

| Mechanism          | Observable Signals                                 | DO                                               | DON'T                                     |
| ------------------ | -------------------------------------------------- | ------------------------------------------------ | ----------------------------------------- |
| Rationalization    | long explanations on failure / "because..." chains | validate the reason, then redirect to the future | argue directly against the justification  |
| Passive Aggression | "I'll do it" + no movement / strategic delay       | name the behavior neutrally                      | call it "you're being passive-aggressive" |

The agent cross-references facts against this table to tag signals, decides the dominant mechanism, and generates situation-indexed rules.

### Situation categories

DO/DON'T rules are indexed by situation category. `nemawashi-reply` looks at the category and situation and loads only the framework files it needs:

| Category              | Situation                        |
| --------------------- | -------------------------------- |
| When Requesting       | you're asking them for something |
| During Conflict       | disagreement / tension           |
| When Reporting        | delivering good / bad news       |
| Routine Collaboration | day-to-day interaction           |

At reply time it doesn't load every framework — it narrows to the 2-3 relevant to the situation. That also cuts the context-window cost.

## Gotchas

- **Drift between the registry and the real files**: at first I synced by hand, and it always broke. I moved `check-frameworks.sh` into pre-commit for automatic detection.
- **Parallel-agent races**: if each agent writes the same `frameworks/<slug>.md`, it obviously breaks. Strictly mapping 1 agent = 1 file avoids it.
- **The temptation for agents to share state**: there are moments you want to "look at the other frameworks' results and adjust." Doing that regresses to the monolithic design, so it's banned — adjustment happens synchronously in the synthesis pass.
- **The Tier 2 threshold**: attachment-style often has thin signal, so I made it Tier 2. The framework itself needs criteria to surface "I don't know" explicitly as a Data Gap.

## Results

- Adding a new framework is 3 steps (table + file + reply mapping), touching none of the existing frameworks
- Re-running analyze doesn't break the other frameworks
- Parallel dispatch shrank wallclock to roughly one framework's worth with all 6 agents running at once
- Each framework file is independently readable, so you can view just the framework you want (`nemawashi-show <person> --framework=defense-mechanisms`, etc.)

## Wrap-up

- Drop the monolithic profile.md and decompose into 1 framework = 1 file × 1 agent
- Make the framework registry the single source of truth, and detect drift with a check script
- Parallel dispatch shortens wallclock; keep synthesis synchronous
- Situation-indexed framework loading keeps the context cost down at reply time

## References

- [supernemawashi (GitHub)](https://github.com/Kohei-Wada/supernemawashi)
- [Thomas-Kilmann Conflict Mode Instrument](https://kilmanndiagnostics.com/overview-thomas-kilmann-conflict-mode-instrument-tki/)
- [Transactional Analysis (Eric Berne)](https://en.wikipedia.org/wiki/Transactional_analysis)
- [Self-Determination Theory (Deci & Ryan)](https://selfdeterminationtheory.org/)
- [Attachment Theory (Bowlby & Ainsworth)](https://en.wikipedia.org/wiki/Attachment_theory)
