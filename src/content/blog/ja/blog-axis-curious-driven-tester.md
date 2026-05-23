---
title: 'このブログの軸を「何かを試す人」に置き直すことにした'
description: 'topic 縛りの blog 運営に何度も失敗したので、軸を topic ではなく process に置き直した。9 ヶ月で 4 記事しか出なかった原因と、気まぐれを load-bearing にする戦略変更の話。'
pubDate: 'May 23 2026'
tags: ['ブログ運営', 'Zettelkasten', '個人開発']
seeAlso: ['ai-writing-thinking-ownership-workflow']
---

## はじめに

過去 9 ヶ月で blog 記事を 4 本しか出せませんでした。理由を観測事実から逆算したら、topic で縛ろうとしていたことが原因だった。だから topic thread ではなく process thread で書く ── つまりブログの軸を「何かを試す人」に置き直すことにした、という話です。

## 4 記事は topic ではばらばらだった

私が書いた過去 4 記事は次のようなラインナップです。

- AWK→Haskell pipeline（言語実験）
- Astro でブログ始めました（meta）
- GhostBSD（OS 試用記）
- git worktree なしで Claude Code 並列開発（workflow tip）

topic で見るとばらばら（言語 / meta / OS / AI workflow）。「shell+FP の人」「Claude Code エキスパート」「BSD/Linux 探究者」など、どの軸を取ろうとしても 1 軸では足りなかった。だから書こうとするたびに「この topic は俺の軸と合うか？」と悩み、結局書かない、というパターンを繰り返してきました。

## topic thread ではなく process thread で書く

観測事実を逆方向から見ると、4 記事には共通点があります。**「気になって試した → 書いた」** という process では全く同じ形をしている。

topic thread と process thread を並べると違いがはっきりします。

| 軸                   | topic thread     | process thread                  |
| -------------------- | ---------------- | ------------------------------- |
| 何を thread にするか | 何について書くか | どう生きているか                |
| audience             | topic 周辺       | personality 周辺                |
| SEO / 権威構築       | 強い             | 弱い                            |
| 気まぐれとの整合     | 矛盾             | 内包可能                        |
| 先例                 | 専門ブログ全般   | @simonw / @karpathy / @levelsio |

私は気まぐれな性格で、興味があるときは全力で動けるが、矯正されるとやる気を失う。これは欠点ではなく load-bearing な制約で、grain と一致しない戦略は中長期で必ず失敗する。だから topic thread を採れば必ず止まる。

process thread で identity を再定義すると一発で決まります。

> **好奇心駆動でモノを試す developer**

試す対象は流動して構わない（それが thread）。評価軸も「topic が一貫しているか」ではなく「**試した過程の正直さ**」に切り替わります。

## 実運用に落とす

- 記事ごとに topic が違っても問題なし。今週ハマっているものを 1 記事化する
- 試してみてうまくいかなかったケースも書く（process thread では「失敗 → 学び」も同じ thread に乗る）
- SEO 権威構築ではなく personality / voice を thread にする
- 矯正前提の Phase（「週 2 記事を投下」など）は採用しない

## 注意点・ハマりどころ

- **「気まぐれを直して継続力をつける」は最初からルートを誤っている**。性格特性の矯正には膨大なエネルギーが要る上に、矯正後の自分が "本人" であり続ける保証も無い
- **「効率」より先に「自分の grain で続くか」を見る**。続かない戦略は採用してはいけない（採用した時点で失敗が確定する）
- **Zettelkasten の original purpose は「出力」**。permanent note を蓄積することは出力を支える _手段_ であって、それ自身を目的にすると本末転倒。9 ヶ月 4 記事の cadence 問題は「蓄積は機能しているが出力が止まっている」結果として説明できる

## 結果

- 「この topic は軸に合うか」で書く前に止まる、というパターンが消えた
- 既存 4 記事を「失敗」ではなく「既に identity を体現していた素材」として扱えるようになった
- このブログ自体が、process thread の最初の検証材料になる

## まとめ

- 過去 4 記事は topic ではばらばらだが process では coherent していた
- 軸を topic ではなく process（「何かを試す人」）に置き直す
- 気まぐれを load-bearing にし、矯正前提の戦略は採用しない
- Zettelkasten の目的は出力。蓄積は手段であって目的ではない
