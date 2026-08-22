---
title: 'I Built Four AI Automations and Deleted Them All in 7 Hours, 6 Days, 11 Days and 12 Days — the Survivor Is the One That Makes No Decisions'
description: 'There are endless posts about setting up a resident AI agent, and almost none about what happened afterwards. I built four AI-powered automations at home and tore every one of them out — the shortest lasted seven hours, the longest twelve days. The only survivor is person detection, which makes no decisions at all.'
pubDate: '2026-08-22T12:00+09:00'
tags: ['AI', 'homelab', 'home-server', 'local-llm']
seeAlso: ['frigate-four-silent-detection-deaths', 'moe-vs-dense-local-llm-agent-tasks']
---

## Only setup posts exist

Search for write-ups on resident AI agents like Hermes Agent or OpenClaw and you'll drown in setup posts. I installed it, here's the config, here's which model to pick, here's how I wired it to Telegram. Search in Japanese and the results are wall-to-wall "top 20 tools" and "complete beginner's guide".

What I can't find is **anyone writing about what happened after a while**.

Maybe the hype is just too recent and not enough time has passed. But I installed Hermes two months ago, and what I had to say kept growing: more on day 3 than on day 1, more on day 6 than on day 3.

Maybe the long-term write-ups don't exist because everyone quits partway through.

That's exactly what I did, so here's the record.

## Four builds, none lasted two weeks

I run a small fleet of home servers managed declaratively with NixOS: a main box with a GPU, a Raspberry Pi for monitoring, and a spare laptop dedicated to person detection. I've built AI-powered things on it several times, and torn them out again.

| What I built                                           | Lifespan    | Why I removed it                                                                                         |
| ------------------------------------------------------ | ----------- | -------------------------------------------------------------------------------------------------------- |
| opencode-scheduler (let the LLM register its own jobs) | **7 hours** | The model reported "registered successfully" when it hadn't                                              |
| Hermes Agent (resident agent)                          | **6 days**  | Its role collided head-on with the Claude Code I already use                                             |
| morning-news (spoken headlines)                        | **11 days** | I'm asleep at 7am. I read the news on my phone anyway                                                    |
| Morning briefing timer                                 | **12 days** | Simplified Chinese leaking in, a subtraction inverted, and the wrong number of people home — all at once |

None of these were throwaway experiments. Each one went through a PR into the config repo and got deployed declaratively. I meant it every time.

Lining up the causes of death, something stands out. **Every one of them died either because of the part where I let the AI decide something, or for a reason that had nothing to do with AI at all.** Three of the former (a false report, wrong output, and nobody listening), one of the latter (role collision). Four data points is nowhere near enough to claim "the more you let it decide, the faster it dies", but at minimum, **the part I let it decide broke every single time**.

By contrast, one thing has survived: person detection at the front door. The outdoor camera's RTSP feed goes into Frigate, YOLOv9 finds people, and when it does, an Echo in the house announces "someone at the front door".

This is not a case of "it survived _even though_ it uses AI". **It survived because the scope of AI in it is squeezed down as far as it goes.** All YOLOv9 does is answer "person or no person"; it decides nothing about what happens next. And it got there the hard way — it [died silently four times in a single month](/en/blog/frigate-four-silent-detection-deaths) before a deterministic recovery script took over babysitting it. That script restarted it again this morning, after the camera stream broke.

If you want to call an AI with no judgment left in it "a glorified cron job", fine — that glorified cron job is the only thing in my house still running.

## Caveat: everything here runs on a local mid-size model

One condition hangs over all of this. **Every LLM in my house is local, and the models are mid-size.** Put a large hosted model behind a resident agent and some of the complaints below go away — the token weight turns into a billing line instead, and the decisions get sharper.

With that said, here's the part I think survives a change of model.

## What I couldn't see on day one

Here's what six days with Hermes taught me.

**The skill mechanism wasn't paying for itself.** This is what I measured while chasing down why responses were slow.

```text
.skills_prompt_snapshot.json      43KB
actually injected into the prompt  ~2k tokens
deleting all 67 builtin skills  →  base 19k → 16.9k tokens
```

Deleting all sixty-seven skills shaves 2.1k off the base prompt. You pay the cost of carrying them continuously, and the part that actually lands is tiny.

**58k tokens just to ask about the weather.** Any question that uses a tool becomes multi-pass, and the base prompt (system plus tool definitions) gets resent on every pass, so even a trivial question costs that much. Running locally, that's all GPU time.

Neither of these is visible on day one. You only learn that deleting 67 skills changes nothing after you get suspicious about the latency and go measure.

## It rots on its own while you leave it alone

Hermes has a mechanism that tidies up and generates its own skills (it's called `curator`). The pitch is "it gets smarter the more you use it", and this is the centrepiece of the whole self-improving-agent idea.

But what happens when you run that on a mid-size model? **It generates junk skills, and the answers degrade.**

And even a correct skill is no guarantee it'll get called. Here's what actually happened in my house. The skill for making Alexa speak was set up correctly — invoke it by hand and it fires every time. The Echo path itself is verified on real hardware for both short and long text. And yet, asking by voice for a report through Alexa, it wouldn't always speak. Once I isolated it, the cause wasn't the path at all: **the model just didn't reliably call that skill**. Laying out the right tools doesn't help much if the hand reaching for them is mediocre.

Now stack "it adds its own skills" on top of that. Worse, the canonical copy of those skills lives in `/srv/hermes`, mutable state, outside the config repo. On a fleet I manage declaratively, that's one more directory that rewrites itself.

This is what doesn't fit with being resident.

Running something resident means leaving it alone. Leaving it alone is the whole reason you make it resident. But a self-improvement mechanism keeps working while you're not looking, piling up artifacts — and there's no guarantee those artifacts are any good. To stop the rot you have to periodically read through them and throw the bad ones out. **That's a second job you just created.**

If you're willing to do that inventory work, you're not leaving it alone anymore. And if you're not leaving it alone, there's no reason for it to be resident — you could just call it when you need it.

So: **a resident agent with self-improvement has a mechanism for being left alone that breaks being left alone.**

This one is also invisible on day one. Observing rot requires the period of neglect itself.

**A setup post can only contain what's knowable on day one, and what's knowable in week two never gets written, because by week two everyone has already quit.** That, I think, is why the long-term write-ups don't exist.

## Why I think they don't last

My own reasoning is fairly simple.

**Automating something means the work is already decided.** If it's decided, you can write the steps down. If you can write the steps down, a script covers it — so a general-purpose AI isn't just unnecessary, it actively adds waste. It costs runtime and tokens, and since the output differs every run, you have to check it.

**And the times you _want_ a general-purpose AI are the one-off jobs, like a messy investigation.** The cases where the procedure isn't decided and you want it to go figure things out. But those are one-offs, which means they were never candidates for automation in the first place.

The condition for automation to work and the reason to reach for AI are mutually exclusive. Resident AI agents are trying to stand in that gap, and from where I'm sitting they keep falling through it.

The people selling agents write the same thing as a design principle. From Anthropic's [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents):

> Find the simplest solution possible, and only increase complexity when needed. **This might mean not building agentic systems at all.**

Someone has already published the verdict on self-hosting, too. laiso's [After the OpenClaw hype, and Hermes Agent](https://blog.lai.so/hermes-agent/) (in Japanese) concludes that "there is almost no value in running Hermes or OpenClaw yourself as an end user" — the differentiators, persistent memory and desktop automation, have been absorbed by the commercial products, and what's left is for people who want to hack on the source.

What I did was skip reading any of this at design time and confirm it in the field over 7 hours, 6 days, 11 days and 12 days. Honestly, I'd have built them anyway. Making things that someone has already written down as unnecessary is sort of the hobby.

## Today I had the same idea again

Today, while writing this, I came up with a fifth one: "wouldn't it be handy if an AI investigated automatically whenever a monitoring alert fired?"

Before building it, I measured how often alerts actually fire. Something goes off most days, so there's plenty of raw material. But I'd **mostly been ignoring them**, because things usually recover on their own. Before bolting an AI onto my alerts, the honest problem is that I don't read my alerts.

Still, I dug into one by hand, and found the person-detection camera restarting ffmpeg every ten seconds. Counting by day:

```console
$ for d in 08-19 08-20 08-21; do
    printf "%s: " "$d"
    journalctl -u podman-frigate --since "2026-$d 00:00:00" --until "2026-$d 23:59:59" \
      | grep -c "Restarting ffmpeg"
  done
08-19: 1
08-20: 12
08-21: 23
```

Across those three days it looks like it's climbing (widen the window and there are worse days further back). Bucket them by hour, though, and they clearly **cluster into specific times of day** — the times we use kitchen appliances.

The culprit is the microwave. This was actually known already: running a microwave or induction hob spikes the whole house's draw, the voltage sags, and the wireless AP reboots. With the AP down for about a minute the camera goes unreachable, and ffmpeg restarts every ten seconds for the duration. It looks like a camera problem, but the AP itself is dropping — **the 5GHz clients disconnect at the same moment**, which rules out radio interference. Cross-referenced against the power meter, the AP reboots line up with microwave starts to a statistically significant degree.

**So the fix is either "replace the AP and remove the cause" or "install a recovery script" — there was no role for an AI.** In fact this detection host already has a recovery script: once a minute it checks the frame rate, and if it's wildly above the configured value eight times running, it restarts the container. That's all. It counted its eight strikes and restarted this morning.

The only part where AI helped was lining up a few days of hourly distribution and noticing the correlation. And that's a one-time job. Once the cause is known, the response is deterministic.

The fifth one died before I built it.

## So, is it needed?

A general-purpose resident AI agent turned out not to be needed in my house. Decided work is covered by scripts, and undecided work is one-off, so I can just run it myself when I need it.

What I can't tell is whether that's structural or specific to my situation.

- Is "decided work is covered by scripts" true everywhere, or are my household chores simply too simple?
- Does "just run it yourself when you need it" only hold because I'm sitting in front of a terminal all day? For someone who isn't, maybe resident is exactly right
- The only job I can think of that's worth running 24/7 _and_ can't be written without AI is person detection. Is that a failure of imagination, or is the set really that small?

Which is why what I actually want to read is the post from someone a good while in. If you've kept a resident agent running for a year, I'd like to know what you have it doing, and what makes it stick.

For now, the only post I'm able to write is the one that stops at day six.
