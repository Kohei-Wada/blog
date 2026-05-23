---
title: 'yadm × Neovim の Git plugin が動かないので yadm-git.nvim を作った（Bazzite の symlink で 3 回直した話つき）'
description: 'yadm 管理の dotfiles は $HOME に置かれていて .git が無いので、gitsigns / fugitive / lazygit がそのままでは認識しない。それを「黙って動かす」ためだけの小さい Neovim plugin を作った。設計判断と、Bazzite のような immutable distro の symlink で 3 回 home directory 解決を直し直した経緯。'
pubDate: 'May 23 2026'
tags: ['neovim', 'yadm', 'dotfiles', 'plugin', 'lua', 'experiment']
---

## はじめに

[yadm](https://yadm.io) で管理している dotfiles は `$HOME` 直下に置かれていて、`$HOME/.git` は存在しない。yadm 本体の git ディレクトリは `~/.local/share/yadm/repo.git` にある。だから `gitsigns.nvim` / `fugitive` / `lazygit.nvim` のような Git 系 Neovim plugin は、`$HOME` 配下のファイルを編集していても「これは git 管理下じゃない」と判定してしまう。

これを「黙って動かす」ためだけの小さい plugin、[yadm-git.nvim](https://github.com/Kohei-Wada/yadm-git.nvim) を作った。この記事では次の 3 点を書く。

- yadm 管理の dotfiles と nvim の Git plugin を共存させる最小の設計
- shell call ではなく filesystem check で yadm を検出するメリット（perf + テスタビリティ）
- `vim.env.HOME` / `vim.uv.os_homedir()` / `vim.fn.expand("~")` が immutable distro で挙動が分かれる現象と、最終的にどれを選んだか

最後の Bazzite の symlink の話で、home directory の解決方法を 3 回直し直した。

## 何が問題だったのか

yadm は「dotfiles を git で管理するためのラッパー」で、`$HOME` を work tree、`~/.local/share/yadm/repo.git` を git directory として使う。CLI からは `yadm` コマンドが `GIT_DIR` と `GIT_WORK_TREE` を裏で渡して `git` を呼ぶ。

ところが Neovim の `gitsigns.nvim` などの Git plugin はそれを知らない。`$HOME/.config/nvim/init.lua` を開いても、そのディレクトリ階層に `.git` が無いので「git 管理外」と判定し、差分も blame も出ない。

毎回 shell で `GIT_DIR=... GIT_WORK_TREE=... nvim` と打つのは面倒だし、cd するたびに切り替えたい。これを自動化するためだけの plugin が欲しかった。

## どう解決したか

設計判断は単純。

| 判断                                                 | 理由                                                          |
| ---------------------------------------------------- | ------------------------------------------------------------- |
| No commands, no user interaction                     | 設定ゼロで黙って動くべき。yadm 管理下にいるかどうかは判定可能 |
| filesystem check のみ（shell call なし）             | perf 良好、Lua で完結、テストが mock 一発で書ける             |
| 環境変数 `GIT_DIR` / `GIT_WORK_TREE` を set するだけ | 既存の Git plugin に何も触らない最小介入                      |
| autocmd 駆動（VimEnter / DirChanged）                | cd で yadm 配下に出入りしたら set / clear する                |

検出ロジックは 3 段。

1. カレントディレクトリの階層に `.git`（ディレクトリ or ファイル）があれば「普通の git repo」と判定して skip
2. yadm の repo が `~/.local/share/yadm/repo.git`（v3+）または `~/.yadm/repo.git`（legacy）にあるか確認
3. カレントディレクトリが `$HOME` 配下にあるか確認

3 つすべて真なら yadm 管理下とみなし、`vim.env.GIT_DIR` と `vim.env.GIT_WORK_TREE` を set する。`DirChanged` で出た時は clear する。

## 実装の進化

主要な PR を時系列で並べる。

| 時期       | PR        | 内容                                                                                                                      |
| ---------- | --------- | ------------------------------------------------------------------------------------------------------------------------- |
| 2025-06-02 | initial   | 初版。shell call ベースで yadm を検出                                                                                     |
| 2025-06    | #6        | shell call をやめて pure Lua filesystem check に。perf + テスト性向上                                                     |
| 2025-06    | #7        | plugin state を内部に持ち、`is_active()` / `get_yadm_repo_path()` / `get_state()` を public API として公開                |
| 2025-06    | #9        | DirChanged autocmd を追加。yadm dir から出たら env vars を clear する。state / event を別 module に切り出す refactor 同梱 |
| 2025-06    | #10       | lualine 用の status component を追加。yadm がアクティブな時に家アイコンと "dotfiles" を表示                               |
| 2025-06    | #11       | activation logic を init から event handling へ。autocmd 依存に統一して teardown も event 駆動に                          |
| 2025-07    | #14       | `.git` がファイル（worktree）の場合の検出漏れを修正                                                                       |
| 2026-04    | #19 / #20 | Bazzite 系 immutable distro で `$HOME` が symlink になる問題を発見。`vim.uv.os_homedir()` 経由に変更                      |
| 2026-05    | #22       | #20 のさらなる修正。`vim.fn.expand("~")` に統一                                                                           |

現在のファイルレイアウト。

```text
lua/yadm-git/
├── init.lua    -- entry point (setup() を export)
├── yadm.lua    -- 検出と env vars set/clear のコア
├── state.lua   -- plugin の activation state
├── event.lua   -- VimEnter / DirChanged の autocmd
├── logger.lua  -- debug logging
└── options.lua -- config
```

## ハマったところ

### 1. cd で出た時に env vars が残る (#9)

最初の実装は `VimEnter` でしか発火しなかった。だから nvim を起動した時に yadm 配下にいれば動くが、`:cd ~/work/project`（yadm 配下じゃない通常の git repo）に移動しても `GIT_DIR` が `~/.local/share/yadm/repo.git` のまま残り、gitsigns が yadm を指したまま壊れた表示になる。

解決は `DirChanged` autocmd で `is_yadm_managed()` を再評価し、false なら `clear_yadm_env()` で env vars を `nil` にする。これと同時に state / event を別 module に切り出して、init.lua は `setup()` を export するだけにした。

### 2. worktree が `.git` ファイルとして存在する (#14)

`vim.fn.finddir(".git", ...)` だけ見ていたので、`git worktree add` で作った worktree（`.git` がディレクトリではなくテキストファイルになる）が「git じゃない」判定になり、yadm 環境が誤って set されていた。`finddir` と `findfile` の両方を見るように修正した。

### 3. Bazzite で `$HOME` が symlink (#19 → #20 → #22)

これが一番厄介だった。Bazzite のような immutable Fedora 派生では、`/home/user` が `/var/home/user` への symlink になっている。

- `$HOME` は `/var/home/user`（physical path）
- `/etc/passwd` は `/home/user`（symlink path）
- Neovim の `vim.fn.fnamemodify(":p")` や `vim.fn.getcwd()` は symlink を解決する → `/home/user/...`
- `vim.uv.os_homedir()` は libuv が `$HOME` を見るので `/var/home/user`

つまり「カレントディレクトリは `/home/user/...` 配下にあるが、`$HOME` は `/var/home/user`」となり、`vim.startswith(cwd, home .. "/")` が false になって yadm 配下と判定されない。

3 回の修正の経緯。

| 試行 | アプローチ                                           | 結果                                                                           |
| ---- | ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| #19  | `vim.env.HOME` を使っていた → symlink 解決問題が露見 | 報告される                                                                     |
| #20  | `vim.uv.os_homedir()` に変更                         | libuv も symlink を解決しないので同じ問題                                      |
| #22  | `vim.fn.expand("~")` に統一                          | Neovim 経由なので `fnamemodify` / `getcwd` と同じ symlink 解決系統に乗る。解決 |

教訓は **「home directory を取る関数」はどれを使うかで挙動が違う** ということ。symlink を解決するかどうかが鍵で、比較する側（cwd を取る関数）と揃える必要がある。Neovim plugin では `vim.fn.expand("~")` が一番安全だった。

該当のソース（コメント付き）。

```lua
-- Resolve the user's home directory.
-- Prefer `vim.fn.expand("~")` over `vim.uv.os_homedir()` or $HOME because on immutable distros
-- (Bazzite, etc.) the folder /home/ is a symlink to /var/home/ which is resolved by Neovim
-- in the functions `vim.fn.fnamemodify()` and `vim.fn.getcwd()` but not when using $HOME
-- or libuv's `os_homedir()`.
-- See issue #19 for more information.
local function get_home()
  return vim.fn.expand "~"
end
```

## 結果

- yadm 配下のファイルを編集中に gitsigns / fugitive / lazygit がそのまま動く
- cd で出入りしても勝手に切り替わる
- lualine に「今 yadm モード」を表示できるようになり、誤操作が減った
- コア部分は 110 行程度。test まで含めても 234 行 + テスト。小さく保てている

## まとめ

- yadm × nvim の Git plugin 共存問題は「`GIT_DIR` / `GIT_WORK_TREE` を autocmd 駆動で出し入れする」だけで解ける
- shell call ではなく filesystem check にすると perf もテスト性も両取り
- immutable distro の home directory 解決は罠だらけで、3 回直し直した。Neovim plugin では `vim.fn.expand("~")` を使うのが現状の正解

## 参考リンク

ソースと PR。

- [Kohei-Wada/yadm-git.nvim (GitHub)](https://github.com/Kohei-Wada/yadm-git.nvim)
- [PR #6 Optimize external commands](https://github.com/Kohei-Wada/yadm-git.nvim/pull/6) ─ shell call → filesystem
- [PR #7 plugin state management and tests](https://github.com/Kohei-Wada/yadm-git.nvim/pull/7) ─ public API
- [PR #9 env vars not cleared on cd out](https://github.com/Kohei-Wada/yadm-git.nvim/pull/9) ─ DirChanged 対応 + module 分離
- [PR #10 lualine component](https://github.com/Kohei-Wada/yadm-git.nvim/pull/10)
- [PR #11 event-driven refactor](https://github.com/Kohei-Wada/yadm-git.nvim/pull/11)
- [PR #14 worktree detection](https://github.com/Kohei-Wada/yadm-git.nvim/pull/14)
- [PR #19 / #20 Bazzite symlink (os_homedir)](https://github.com/Kohei-Wada/yadm-git.nvim/pull/20)
- [PR #22 expand("~") final fix](https://github.com/Kohei-Wada/yadm-git.nvim/pull/22)

関連ツール。

- [yadm 公式](https://yadm.io)
- [gitsigns.nvim](https://github.com/lewis6991/gitsigns.nvim)
- [vim-fugitive](https://github.com/tpope/vim-fugitive)
- [lazygit.nvim](https://github.com/kdheepak/lazygit.nvim)
- [Bazzite (immutable Fedora)](https://bazzite.gg)
