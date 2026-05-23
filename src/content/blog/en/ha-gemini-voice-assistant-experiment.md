---
title: 'I wired a Gemini voice assistant into Home Assistant and only half of it worked'
description: "I integrated Google Gemini 2.0-flash into Home Assistant's Assist pipeline to build a phone-voice → Gemini → Alexa Echo Dot readout path. The basics work, but conversation history, tool chaining, and scripts-with-arguments all failed."
pubDate: 'May 24 2026'
tags: ['home-assistant', 'gemini', 'voice-assistant', 'personal-projects']
seeAlso: ['ha-claude-code-alexa-report', 'ha-alexa-migration-journey']
---

## Introduction

I integrated Google Gemini 2.0-flash into Home Assistant's Assist pipeline: "phone voice input → STT → HA built-in Agent (Gemini) → conversation trigger → Alexa Echo Dot readout." Basic sensor reads and simple device operations work. On the other hand, conversation history, tool chaining, and running scripts with arguments all failed — as a "smart assistant," it fell short.

In a fairly smart-home-ified house, I wanted the experience of "ask Alexa in natural language and it answers across HA sensors / family location / power data." Alexa alone can't integrate at that level, so I tried a setup with the HA Assist pipeline as the hub and Gemini behind it.

## The setup

```text
phone voice input
    ↓
STT (Google AI STT)
    ↓
HA built-in Agent (backend: Gemini 2.0-flash)
    ↓
conversation trigger (Automation)
    ↓ output to both
├── show text on the phone
└── read aloud on the Echo Dot (notify.echo_dot_speak)
```

Key settings:

1. **Google Generative AI Integration**
   - Use a paid API key (the free tier is 20 requests/day, exhausted instantly)
   - Model: gemini-2.0-flash. Leave `recommended: true` and it picks 2.5-flash, which has function-calling issues
2. **Assist Pipeline config** (`assist_pipeline.pipelines`)
   - conversation_engine: `conversation.home_assistant` (HA built-in; required to fire the conversation trigger)
   - stt_engine: `stt.google_ai_stt`
   - tts_engine: `tts.google_ai_tts`
   - Set the HA built-in Agent's backend to Gemini
3. **Alexa Devices official integration** (HA 2025.6+)
   - Send TTS via `notify.echo_dot_speak`
   - You can also get a motion sensor (`binary_sensor.echo_dot_motion`) and illuminance sensor (`sensor.echo_dot_illuminance`) — not available via Alexa Media Player

The automation for Alexa output:

```yaml
- id: assist_gemini_to_alexa
  alias: 'Assist→Gemini→Alexa'
  triggers:
    - trigger: conversation
      command:
        - '{query}'
  actions:
    - action: conversation.process
      data:
        text: '{{ trigger.slots.query }}'
        agent_id: conversation.google_ai_conversation
        language: ja
      response_variable: gemini_result
    - action: notify.send_message
      data:
        entity_id: notify.echo_dot_speak
        message: '{{ gemini_result.response.speech.plain.speech }}'
    - set_conversation_response: '{{ gemini_result.response.speech.plain.speech }}'
```

## What worked / what didn't

Worked:

| Feature                                       | Status |
| --------------------------------------------- | ------ |
| phone voice → Gemini → text on phone          | OK     |
| phone voice → Gemini → Alexa readout          | OK     |
| sensor reads (power usage, temperature, etc.) | OK     |
| simple device control (sleep mode ON/OFF)     | OK     |
| running a notification script (no arguments)  | OK     |
| text input → Gemini → Alexa (via a script)    | OK     |

Didn't work:

| Problem                          | Cause                                                                                               |
| -------------------------------- | --------------------------------------------------------------------------------------------------- |
| conversation history not kept    | passing conversation_id doesn't make it remember. A limit of the HA built-in Agent's Gemini backend |
| can't chain tools                | "look up the weather and notify me" → "I don't have that capability"                                |
| can't pass arguments to a script | Assist's script execution is turn_on only. No message parameter                                     |

## Gotchas

- **The agent_id trap**: `conversation.google_ai_conversation` (entity-ID form) can stop working after a restart. Using the config entry ID sometimes stabilizes it, but sometimes that one stops working instead. You need to check which is valid after each restart.
- **Writing tool instructions into the prompt crashes it**: Gemini tries to function-call notify etc. and errors.
- **The `notify` domain isn't an Assist tool**: scripts / switches are supported.
- **The free tier is effectively unusable**: gemini-2.5-flash's free tier is 20 requests/day.

## Reflection — the model is smart; what's missing is context management

The thing this drove home hardest is the obvious fact that **recent ChatGPT / Claude / Gemini are incredibly smart on their own, yet turn incredibly dumb the moment you don't manage their context properly.**

Most of what "didn't work" in this experiment isn't a problem of the model's intelligence. No conversation history, can't chain tools, can't pass arguments to a script — all of these are context-management failures: the integration side isn't correctly handing the model the context and tools it needs. The same Gemini behaves smartly if you actually feed it the history and the functions. The HA built-in Agent sets that table thinly, so a smart model gives the curt "I don't have that capability."

I learned, hands-on with a home voice assistant, that the essence of embedding an LLM in a product is less about model choice and more about **designing the supply of context.**

## Ideas for improvement

1. **Home Mind** — a Conversation Agent with persistent semantic memory (HACS). But shodh-memory is x86-only, not RPi-compatible.
2. **Extended OpenAI Conversation v2** — an improved multi-turn version. Via the OpenAI-compatible API, it may be able to use Gemini too.
3. **Embed fixed info in the prompt** — write family info etc. into the prompt. Simple, but it can only ever reference the same fixed info.

## Wrap-up

- "Simple questions" and "simple operations" work with Gemini + HA Assist.
- Conversation history / tool chaining / scripts-with-arguments don't work right now.
- The real nature of "doesn't work" isn't the model's intelligence but a thin supply of context. That's the crux of embedding an LLM.
- For serious use as a smart assistant, you need an alternative like Extended OpenAI Conversation v2 rather than the HA built-in Agent.

## References

- [Google Gemini — Home Assistant](https://www.home-assistant.io/integrations/google_generative_ai_conversation/)
- [Alexa Devices — Home Assistant](https://www.home-assistant.io/integrations/alexa_devices/)
- [Assist Pipeline Developer Docs](https://developers.home-assistant.io/docs/voice/pipelines/)
- [Home Mind — HA Community](https://community.home-assistant.io/t/home-mind-conversation-agent-with-persistent-semantic-memory/984251)
