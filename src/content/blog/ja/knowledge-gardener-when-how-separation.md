---
title: 'Plugin は WHEN だけ、vault は HOW を持つ ─ format-agnostic な Claude Code plugin の設計'
description: '自作 knowledge-gardener plugin で、vault の formatting 規約を一切 hardcode せずに動かす設計の話。既存 Obsidian-for-Claude 系 plugin との違いと、責務分離の効用。'
pubDate: 'May 23 2026'
tags: ['Claude Code', 'Obsidian', '個人開発']
---

## はじめに

Claude Code 向けの自作 plugin [knowledge-gardener](https://github.com/Kohei-Wada/knowledge-gardener) は、Obsidian vault の formatting 規約（filename / frontmatter / link 構文 / folder layout）を一切持っていません。代わりに、vault 自身の `README.md` を毎回読みに行く。この記事では、なぜそうしたのか・既存 plugin との違い・その結果どんな性質が出るのかを書きます。

Claude Code 向けに Obsidian vault を CRUD する plugin はすでにいくつか存在します。代表例:

- `eugeniughelbur/obsidian-second-brain` — 独自 wiki / PARA スキーマを前提
- `AgriciDaniel/claude-obsidian` — Karpathy wiki pattern を固定
- `dlutsyk/Obsidian-Zettelkasten-Claude` (MCP) — Luhmann ID を強制

これらは format を plugin 側で hardcode している。だから、自分の vault が「standard markdown link（wikilink 不使用）」「数字 prefix folder（`01_FleetingNotes/` 等）」のような独自規約を持っていると、そのまま衝突する。fork して直す手もあるが、その時点で plugin の汎用性は失われます。

## plugin は WHEN、vault は HOW

knowledge-gardener は **「いつ」 vault を CRUD すべきか** だけを持ち、**「どう書くか」** は vault 自身の README に従います。

```text
[従来の plugin]                    [knowledge-gardener]
plugin が format も持つ            plugin: いつ書く / 何を書く
→ 別 vault では合わない            vault README: どう書く
                                   → 規約は vault 側に集中
```

この責務分離により、

- **vault 側で規約を変えても plugin 側の修正は不要**
- 他人の vault でも format 違いを README 経由で吸収できる
- plugin のロジックは「durable insight 検出 / 重複検査 / propose-then-write」に集中できる

## 実装: pre-flight で README を読む

各 skill の冒頭に "Pre-flight Setup" を置きました。共通手順を抜粋すると:

```text
1. KG_VAULT 環境変数で vault path を解決
2. $KG_VAULT/README.md を読む（vault-root の convention 文書）
3. $KG_VAULT/../README.md も読む（vault が repo subdir の場合に対応）
4. folder-scoped README があれば追加で参照
5. 規約が不明なら stop and ask ─ 黙って default を発明しない
```

実装的には、各 operational skill（plant / water / connect / prune / survey / recap）が個別に CRUD アクションを担当し、共通の "Pre-flight Setup" を共有することで重複を排除しています。

## 注意点・ハマりどころ

- **README が無い vault に対しては「動かない」ほうがいい**。silent default で書き始めると、その vault の規約に従わない note が量産されてしまう。stop-and-ask は機能制限ではなく、format drift を防ぐ仕様。
- **vault README の置き場所が複数あり得る**。私の vault は `Obsidian/vault/` 構造なので、規約の一部は `Obsidian/README.md`（親）に、一部は `vault/README.md`（vault-root）にある。親と vault-root の両方を読み、衝突時は vault-root を優先。
- **folder-scoped な規約**（例: People フォルダだけ別 frontmatter）には folder-scoped README を読みに行く層を別途用意。

## 結果

- 自分の vault（数字 prefix folder + standard markdown link + 独自タグ namespace）で plugin がそのまま動く
- 同じ plugin が、別の人の wiki-style vault や Luhmann ID vault でも README さえ書けば動く理屈になる
- plugin の責務が明確で、新 skill（garden-recap 等）を足すときに format 周りの判断が不要

## まとめ

- 「plugin が format を持つ」のではなく「vault が format を持ち、plugin はそれを読む」
- 責務分離: **plugin は WHEN、vault は HOW**
- 規約が不明なら停止 — 黙って default を発明しないことが format drift を防ぐ

## 参考リンク

- [knowledge-gardener (GitHub)](https://github.com/Kohei-Wada/knowledge-gardener)
- [私の Obsidian vault](https://github.com/Kohei-Wada/Obsidian)
