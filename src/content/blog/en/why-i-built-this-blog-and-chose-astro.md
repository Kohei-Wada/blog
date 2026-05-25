---
title: 'Why I Built This Blog, and Why I Chose Astro'
description: "Writing this down so I don't forget what I built this blog for"
pubDate: '2025-08-11'
tags: ['blog', 'astro', 'frontend']
---

## Introduction

Frontend has never been my strong suit, for as long as I can remember.
At work and in my side projects alike, I somehow always end up building backends and CLI tools, and I barely touch anything on the browser side.
My day-to-day work is almost entirely in the terminal, so I'd been living a life where I didn't even feel the need to learn frontend.

**To be honest, one reason I avoided frontend was a bias I held.**
"Frontend is just a feature for the end users of computers, so it's inefficient to go out of my way to build it for them. Everyone would be better off overall if end users learned a bit about computers themselves."
That's the kind of thing I used to think.

But as I gained more real-world experience, an obvious fact finally sank in: **customers don't understand the technical details.**
No matter how brilliant the algorithms or architecture are under the hood, if the frontend isn't solid, people will think "this service is kind of meh."
Conversely, even if the backend is unremarkable, a polished UI/UX can get the service praised as "amazing."

**For customers, the value of a system is judged by the parts they can see.**
As an engineer, that's a frustrating reality, but in the world of business it's also an unavoidable truth.

If I ever want to build and sell my own product down the line, frontend knowledge is unavoidable.
Once I realized that, I finally decided to get off my ass.

I'd told myself "I should study this" a few times before, but motivation never lasted for tech that wasn't directly tied to my workflow. I'd buy materials and then never actually touch the keyboard — that pattern repeated over and over.

So I flipped the approach and decided to build **"a contraption that forces frontend into my daily workflow."**
That's this blog.

## Why I built the blog

| Goal                                     | Details                                                                       |
| ---------------------------------------- | ----------------------------------------------------------------------------- |
| Studying frontend                        | Without a place to actually touch it, I could see myself never studying again |
| Fixing my Zettelkasten output shortage   | Get the notes I write in Obsidian out into the open so they actually stick    |
| Foundation for future React/Vue practice | Start with plain Markdown, then add UI components later                       |

## Candidates and requirements

The candidates were:

- **Astro**: a newer static site generator I came across while researching
- **Docusaurus**: often used for the Neovim plugin docs I read regularly (lazy.nvim, etc.)
- **Hugo**: a fast static site generator written in Go; I'd seen it used here and there
- **Next.js**: the household-name framework in the React world
- **Nuxt.js**: the household-name framework in the Vue.js world
- **Gatsby**: a React-based static site generator I used to hear about a lot
- **Jekyll**: the GitHub Pages standard, a long-running static site generator written in Ruby
- **VitePress**: a lightweight, docs-oriented SSG built by the creator of Vue.js
- **WordPress**: the classic answer to "I want my own blog"
- **Laravel**: I've used it on the job, so I have the know-how

My requirements:

1. **Markdown support** -> use Obsidian notes as-is
2. **Static site generation (SSG) support** -> fast, safe, easy to deploy
3. **No backend required** -> stay focused on the actual goal (learning frontend)
4. **Low learning cost** -> it's my weak spot, so getting something running comes first
5. **Future extensibility** -> able to slot in React/Vue/Svelte later
6. **Allows ads** -> so I can earn pocket money down the line

## Comparison table

| Tech           | Pros                                                                                                         | Cons                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| **Astro**      | - Markdown out of the box<br>- Fast SSG<br>- Can mix in React/Vue/Svelte selectively<br>- Zero JS by default | - Newer tech, so less material out there<br>- Especially little in Japanese                                                    |
| **Docusaurus** | - Optimized for docs sites<br>- Markdown support<br>- Built by Meta, stable<br>- Great i18n support          | - Overkill for a blog<br>- Low flexibility<br>- Designs tend to look alike                                                     |
| **Hugo**       | - Extremely fast (Go)<br>- Feature-rich SSG<br>- Many themes<br>- Runs as a single binary                    | - Have to learn Go templates<br>- The HTML and such is hidden away, so you don't really learn it<br>- Configuration is complex |
| **Next.js**    | - Tons of info and examples<br>- Supports SSR / ISR / SSG<br>- React ecosystem<br>- Optimized for Vercel     | - Too much going on, steep learning curve<br>- Lots of backend-leaning features<br>- Overkill                                  |
| **Nuxt.js**    | - Pairs perfectly with the Vue ecosystem<br>- File-based routing<br>- Supports both SSR and SSG              | - Too much going on, steep learning curve<br>- Designed around SSR<br>- Need to learn Vue.js itself first                      |
| **Gatsby**     | - React-based, highly extensible<br>- GraphQL integration<br>- Rich plugin ecosystem<br>- PWA support        | - Heavy builds<br>- GraphQL is mandatory and complex<br>- Easy to over-engineer                                                |
| **Jekyll**     | - GitHub Pages standard<br>- Long-running and stable<br>- Simple<br>- Free hosting                           | - Requires a Ruby environment<br>- Low extensibility<br>- Lacks modern features                                                |
| **VitePress**  | - Very lightweight and fast<br>- Built on Vue.js<br>- Excellent Markdown extensions                          | - Docs-focused, not really blog-oriented<br>- Limited customizability                                                          |
| **WordPress**  | - Get a blog up easily<br>- Tons of plugins<br>- No-code management                                          | - Not educational<br>- Annoying security management<br>- Requires a server                                                     |
| **Laravel**    | - I have job experience with it, so low learning cost<br>- Full-stack<br>- Feature-rich                      | - I don't want to build a backend<br>- Requires a server<br>- Drifts away from the frontend-learning goal                      |

## Why Astro

- **Markdown out of the box** -> I can leverage my existing Obsidian notes
- **Fast static site generation** -> builds and deploys are instant
- **Can slot in React/Vue/Svelte only where needed** -> perfect for future UI practice
- **Self-contained, no backend needed** -> lets me stay focused on the actual goal

Why I passed on the others:

- Docusaurus -> docs-specific, not flexible enough
- Hugo -> learning Go templates drifts from the goal
- Next.js / Nuxt.js -> too feature-heavy, overkill for this use case

## Wrap-up

I built this blog to hit two goals at once: learning frontend, and beefing up the output side of my Zettelkasten.
Astro checked every box — Markdown support, fast SSG, extensibility — and on top of that it leaves the door open for React or Vue practice later. An ideal fit.
From here, I plan to keep improving the blog while taking on UI/UX and component implementation along the way.
Whatever I learn, I'll keep dumping the output here.
