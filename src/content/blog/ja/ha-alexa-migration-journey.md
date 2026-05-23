---
title: 'Home Assistant の Alexa 連携を 3 世代渡り歩いて automation を集約した話'
description: 'alexa-remote-control (SSH 経由) → Alexa Media Player (HACS) → Alexa Devices (公式 integration) と移行を重ねた記録。位置通知・電力レポートなど 75 個のオートメーションを一括生成し、64 個の位置通知を動的 zone trigger + Jinja で 2 個に集約。ChatGPT スキル構築では Amazon developer アカウントの罠にもハマった。'
pubDate: 'May 23 2026'
tags: ['Home Assistant', 'Alexa', '個人開発']
seeAlso: ['ha-claude-code-alexa-report', 'ha-alexa-remote-control-tts']
---

## はじめに

Home Assistant (HA) から Echo Dot を喋らせる仕組みを、3 世代に渡って移行した記録です。最初は SSH 経由でコマンドを叩く `alexa-remote-control`、次に HACS の Alexa Media Player、最後に HA 2025.6 で入った公式 `Alexa Devices` integration。同時期に Python スクリプトで 75 個のオートメーションを一括生成し、後日 64 個の位置通知を 2 個に集約するという「乱立 → 集約」の運用フェーズも踏みました。さらに Alexa から ChatGPT を呼ぶカスタムスキルも組もうとして、Amazon developer アカウントの罠に綺麗に落ちました。

「HA から Echo Dot を喋らせたい」というニーズは初期からあった。誰がどの zone に出入りしたか、消費電力が跳ねたか、雨が降りそうか ── そういうイベントを Echo Dot に喋らせたい。ただ Alexa 側は公式に「ローカル HA から TTS を投げる」API を長らく出していなかったため、コミュニティ製の hack を継ぎ足してきた歴史があり、3 世代分の移行を順番に踏むことになりました。

## 3 世代の整理

| 世代    | 仕組み                                                   | 入手元                             |
| ------- | -------------------------------------------------------- | ---------------------------------- |
| 第1世代 | alexa-remote-control を SSH 経由で叩く                   | コミュニティ製スクリプト           |
| 第2世代 | Alexa Media Player の notify.alexa_media_echo_dot        | HACS (alandtse/alexa_media_player) |
| 第3世代 | Alexa Devices 公式 integration の notify.<device>\_speak | HA Core 2025.6+                    |

### 第1世代: alexa-remote-control (SSH 越し)

```text
HA → SSH (port 2222) → alexa-remote-control → Amazon 非公開 API → Alexa 発話
```

`shell_command.alexa_speak` を経由してアドオンに SSH 接続し、内部で `alexa-remote-control` を実行する形。動くが、SSH 経由なので遅延がある・shell 文字列のエスケープが脆い・2 段階認証で詰まることが多い。（この世代の詳細は別記事に切り出しています。）

### 第2世代: Alexa Media Player (HACS)

```text
HA → notify.alexa_media_echo_dot → Alexa 発話
```

整備手順:

- HACS から custom repository として `alandtse/alexa_media_player` を追加
- Amazon の 2 段階認証アプリキー（52 文字）を取得して integration の設定に貼る
- Echo Dot が `media_player.echo_dot` として認識されること、`notify.alexa_media_echo_dot` で TTS が通ることを確認

既存 automation の一括移行は単純で、`automations.yaml` の `shell_command.alexa_speak` を `notify.alexa_media_echo_dot` に全置換するだけ（当時 20 個）。

### 第3世代: Alexa Devices (公式 integration)

HA Core 2025.6 で `Alexa Devices` integration が公式に入った。`notify.<device>_speak` という entity を提供してくれる。公式版に乗り換えるメリットは大きい:

- 設定が GUI で完結（HACS リポジトリ追加不要）
- 人感センサー (`binary_sensor.<device>_motion`) や照度センサー (`sensor.<device>_illuminance`) が取れる。Alexa Media Player では取れなかった付加情報
- メンテナンスが HA 本体に乗るので、Amazon 側仕様変更への追従が早い

ただし `notify.<x>_speak` は後に Amazon 側で `Alexa.Speak` API が事実上 deprecate され、200 OK は返るが無音になる。現状は `notify.<x>_announce`（チャイム付き）に乗り換える必要がある ── これは別記事の領域です。

## 75 個のオートメーションを Python で一括生成

第2世代に乗り換えた直後、家のイベントを片っ端から Echo Dot に喋らせるべく Python スクリプトで automation を一括生成しました。内訳:

| カテゴリ       | 数  | 内容                                                      |
| -------------- | --- | --------------------------------------------------------- |
| 家族の位置通知 | 64  | 家族 4 人 × 各自の zone（家・最寄り駅・職場・通院先など） |
| バッテリー低下 | 5   | 全スマホ + iPad（20% 以下で通知）                         |
| 消費電力異常   | 1   | 2000W 超が 5 分続いたら通知                               |
| 天気変化       | 2   | 雨、大雨                                                  |
| 朝の天気予報   | 1   | 毎朝 7:00                                                 |
| 時報           | 1   | 8:00〜22:00 の毎時                                        |
| 電力レポート   | 1   | 毎日 21:00                                                |

位置通知だけで 64 個ある。「家族 × zone」の組み合わせで個別 automation を吐くアプローチで、初期投入はそれで足りるが、後で zone を増やすたびに automation を増産することになる。これは後段で集約します。

### 日次電力消費量センサー

21 時の電力レポートを出すために、`configuration.yaml` に `utility_meter` を追加:

```yaml
utility_meter:
  daily_energy_consumption:
    source: sensor.smart_meter_total_consumption
    name: '今日の消費電力'
    cycle: daily
```

これで日次の消費電力センサーが生成され、毎日 0 時にリセットされる。21 時のレポート内容は、今日の消費電力量 (kWh) / 現在の消費電力 (W) / CO2 強度 (gCO2eq/kWh、Electricity Maps 連携) / 化石燃料の割合 (%)。

## 位置通知 64 個 → 2 個への集約

しばらく運用したあとで「人 × zone」の個別 automation を 2 個に畳みました。

- `alexa_speak_person_enter_zone`
- `alexa_speak_person_leave_zone`

どちらも `mode: parallel` / `max: 10`、各家族の `person.*` entity の state trigger を一括 subscribe する。`variables` ブロックの Jinja テンプレで人名と zone 名を動的に埋めて、1 行で発話させる。

このパターンの効きどころは、新しい zone を追加しても automation 側を一切いじらなくていい点。`zones.yaml` に zone を足すだけで自動的に新 zone への enter/leave が発話対象になる。

64 個の総当たりを最初から狙わなかったのは正解だった。先に個別で量産して zone データ構造が固まってから集約に倒すほうが、抽象化の的を外さない。

## Alexa × ChatGPT スキルと Amazon developer の罠

Alexa に話しかけた内容を OpenAI API (GPT-4o-mini) に投げて回答させるカスタムスキルも組みました（`k4l1sh/alexa-gpt` ベース、Alexa-hosted Python、`GptQueryIntent` + `AMAZON.SearchQuery` スロット。samples には `{query}` 単体は使えずキャリアフレーズ必須）。

ここで一番時間を溶かしたのが Amazon developer アカウントの罠です。

- `developer.amazon.co.jp` は **存在しない**（DNS 解決できない）
- `developer.amazon.com` に amazon.co.jp のアカウントでログインしようとするとパスワードエラー
- 原因: amazon.com と amazon.co.jp で同じメールアドレスを使っている場合、パスワードが競合する
- 解決: amazon.co.jp 側のパスワードを変更して、amazon.com と異なるものにする

知らないと「パスワード絶対あってるのに通らない」で数時間溶かします。

## SSH add-on から HA を触るときの所有権

`ssh` で入るユーザー (uid 1000) は `/homeassistant/` 配下を書き換えるのに `sudo` 必須（root 所有 644）。同等の `/config` は read-only mount でそもそも書けない（add-on のサンドボックスっぽい）。実体は `/homeassistant/` 側。

HA CLI (`ha core check` / `ha core reload`) は token 必須でエラーになる。`ha` の auth は SSH add-on shell には注入されていない。SSH から automation を reload したいなら HA Core REST API を直接叩くしかなく、`.storage/auth` の `jwt_key` で短期 JWT を mint すれば新規 token 発行なしで Bearer auth が通る。

## まとめ

- HA → Alexa 発話は alexa-remote-control → Alexa Media Player → Alexa Devices と 3 世代の移行を経て公式 integration に到達した
- 個別 automation を量産するフェーズと、それらを動的 trigger + Jinja で集約するフェーズの両方を踏むのが現実的（最初から集約を狙うと zone データ構造が固まらない）
- ChatGPT スキルを Alexa に組むなら、まず Amazon developer アカウントの amazon.com / amazon.co.jp パスワード競合を片付けてから着手すること

## 参考リンク

- [Alexa Devices ─ Home Assistant](https://www.home-assistant.io/integrations/alexa_devices/)
- [alandtse/alexa_media_player (HACS)](https://github.com/alandtse/alexa_media_player)
- [k4l1sh/alexa-gpt](https://github.com/k4l1sh/alexa-gpt)
- [Utility Meter ─ Home Assistant](https://www.home-assistant.io/integrations/utility_meter/)
- [Electricity Maps API](https://www.electricitymaps.com/)
