---
title: 'カーネル更新で起動不能になったトラウマから、固定をやめて安全に更新し続ける体制にした'
description: 'Arch で out-of-tree な USB WiFi ドライバ（8821au）がカーネル更新で壊れ、起動はするがネット無しで詰む事故を踏んで以来、カーネルを IgnorePkg で固定して止めていた。今回それを根本解決した話。原因の DKMS を捨てて in-tree だけにし、linux-lts を保険に入れ、固定を解除して最新まで追いついた。partial upgrade の罠と linux-firmware 分割の衝突も込み。'
pubDate: 'May 25 2026'
tags: ['Arch Linux', 'pacman', 'kernel', 'GRUB', 'DKMS', 'トラブルシューティング']
seeAlso: ['pacman-damaged-tar-archive-debug']
---

## はじめに

過去に、Arch のカーネル更新で**起動不能**になったことがある。原因は外付け USB WiFi のドライバ（`8821au`、out-of-tree の DKMS）が新カーネルでビルドに失敗し、起動はするのに**ネットに繋がらない**状態になったことだった。ネットが無いと直すための情報もパッケージも取れず、結局 live USB 行き。そのトラウマで、以来カーネルを `IgnorePkg` で 6.13.8 に**固定**して更新を止めていた。

だがカーネル LPE を使い捨て VM で体験して、「固定して止める＝脆弱性を放置する」運用が割に合わないと腹落ちした。そこで今回、固定をやめて**安全に更新し続ける体制**に作り直した。やったことは、原因の DKMS を捨てて in-tree ドライバだけにする・`linux-lts` を保険カーネルに入れる・固定を解除して `-Syu` で追いつかせる、の 3 つ。再起動後は全デバイス（WiFi / カメラ / マイク）が動いた。

## 起動はするのにネットが無い、という詰み

起動不能と言っても、画面が真っ黒で何も出ないわけではなかった。**起動はする。でも WiFi が死んでいる。** これが一番タチが悪い。

- ネットが無いので、原因を調べる記事も、直すためのパッケージも取れない。
- 「カーネルを戻せばいい」と分かっていても、その操作に必要なものをダウンロードできない。
- 結局、別マシンで live USB を焼いて chroot して…という大ごとになる。

原因は **out-of-tree なドライバ**だった。`8821au` のような USB WiFi ドライバは DKMS でカーネルごとにビルドされるが、カーネルが上がると非互換やビルド失敗を起こす。それが**必須デバイス**（ネット）だと、上の悪循環に直結する。

この事故のあと、私は安易に「カーネルだけ `IgnorePkg` で固定」して更新を止めた。これが次の問題になる。

## カーネルだけ固定は Arch では危険

「危ないカーネルだけ止めて、他は更新すればいい」── 直感的だが、Arch では地雷だ。

- Arch は rolling release で、**partial upgrade（部分更新）は非サポート**。`pacman -Sy <pkg>` 単独や、カーネルだけ `IgnorePkg` で残す運用は、**glibc / ABI のずれ**を招く。
- ずれた状態で何かのきっかけで再起動すると、今度は固定とは別の理由で壊れる。

つまり「固定して安心」しているつもりが、別の不発弾を抱えていた。正しい方向は**固定をやめて、壊れない形で常に full upgrade する**ことだ。

## 解決策：原因を消す → 保険を積む → 追いつく

### 1. 原因の out-of-tree ドライバを捨てる

内蔵の Intel WiFi（`iwlwifi`）は **in-tree** なので、カーネルに同梱されて更新に自動で追従する。壊れない。外付け USB WiFi に依存していたのが事故の根なので、in-tree で足りるなら DKMS パッケージは消す。

```bash
sudo pacman -Rns <dkms-package>   # 例: rtl8821au-dkms-git
```

これで「カーネル更新で WiFi が死ぬ」経路そのものを断った。

### 2. linux-lts を保険カーネルにする

最新カーネルがコケても GRUB の "Advanced options" から `linux-lts` で起動できれば、**live USB 無しで**ネットありの環境に入って復旧できる。

```bash
sudo pacman -S linux-lts linux-lts-headers
sudo grub-mkconfig -o /boot/grub/grub.cfg
```

### 3. 固定を解除して追いつく

`IgnorePkg` を外し、改めて full upgrade でカーネルを最新まで上げる。

```bash
sudo pacman -Syu      # 個別 -S / -Sy 単独は禁止（partial upgrade になる）
```

## 更新中に踏んだ衝突

追いつかせる過程で linux-firmware の分割に由来する衝突を踏んだ。

```text
error: failed to commit transaction (conflicting files):
linux-firmware-nvidia: /usr/lib/firmware/... exists in filesystem
```

これは linux-firmware がサブパッケージに分割された影響で、旧 linux-firmware を一旦消して入れ直せば抜けられる。**再起動さえしなければ無害**だ。

```bash
sudo pacman -Rdd linux-firmware
sudo pacman -Syu linux-firmware
```

復旧手段も残しておく。`/var/cache/pacman/pkg` の旧パッケージは消さない（`pacman -Scc` 禁止）。何かあれば `sudo pacman -U <旧pkg>` で前バージョンへ戻せる。

## 結果

固定（6.13.8）を解除し、`linux` を最新（7.0.10）まで追いつかせ、保険として `linux-lts` を併存させた。再起動後は **lts 6.18.33 で WiFi / カメラ / マイクが全部動作**。「カーネルを上げると WiFi が死ぬ」という恐怖の根（out-of-tree ドライバ）を抜いたので、今後は `-Syu` で素直に追従できる。

- 起動不能の根本原因を特定して削除（in-tree のみに）。
- 固定をやめても、コケたら GRUB から lts で起動できる保険付き。
- パッチを当て続けられる体制になった ＝ カーネル LPE のような脆弱性で**被害がマシン全体に広がるのを止められる**前提が整った。

## まとめ

- カーネル更新で「起動はするがネット無し」の詰みは、たいてい **out-of-tree な DKMS ドライバ**が原因。in-tree で足りるなら捨てる。
- カーネルだけ `IgnorePkg` で固定する運用は **partial upgrade** になり、別の壊れ方を呼ぶ。Arch では full upgrade が原則。
- `linux-lts` を保険に積めば、最新がコケても **live USB 無し**で復旧できる。
- 旧パッケージ（`/var/cache/pacman/pkg`）は消さない。ロールバックの命綱。

## 参考リンク

- [Arch Wiki — System maintenance（partial upgrades が非サポートな理由）](https://wiki.archlinux.org/title/System_maintenance#Partial_upgrades_are_unsupported)
- [Arch Wiki — Kernel（linux-lts などのカーネルパッケージ）](https://wiki.archlinux.org/title/Kernel)
- [Arch news — 手動介入が必要な告知（linux-firmware の分割など）](https://archlinux.org/news/)
