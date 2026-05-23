---
title: 'Obsidianのリンク切れをlycheeで自動チェックする'
description: 'Rust製の高速リンクチェッカー「lychee」を使って、Obsidian vaultのリンク切れを自動検出する方法'
pubDate: 'Jan 08 2026'
tags: ['Obsidian', 'lychee', 'Markdown', 'pre-commit', 'Zettelkasten']
---

Obsidianでノートを管理していると、ファイル名の変更やノートの削除でリンク切れが発生することがあります。この記事では、Rust製の高速リンクチェッカー「lychee」を使って、リンク切れを自動検出する方法を紹介します。

## lycheeとは

[lychee](https://github.com/lycheeverse/lychee)は、Rustで書かれた高速なリンクチェッカーです。

**特徴：**

- 非同期処理による高速なチェック
- Markdownファイルのネイティブサポート
- `--offline`オプションでローカルリンクのみチェック可能
- GitHub Actionsとの連携が容易

## 前提：Obsidianのリンク形式について

lycheeを使う上で重要な点があります。Obsidianのデフォルトであるwikiリンク `[[note]]` はlycheeではサポートされていません。lycheeでリンクチェックを行うには、標準Markdownリンク形式を使う必要があります。

Obsidianの設定で「新しいリンクの形式」を「相対パス」に変更しておくと、新規リンク作成時に自動で標準形式になります。

![Obsidianの設定画面：リンク形式を相対パスに変更](../../../assets/obsidian-link-settings.png)

| 形式         | 例                  | lychee対応 |
| ------------ | ------------------- | ---------- |
| wikiリンク   | `[[note]]`          | ❌ 非対応  |
| 標準Markdown | `[note](./note.md)` | ✅ 対応    |

既存のwikiリンクを変換するには、[obsidian-link-converter](https://github.com/ozntel/obsidian-link-converter)などのプラグインが便利です。

## インストール

### macOS (Homebrew)

```bash
brew install lychee
```

### Linux

```bash
curl -sSfL https://github.com/lycheeverse/lychee/releases/latest/download/lychee-x86_64-unknown-linux-gnu.tar.gz | tar xzf - -C /usr/local/bin
```

## 基本的な使い方

Obsidian vaultの内部リンクをチェックするには`--offline`オプションを使います：

```bash
lychee --offline vault/
```

### 出力例

リンク切れがある場合、以下のような出力が表示されます：

![lycheeでリンク切れを検出した際のターミナル出力](../../../assets/lychee-failed.png)

リンクがすべて正常な場合：

![lycheeでリンク切れがない場合のターミナル出力](../../../assets/lychee-ok.png)

## 標準Markdownリンクの書き方

相対パスを使用することで、正確にリンク切れを検出できます。

```markdown
[関連ノート](../03_PermanentNotes/related-note.md)
![画像](../97_Assets/image.png)
```

**ポイント：**

- 相対パスを使用する（`../folder/file.md`）
- URLエンコード（`%20`など）は避ける

## 除外設定

実運用では、チェック対象から除外したいファイルやディレクトリが出てきます。

### コマンドラインで除外

```bash
# 特定のパスを除外
lychee --offline --exclude-path "vault/99_Archive" vault/

# 複数パスを除外
lychee --offline \
  --exclude-path "vault/99_Archive" \
  --exclude-path "vault/.obsidian" \
  vault/
```

### .lycheeignore で除外

プロジェクトルートに `.lycheeignore` ファイルを作成して、除外パターンを記述できます：

```
# アーカイブは除外
vault/99_Archive/

# テンプレートは除外
vault/98_Templates/

# 特定パターンのファイルを除外
**/draft-*.md
```

### lychee.toml で設定を管理

設定をファイルにまとめておくと便利です：

```toml
# lychee.toml
exclude_path = [
  "vault/99_Archive",
  "vault/.obsidian"
]

# タイムアウト設定（外部URLチェック時）
timeout = 10

# 同時接続数
max_concurrency = 32
```

コマンド実行時に設定ファイルを指定できます。

```bash
lychee --offline --config lychee.toml vault/
```

## Pre-commitフックで自動チェック

コミット時に自動でリンクチェックを行うには、pre-commitを設定します。

### .pre-commit-config.YAML

```yaml
repos:
  - repo: local
    hooks:
      - id: lychee-link-checker
        name: Check links with lychee
        entry: lychee --offline --config lychee.toml vault/
        language: system
        files: '\.md'
        pass_filenames: false
```

### pre-commitのインストールと有効化

```bash
pip install pre-commit
pre-commit install
```

これでコミット時に自動でリンクチェックが実行され、リンク切れがあるとコミットが中断されます。

## GitHub Actionsでの継続的チェック

CIでもリンクチェックを実行することで、PRマージ前に問題を検出できます。

### .GitHub/workflows/ci.yml

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  link-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install lychee
        run: |
          curl -sSfL https://GitHub.com/lycheeverse/lychee/releases/latest/download/lychee-x86_64-unknown-linux-gnu.tar.gz | tar xzf - -C /usr/local/bin

      - name: Run link checker
        run: lychee --offline --config lychee.toml vault/
```

## Makefileでの実行

よく使うコマンドはMakefileにまとめておくと便利です：

```makefile
VAULT_PATH := vault

.PHONY: check-links
check-links:  ## Check for broken links using lychee
 lychee --offline --config lychee.toml $(VAULT_PATH)/
```

```bash
make check-links
```

## まとめ

lycheeを使うことで、Obsidian vaultのリンク切れを高速かつ自動的にチェックできます。

| 場面                   | コマンド                         |
| ---------------------- | -------------------------------- |
| ローカルで手動チェック | `lychee --offline vault/`        |
| コミット時             | pre-commitフックで自動チェック   |
| CI                     | GitHub Actionsで継続的にチェック |

**注意点として、lycheeは標準Markdownリンクのみ対応しています。** wikiリンク `[[note]]` を使用している場合は、事前に標準形式への変換が必要です。

リンク切れのない健全なナレッジベースを維持しましょう。

## 参考リンク

- [lychee - GitHub](https://github.com/lycheeverse/lychee)
- [lychee Documentation](https://lychee.cli.rs/)
- [pre-commit](https://pre-commit.com/)
- [obsidian-link-converter](https://github.com/ozntel/obsidian-link-converter)
