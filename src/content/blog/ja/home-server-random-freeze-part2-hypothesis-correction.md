---
title: '自宅サーバがランダムフリーズした話 (2) ─ 仮説の前提が実測で崩れる'
description: 'まず hardware watchdog で出血を止め、証拠を集める。ところが「メモリ OC が原因」という思い込みが dmidecode の実測でひっくり返り、容疑はハードウェアそのものへ。memtest 準備までの記録。'
pubDate: '2026-07-04T11:00'
tags: ['自宅サーバ', 'Linux', 'NixOS', 'トラブルシューティング']
seeAlso: ['home-server-random-freeze-part1-journal-forensics']
---

## 前回までのあらすじ

[前回](/ja/blog/home-server-random-freeze-part1-journal-forensics)、数日おきに完全フリーズする自宅 AI サーバの journal を読み、「DRAM のビット化け」という仮説に到達しました。状況証拠は真っ黒、しかし物証はまだない ─ という状態からの続きです。

## まず出血を止める

原因究明より先にやるべきことがあります。**フリーズのたびに電源ボタンまで歩いていく生活を終わらせる**ことです。

Linux には hardware watchdog という仕組みがあります。チップセット内蔵のタイマー（このマザーは AMD の SP5100 TCO）に systemd が定期的に「生きてるよ」と餌をやり、餌が止まったらハードウェアが勝手にリセットをかける。カーネルごと完全に固まっても、**タイマー回路は独立に動いている**ので必ず発火します。

NixOS ならこれだけです。

```nix
systemd.settings.Manager = {
  RuntimeWatchdogSec = "20s"; # 20 秒餌が来なければリセット
  RebootWatchdogSec = "30s";
};
```

デプロイ後に確認:

```console
$ systemctl show -p RuntimeWatchdogUSec
RuntimeWatchdogUSec=20s
```

これで「フリーズ → 20 秒後に自動リセット → 勝手に復旧」になりました。以後この watchdog は **計 8 回発火**することになります。つまり問題は全く解決していないのですが、少なくとも私が電源ボタンまで歩く必要はなくなった。根本対処と復旧自動化を分離する、インシデント対応の基本です。

## 問題は続く ─ そして発症条件が見えてくる

watchdog を入れてからもクラッシュは続きました。しかも記録を並べると、パターンが浮かびます。

```text
kernel: list_del corruption. prev->next should be fffff7eac79a1808,
        but was fffff7eac39a1808. (prev=fffff7eac79a1848)
kernel: Oops: invalid opcode: 0000 [#1] SMP NOPTI
kernel: CPU: 1 ... Comm: llama-server ...
```

`fffff7eac79a1808` と `fffff7eac39a1808`。**また 1 ビット違いです**（c7 → c3、bit 26 が落ちた）。今回はカーネルの連結リストのポインタに乗りました。

そして死ぬプロセスが `llama-server`、`ollama` に集中しはじめます。このサーバの主業務は LLM 推論で、数十 GB のモデルを RAM にロードする。**idle の日は何日でも安定して、重いモデルを回した日に落ちる**。メモリ使用量が増えたときだけ発症する ─ ビット化け仮説と綺麗に整合します（この「なぜ使用量に依存するのか」の答え自体は次回、物証と一緒に出ます）。

## ファイルシステムが濡れ衣を着せられる

さらに面白い証拠が出ました。BTRFS のエラーカウンタです。

```console
$ sudo btrfs device stats /
[/dev/nvme0n1p2].write_io_errs    0
[/dev/nvme0n1p2].read_io_errs     0
[/dev/nvme0n1p2].corruption_errs  1744
[/dev/nvme0n1p2].generation_errs  0
```

corruption 1744 件。普通なら「SSD が死にかけている」と青ざめる数字です。ところが:

```console
$ sudo btrfs scrub status /
Status:           finished
Error summary:    no errors found
```

**scrub（ディスク上の全データをチェックサム検証）はエラーゼロ**。この矛盾のもっとも素直な説明はこうです。ディスクから読んだデータは正しく、**RAM に載ってからチェックサム検証されるまでの間に化けて**、不一致として検出されている。ディスクは無実で、RAM が濡れ衣を着せていた。ビット化け仮説の傍証がまた 1 つ増えました。

## 「どうせ OC が原因でしょ」─ 思い込みが崩れる

この時点で私はこう考えていました。「AM5 で DDR5-6000 の EXPO プロファイルは定格外 OC。32GB×2 の計 64GB dual-rank は IMC（CPU 内蔵メモリコントローラ）に厳しいから、それが原因だろう」と。ネットにも AM5 + EXPO の不安定報告は山ほどある。BIOS で EXPO を切れば直るだろう、と。

実測します。

```console
$ sudo dmidecode -t 17 | grep -E "Speed|Part Number|Rank"
 Part Number: CT32G56C46U5.C16D
 Rank: 2
 Configured Memory Speed: 5600 MT/s
```

**5600。6000 ではない。** 型番を引くと Crucial の素の DDR5-5600 ─ EXPO プロファイルを盛った OC キットではなく、**JEDEC 準拠の定格品**でした。しかも BIOS は購入後一度も触っていない（後日、実機の BIOS 画面でも EXPO: Disabled を確認しました）。

さらにスペック表を読み直すと、自分がもう 1 つ誤解していたことが分かります。Ryzen 9000 系（このサーバは 9950X）の公式メモリ定格は「2 枚挿し dual-rank（1DPC 2R）で DDR5-5600」。つまりこの構成は**定格のど真ん中**です。攻めた設定はどこにもない。

「OC が原因」仮説は、実測 1 コマンドで消滅しました。**思い込みで BIOS をいじり始める前に測ってよかった**、というのが今回一番の教訓かもしれません。もし先に EXPO 設定を探して「あれ、もともと無効だ」とやっていたら時間を溶かすだけですが、もっと悪いのは「何かを変えて、たまたま数日安定して、直った気になる」コースです。

## 定格でも落ちるのか？ ─ 裏取り

「定格運用でもメモリ起因で落ちるものなのか」をコミュニティ事例で裏取りしました。結論、普通にあります。

- EXPO を明示的に無効化した JEDEC 定格運用でも MEMORY_MANAGEMENT / PFN_LIST_CORRUPT 系の BSOD が続いた AM5 の事例
- memtest は通るのに実負荷で落ち続け、最終的に DIMM 交換で解決した事例
- DIMM を増やすほど落ちるまでの時間が縮む（1 枚で 27 時間 → 2 枚で 6〜12 時間 → 4 枚で 1〜2 時間）という、メモリ負荷と故障の相関を示す報告

つまり容疑は「設定」から「ハードウェア個体」へ移りました。不良 DIMM か、IMC の個体差か。どちらにせよ、次の一手は同じです。**memtest86+ で RAM を直接叩く。**

## 検証の準備

NixOS では memtest86+ をブートメニューに足すのも 1 行です。

```nix
boot.loader.systemd-boot.memtest86.enable = true;
```

これを GitOps のフローに乗せて（PR → merge → 自動デプロイ）、次の再起動からブートメニューに `Memtest86+` が並ぶようになりました。診断作業の準備までコミット履歴に残るのは、宣言的構成のちょっといいところです。

残る問題は 1 つ。memtest は OS なしで走るので **SSH では結果が見えない**。ヘッドレス運用のこのサーバに、物理モニタとキーボードを繋ぐ必要があります。ポータブルモニタを発注し、届くのを待つ ─。

次回、モニタを繋いで memtest を起動します。**答えは 1 分で出ました。**
