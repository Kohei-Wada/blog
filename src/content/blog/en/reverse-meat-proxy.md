---
title: 'What Should We Call the Inverse of a Meat Proxy?'
description: 'Starting from meat proxy on Hacker News (a human who pastes raw AI output and adds nothing), I worked out its mirror image: the reverse meat proxy. The right test turned out to be not "does it add anything" but "does it terminate" — plus the candidate terms that sounded great and got cut because the structure did not match.'
pubDate: '2026-08-04T15:00+09:00'
tags: ['communication', 'networking']
seeAlso: ['knowledge-vs-task-direction-of-fit']
---

## Where this started

I ran into the term **meat proxy** on Hacker News. It means a person who pastes raw AI output and adds nothing of their own. AI upstream, humans downstream. A proxy made of meat.

Good phrase. But it also made me think the other direction exists too. Someone who takes a request from outside and just hands it to a person inside. Humans upstream *and* downstream. A **reverse meat proxy**.

I meant to write this as nothing more than a list of terms I came up with. Then I got stuck trying to list them, because this kind of metaphor is trivially easy to manufacture and falls apart just as fast unless you pin down a test first. So this ended up being about the test, and about the candidates the test rejected.

## The test is not "does it add anything" — it's "does it terminate"

My first instinct was that what makes this kind of relay bad is the zero added value. But that doesn't hold up as a reverse proxy metaphor.

The essence of a reverse proxy is neither choosing a destination nor adding content. Reverse proxies with exactly one backend are perfectly common and perfectly useful. What actually defines one is that it **terminates the client connection and answers as the backend's front door in its own name**.

And terminating drags one consequence along with it: when the backend dies, **you are the failure surface as far as the client is concerned**. Typically that means returning a 5xx under your own name. Even though you're not the broken part, you're the one who has to announce yourself as the point of failure.

Not that a 5xx is mandatory. You can serve a stale response with `stale-if-error`, or fail over to another upstream so the client never sees the failure at all. But that isn't a counterexample — it makes the point sharper. **You can only choose to hide it because the attribution is yours.** Terminating is very nearly the same thing as accepting where failure lands.

Seen that way, it's clear what's actually wrong with a pass-through relay. It isn't that nothing was added. It's that it **takes the benefit of indirection — from the outside, there's one door — without taking on the duty of termination**.

## The same mechanism flips depending on whether it terminates

Line them up on that axis and the good metaphors separate from the bad ones. What gets classified is behavior, not people, so each mechanism gets both sides.

| Mechanism | Terminates (this is where the value is) | Doesn't terminate (the pathology) |
|---|---|---|
| **proxy** | Answers in its own name, so it checks before sending | Pastes raw output, blames the original output when it's wrong (**meat proxy**) |
| **reverse proxy** | Returns the backend's failure under its own name | Takes the front-door benefit, leaves the liability downstream (**reverse meat proxy**) |
| **cache** | Says out loud "this is a stale copy I had on hand" | Nobody checks freshness; stale answers get served with total confidence |
| **queue** | Applies backpressure and says no on its own judgment | Lets the receipt ACK stand in for a completion signal, hiding the backlog |

The queue row is quietly the sharpest. The awkward part is that the ACK involved isn't a lie. A broker's enqueue ACK means "accepted and durably stored," not "processed." With nobody lying anywhere, the requester reads receipt as commencement and waits that much longer. A refusal would have let them try something else. A relay that never says no can be worse than one that does.

The cache pathology isn't only staleness either. The harder one to catch is a **key that's too coarse**. Some input that belonged in the key isn't in it, so the answer to a different question comes back as the answer to this one. In HTTP terms, that's forgetting a header in `Vary` — also a primary cause of web cache poisoning. The answer itself is correct and perfectly fresh, so neither the sender nor the receiver sees a contradiction. A thing that terminates can say "that isn't the question I answered." A thing that doesn't just hands back whatever it had, with a 200.

## Candidates I cut

Terms that sounded great but whose mechanism didn't structurally match the behavior. The reasons for cutting them are a better demonstration of the test than the table is.

**meat NAT.** I wanted "you can't see from outside who did it internally" as the pathology, but that's how NAT behaves when it's working *correctly* — it doesn't degrade into anything. And NAT does keep the mapping, in a translation table, for as long as the flow is alive. What I actually meant wasn't NAT at all; it was **the correlation ID / `Via` / `X-Forwarded-For` chain being broken**. That one matches structurally.

**meat 502.** A 502 means "I asked upstream and got an invalid response back." No response in time is a 504. Which one to return when you couldn't *connect* at all is left undecided by the RFC, and implementations disagree: nginx returns 502, haproxy and Envoy return 503. And there's no 5xx at all for "never asked upstream, synthesized the answer myself" (there is 203 Non-Authoritative Information if a 2xx will do, but it returns as a success, so it's useless for talking about where failure lands). The property I wanted — a gateway naming itself as the point of failure — got absorbed into the reverse proxy row above anyway.

**meat firewall / meat switch.** Far too generic to pin down any property. Just a machine's name stuck onto a human.

## Wrapping up

Fixing the test as "does it terminate" made it possible to judge my own coinages. Four survived, three got cut. All three of the rejects had good ring to them, and without a test I'd probably have kept them.

One caveat: `reverse meat proxy` isn't a property of a person. It's the shape of a behavior in a moment, and the same person terminates in one situation and doesn't in another. Attach it to a person and it just works as an insult. I'd rather use it the other way — think back over my own recent relays and count what I actually added to the request path.
