---
title: 'git worktreeを使わずにClaude Codeで並列開発する方法（container-use）'
description: 'Dagger製のMCPツール「container-use」を使って、ディレクトリ構造を汚さずにClaude Codeで並列開発を実現する方法'
pubDate: 'Jan 12 2026'
tags: ['Claude Code', 'MCP', 'container-use', 'Dagger', 'Git']
---

Claude Codeで複数のタスクを同時に進めたいけど、git worktreeでディレクトリが増えるのは嫌だ——そんな悩みを解決するツール「container-use」を紹介します。

## この記事の対象読者

- Claude Codeを使っていて、並列開発に興味がある
- git worktreeは知っているが、ディレクトリ管理が煩わしいと感じている
- ghqなどでリポジトリを整理して管理している

## container-useとは

[container-use](https://github.com/dagger/container-use)は、Dagger製のMCPツールです。ブランチごとにコンテナ内で隔離された開発環境を作成でき、ローカルのディレクトリ構造を汚さずに並列開発が可能になります。

### worktreeとの比較

| 観点         | git worktree             | container-use              |
| ------------ | ------------------------ | -------------------------- |
| ディレクトリ | 別ディレクトリが作られる | コンテナ内に隔離される     |
| 環境の独立性 | ファイルのみ分離         | 環境全体が分離             |
| 作業ログ     | gitの履歴のみ            | `cu log`で操作履歴も確認可 |
| ghqとの相性  | 管理が煩雑になりやすい   | 影響なし                   |

## セットアップ

### 1. インストール

```bash
# Arch Linuxの場合
sudo pacman -S dagger
yay -S container-use
```

他のOSについては[公式リポジトリ](https://github.com/dagger/container-use)を参照してください。

### 2. Claude CodeにMCPを追加

```bash
# グローバルにMCPを追加
claude mcp add container-use -s user -- cu stdio

# 接続確認
claude mcp list
```

以下のように表示されれば成功です。

```
container-use: cu stdio - ✓ Connected
```

### 3. CLAUDE.mdにルールを追加（重要）

公式ドキュメントでは「optional」と記載されていますが、これを追加しないとClaudeがcontainer-useを使ってくれません。

```bash
curl https://raw.githubusercontent.com/dagger/container-use/main/rules/agent.md >> CLAUDE.md
```

### 4. ツールの許可設定（任意）

毎回確認プロンプトが出るのを避けたい場合は、以下のオプションを付けて起動します。

```bash
claude --allowedTools mcp__container-use__environment_checkpoint,mcp__container-use__environment_create,mcp__container-use__environment_add_service,mcp__container-use__environment_file_delete,mcp__container-use__environment_file_list,mcp__container-use__environment_file_read,mcp__container-use__environment_file_write,mcp__container-use__environment_open,mcp__container-use__environment_run_cmd,mcp__container-use__environment_update
```

## 基本的な使い方

### cuコマンド一覧

| コマンド               | 説明                           |
| ---------------------- | ------------------------------ |
| `cu list`              | 環境一覧を表示                 |
| `cu log <env_id>`      | 作業ログを確認                 |
| `cu checkout <env_id>` | 変更をローカルブランチに反映   |
| `cu open <env_id>`     | 既存環境を開く                 |
| `cu config`            | ベースイメージなどの設定を変更 |

### 作業の取り込み

開発が完了したら、以下のコマンドでコンテナ内の変更をローカルに取り込みます。

```bash
cu checkout <env_id>
```

## 並列開発のワークフロー

具体的な運用例を紹介します。

### 例：2つのタスクを同時に進める

ターミナルを2つ開き、それぞれで別のClaude Codeセッションを起動します。

#### ターミナル1（バグ修正）

```
$ claude
> Issue #42のバグを修正して
```

#### ターミナル2（新機能開発）

```
$ claude
> Issue #58の機能を実装して
```

それぞれのClaudeがcontainer-use環境で作業するため、互いに干渉しません。

### 作業完了後の流れ

```
1. Claudeが作業完了を報告
   ↓
2. cu list で環境IDを確認
   ↓
3. cu checkout <env_id> で変更を取り込み
   ↓
4. 通常通りレビュー → マージ
```

## 注意点

### レビューがボトルネックになりやすい

並列開発で効率が上がる分、レビュー待ちが溜まりやすくなります。

#### 対策

- Issueを小さく区切り、レビューしやすいサイズに保つ
- Claude Codeにセルフレビューや差分サマリの生成を依頼する
- 優先度の高いものから順にレビューするルールを決めておく

### CLAUDE.mdの追記を忘れずに

前述の通り、`agent.md`の内容をCLAUDE.mdに追記しないと、Claudeがcontainer-useを認識しません。プロジェクトごとに設定が必要な点に注意してください。

## まとめ

container-useを使えば、git worktreeのようにディレクトリが散らかることなく、Claude Codeでの並列開発が可能になります。

- ディレクトリ構造を汚さない
- 環境が完全に隔離される
- 作業ログが残るので検証にも便利

ghqなどでリポジトリをきれいに管理している方には特におすすめです。

## 参考リンク

- [container-use - GitHub](https://github.com/dagger/container-use)
- [Dagger公式サイト](https://dagger.io/)
- [Claude Code 公式ドキュメント](https://docs.anthropic.com/en/docs/claude-code)
