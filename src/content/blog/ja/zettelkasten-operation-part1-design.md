---
title: 'Zettelkasten 運用記録 Part 1: 設計編'
description: 'Zettelkastenを2年運用して落ち着いたフォルダ構造・タグ設計・MOCの運用方法を紹介'
pubDate: 'Jan 08 2026'
updatedDate: 'Jan 08 2026'
tags: ['Zettelkasten', 'Obsidian', 'Markdown', 'ナレッジマネジメント']
---

Zettelkasten を2年ほど運用しています。この記事では、フォルダ構造とタグ設計について書きます。

正直、特別なことはやっていません。ただ、続けてみて「これでいいな」と思える形に落ち着いたので、記録として残しておきます。

---

## なぜ Zettelkasten か

以前はディレクトリ構造でノートを管理していました。`programming/python/`、`infrastructure/docker/` のように分類する方法です。

この運用には問題がありました。関連しているドキュメントが全然違う場所に保存されてしまうのです。

「Python で Docker コンテナを操作する」というノートは、`programming/python/` に置くべきか `infrastructure/docker/` に置くべきか。どちらに置いても、もう一方からは見つけにくくなります。

Zettelkasten はこの問題を「つながりで管理する」という発想で解決します。どこに保存するかではなく、何とつながっているかを重視します。

---

## フォルダ構造

```
vault/
├── 01_FleetingNotes/
├── 02_ReferenceNotes/
├── 03_PermanentNotes/
├── 04_DailyNotes/
├── 05_BlogDrafts/
└── 99_Templates/
```

**FleetingNotes** は一時的なメモです。「あとで調べる」「このツール試したい」みたいな思いつきを置く場所です。

**ReferenceNotes** がメインです。調べた技術情報を記録します。Zettelkasten の用語では Literature Note ですが、技術リファレンスという実態に合わせて改名しました。

**PermanentNotes** は MOC（Map of Contents）や、自分の見解をまとめたノートです。複数の Reference Note を束ねる役割があります。

**DailyNotes** は振り返り用。**BlogDrafts** はブログ下書きです。

フォルダは浅く保ちます。深い階層を作ると、どこに置くか迷う問題が再発します。

---

## ファイル命名規則

Reference Note のファイル名は `{tool}-{action}` 形式で統一しています。

```
curl-post-request.md
mysql-backup-restore.md
docker-compose-networking.md
```

この命名だと、シェルから `ls` や `rg` で直感的に探せます。

```bash
ls vault/02_ReferenceNotes/ | grep curl
rg "proxy" vault/
```

Obsidian の検索機能に頼らなくても見つかります。これは後述するツール非依存の設計にもつながります。

---

## タグ設計

タグは多次元で設計しています。

```yaml
tags:
  - tool/curl
  - category/http
  - use-case/development
```

**tool/** はツール軸。curl、docker、mysql など。

**category/** は機能軸。http、database、networking など。

**use-case/** は使用場面。development、debugging、monitoring など。

なぜ多次元にするか。検索の切り口が複数あるからです。

- curl の使い方を全部見たい → `tool/curl`
- HTTP 関連を横断的に見たい → `category/http`
- 開発時に使うコマンドを探したい → `use-case/development`

単一軸のタグだと、どれか一つの切り口でしか探せません。

---

## MOC（Map of Contents）

同じトピックのノートが増えてきたら、MOC を作ります。

```markdown
# curl MOC

## ネットワーク診断

- [curl-global-ip-check](../02_ReferenceNotes/curl-global-ip-check.md)
- [curl-via-proxy](../02_ReferenceNotes/curl-via-proxy.md)

## API操作

- [curl-post-request](../02_ReferenceNotes/curl-post-request.md)
- [curl-JSON-request](../02_ReferenceNotes/curl-JSON-request.md)

## 関連ツール

- [wget-basic](../02_ReferenceNotes/wget-basic.md)
- [httpie-usage](../02_ReferenceNotes/httpie-usage.md)
```

MOC は単なる目次ではなく、用途別のナビゲーションです。「curl で何ができるか」を俯瞰できます。

作成タイミングは「ノートが増えてきたら」です。厳密なルールは設けていません。5個くらい溜まったら作ることが多いです。

---

## ツール非依存の設計

Obsidian を使っていますが、Obsidian に依存しない設計にしています。

### Wikilinks を使わない

```markdown
<!-- 使わない -->

[[curl-post-request]]

<!-- 使う -->

[curl-post-request](../02_ReferenceNotes/curl-post-request.md)
```

標準の Markdown 相対リンクなら、GitHub でも VSCode でもリンクが機能します。

### プラグインは最小限

git 同期のプラグインだけ使っています。便利なプラグインは山ほどありますが、それに依存すると Obsidian がないと困る状態になります。

### 検索は nvim + telescope

Obsidian の検索も使いますが、よく使うのは nvim の telescope です。ファイル名検索・全文検索をして、yank してシェルに貼り付けて実行、という流れがスムーズにできます。

この運用のために、Reference Note のコマンドは汎用的な書き方にしておく必要があります。環境変数やパスを直書きせず、どこでも動く形で記録しておく。

プレーンテキストだから `grep` も `rg` も効きます。Obsidian が消えても、Markdown ファイルと検索コマンドがあれば困りません。

---

## ノートの一生

```
アイデア → Fleeting Note
              ↓
調べる   → Reference Note
              ↓
増える   → MOC 作成
              ↓
まとめる → Permanent Note
              ↓
公開     → Blog
```

Fleeting Note は一時的な置き場です。調べたら Reference Note に昇格します。放置されたら消します。

Reference Note が増えてきたら MOC を作って整理します。

独自の見解が出てきたら Permanent Note にまとめます。

公開できそうならブログに出します。

この流れがあるから、ノートを書くときに「これはどの段階か」を意識できます。

---

## まとめ

- フォルダは浅く、分類より「つながり」を重視
- ファイル名は `{tool}-{action}` で検索しやすく
- タグは多次元で複数の切り口から探せるように
- MOC でトピックを俯瞰
- ツールに依存しない設計

特別なことはしていません。ただ、この構造で2年続いているので、それなりに機能していると思います。

---

## 関連記事

品質管理（リンク切れチェック、pre-commit、GitHub Actions）については、別記事で詳しく書いています。

- [Obsidianのリンク切れをlycheeで自動チェックする](/ja/blog/obsidian-lychee-link-checker/)

---

## 続き

- [Zettelkasten 運用記録 Part 2: 分析編](/ja/blog/zettelkasten-operation-part2-analysis/)
