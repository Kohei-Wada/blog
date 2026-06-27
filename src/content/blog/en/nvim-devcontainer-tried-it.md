---
title: 'I Tried devcontainers with Neovim and Gave Up'
description: 'A record of trying a devcontainer setup — attaching to a container from nvim to develop inside it — and dropping it over slow startup and wasted storage. For solo dev I think it goes nix > per-language package managers > devcontainer.'
pubDate: '2026-06-27'
tags: ['devcontainer', 'neovim', 'Docker', 'nix', 'dev-environment']
---

> This is an old note from around summer 2025, written up as a post. These days I mostly let AI do the coding, so I care a lot less about my local dev environment than I did back then. So read this less as a verdict and more as a "I tried it once and here's how I judged it" record.

## What I was going for

If I'm going to develop against containers anyway, why not go all the way and lock the whole dev environment inside a container with a devcontainer? That was the starting thought.

The mental image was something like:

- Attach to the container from Neovim and develop inside it
- Maybe semi-automatically generate the Dockerfile from shell history

Honestly, I just wanted the VS Code devcontainer experience but in nvim.

## What I found out by trying it

In practice it didn't click the way I expected.

- **Slow startup.** You wait on the order of minutes. When you just want to poke at something, that's a high barrier.
- **Wasted storage.** You end up installing the whole dev toolchain _plus_ the editor and its plugins inside the container. And this piles up per project.
- **If you can set up your own environment, you don't need it.** Something like uv already gives you per-language environment isolation.

"Keeps your environment clean" is the selling point of devcontainers, but if that's the goal, there are other ways to get there — that was my takeaway after actually using it.

## Conclusion: for solo dev, the priority is this

For a solo developer who has the skills to build environments, I think the rational order is:

```
nix > per-language package manager > devcontainer
```

- **nix** is the cleanest. You can pin the environment declaratively, with no container overhead.
- **Per-language package managers** (uv, etc.) are lightweight and cover most use cases.
- **devcontainer**, on top of those, has a weak case for being the deliberate choice.

That doesn't mean devcontainers are bad — they're strong as a **lowest-common-denominator solution for a team with a skill gap**. "Press this button in the README and everyone gets the same environment" pays off precisely when not everyone can assemble an environment themselves. Solo dev just doesn't match that premise.

## Looking back now

As I said up top, I now let AI write code more often, and the situations where I fuss over my local dev environment have shrunk. Even so, taking the "lock the dev environment inside a container" approach for a proper spin and concluding it doesn't fit how I work wasn't wasted effort. You only learn whether you need a tool by trying it.
