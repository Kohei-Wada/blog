---
title: 'Home Assistant に Gemini 音声アシスタントを組んでみたら半分しか動かなかった'
description: 'Home Assistant の Assist パイプラインに Google Gemini 2.0-flash を統合して、スマホ音声 → Gemini → Alexa Echo Dot 読み上げの一筋を作ってみた。基本はちゃんと動くが、会話履歴・ツール組み合わせ・引数つきスクリプトはどれも動かなかった。'
pubDate: 'May 24 2026'
tags: ['Home Assistant', 'Gemini', '音声アシスタント', '個人開発']
seeAlso: ['ha-claude-code-alexa-report', 'ha-alexa-migration-journey']
---

## はじめに

Home Assistant の Assist パイプラインに Google Gemini 2.0-flash を統合してみました。「スマホ音声入力 → STT → HA 内蔵 Agent (Gemini) → conversation trigger → Alexa Echo Dot 読み上げ」というパイプライン。基本的なセンサー読み取りや単純なデバイス操作は動く。一方で、会話履歴・ツール組み合わせ・引数つきスクリプト実行はどれもできず、「賢いアシスタント」としては力不足でした。

スマートホーム化が進んだ家で「アレクサに自然言語で質問したら、HA のセンサー / 家族の位置 / 電力データを横断して答えてくれる」という体験を作りたい。Alexa 単体ではこのレベルの統合はできないので、HA の Assist pipeline をハブにして Gemini を裏に据える構成を試しました。

## 構成

```text
スマホ音声入力
    ↓
STT (Google AI STT)
    ↓
HA 内蔵 Agent (バックエンド: Gemini 2.0-flash)
    ↓
conversation trigger (Automation)
    ↓ 両方に出力
├── スマホにテキスト表示
└── Echo Dot で読み上げ (notify.echo_dot_speak)
```

設定の要点:

1. **Google Generative AI Integration**
   - API キーは有料課金版を使用（無料枠は 1 日 20 リクエストで即枯渇）
   - モデル指定: gemini-2.0-flash。`recommended: true` のままだと 2.5-flash が選ばれて function calling に問題が出る
2. **Assist Pipeline 設定** (`assist_pipeline.pipelines`)
   - conversation_engine: `conversation.home_assistant`（HA 内蔵。conversation trigger を動かすために必要）
   - stt_engine: `stt.google_ai_stt`
   - tts_engine: `tts.google_ai_tts`
   - HA 内蔵 Agent のバックエンドを Gemini に設定
3. **Alexa Devices 公式 Integration**（HA 2025.6+）
   - `notify.echo_dot_speak` で TTS 送信
   - 人感センサー（`binary_sensor.echo_dot_motion`）・照度センサー（`sensor.echo_dot_illuminance`）も取得可能。Alexa Media Player 経由では取れなかった

Alexa 出力のための automation:

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

## できたこと / できなかったこと

できたこと:

| 機能                                            | 状態 |
| ----------------------------------------------- | ---- |
| スマホ音声 → Gemini → スマホテキスト表示        | OK   |
| スマホ音声 → Gemini → Alexa 読み上げ            | OK   |
| センサー読み取り（電気使用量、温度等）          | OK   |
| 単純なデバイス操作（おやすみモード ON/OFF）     | OK   |
| 通知スクリプト実行（引数なし）                  | OK   |
| テキスト入力 → Gemini → Alexa（スクリプト経由） | OK   |

できなかったこと:

| 問題                       | 原因                                                                         |
| -------------------------- | ---------------------------------------------------------------------------- |
| 会話履歴が保持されない     | conversation_id を渡しても記憶しない。HA 内蔵 Agent の Gemini backend の制限 |
| ツールの組み合わせ不可     | 「天気を調べて通知して」→「その機能はありません」                            |
| スクリプトに引数を渡せない | Assist のスクリプト実行は turn_on のみ。message パラメータ不可               |

## 注意点・ハマりどころ

- **agent_id の罠**: `conversation.google_ai_conversation`（entity ID 形式）は再起動後に使えなくなることがある。config entry ID を使うと安定する場合もあるが、逆にそちらが使えなくなることもある。再起動後にどちらが有効か確認が必要
- **プロンプトにツール指示を書くとクラッシュ**: Gemini が notify 等を function call しようとしてエラー
- **`notify` ドメインは Assist のツール非対応**: scripts / switches は対応している
- **無料枠は実質使えない**: gemini-2.5-flash の無料枠は 1 日 20 リクエスト

## 所感 ─ モデルは賢い、足りないのは context 管理

やってみて一番強く再認識したのは、**最近の ChatGPT / Claude / Gemini は単体ではめちゃくちゃ賢いのに、コンテキストをちゃんと管理してやらないと途端にアホになる** という当たり前の事実でした。

この実験で「動かなかった」ことの大半は、モデルの知能の問題ではない。会話履歴が保持されない・ツールを組み合わせられない・スクリプトに引数を渡せない ── どれも「モデルに必要な文脈と道具を、統合側が正しく渡せていない」という context 管理の失敗です。同じ Gemini でも、ちゃんと履歴と関数を渡してやれば賢く振る舞う。HA 内蔵 Agent はそのお膳立てが薄いので、賢いモデルが「その機能はありません」と木で鼻を括った返事をする。

LLM を製品に組み込むときの本質はモデル選定より **context の供給設計** なんだ、というのを家の音声アシスタントで地で踏んだ格好でした。

## 改善案

1. **Home Mind** ─ 永続的セマンティックメモリを持つ Conversation Agent (HACS)。ただし shodh-memory が x86 のみで RPi 非対応
2. **Extended OpenAI Conversation v2** ─ マルチターン改善版。OpenAI 互換 API 経由で Gemini も使える可能性
3. **プロンプトに固定情報を埋め込む** ─ 家族情報等をプロンプトに書いておく。簡易だが毎回同じ情報しか参照できない

## まとめ

- 「単純な質問」「単純な操作」レベルは Gemini + HA Assist で動く
- 会話履歴 / ツール組み合わせ / 引数つきスクリプトは現状動かない
- 「動かない」の正体はモデルの知能ではなく context 供給の薄さ。LLM 組み込みの肝はそこ
- 賢いアシスタントとして本格運用するなら HA 内蔵 Agent ではなく Extended OpenAI Conversation v2 などの代替が要る

## 参考リンク

- [Google Gemini ─ Home Assistant](https://www.home-assistant.io/integrations/google_generative_ai_conversation/)
- [Alexa Devices ─ Home Assistant](https://www.home-assistant.io/integrations/alexa_devices/)
- [Assist Pipeline Developer Docs](https://developers.home-assistant.io/docs/voice/pipelines/)
- [Home Mind ─ HA Community](https://community.home-assistant.io/t/home-mind-conversation-agent-with-persistent-semantic-memory/984251)
