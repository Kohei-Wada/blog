---
title: '24時間動かす自宅AIサーバのOSにNixOSを選んで、導入で踏んだ5つの地雷'
description: 'ローカルLLMの実験場として24/7無人のAIサーバを建てるにあたり、当初予定のArchをやめてNixOSにした。なぜ宣言的構成とrollbackを取ったのか、そしてGPUがBlackwell(RTX5090)というほぼ前例ゼロのパイオニア領域で、minimal ISOからのインストール時に実際に詰まった5つ——WiFiのwpa_supplicant罠、btrfsマウントオプション消失、ヘッドレス再起動でのネット喪失、WiFi power saveによるSSH激遅、リモートsudo+globの展開——をまとめた実録。'
pubDate: 'Jun 14 2026'
tags: ['NixOS', 'homelab', '自宅サーバ', 'WiFi', 'btrfs', 'トラブルシューティング']
---

## はじめに

ローカルLLMをいじり倒す実験場として、24時間動かしっぱなしの自宅AIサーバを建てた。GPUはRTX5090(32GB)、ヘッドレス・無人運用が前提だ。問題はOSをどうするか。普段使いはArchなので最初はArchで行くつもりだったが、最終的に**NixOS**にした。

結論から言うと、選択は正解だった。ただしGPUがBlackwell世代という**コミュニティ実績がほぼゼロのパイオニア領域**で、minimal ISOからのインストールでは想定どおり何度か詰まった。この記事は「なぜNixOSにしたか」と「導入で実際に踏んだ地雷」の実録だ。汎用的なNixOS入門ではなく、自分が手を動かして引っかかった部分だけを書く。

## なぜArchをやめてNixOSにしたのか

普段のラップトップはArchで困っていない。だが**24時間無人で動かすサーバ**は要求が違った。

- **宣言的構成管理**: サーバの状態が1つの`configuration.nix`に全部書いてある。手で何かを入れて後で「これ何で入れたっけ」になる、が原理的に起きない。
- **ロールバックが容易**: カーネルやドライバの更新で起動が壊れても`nixos-rebuild switch --rollback`で前の世代に即戻せる。Archでカーネル更新が壊れてネット無しで詰んだトラウマ（[別記事](/ja/blog/arch-safe-kernel-upgrade-journey)）があるので、これは大きい。
- **再現性**: 構成ファイルをgit管理しておけば、SSDが飛んでも同じ環境を再構築できる。

NixというLanguageの学習コストはあるが、Haskell/Luaを触ってきた身には許容範囲だと判断した。「自分の興味の地肌（宣言的・関数的なもの）と噛み合う系は続く」という経験則にも合っていた。

### Ubuntuにしなかった判断

NixOS + RTX5090(Blackwell)はほぼ前例がない。「事例が多いUbuntuの方が安全では?」と当然迷う。ここは事前にちゃんと調べた。

Blackwellの24/7運用で一番怖いのは**GSP heartbeat timeout**という未解決のハングバグなのだが、これは調べた限り**ディストリ非依存**だった（Mint/Fedora等でも報告がある。Blackwellはどのディストリでも`nvidia-open`ドライバ一択で、そこは共通)。つまりUbuntuに替えても**得られるのは事例の多さだけで、クラッシュは回避できない**。それと引き換えにNixOSのrollbackと宣言的構成を失うのは割に合わない。

落とし所は「**NixOSで続行 + ウォッチドッグで自動復帰前提の設計 + 切り分け用のUbuntu Live USBを1本だけ用意**」にした。詰まったときに「GPUの問題かNix設定の問題か」を切り分けられる保険だけ持っておく形だ。

## 導入で踏んだ5つの地雷

ここからが本題。NixOS 26.05のminimal ISOから、btrfs subvolume構成でベースインストールした。全工程をSSH経由のリモートでやったので、その分の罠も含む。

### 1. WiFi接続は `nmcli` 一択、`wpa_supplicant` 直叩きは罠

ヘッドレスなのでまずWiFiを繋いでSSHを開通させたい。古いwikiにある`wpa_passphrase > /etc/wpa_supplicant.conf`の手順をやったが、**まったく繋がらない**。

原因は、26.05のinstaller ISOがNetworkManager前提になっていることだった。ISOの`wpa_supplicant.service`は`-u`（D-Bus待ち・`-i`なし）で起動する**NM専用バックエンド**で、自分でconfを書いてもインターフェースを掴まない。しかも`kill`しても**D-Bus activationで勝手に復活する**ので、手動運用しようとすると延々と空振りする。

正規ルートはNetworkManager:

```bash
nmcli device wifi connect "<SSID>" password "<pass>"
```

これ一発で繋がる。古い手順を疑わずに踏むと一番最初でハマる。

### 2. `nixos-generate-config` が btrfs のマウントオプションを拾わない

btrfsで`compress=zstd`と`noatime`を効かせたかったので、subvolumeをマウントしてから`nixos-generate-config`を走らせた。生成された`hardware-configuration.nix`を見ると、**`subvol=` は入っているのに `compress=zstd` と `noatime` が消えていた**。

これは公式Wikiにも明記されている既知の挙動だった。`configuration.nix`側で補う:

```nix
fileSystems."/".options = [ "compress=zstd" "noatime" ];
fileSystems."/nix".options = [ "compress=zstd" "noatime" ];
# ...各サブボリュームぶん
```

リストはマージされるので、`subvol=`を消さずに追記で効く。生成物を鵜呑みにせず差分を確認する、を地で行く話。

### 3. ヘッドレス再起動で「ネットの無いサーバ」が爆誕する

これが一番ヒヤッとした。ISO上で繋いだWiFiの接続情報は、**インストール先には引き継がれない**。気づかずに再起動すると、ヘッドレスのサーバが**ネットワーク無しで上がってくる**——画面もキーボードも繋いでいないので、文字どおり手も足も出なくなる。

インストール前にNMプロファイルを手でコピーしておく必要がある:

```bash
mkdir -p /mnt/etc/NetworkManager/system-connections
cp -a /etc/NetworkManager/system-connections/*.nmconnection \
      /mnt/etc/NetworkManager/system-connections/
chmod 600 /mnt/etc/NetworkManager/system-connections/*
```

（後で`configuration.nix`の`networking.networkmanager.ensureProfiles`で宣言的に書き直したが、初回再起動を生き延びるにはこのコピーが要る。）

### 4. WiFi の power save で SSH が激遅になる

無事に上がってきた後、今度は**SSHのキー入力反応がやけに悪い**。スペックの問題かと疑ったが、`time bash -lc true`でシェル起動は0.002秒。シェルは無実だった。

ネットワーク層を疑って`ping`を取ると、**LAN内なのに平均83ms・最大257ms**という分布。LANの正常値は2〜5msなので明らかにおかしい。これはWiFiの**power save**がパケットを次のビーコンまでバッファする典型パターンだった。

使っていたチップ（rtw89 / RTL8922AE）は、NetworkManagerの設定が`powersave: 0`でも「**無効**」ではなく「**ドライバ任せ**」で、ドライバが勝手にpower saveを有効化する。明示的に切る:

```bash
# ランタイム確認・即時対処
iw dev wlp7s0 get power_save
iw dev wlp7s0 set power_save off
```

NixOSでは宣言的に、プロファイルへ`wifi.powersave = 2;`（2 = disable）を入れて恒久化した。結果は**平均8ms・最大18ms**で、約10倍改善。サーバ用途のWiFiはpower save無効が定石だと体で理解した。

### 5. リモート `sudo` + glob の展開罠

細かいが地味に効く。リモートで`sudo cp ... *.nmconnection ...`のようなglobつきコマンドを投げると、**globが非rootシェルで展開されて失敗する**。`sudo sh -c "cp ... *.ext ..."`の形で、glob展開をroot側のシェルに寄せる必要がある。リモート作業特有のハマりどころだった。

## まとめ

パイオニア領域だけあって、WiFi周りを中心に素直には進まなかった。ただ踏んだ地雷はどれも「調べれば一次情報がある」類で、致命傷はなかった。そして肝心の**宣言的構成 + rollbackの安心感**は期待どおりで、その後ドライバやサービスをガンガン足していく作業が怖くなくなった。「壊れても前の世代に戻せる」という前提があるだけで、サーバいじりの心理的コストが段違いに下がる。

GPU（Blackwell）側の本丸——GSP heartbeat timeoutとウォッチドッグ設計——はまた別の話なので、それは別記事に分けたい。
