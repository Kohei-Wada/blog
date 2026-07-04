---
title: '自宅サーバがランダムフリーズした話 (1) ─ journal から犯人を探す'
description: '数日おきに SSH 無応答になる自宅 AI サーバ。永続化した journal から 3 回のハングを特定し、クラッシュ署名を読み解いて「DRAM のビット化け」仮説に到達するまでの記録。'
pubDate: '2026-07-04'
tags: ['自宅サーバ', 'Linux', 'NixOS', 'トラブルシューティング']
seeAlso: ['nixos-home-ai-server-install-gotchas', 'rtx5090-blackwell-headless-gsp-watchdog']
---

## はじめに

[以前構築した自宅 AI サーバ](/ja/blog/nixos-home-ai-server-install-gotchas)（Ryzen 9 9950X + RTX 5090、NixOS）が、稼働開始から数日おきに SSH 無応答になる事件が起きました。ping も通らない、画面もつないでいない、何もできない。毎回電源ボタン長押しで強制再起動して、3 回目で堪忍袋の緒が切れて本気で調査した ─ その記録です。

長くなったのでシリーズにします。今回は「ログだけでどこまで犯人を追い詰められるか」の話。

## 容疑者リスト

ヘッドレスの Linux サーバが完全フリーズしたとき、容疑者はだいたいこの辺です。

- GPU ドライバ（RTX 5090 は Blackwell 世代で、nvidia ドライバの GSP timeout 問題が既知）
- カーネル / ドライバのバグ
- ストレージ故障
- 電源・温度
- メモリ

私は当初 GSP timeout を本命にしていました。新しい GPU、新しいドライバ、いかにも怪しい。しかも [GSP timeout 対策の watchdog](/ja/blog/rtx5090-blackwell-headless-gsp-watchdog) は仕込み済みで、それが一度も発火せずに固まっている ─ もっとも、OS ごと固まればユーザー空間の watchdog 自身も動けないので、これは矛盾ではありません。いずれにせよ**この予想は外れます。**

## boot 境界からハングを特定する

journald を永続化してある（`/var/log/journal`）ので、過去の boot は全部残っています。まず `journalctl --list-boots` で boot 一覧を出し、**「前の boot の最終ログ」と「次の boot の開始」のギャップ**を見ます。

```text
-15 0c8eb04e... Thu 2026-06-18 23:45 — Fri 2026-06-19 00:51  ← 次の boot まで 37 秒（正常 reboot）
-14 96582cae... Fri 2026-06-19 00:52 — Fri 2026-06-19 16:28  ← 次の boot まで 8 分（ハング→電源長押し）
-13 a40ea466... Fri 2026-06-19 16:36 — Fri 2026-06-19 17:22
```

正常な reboot ならギャップは 30〜60 秒。**ハングして電源長押しした boot は、最終ログから次の boot まで数分〜十数分の空白**ができます（フリーズに気づいて電源ボタンまで歩いていく時間です）。この方法で 3 回のハングを特定しました。

## 3 つのクラッシュ署名を読む

特定した各 boot の末尾には、毎回違う顔のクラッシュが残っていました。

### 1 回目: CPU 0 がロック待ちのまま帰ってこない

```text
kernel: rcu: INFO: rcu_preempt detected stalls on CPUs/tasks:
kernel: rcu:     (detected by 3, t=21002 jiffies, g=5283881, q=116 ncpus=32)
kernel: Sending NMI from CPU 3 to CPUs 0:
kernel: CPU: 0 UID: 0 PID: 1 Comm: systemd Tainted: G  D  O  6.18.34 #1-NixOS
kernel: RIP: 0010:native_queued_spin_lock_slowpath+0x64/0x2c0
kernel:  _raw_spin_lock_irqsave+0x3d/0x50
（1 分後）
kernel: rcu:     (detected by 17, t=84007 jiffies, g=5283881, q=224 ncpus=32)
```

CPU 0 で **PID 1、つまり systemd** がスピンロック取得待ちで硬直し、RCU が「CPU 0 が応答しない」と NMI を撃ち込んでいます。`t=21002 → 84007 jiffies` と待ち時間が伸び続けるだけで、二度と回復しない。この後ログは途絶え、次に現れるのは電源長押し後の起動メッセージです。

### 2 回目: ありえないアドレスへのアクセス

```text
kernel: Oops: general protection fault, probably for non-canonical address
        0xfdff8e2e2cffe130: 0000 [#1] SMP NOPTI
kernel: CPU: 2 UID: 62392 PID: 4230 Comm: .wyoming-faster Tainted: G  O  6.18.34 #1-NixOS
kernel: RIP: 0010:__lruvec_stat_mod_folio+0x55/0xd0
kernel: RAX: fdff8e2e2cffdb00 RBX: ffff8e3cfdd7a780 ...
kernel: Call Trace:
kernel:  folio_remove_rmap_ptes+0x42/0x220
kernel:  unmap_page_range+0xdeb/0x14e0
kernel:  unmap_vmas+0xa1/0x180
kernel:  exit_mmap+0xe5/0x3c0
kernel:  __mmput+0x41/0x150
kernel:  do_exit+0x283/0xac0
```

音声認識サービス（wyoming-faster-whisper）がただ終了しようとして、メモリを返却する途中（`exit_mmap`）で死んでいます。注目はアドレスです。カーネルポインタは本来 `0xffff...` で始まりますが、fault アドレスも RAX レジスタの中身も `0xfdff...`。**`ffff` と `fdff` の差は bit 57 が 1 個落ちただけ**。隣の RBX には正常な `ffff8e3c...` が残っているのと見比べると、「ポインタの上位ビットが 1 個だけ化けた」ことがそのまま見えます。

### 3 回目: ページ台帳の破損検出

```text
kernel: BUG: Bad page state in process bash  pfn:31e8c3
kernel: page: refcount:0 mapcount:0 mapping:000000007ebbe801 index:0x748932ae8 pfn:0x31e8c3
kernel: raw: 017fffc000000000 dead000000000100 dead000000000122 0400000000000000
kernel: page dumped because: non-NULL mapping
```

解放済みページの `mapping` フィールドは NULL であるべきなのに、raw ダンプの 4 語目に `0400000000000000` が残っています。**`0x0400000000000000` は bit 58 が 1 個だけ立った値**。それ以外は全部ゼロ。誰かが書いたにしては綺麗すぎる、「勝手に 1 ビット立った」形です。ちなみにこれを踏んで検出の巻き添えになったのはただの bash でした（Bad page state はダンプを吐くだけでプロセスを殺しはしません）。

## 推理: 共通項を探す

3 件を並べると共通項が浮かびます。

1. **全部、無関係なプロセス**（systemd / 音声認識 / bash）で起きている。特定のアプリのバグなら同じプロセスで再現するはず
2. **全部、汎用のカーネルメモリ管理コード**（spinlock / `exit_mmap` / ページ解放）の中で死んでいる。カーネルの同じバグなら同じ関数で死ぬはず
3. **うち 2 件は、64bit 値の 1 ビットだけが化けた姿が直接見えている**（bit 57 が落ちる、bit 58 が立つ）。残る 1 件（デッドロック）も、ロック変数の破損と置けば同じ絵に収まる
4. そして本命だった **nvidia モジュールは、どのコールトレースにも一度も登場しない**

ソフトウェアのバグは「同じ条件で同じ場所が壊れる」。一方この壊れ方は「ランダムな場所の、ランダムなタイミングの、1 ビット」。これはソフトの顔ではありません。**DRAM のビット化けの顔**です。

サーバ用途なのに ECC なしのコンシューマ構成（この選択自体は承知の上でした）なので、ビットが化けても誰も検出・訂正してくれない。化けたビットがカーネルのポインタに乗れば GPF、ページ管理の台帳に乗れば Bad page state、ロック変数に乗ればデッドロック ─ **1 つの故障が、乗った場所によって毎回違う顔で現れていた**としたら、3 件すべてに説明がつきます。

## だが物証がない

状況証拠は真っ黒です。しかしこの時点では「メモリが怪しい」以上のことは言えません。ログをいくら読み返しても、どの DIMM のどのビットが悪いかまでは分からない。

物証を取るには memtest86+ で RAM を直接叩く必要があります。ところがヘッドレスサーバに物理コンソールがない、という間抜けな障害があり ─ さらにこの後、**私の仮説の前提が実測でひっくり返る**ことになります。

次回は、誤認の訂正と検証準備の話です。
