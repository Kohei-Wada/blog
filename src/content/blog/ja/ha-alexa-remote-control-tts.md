---
title: '公式 integration が無かった頃、Alexa を喋らせるために非公式 API を叩いていた話'
description: 'Home Assistant から Echo Dot を喋らせる公式手段が無かった頃、Amazon の非公開 Alexa API を alexa-remote-control 経由で叩く自作セットアップを組んでいた。refresh token の取り方、SSH 越しに HA から叩く構成、そして結局なぜ公式 integration に移ったか。'
pubDate: 'May 23 2026'
tags: ['Home Assistant', 'Alexa', 'リバースエンジニアリング', '個人開発']
seeAlso: ['ha-claude-code-alexa-report']
---

## はじめに

今でこそ Home Assistant には Alexa Devices の公式 integration があって、`notify.<device>_announce` を叩けば Echo Dot が喋ります。[Claude Code の進捗を Alexa に読み上げさせる仕組み](/ja/blog/ha-claude-code-alexa-report) もこの公式経路の上に乗っています。

でも少し前まで、HA から Echo を喋らせる手軽な公式手段は無かった。Amazon は Alexa の TTS を公開 API として提供していないからです。当時やっていたのは、**Amazon の非公開 Alexa API を `alexa-remote-control` 経由で叩く自作セットアップ**でした。この記事はその「非公式 API 時代」の構成と、なぜ最終的に公式へ移ったかの記録です。

## 仕組み: 非公開 API を refresh token で叩く

中核は [alexa-remote-control](https://blog.loetzimmer.de/2021/09/alexa-remote-control-shell-script.html)（loetzimmer 氏のシェルスクリプト）です。これは Alexa アプリが内部で使っている非公開 API を、ブラウザのログインで得た refresh token で叩くもの。公式 API ではないので、Amazon 側の仕様変更で壊れるリスクを常に抱えています。

流れはこうでした。

```text
HA → SSH (port 2222) → alexa-remote-control → Amazon 非公開 API → Echo Dot 発話
```

HA から SSH 越しにスクリプトを起動し、それが Amazon の非公開エンドポイントを叩いて Echo を喋らせる、という多段構成。「公式 integration が無いなら、アプリと同じ API を自分で叩けばいい」という発想です。

## refresh token を取る

スクリプトを動かすには Amazon アカウントの refresh token が要ります。`alexa-remote-control` 同梱の `cli.js`（内部で alexa-cookie を使う）でログインフローを回して取得します。

```bash
node cli.js -a "ja_JA"
```

実行すると `http://127.0.0.1:8080/` でローカルにログインフォームが立つので、そこに Amazon の認証情報を入れる。成功すると、こういう出力が返ってきます（実値はマスク済み）。

```text
=======================================================================
Some of this data might be useful to you for additional token retrieval
 Please store in a safe place ...
=======================================================================
 macDms: {"device_private_key":"<...>"}{key:<...>}{iv:<...>}{name:<...>}{serial:<...>}
 ----------------------------------------------------------------------
 deviceSerial: <REDACTED>
=======================================================================
 refreshToken: <REDACTED>
=======================================================================
```

この `refreshToken` を環境変数で渡すラッパーを噛ませると取り回しが楽になります。

```sh
#!/bin/sh
# alexa.sh wrapper script
export REFRESH_TOKEN='<REDACTED>'
export LANGUAGE='ja-JP'
export TTS_LOCALE='ja-JP'
export AMAZON='amazon.co.jp'
export ALEXA='alexa.amazon.co.jp'

$HOME/Projects/alexa/alexa-remote-control/alexa_remote_control.sh "$@"
```

日本のアカウントなので `AMAZON` / `ALEXA` を `amazon.co.jp` 系に向けるのがポイント。ここを `.com` のままにすると認証が通りません。

## なぜ公式 integration に移ったか

このセットアップは動きはしたものの、非公式 API ゆえの脆さが常につきまといました。

- **token の寿命と 2 段階認証**: refresh token は永続ではなく、Amazon 側のセッション・2FA 仕様変更で再取得が必要になる
- **API 変更で無言で壊れる**: 公開契約のない API なので、ある日突然 Echo が喋らなくなる
- **多段構成のもろさ**: HA → SSH → シェルスクリプト → 非公開 API、と段が多く、どこか 1 つコケると全部止まる

なので、選択肢が出てきた順に乗り換えていきました。

1. **alexa-remote-control（非公式 API / SSH）** ← この記事
2. **Alexa Media Player（HACS, `alandtse/alexa_media_player`）** — 同じく非公式 API ベースだが HA integration として扱える。`shell_command` で叩いていた発話を `notify.alexa_media_echo_dot` に置き換えた
3. **Alexa Devices（公式 integration）** — ようやく登場した公式経路。今はこれ

「非公式 API を自分で叩く」から「HACS の integration」へ、最後に「公式 integration」へ。手数と脆さが一段ずつ減っていく移行でした。

## まとめ

- 公式 integration が無かった頃は、Alexa を喋らせるのに Amazon の非公開 API を `alexa-remote-control` で叩いていた
- refresh token を `cli.js` で取り、環境変数ラッパー経由で HA から SSH で起動する多段構成
- 非公式 API ゆえに token 失効・仕様変更・多段構成のもろさが常にあり、最終的に公式 Alexa Devices integration へ移行した
- 「アプリと同じ API を自分で叩けばいい」という割り切りは、公式手段が無い時期の橋渡しとしては有効だった

## 参考リンク

- [Alexa Remote Control Shell Script (loetzimmer)](https://blog.loetzimmer.de/2021/09/alexa-remote-control-shell-script.html)
- [Alexa Media Player (alandtse/alexa_media_player)](https://github.com/alandtse/alexa_media_player)
- [Alexa Devices integration (Home Assistant)](https://www.home-assistant.io/integrations/alexa_devices/)
