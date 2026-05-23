---
title: 'AI に書かせても "自分で書いた感じ" を失わない workflow ─ vault provenance で境界を引く'
description: '「AIで書いた感じ」の核は thinking-ownership の喪失。prompt 単位で AI 境界を引くのは judgement cost が高すぎる。workflow 単位で固定する（vault → AI summary → blog）と、構造的に thinking-ownership が保たれる。'
pubDate: 'May 23 2026'
tags: ['AIワークフロー', '文章術', 'Zettelkasten', '個人開発']
seeAlso: ['zettelkasten-operation-part1-design']
---

## はじめに

「AI を全面禁止」というルールは粗すぎます。私自身、`knowledge-gardener` / `supernemawashi` / `taskdog` / `ttymap` の開発で AI を全力で使っていながら「自分で考えていない感じ」は出ていない。一方、blog を「X について 1500 字書いて」と AI に投げると一発で「AI で書いた感じ」になる。

何が違うのか。整理すると、build と write では **奪われる層が違う** ことに気づきます。

- **build**: AI 担当 = typing / boilerplate / lookup / 実装の細部。自分担当 = 何を作るか / どう設計するか / なぜ必要か → thinking layer は自分側
- **write**: AI 担当 = 角度 / 例 / 主張 / 結論 → これ全部 thinking layer

つまり「AI で書いた感じ」の core は **thinking-ownership の喪失** であって、AI 使用そのものではない。本記事はその解像度を上げ、境界を prompt ではなく workflow に倒す話です。そして本記事自体が、後述するワークフローで書かれた検証材料の一つでもあります。

## 思考レイヤと表面レイヤを分ける

ルールを書き直すとこうなります。

- ❌ **思考レイヤを AI に任せる**: 角度 / 主張 / 例 / 比較 / 結論 / 全体の流れ
- ✅ **表面レイヤを AI に任せる**: typo / 文法 / 翻訳 / 論理 sanity check / 事実確認 / 整形 / 重複指摘 / 抜けの質問

これは「ルールの緩和」ではなく、**ルールの解像度を上げて守りたいものを正確に守る** 作業です。

ただし、これを prompt 単位で毎回引き直すと judgement cost が残る。書くたびに「いま AI に思考させていないか？」を判定し続けるのは疲れます。

## 順序を逆にする ─ prompt ではなく workflow で守る

```text
[従来]                              [workflow に倒した割り切り]
prompt 設計で境界を引く             思考は事前に vault に溜まっている
→ 書く瞬間に AI を制御する          → AI に渡す時点で思考は既に終わっている
                                    → AI は思考者ではなく要約者
```

時系列のシフトで境界を守るのではなく、**vault の provenance** で守る。

| 層     | 中身                             | workflow での扱い                     |
| ------ | -------------------------------- | ------------------------------------- |
| 体感面 | 自分の指でタイプしたか           | 捨てる（AI 要約で OK）                |
| 構造面 | 思考が誰のものとして残っているか | vault commit log が provenance を担保 |

体感面を捨てて構造面に倒す。vault に思考の git history が残る限り、blog 段階で AI が文面を書いても「自分が考えた」という事実は変わりません。

## blog 1 本書くときの workflow

```text
[1] 通常の vault 運用で思考過程を蓄積（fleeting → permanent）
[2] blog 化したいとき、自分で source note を選ぶ      ← thinking layer
[3] 自分で記事の outline を書く（角度・主張・順序）   ← thinking layer
[4] AI に「この outline + これらの note で N 字記事に圧縮」を依頼
[5] AI 出力を自分が check（角度になっているか / claim が抜けていないか）  ← thinking layer
[6] 自分の指で書き直し（articulation 段階で介入）    ← thinking layer
[7] publish
```

[1]-[3] と [5]-[6] が thinking layer。AI が触れるのは [4] と部分的な [6] の参考材料生成のみです。

副次効果として、自作 [knowledge-gardener](https://github.com/Kohei-Wada/knowledge-gardener) plugin の **dogfood** が走り、vault → AI 要約 → blog という workflow 自体が **distribution material**（このような記事）になります。

## 注意点・ハマりどころ

- **vault に十分な思考蓄積がない記事を AI に書かせるべきでない**。要約元が薄いと AI が thinking layer を補完してしまい、結局「AI で書いた感じ」が戻る
- つまり vault の **蓄積密度** が blog 化可能性の前提条件になる
- cadence 問題（私の場合 9 ヶ月 4 記事 = 0.44 本/月）は「AI を使うか」ではなく **「vault 蓄積が thin な領域で blog 化を試みている」** 可能性が高い
- 「AI 全面禁止」を解除する前に、vault に書く習慣のほうを先に作る

## 結果

- prompt 単位で AI 境界を判定する judgement cost が消えた
- vault → blog の workflow に乗った記事は AI を使っても「自分のもの」と感じられる
- 「書けないから vault に書く」が成立し、書いた思考が後で記事化される自然な path ができた
- 結果として、本記事も上述の workflow で書かれた最初の検証材料の一つになっている

## まとめ

- 「AI で書いた感じ」の core は **thinking-ownership の喪失**。AI 使用そのものではない
- ルールの解像度を上げる: thinking layer は自分、surface layer は AI
- それを prompt 単位ではなく **workflow 単位で固定**: vault → AI summary → blog
- 守られるのは **vault provenance**。git history が「誰が考えたか」を担保する

この draft の thinking layer（角度・主張・例・結論）は私の Obsidian vault の permanent note に由来します ── [その vault の運用方法はこの記事](/ja/blog/zettelkasten-operation-part1-design/)に書きました。本記事は surface layer の体裁化のみ AI 介在 ── つまり、ここに示した workflow の最初の検証材料の一つです。
