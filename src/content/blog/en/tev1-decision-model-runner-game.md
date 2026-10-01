---
title: 'Letting tev1, a 4B Decision Model, Play a Game'
description: 'I ran tev1, a 4B decision model that claims accuracy close to Jev, on my home GPU and let it play a side-scroller. 20 decisions a second, about 30ms each. That this runs locally is wild.'
pubDate: '2026-10-01T20:00+09:00'
tags: ['local-llm', 'ollama', 'AI', 'homelab']
seeAlso: ['qwen38-27b-rtx5090-measured']
---

## Why I Tried It

ollama added a new kind of model: the decision model. Instead of generating text, it takes a situation and a set of options and returns which option it picks, with a probability for each. The idea comes from Jev, a closed API from TypeSafe AI, and tev1 is an open-weight follow-up.

What caught my eye was the size. tev1 comes in just two sizes, **4B** and **0.8B**. Even the larger 4B is tiny, yet its published benchmark puts it at 73.3% against Jev's 76.0% — nearly level. A 4B model fits on my home GPU with room to spare. I wanted to see whether it really holds up.

## What I Built

I wrote a side-scrolling game and handed all the controls to tev1.

<video controls muted loop playsinline src="/videos/tev1-runner.mp4"></video>

The setup is simple. The game describes the situation in words — whether the runner is on the ground, and whether jumping right now would clear the next gap or enemy — and asks tev1 to pick `run`, `jump`, or `wait` every time. The bars in the right-hand panel are the raw probabilities tev1 returns.

Each decision comes back in the 30ms range, so it re-decides about 20 times a second. The game never waits for the model; the input switches whenever an answer arrives. It dies a few times along the way, but it jumps the gaps, stomps an enemy, and makes it to the goal.

## Thoughts

Honestly, I was impressed that this runs **on my own machine, with a 4B model, in real time**.

With the same tev1, when I had the regular generation API write out the option letter as text, it sometimes got lost in thought and never returned an answer, and it got fewer answers right. The decision API returns the option probabilities directly, so that doesn't happen. As long as the question boils down to a three-way choice like this, even a 4B model runs this fast.

The game is a toy, but I have plenty of places where I need to make the same kind of call over and over. I'm going to keep playing with it for a while.
