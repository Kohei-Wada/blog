---
title: 'Funneling Slack requests into taskdog and letting /loop run them (a taskloop work-in-progress)'
description: 'My "assigned to me" work arrives scattered across Slack, email, and hallway conversations. I have been funneling it all into a single hub — taskdog — and letting Claude Code /loop cycle through intake, triage, and self-driving dispatch. It has reached ~5 hours of unattended running, but I also hit empty cycling, the note-and-bail failure, and candidate pile-up. A progress note from the middle of the experiment.'
pubDate: '2026-07-16T15:00+09:00'
tags: ['personal-projects', 'taskdog', 'task-management', 'claude-code', 'AI']
seeAlso: ['knowledge-vs-task-direction-of-fit']
---

## The problem

"Can you handle this?" reaches me scattered everywhere — Slack mentions, DMs, email, alerts, hallway conversations. I drop things, and even when I catch them I have to re-load the context every time. What has bugged me for a long time is that "what I should be doing right now" is nowhere in a single, machine-readable place.

Lately I have been running this through my own terminal task manager, [taskdog](https://github.com/Kohei-Wada/taskdog), as the single hub, with Claude Code's `/loop` cycling over it. **None of this is settled yet**, and as you'll see below I stepped on several rakes. But the direction feels genuinely good, so here is a note from the middle of the experiment.

## taskloop — funnel external events into one place and cycle

In one sentence: **funnel external event sources (Slack and friends) into a single hub called taskdog, and use `/loop` to run "intake → triage → executability check → serial dispatch."** The only thing I keep in human hands is the **decision gate**; picking things up and starting them should drive itself. I'm tentatively calling this taskloop.

taskdog started life as a keyboard-only terminal task manager with schedule optimization and a dependency graph. The trick here is using it not as mere task management but as an **event bus for agent orchestration**.

On the Claude Code side, instead of one big clever skill, I split the work into thin, convention-shaped skills:

- **Intake**: cycle through Slack messages addressed to me and turn _only the requests I actually need to act on_ into taskdog tasks. Acknowledgements, FYIs, and "got it" replies get absorbed with a 👍 reaction and never become tasks.
- **Triage**: judge each task on "is this safe to let an agent self-drive?" as a three-way call (`dispatch` / `human` / `unclear`). Only the exclusions get a tag; every task gets a one-line reason in its note.
- **Self-drive**: hand _exactly one_ `dispatch`-eligible task to an agent, and have it complete it the disciplined way — start → append progress log → complete once the completion condition is met.

Because each piece is thin, the behavior is easy to read when you run it under `/loop`.

## The design crux: no watermark — taskdog's state is the only truth

When you write a cycling loop, you're tempted to keep a separate cursor (a watermark) of "how far did I process?" I decided **deliberately not to keep one**.

Each cycle dedupes purely on "is this request already in taskdog?" State lives in exactly one place — taskdog — and the loop stays a thin cursor over it. For diff detection I reconcile Slack permalinks against tasks and add _only the confirmed gaps_, each with a note. Rather than double-managing a cursor and having it drift, making the hub's state the single source of truth was, at least so far, the simpler path.

(Why taskdog lives in a dedicated store rather than in my notes vault is an ownership question I [wrote about separately](/en/blog/knowledge-vs-task-direction-of-fit). taskloop is the usage where that dedicated store becomes the center of a self-driving loop.)

## Actually running it

One day I swept every channel for messages addressed to me, reconciled them against existing taskdog tasks by permalink, and added only the missing ones with notes. Then I left it running under `/loop` in dynamic mode (where the model paces its own interval). It ran **unattended for about five hours, continuously confirming "no new requests" while turning up anything it caught into a task**. Being able to focus on other work without worrying about dropping things was, honestly, great.

The decision gate worked too. A real request from a colleague became a task with a `dispatch` verdict; a question about a client integration got a `human` verdict ("this one a person should answer") plus an exclusion tag and a reason note. Across genuinely different kinds of requests, the verdict kept doing its job. Anything dangerous — an outbound message to a client, a step that writes state — always pauses for a human to approve. **The gate is human, execution is the agent**: keeping that boundary _outside_ the loop is what lets self-driving and safety coexist.

## The rakes I stepped on

Here's the honest part. There's no point writing only the good bits, so here are the ones I hit.

### 1. A watermark-free design breeds empty cycling

I just praised "deliberately no watermark," but it cuts both ways. Messages that are already processed, already declined, or already 👍-acknowledged **keep re-matching**. Even after I loosened the interval to ten minutes, empty cycles that only re-hit already-processed messages ran all day. The cause: "is it in taskdog?" alone can't filter out the things I _decided not to turn into a task_. The fix is to add "exclude declined / acknowledged / already-tasked" to the processed check, or to auto-thin the cadence after N calm cycles in a row. Still fixing this one.

### 2. Judging without acting lets candidates pile up

Running the triage skill and accumulating `dispatch`-eligible candidates is fine, but if you leave the actual start as a manual step, the loop keeps catching things and nobody touches them. You have to either connect triage and start without a break, or have a human periodically clear the backlog — otherwise you get "judgment advances but nothing moves forward."

### 3. Weak completion checks let the agent note-and-bail

This was the failure that bit hardest. An agent will sometimes **leave only an investigation log in the note and leave the task open**, without having met the completion condition. On one task the investigation itself was done, but the note stopped updating and the state never advanced. Two causes: (1) the task granularity was too coarse to draw a "done" line, and (2) the completion judgment was left to the executor's subjectivity. The fix: **split tasks to a granularity where completion is verifiable, and spell out the completion condition at task-creation time.** Combined with dropping "waiting on the other party" into a pause rather than "done," I want to drive "open but not moving" to zero.

### 4. The basis for picking the next task is opaque

When the `dispatch` loop picks **which task to do next** out of the executable ones, that choice is invisible to a human. Unless it's on the table whether tasks are ordered by priority, dependency, deadline, or estimate, you can't explain "why _this_ task now," and you can't fully trust the self-driving. My current stance is to apply the same discipline the triage skill uses for verdicts — leave a one-line reason for the selection too.

## Wrapping up, and what's next

- A human's inbox scatters everywhere. **Funnel it into a single hub (taskdog) and "what to do now" gathers in one machine-readable place**; as long as you hold the decision gate, execution can be automated safely.
- But to make self-driving trustworthy you need **task splitting to a granularity where completion is verifiable, and visibility into the basis for picking the next task.** Without those, the loop spins but you get "open but not moving / can't explain why this one now."
- `/loop` is a volatile loop that stops when you close the session, so I've confirmed long stability but not always-on operation. Next I want to move it to a cloud scheduler for a permanent cycle that survives the session ending.

To repeat: this is still mid-experiment, and I'm not handing out a solution. But the shape — funnel scattered requests into a single hub, hold only the decision gate, and let a cycle self-drive the rest — feels genuinely promising. If you're doing something similar I'd love to hear how you fold away the empty cycling and the completion checks. taskdog itself is [open on GitHub](https://github.com/Kohei-Wada/taskdog) if you want to poke around.
