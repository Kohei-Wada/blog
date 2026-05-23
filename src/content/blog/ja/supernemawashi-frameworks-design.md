---
title: 'supernemawashi の心理学フレームワーク 6 種統合 ─ 1 framework = 1 file × 並列 agent 構成'
description: 'supernemawashi の analyze skill は、6 つの心理学フレームワーク（防衛機制 / TKI / TA / 動機 / バイアス / 愛着）を 1 framework = 1 file × 1 parallel agent で並走させる。なぜ monolithic な profile を捨てて framework ごとに分離したか、registry の single source of truth 化、状況別ルール生成までの全体設計。'
pubDate: 'May 24 2026'
tags: ['Claude Code', 'supernemawashi', '心理学', '個人開発']
seeAlso: ['supernemawashi-intro']
---

## はじめに

[supernemawashi](https://github.com/Kohei-Wada/supernemawashi) の `nemawashi-analyze` skill は、profile を 1 つの monolithic file として持つのをやめて、**1 framework = 1 file × 1 parallel agent** の構成にしました。6 つの心理学フレームワーク（防衛機制 / Thomas-Kilmann / Transactional Analysis / Core Motivators / Cognitive Biases / Attachment Style）を、並列に走る agent が独立に分析する。なぜそうしたか、どう実装したかを書きます。

最初の supernemawashi (v1.x) は、profile を 1 つの markdown file (`profile.md`) に書いていました。心理学的な分析もその中の 1 セクション。これだと問題が出ます。

- 「新しい framework を 1 つ足したい」と思っても、monolithic ファイルの中の構造を書き換える必要がある
- analyze を再走するたびに **既存の他 framework の分析もすべて消えて上書きされる**
- framework ごとに独立した signal（事実）が混ざって、どの判断がどの根拠から来たか追跡できなくなる
- 並列化したくても 1 file への書き込み競合が発生する

## 1 framework = 1 file × 1 agent

profile を framework ごとに分解します。

```text
PROFILE_DIR/<person-name>/
├── profile.md                          ← slim index (Core Pattern + summary table のみ)
├── facts.jsonl                          ← 事実 (collect の出力)
└── frameworks/
    ├── defense-mechanisms.md            ← framework ごとの classification + 根拠 + DO/DON'T
    ├── thomas-kilmann-tki.md
    ├── transactional-analysis-ta.md
    ├── core-motivators.md
    ├── cognitive-biases.md
    └── attachment-style.md
```

各 framework file が**完全に独立**。1 個 update するときに他 5 個に触らない。

### Framework registry を single source of truth にする

frameworks の slug / display name / tier は **1 つの table** が source of truth:

| Slug                        | Display name        | Tier |
| --------------------------- | ------------------- | ---- |
| `defense-mechanisms`        | Defense Mechanisms  | 1    |
| `thomas-kilmann-tki`        | Conflict Mode (TKI) | 1    |
| `transactional-analysis-ta` | Ego States (TA)     | 1    |
| `core-motivators`           | Core Motivators     | 1    |
| `cognitive-biases`          | Cognitive Biases    | 1    |
| `attachment-style`          | Attachment Style    | 2    |

Tier 1 = default で analyze、Tier 2 = signal 密度が十分な場合のみ analyze（薄かったら Data Gap として明示）。新しい framework を足すときの手順:

1. registry table に行を追加
2. `frameworks/<slug>.md` を contract に従って作成
3. `nemawashi-reply` の situation→framework 優先度 mapping を更新（必要なら）
4. `scripts/check-frameworks.sh` で registry と実 file が一致することを確認

registry と実体の drift を検知する script があるので、片方だけ追加して壊れる事故が起きない。

### 並列 agent dispatch

`nemawashi-analyze` の処理フロー:

```text
[1] 共通入力を読む（profile.md + facts.jsonl）
        ↓
[2] registry の framework 数だけ agent を並列 dispatch
    ┌─ agent: defense-mechanisms     ──┐
    ├─ agent: thomas-kilmann-tki     ──┤
    ├─ agent: transactional-analysis ──┤  並列実行
    ├─ agent: core-motivators        ──┤
    ├─ agent: cognitive-biases       ──┤
    └─ agent: attachment-style       ──┘
        ↓ 全 agent 完了を待つ
[3] 合成パス（synchronous）
    - profile.md の Framework Summary table を更新
    - Core Pattern を再導出
```

各 agent は **`facts.jsonl` を読み、自分が担当する framework の `frameworks/<slug>.md` を書く** だけ。他 agent と一切共有 state を持たない。合成パスは結果を集約するだけで再分析しません。

## Framework file の中身

各 `frameworks/<slug>.md` は同じ contract に従う:

```text
---
framework: Defense Mechanisms
tier: 1
output_label: Defense Mechanisms
---

# Defense Mechanisms

## Purpose
（この framework が何を明らかにするか）

## Classification Guidance
（事実から signal を抽出する手順）

## Reference Table
（mechanism / definition / observable signals / DO / DON'T の対応表）

## Rule Generation
（classification → 状況別ルールへの変換規則）

## Signal Tags
（事実 jsonl に埋める tag フォーマット）
```

例として、防衛機制 file の reference table から 2 行:

| Mechanism          | Observable Signals                     | DO                                          | DON'T                                    |
| ------------------ | -------------------------------------- | ------------------------------------------- | ---------------------------------------- |
| Rationalization    | 失敗時の長い説明 / "because..." の連鎖 | 理由を validate してから future に redirect | 正当化に直接反論する                     |
| Passive Aggression | "やります" + 動かない / 戦略的遅延     | 行動を中立的に名指す                        | "you're being passive-aggressive" と呼ぶ |

agent は事実をこの table と照合して signal をタグ付け、dominant な mechanism を判定、状況別ルールを生成します。

### Situation Categories

DO/DON'T ルールは状況カテゴリでインデックスする。`nemawashi-reply` 側はこの category と situation を見て、必要な framework file だけ load する設計:

| Category              | 想定状況                    |
| --------------------- | --------------------------- |
| When Requesting       | 自分が相手に何かを頼む      |
| During Conflict       | 揉めている / 緊張がある     |
| When Reporting        | 良い / 悪いニュースを伝える |
| Routine Collaboration | 日常的なやりとり            |

reply 時に全 framework を load せず、状況に応じて 2-3 framework に絞る。これで context window のコストも下がります。

## 注意点・ハマりどころ

- **registry と実 file の drift**: 最初は手動同期だったが必ず壊れる。`check-frameworks.sh` を pre-commit に入れて自動検知に変えた
- **並列 agent の race**: 各 agent が同じ `frameworks/<slug>.md` に書くと当然壊れる。1 agent = 1 file に厳密に対応させて回避
- **agent が共有 state を持ちたくなる誘惑**: 「他 framework の結果も見て補正したい」と思いたくなる場面がある。それをやると monolithic 設計に逆戻りなので禁止し、補正は合成パスで synchronous にやる
- **Tier 2 framework のしきい値**: attachment-style は signal が薄い場合が多いので Tier 2 にした。「分からない」を Data Gap として明示する判定基準を framework 側に持たせる必要があった

## 結果

- 新 framework 追加が「table + file + reply mapping」の 3 ステップで完結。既存の他 framework に一切触らない
- analyze の再走で他 framework が壊れない
- 並列 dispatch により、6 agent 同時走行で wallclock がほぼ 1 framework 分まで縮んだ
- 各 framework file が独立読み取り可能で、好きな framework だけ見られる（`nemawashi-show <person> --framework=defense-mechanisms` 等）

## まとめ

- monolithic な profile.md を捨て、1 framework = 1 file × 1 agent に分解
- framework registry を single source of truth にし、drift を check script で検知
- 並列 dispatch で wallclock を短縮、合成は synchronous に保つ
- 状況別 framework loading で reply 時の context cost を抑える

## 参考リンク

- [supernemawashi (GitHub)](https://github.com/Kohei-Wada/supernemawashi)
- [Thomas-Kilmann Conflict Mode Instrument](https://kilmanndiagnostics.com/overview-thomas-kilmann-conflict-mode-instrument-tki/)
- [Transactional Analysis (Eric Berne)](https://en.wikipedia.org/wiki/Transactional_analysis)
- [Self-Determination Theory (Deci & Ryan)](https://selfdeterminationtheory.org/)
- [Attachment Theory (Bowlby & Ainsworth)](https://en.wikipedia.org/wiki/Attachment_theory)
