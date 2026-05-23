---
title: 'tar + ssh パイプ技法メモ'
description: 'rsyncがない環境やsudoが必要なファイル転送で使える、tar + sshパイプによるストリーミング転送の実践テクニック'
pubDate: 'Jan 11 2026'
tags: ['Shell', 'Bash', 'SSH', 'Linux', 'Unix']
---

いざというときにサッとコマンドが出てこないので、コピペ用に残しておきます。

## TL;DR（今すぐ使いたい人向け）

```bash
# リモートからローカルに引き上げ（sudo権限付き）
ssh host "sudo tar cz /var/log/nginx" | tar xzv --strip-components=3

# ローカルからリモートに送信
tar cz . | ssh host "tar xz -C /path/to/dest"
```

---

## 何が起きたか

古いCentOSサーバーからログを引き上げる必要がありました。

rsync を使おうとしたら：

```
-bash: rsync: command not found
```

EOLでリポジトリが死んでいて、yum install rsync も通りません。

scp で済まそうとしたら：

```
scp: /var/log/nginx/access.log: Permission denied
```

ログディレクトリはroot権限が必要です。scpにはsudoを挟む術がありません。

こういうときに tar + ssh のパイプが役立ちます。

---

## いつ使うか

- rsyncがインストールされていない（古いサーバー、最小構成のコンテナ）
- scpだと権限問題でファイルが取れない（sudo経由でないと読めない）
- リモートに一時ファイルを残したくない
- 圧縮しながら転送して帯域を節約したい

---

## 基本パターン

### リモート → ローカル

```bash
ssh host "tar cz /path/to/dir" | tar xz
```

リモートの /path/to/dir がローカルのカレントディレクトリに展開されます。

### sudo権限が必要な場合

```bash
ssh host "sudo tar cz /var/log/nginx" | tar xzv --strip-components=3
```

`--strip-components=3` で /var/log/nginx/... の先頭3階層を削り、nginx/... として展開します。

### 展開先を指定

```bash
ssh host "tar cz /path/to/data" | tar xz -C ./backup/
```

### ローカル → リモート

**ディレクトリを送って展開:**

```bash
tar cz . | ssh host "tar xz -C /path/to/dest"
```

**アーカイブとして保存:**

```bash
tar cz directory | ssh host "cat > backup.tar.gz"
```

---

## 応用

### 進捗表示

```bash
tar cz /data | pv | ssh host "tar xz -C /backup"
```

pv を挟むと転送速度が見えます。

### 複数サーバーに同時配布

```bash
tar cz /deploy | tee >(ssh server1 "tar xz -C /app") \
                      >(ssh server2 "tar xz -C /app") > /dev/null
```

---

## ハマりポイント

### --strip-components の数え方

パスの先頭からN階層を削除します。

```
/var/log/nginx/access.log
  │    │    │
  1    2    3  ← strip-components=3 で nginx/access.log になります
```

### -C オプションの位置

展開側（パイプの右側）で指定します。

```bash
# ○ 正しい
ssh host "tar cz /path" | tar xz -C ./dest/

# × 意味がない（圧縮側で -C しても展開先は変わらない）
ssh host "tar cz -C /path ." | tar xz
```

### 圧縮オプション

| オプション | 形式  | 用途             |
| ---------- | ----- | ---------------- |
| z          | gzip  | 通常はこれで十分 |
| j          | bzip2 | 圧縮率優先       |
| J          | xz    | 最高圧縮率、遅い |

---

## scp / rsync との使い分け

| 状況                  | 推奨      |
| --------------------- | --------- |
| 単発の小さいファイル  | scp       |
| 定期同期・差分転送    | rsync     |
| rsyncがない・sudo必要 | tar + ssh |

---

## まとめ

- tar + ssh は rsync がない環境での代替手段
- sudo 経由でないと読めないファイルも取得できる
- `--strip-components` でパス階層を調整可能
- 一時ファイルなしでストリーミング転送可能
