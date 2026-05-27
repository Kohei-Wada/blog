---
title: "You Can't Kill a Thread, So Make It a Process — Making ttymap's Engine Restartable"
description: 'In ttymap, my terminal globe, the polygon triangulation library earcut hits an infinite loop on pathological input, and the zombie threads keep burning CPU forever. Why I made the engine restartable, and why that restart has to be a process rather than a thread — the one fact that in safe Rust you cannot kill a running thread from the outside.'
pubDate: 'May 28 2026'
tags: ['personal-projects', 'Rust', 'TUI', 'process-isolation']
seeAlso: ['ttymap-terminal-scriptable-globe']
---

`ttymap` is a tool I built that draws a globe in the terminal with Braille ([previous post](/en/blog/ttymap-terminal-scriptable-globe)). I made its engine "restartable while running." This post covers only why a restart is needed, and why that restart has to be a **process** restart.

## Why make it restartable

A long-running ttymap was eating close to 200% CPU even when I wasn't touching it. The culprit was `earcut`, the polygon triangulation. Feed it a pathological (self-intersecting) polygon and it can fall into an infinite loop.

ttymap has a defense — a 200ms timeout that "gives up and swaps in another worker" — so **the UI never freezes**. But the worker it gave up on doesn't stop. It keeps spinning inside earcut, abandoned. So every time you pan over a tile that contains a pathological polygon, you add one more thread that burns CPU forever ([#305](https://github.com/Kohei-Wada/ttymap/issues/305)).

I wanted to reclaim this accumulated garbage without losing the session or the spot I was currently looking at. So I wanted an operation that "rebuilds just the engine."

## Why a process, not a thread

My first naive thought was "just kill the runaway thread." You can't.

safe Rust's `std::thread` has no kill / cancel API. If a tight loop has no yield point and no flag check, there is zero way to stop it from outside. earcut's triangulation is a single closed loop with no hook for cancellation. **The thread lives until "earcut exits on its own" — which, for a true infinite loop, is never.**

There is exactly one general way to reliably reclaim it — **kill the whole process**. Kill a process and, no matter what it was doing inside, the OS reclaims every thread, no questions asked.

At first everything ran in one process — tile fetching, decoding, rendering, and earcut, all inside the `ttymap` binary. This #305 became the main driver for carving the engine out into a separate process ([#348](https://github.com/Kohei-Wada/ttymap/issues/348)). I first tried isolating **only** earcut into a subprocess, but that left the engine as a lopsided half-thread / half-process model. So instead of earcut alone I moved the **entire engine** into a separate process (other pressures — an external control channel, headless rendering, multiple frontends — pointed the same direction, but the trigger was this thread leak).

In a single process, "restart the engine" means "restart the whole app," and you lose the terminal and the view along with it. With the engine in a separate process, you kill just the child and grow a new one, reclaiming the zombies while keeping the TUI intact.

You can't kill a thread. So you make it a process. That was all there was to it.
