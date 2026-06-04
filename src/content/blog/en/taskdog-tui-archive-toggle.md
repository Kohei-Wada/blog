---
title: "Making Archived Tasks Visible in taskdog's TUI"
description: 'I added a toggle to show archived tasks in the TUI of taskdog, my CLI/TUI task manager. While I was at it, I made the Gantt chart a fixed-width time window so rendering stays cheap as history piles up.'
pubDate: '2026-06-04'
tags: ['Python', 'TUI', 'personal-projects']
---

## Intro

This is about [taskdog](https://github.com/Kohei-Wada/taskdog), my own CLI/TUI task manager.

I archive tasks once they're done — but until now, the TUI task list couldn't show archived ones at all. Every time I thought "wait, where did that task I finished last week go?", I had to drop to the CLI to find it. Mildly annoying, every time. So I made them visible. A trivial little feature, but I'm logging it as one of those small accretions.

## What I did: Toggle Archive

I just added a `Toggle Archive` entry to the command palette. The implementation is almost embarrassingly thin.

The TUI state carries a single `show_archived: bool = False`, and that flag gets passed when fetching tasks:

```python
self.repository.list_tasks(
    include_archived=self.state.show_archived,
)
```

Running the toggle flips `show_archived` and the list re-fetches. That's it. The `include_archived` path already existed on the CLI side, so the TUI is really just pulling that switch up into the UI.

As a feature, that's genuinely all of it. But the gap between "can't see them" and "toggle to see them" feels much larger than the diff, for a tool you reach for every day.

## Bonus: a fixed-width time window for the Gantt

In the same change I also fixed the Gantt chart. It used to render the whole live range, so once history accumulated — archived tasks included — the column count kept growing, and panning into the past would freeze the chart.

`Textual`'s `DataTable` has no column virtualization, so more columns means proportionally more render cost. There's no clean way to shave that off.

So I changed the approach to pan a **fixed-width time window**:

- `H` / `L` shift the window one week into the past / future; `T` snaps back to the current week.
- The window width is constant, so the rendered column count is constant too — meaning **render cost stays flat no matter how much history piles up**.

If there's no virtualization, then just don't grow the number of columns you draw. Cursor and scroll position are preserved across pan and zoom rebuilds.

## Wrap-up

It's a small change — just making archived tasks visible — but it cleared the Gantt's rendering ceiling along the way. Small accretions like this are what grow a tool.

👉 https://github.com/Kohei-Wada/taskdog
