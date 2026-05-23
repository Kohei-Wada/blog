---
title: 'supernemawashi を作った ― 同僚との会話のために心理プロファイルを管理する Claude Code plugin'
description: "「あの人にどう言えばいいか」を毎回考える疲れを、プロファイルをデータとして管理する形で解決する Claude Code plugin。Slack / Gmail / Calendar から事実を集め、心理学フレームワークで分類し、状況別の DO / DON'T ルールを返す。"
pubDate: 'May 23 2026'
tags: ['Claude Code', 'plugin', 'MCP', 'コミュニケーション', '個人開発']
---

## はじめに

同僚やステークホルダーとの会話で、「あの人にこの言い方は刺さるか、それとも地雷か」を毎回ゼロから考えるのが地味に疲れます。自分一人が頭の中で覚えていられる人数には限界があるし、そもそも忘れます。

これを **プロファイルをデータとして管理する形** で解決する Claude Code plugin として [supernemawashi](https://github.com/Kohei-Wada/supernemawashi) を作りました。

Slack / Gmail / Calendar / GitHub から事実を収集し、心理学フレームワークで分類し、状況別の DO / DON'T ルールを生成して、返信を書くときに呼び出す ── という workflow です。処理はすべてローカルで完結し、外部には何も送りません。

## なぜ作ったのか

エンジニアの仕事の大半は「人と話す」ことだ、と言うと身も蓋もないですが、実際そうです。コードを書く時間より、誰かに頼む・報告する・揉める・説得する時間のほうが長い。そしてそのすべてに対して「相手のタイプ別の最適な言い方」を毎回考えている。これが疲れる。

具体的にはこんな場面です。

- ある人に「率直すぎる言い方」をして地雷を踏んだ。次から気をつけよう、と思って忘れる
- ある人は「数字で示す」と通るが、別の人は「ストーリーで示す」ほうが通る。逆をやると無視される
- ある人は会議で詰めたほうが動くが、別の人は会議で詰めるとシャットダウンする

これを「経験で覚える」やり方は、相手の人数が増えると破綻します。覚えていない人が相手だと毎回ゼロからやり直しだし、覚えているつもりの人でも忘れていることがある。

## どう解決したか

supernemawashi の発想自体は単純です。

1. その人についての **事実**（誰がいつ何を言ったか）をデータとして記録する
2. 事実を **心理学フレームワーク** で分類する（防衛機制 / 葛藤モード / エゴ状態 / 動機 / バイアス / 愛着スタイル）
3. 分類結果から、**状況別の DO / DON'T ルール** を生成する
4. 返信を書くときに、その人のプロファイル + 該当状況のルールを呼ぶ

つまり「あの人にどう言うか」を **事前計算してファイルに置いておく**。返信のたびに考え直さない、という発想です。

プロファイルの保存場所は `~/.local/share/supernemawashi/profiles/<person-name>/` で、すべてローカル。MCP 経由で Slack / Gmail を読みに行くときも、収集したデータが手元から出ることはありません。

## Skills 構成

操作系の skill は `nemawashi-` プレフィックスで動詞先頭に統一しています。

| Skill                | やること                                                                            |
| -------------------- | ----------------------------------------------------------------------------------- |
| `nemawashi-collect`  | MCP source（Slack / Gmail / Calendar / GitHub）から事実を収集してプロファイルに書く |
| `nemawashi-analyze`  | 集めた事実を心理学フレームワークで分類し、状況別 DO / DON'T を生成                  |
| `nemawashi-show`     | プロファイルの閲覧（一覧 / 一人ドリルダウン / 状況別ルール集約）                    |
| `nemawashi-discover` | 自分が会話しているのに未プロファイルな人を MCP source から発見                      |
| `nemawashi-check`    | stale な（古い分析の）プロファイルの dashboard                                      |
| `nemawashi-note`     | 1on1 / 電話 / 廊下話など MCP で見えない事実を手動で 1 行追加                        |
| `nemawashi-reply`    | 状況に合ったフレームワークだけ load して、返信案を 2〜3 通生成                      |
| `nemawashi-migrate`  | 旧フォーマットのプロファイルを新フォーマットに変換                                  |
| `nemawashi-issue`    | 思いついた改善案を house-style に整形して GitHub issue 化                           |

基本的な workflow はこうなります。

```text
[1] /nemawashi-collect "John"
        ↓ MCP source から事実収集
[2] /nemawashi-analyze "John"
        ↓ フレームワークごとに分類、DO/DON'T 生成
[3] /nemawashi-reply "How should I reply to John about the deadline?"
        ↓ John のプロファイル + 該当フレームワークだけ load
[4] 2〜3 通の draft が返る
```

install はマーケットプレイス経由です。

```text
/plugin marketplace add Kohei-Wada/supernemawashi
/plugin install supernemawashi@supernemawashi
```

Claude Code のセッションを再起動すると、`using-supernemawashi` という entry point skill が SessionStart hook で注入され、あとは自然言語で動きます。

## 注意点・ハマりどころ

- **「人をデータ化する」ことの違和感**: プロファイルを作る対象は「自分が会話する相手」であって、監視対象ではありません。社内の他人を勝手にプロファイル化する用途には作っていない（MCP source も自分のアカウント経由でしか動かない）
- **MCP の rate limit**: Slack や Gmail を一気に叩くと制限に当たります。`--all` 系の一括操作はバッチ 5 並列で間引いています
- **stale なプロファイル**: 1 ヶ月分析していないプロファイルは信頼度が下がる。`nemawashi-check` で staleness を可視化し、`nemawashi-update --all` で一括再分析できます
- **「全員 collect」は重い**: collect は MCP 依存で時間がかかる一方、analyze はローカルファイルのみで軽い。なので 2 つの skill を分離して、分析だけ再走できるようにしています

## 結果

- プロファイルを持っている相手なら、「どう言えばいいか」を考える時間が 5 分 → 30 秒程度に圧縮された
- 「久しぶりに連絡する人」「あまり会話していない人」も、過去の Slack / Gmail から自動で事実が集まるので、初回コストが下がった
- 自分自身のプロファイルを作って自分を analyze にかけたら、自分の coping pattern が可視化されて、ちょっとセラピー的に役立った（副次効果）

## まとめ

- 「人とどう話すか」を毎回ゼロから考えるコストは、データ化で削れる
- supernemawashi は、事実収集 / 心理学分析 / 状況別ルール生成 / 返信 draft を 1 つの plugin で繋いだ
- プロファイルデータは手元から出ない。MCP source の読み込みも自分のアカウント経由のみ
- Claude Code plugin として install 可能

リポジトリはこちらです: [supernemawashi (GitHub)](https://github.com/Kohei-Wada/supernemawashi)
