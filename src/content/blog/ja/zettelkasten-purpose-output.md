---
title: 'vault を育てる plugin を作ったのに、Zettelkasten の本来の目的は「出力」だった'
description: '9 ヶ月で 4 記事しか出ない停滞を診断したら、Zettelkasten の目的は出力 (C) ひとつで、検索性 (A) と洞察の結晶化 (B) は手段、決定ログ (D) は外来要素だった。vault を育てる knowledge-gardener を作り込むほど手段が目的化しかける、その綱引きの記録。'
pubDate: 'May 24 2026'
tags: ['Zettelkasten', 'PKM', '個人開発']
seeAlso: ['knowledge-gardener-when-how-separation', 'blog-axis-curious-driven-tester']
---

## はじめに

vault（Obsidian の Zettelkasten）を育てるために、CRUD を自動化する Claude Code plugin まで自作しました。なのに記事は 9 ヶ月で 4 本しか出ていない。「蓄積は増えるのに出力が動かない」この感覚を診断したら、Zettelkasten の本来の目的は **出力 (C) ひとつ** で、検索性 (A) と洞察の結晶化 (B) はそれを支える _手段_、決定ログ (D) は後付けの _外来要素_ だった、という整理に行き着きました。そして、vault を育てる道具を作り込むほど、手段の側が目的化しかける。その綱引きの話です。

私は数年 Obsidian で Zettelkasten をやっています。fleeting → reference → permanent と段階を分け、note は wikilink ではなく standard markdown link で繋ぎ、tag namespace も整えた。最近はそれを Claude Code から CRUD する plugin（[knowledge-gardener](https://github.com/Kohei-Wada/knowledge-gardener)）まで自作して、note を plant（新規）/ water（追記）/ connect（リンク）/ prune（剪定）/ survey（検索）できるようにした。

道具立てだけ見れば順調です。permanent note は毎月増える。検索すれば過去の自分にすぐ届く。

なのに **blog 記事は 9 ヶ月で 4 本** しか出ていない。そして「vault が膨張しているのに、有効活用できている気がしない」という違和感がずっと残っていた。蓄積は増える。検索性も上がる。道具も作った。それでも出力が動かない。この非対称はどこから来るのか。

## 1 目的 + 2 手段 + 1 外来

原点に戻ると話が早かった。

- Niklas Luhmann は約 90,000 枚の Zettel から 70 冊の本と 400 本以上の論文を書いた。本人いわく「書いたのは Zettelkasten」。
- Sönke Ahrens『How to Take Smart Notes』(2017) は「白紙からの執筆」をなくすために常に蓄積から書く、と framing する。fleeting / literature / permanent の分離は **writing pipeline の段階分け** にほかならない。

どちらも目的は **writing = 出力** です。permanent note は、出力の素材として存在している。

ここから、Zettelkasten が抱える要素を「1 目的 + 2 手段 + 1 外来」に並べ直せます。

| 役割       | 内容                                  | 成功指標            |
| ---------- | ------------------------------------- | ------------------- |
| **目的 C** | 出力（外部成果物の生産）              | 公開記事数 / 月     |
| **手段 A** | 検索性（過去 note に即到達）          | 到達時間            |
| **手段 B** | 洞察結晶化（atomic permanent の蓄積） | permanent 純増 / 月 |
| **外来 D** | 決定の記録                            | （ZK では扱わない） |

A は ZK の **infrastructure**（連番・相互参照）、B は **mechanism**（1 note 1 idea の atomic 化）に対応する。どちらも ZK の運用そのものだから、捨てる選択肢はない。だが **それ自身を主目的に据えると本末転倒** になる。permanent がいくら積み上がっても、出力されなければ ZK 本来の効用は出ない。

ここで自分の作った道具を見直すと、位置づけがはっきりしました。**knowledge-gardener がやっているのは、ほぼ全部 A と B だ。**

- survey / connect → A（検索性・到達性の維持）
- plant / water → B（atomic note の蓄積と結晶化）
- prune → A/B の保守（腐った note の除去）

つまり私は、**手段 (A/B) を磨く道具を一生懸命作っていた**。目的 (C) を回す部分は、道具の外 — blog 側 — にずっと放置されていた。蓄積が増えるのに出力が動かない非対称は、当然の帰結だった。道具が手段の側にしかなかったのだから。

## 悩みは全部「C が見えていない」症状だった

この枠組みは、これまで vault に書き溜めてきた「ZK 運用の悩み」をきれいに説明し直してくれます。悩みは個別の問題ではなく、全部「目的 (C) が見えていない / 手段が目的化している」症状だった。

- **permanent が参照メモ化している** → B が機能していない。atomic な思考の結晶ではなく、web の写しが置かれている。原因は C に接続されていないから、refine する動機が湧かないこと。
- **記事化して FB を得るループが回らない** → C 不全そのもの。これが ZK の本来の目的なので、ここが止まると全体が崩れる。
- **tag や MOC を直すのに時間を溶かす** → A の保守。必要だが、保守そのものが目的化したら、それは ZK ではなく図書館分類だ。

道具の側にも同じ補助線を引けます。knowledge-gardener には実は C を回すための skill（garden-recap、そして plant で blog draft を起こす経路）も用意してある。だが C は「道具がやってくれる」ものではなく、**自分が書く** ことでしか動かない。道具にできるのは、書ける状態の素材を A/B で維持しておくところまで。

そして今書いているこの記事こそが、その C です。vault に溜めた「Zettelkasten の本来の目的は出力」という permanent note を素材に、出力を一本起こしている。道具で耕した畑から、ようやく収穫している格好になります。

## 注意点・ハマりどころ

- **道具を作るほど、手段が目的化しやすい**。vault を育てる plugin を書くのは楽しいし、permanent を磨くのも気持ちいい。だがそれは A/B の最適化であって、出力ではない。道具立てが充実しているのに記事が出ないなら、たいてい手段の側に時間が吸われている。
- **「vault の主目的をどれにするか」と悩む必要はない**。Zettelkasten を採用した時点で目的は C（出力）に決まっている。蓄積を主目的に格上げした瞬間に pipeline の判断基準が壊れる。
- **決定ログ (D) を permanent に混ぜない**。決定は時系列の特定文脈に紐づくが、permanent は atomic で時系列を持たない。両立は無理なので、D を扱いたいなら ZK の外（別 directory / 別 tool）でやる。
- **「膨張感」への対処は、蓄積を減らすことではなく出力を起こすこと**。手段 (B) は機能しているのだから、削るのは筋が悪い。足りないのは出力先だ。

## 結果

- 「vault が膨張して活用できていない」感の正体が、蓄積過多ではなく **出力不全** だと特定できた。打ち手が「整理する」から「書く」に変わった。
- 自作の knowledge-gardener が A/B に寄っていること、C は道具の外で自分が回すしかないことを、役割として腑に落とせた。道具をこれ以上作り込むより、出力の頻度を上げる方が効くと判断できる。
- この記事自体が、その判断に沿った最初の出力になっている。

## まとめ

- Zettelkasten の本来の目的は **出力 (C) ひとつ**。検索性 (A) と洞察の結晶化 (B) は手段、決定ログ (D) は外来要素。
- vault を育てる道具（自作 plugin）はほぼ A/B しかやっていない。C は道具の外で、自分が書くことでしか動かない。
- 「膨張して活用できていない」感は、蓄積過多ではなく出力不全。整理ではなく出力で解く。
- 道具を作り込むほど手段が目的化する。手綱は「目的 (C) は出力」という一点に常に戻すこと。

## 参考リンク

- [knowledge-gardener (GitHub)](https://github.com/Kohei-Wada/knowledge-gardener) ─ vault を育てる（A/B を回す）ために作った Claude Code plugin
- Sönke Ahrens『How to Take Smart Notes』(2017) ─ writing を目的に据えた ZK の現代的 framing
