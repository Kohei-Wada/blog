---
title: 'Is "Send Text as an Image" Actually a Win for Japanese? I Measured It'
description: 'DeepSeek-OCR revived the idea that screenshotting text and feeding it as an image costs fewer tokens than plain text. Information-dense Japanese should benefit most — so I rendered a meaning-identical English/Japanese document and measured token cost and readback accuracy across Claude, Qwen2.5-VL, and DeepSeek-OCR. The result was the opposite of the intuition.'
pubDate: '2026-07-19T16:30+09:00'
tags: ['Local LLM', 'AI', 'RTX5090', 'DeepSeek', 'homelab']
seeAlso: ['diffusiongemma-vllm-rtx5090-local']
---

Lately I keep running into the claim that if you want to feed an LLM a long document, it's **cheaper to screenshot the whole thing and pass it as an image** than to send it as text. The spark was DeepSeek-OCR, a Chinese model, and Karpathy amplified it by musing that maybe text input should just be images in the first place.

My first thought was: **that should be especially true for Japanese, right?**

A single kanji carries word-level information, and BPE tokenizers chop Japanese inefficiently (one character often splits into several tokens). Japanese expresses the same content in fewer characters than English, yet costs _more_ in text tokens. So rendering it to an image and competing on "pixel area" ought to help Japanese more than English — or so the story goes.

I tested whether that intuition holds, using the RTX5090 in my closet. Bottom line up front: **the intuition is half right, and backwards exactly where it matters.** Let me walk through it.

## Setting up the experiment

I needed a long English/Japanese text pair with identical meaning. To minimize translation drift I used a document with official translations: the **Universal Declaration of Human Rights** (Preamble + Articles 1–10). I render it to an image in both languages, with the same layout, and feed it to three different "readers."

Two things get measured:

- **Context consumption**: how many tokens the text/image costs
- **Readback accuracy (CER, character error rate)**: how faithfully the original text can be recovered from the image

The three readers were chosen for contrast:

```text
① Claude (Opus)      … strong general-purpose VL, fixed-formula image tokenizer
② Qwen2.5-VL 3B      … local general-purpose VL (ollama, RTX5090)
③ DeepSeek-OCR       … dedicated optical-compression encoder (the star of the show)
```

One premise up front: **on most models, image token cost is determined purely by pixel area, not by language.** For Claude it's `tokens ≈ width × height / 750`, and what language is written there is irrelevant. So at the same layout and font size, an English page and a Japanese page cost roughly the same image tokens.

So where does the language difference show up? In the **text baseline** and in the **compression limit of the dedicated encoder**. That turned out to be the crux.

## Result 1: In text, Japanese is paying a 1.75× penalty

First, plain text token counts (Claude's tokenizer isn't public, so I used o200k, which behaves similarly, as a proxy).

|          | characters | text tokens |
| -------- | ---------- | ----------- |
| English  | 3243       | 735         |
| Japanese | 1480       | **1289**    |

Japanese uses **less than half the characters yet 1.75× the tokens**. This is exactly the "Japanese is mistreated by the tokenizer" effect that makes image input tempting: the denominator (the text baseline) is inflated, so there's more room for an image to look like a bargain.

## Result 2: On general-purpose VLs, images don't pay off at all

Now the actual image token cost when fed to a general VL. I rendered the full text at 12px and cropped to content.

| reader     | English image tok | Japanese image tok |
| ---------- | ----------------- | ------------------ |
| Claude     | 1908              | 1855               |
| Qwen2.5-VL | 1850              | 1809               |

(Mind where these numbers come from — they're not the same kind of count. Claude's are **computed** from its public image-token formula `w × h / 750`; Qwen's are the **actual eval token count** from feeding it the image; and DeepSeek's per-mode tokens below are **nominal** mode budgets. It isn't a strict apples-to-apples basis, so read it as an order-of-magnitude comparison.)

As advertised, **image tokens barely change with language** (~3% apart). And look at the absolute values. Japanese text is 1289 tokens, but as an image it's 1809–1855 tokens — **it got more expensive the moment it became an image.** English goes 735 → 1850, a 2.5× increase.

So as long as you throw a raw PNG at a general VL like Claude or Qwen, "screenshots are cheaper" simply doesn't happen. It's a loss. Even Japanese is merely "less bad" thanks to its inflated text baseline — it isn't winning.

What about accuracy? Transcribing with Qwen2.5-VL, **English CER was 0.22% versus Japanese at 1.08% — 5× worse.** The actual errors were things like 世界の到来→世界的到来 and 授けられ→受けられ: complex kanji and particle mix-ups. Claude, by contrast, produced no visible transcription errors on the same images — though I didn't run a formal CER pass on Claude. A stronger model can probably lean on its **knowledge of Japanese to reconstruct half-crushed kanji**, which is a different thing from the pixels being legible. "Weaker models do worse on Japanese" — keep that in mind, it foreshadows the punchline.

## Result 3: The dedicated encoder, DeepSeek-OCR, is in another league

Here's the main event. DeepSeek-OCR is designed differently from a general VL: it has a **dedicated compression encoder that crams a page into tens-to-hundreds of tokens.** Resolution modes set the vision-token count (Tiny=64, Small=100, Base=256, Large=400, Gundam=dynamic).

I ran it on the RTX5090 (raw transformers, torch cu128, 6.7GB) and measured CER per mode on the same images.

| mode   | vision tok | English CER | Japanese CER       |
| ------ | ---------- | ----------- | ------------------ |
| Tiny   | 64         | 6.2%        | **45% (collapse)** |
| Small  | 100        | **2.8%**    | 10%                |
| Base   | 256        | 2.1%        | 3.1%               |
| Large  | 400        | 2.1%        | **0.75%**          |
| Gundam | ~640       | 2.1%        | 2.4%               |

Look at the order of magnitude first. The same document that cost general VLs 1850 tokens is recovered near-perfectly at **100 tokens for English, 400 for Japanese** — that's roughly **18× compression for English, and about 5× for Japanese.** And compared to the text baselines (EN 735 / JA 1289):

- English: 100 image tok vs 735 text tok → **image is 7.3× cheaper**
- Japanese: 400 image tok vs 1289 text tok → **image is 3.2× cheaper**

**With a dedicated encoder, both English and Japanese clearly win by going to image** — which they couldn't on general VLs. DeepSeek-OCR's "10× compression, 97% accuracy" headline roughly refers to this English regime.

(Aside: English CER plateaus at ~2% not from misreads but because the model dropped the single title line at the top. It's effectively perfect from ~100 tokens on.)

## And then the intuition flips

Now look at that table again — this time at **the English-vs-Japanese gap within each mode.**

- At 64 tokens (Tiny): English reads fine at 6% CER, but **Japanese collapses at 45%.** It starts hallucinating plausible-looking Japanese — inventing phrases that were never there.
- The accuracy English reaches at 100 tokens takes Japanese **256–400 tokens** (256 to roughly match English's 100-token result, 400 to actually surpass it).

In other words, **on DeepSeek-OCR, Japanese demands roughly 2.5–4× the vision tokens of English.** The likely reason: optical compression aggressively downsamples the page into a few dozen tokens, and **the denser, higher-stroke-count kanji plausibly break down first.** Once the glyph shapes are destroyed the text becomes unreadable and the model fills the gap with hallucinations — indeed, Japanese at 64 tokens collapsed entirely.

So here's the answer to the original intuition — "dense Japanese benefits most from images."

**Half of it is right.** On the text-token denominator, Japanese is inflated 1.75×, which does make images relatively more attractive.

**But it takes a penalty on the compression side, where it counts.** Fitting the same information into a compressed image costs Japanese ~2.5–4× the tokens because of the kanji. These two forces point in opposite directions, and on a dedicated encoder the **compression penalty wins — English actually comes out ahead.** High density is a virtue in text but a liability under optical compression.

## The practical takeaway

Lining up the three readers:

```text
                image tok (EN/JA)    is imaging a win?
Claude          1908 / 1855          ✗ (more expensive than text)
Qwen2.5-VL      1850 / 1809          ✗ (same, and Japanese loses accuracy too)
DeepSeek-OCR     100 /  400          ◎ (far cheaper than text)
```

- **Throwing a raw PNG at general-purpose Claude / GPT / Qwen won't save tokens.** It costs more. Don't expect "screenshot to save money" from a general VL — that claim is fundamentally **about the dedicated encoder.**
- **If you actually want it cheaper, you need an optical-compression encoder like DeepSeek-OCR.** There, both languages win, but the **win is bigger for English**; Japanese is discounted by the kanji tax.
- Use cases needing exact character fidelity (code, contracts) are a poor fit, since compression is lossy by nature. Imaging pays off when "the table/form/layout itself is information" and "good enough to read" suffices.

One caveat: this is **n=1** — a single document (the UDHR preamble + Articles 1–10, a formal legal register) rendered at one font and size (12px). Dependence on density, layout, and document type is unverified, so don't over-generalize the "English wins" conclusion. Treat it as a first data point, not a law.

I went in expecting the tidy story that information-dense Japanese wins hardest with images, and came out with the inverted punchline: the very density makes compression cost more, and Japanese loses to English. You really can't tell without measuring. The harness (rendering + the three-reader setup) is still on my machine, so next I want to chase the density dependence with longer real documents and code snippets.
