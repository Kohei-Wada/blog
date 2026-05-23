---
title: 'pacman "Damaged tar archive" 障害復旧戦記 ─ 3 つの要因が合流した日'
description: 'sudo pacman -Syu が "Damaged tar archive (bad header checksum)" で延々失敗する障害を踏んだ。tar/bsdtar では読めるのに pacman だけが落ちる謎、HTTP 304 で再ダウンロードもされない罠、そして systemd timer のサスペンド復帰挙動。3 要因の合流で起きた障害を pacman --debug と gzip フォーマット解析で追った記録。'
pubDate: 'May 23 2026'
tags: ['Arch Linux', 'pacman', 'systemd', 'トラブルシューティング']
---

## はじめに

朝一の `sudo pacman -Syu` が `error: could not read db 'core' (Damaged tar archive (bad header checksum))` で延々失敗するようになった。`-Syy` で DB を強制再取得しても直らない、`pacman -U` で pacman 本体と libarchive を再インストールしても直らない。一見すると単なる「ミラーが古い」案件に見えるが、掘っていくと 3 つの独立した要因が同じ日に合流していました。

この記事では、その障害を pacman --debug、gzip のフォーマット解析、`cmp` によるバイト比較、systemd-journald のログ追跡で原因まで辿った過程を残しておきます。`file` が「正常な gzip」と誤判定する仕組みや、`network-online.target` がサスペンド復帰で再評価されない罠など、Arch ユーザーや systemd 運用者が踏みうるポイントが詰まっていました。

結論を一文で先に書くと: **reflector がサスペンド復帰直後に DNS 失敗で死んでいて、mirrorlist が古いまま、その先頭ミラーが破損 DB を配信していて、しかも HTTP 304 を誤って返すので再取得できない** ─ という多段の合流でした。

## まず何が起きたか

普段どおり `sudo pacman -Syu` を叩いたらこうなった。

```text
error: could not read db 'core' (Damaged tar archive (bad header checksum))
error: could not read db 'extra' (Damaged tar archive (bad header checksum))
...
```

最初の反射は「ダウンロードが途中で切れた」だったので `sudo pacman -Syy` で DB を強制再取得した。変わらない。次に「pacman か libarchive のバイナリが壊れたかも」と疑って `pacman -U` でキャッシュから両方を再インストールした。これも変わらない。

`-U` は sync DB を参照しないのでキャッシュからの再インストールはできた、というのが後でわかる伏線になります。

## DB ファイル自体は「読めるソフト」もある

まず DB が物理的に壊れているのかを切り分けるために、pacman 以外で読めるか試した。

```bash
tar tf /var/lib/pacman/sync/core.db | wc -l    # 589 entries, exit 0
bsdtar tf /var/lib/pacman/sync/extra.db | wc -l # 1496 entries, exit 0
```

GNU tar も bsdtar も普通にエントリを返してくる。`file` コマンドに食わせても `gzip compressed data` と返ってきて、「破損」とは言わない。bsdtar は libarchive 3.8.7 を使っていて、pacman も同じ libarchive にリンクされている。**同じライブラリを使っているはずなのに、pacman だけが落ちる**。これが最初の謎でした。

## 公式ミラーとバイト単位で比較する

pacman.conf の 1 番目のミラー `mirrors.cat.net` と、Arch 公式 `geo.mirror.pkgbuild.com` の `core.db` を `curl -sI` と `cmp` で比較した。

| ファイル       | mirrors.cat.net  | 公式             |
| -------------- | ---------------- | ---------------- |
| core.db サイズ | 127,304 bytes    | 127,296 bytes    |
| core.db 更新   | Apr 20 08:56 UTC | Apr 20 13:59 UTC |
| core.db MD5    | efec2b0b...      | efe1e191...      |

サイズが 8 bytes 違って、MD5 が完全不一致。`cmp` で先頭から見ると 28 バイト目から既に差分があった。

```text
core_cat.db core_official.db differ: byte 28, line 1
```

単に同期が遅れているのではなく、cat.net が配信している DB のバイト列そのものが公式と違う。

## gzip レイヤで破損していることを確認する

ここで `gzip -l` に食わせると、cat.net 版は両方ともはっきり「壊れている」と返してきた。

| ファイル | エラー                                   |
| -------- | ---------------------------------------- |
| core.db  | invalid compressed data--crc error       |
| extra.db | invalid compressed data--format violated |

ここで核心の疑問に戻る: **なぜ `file` は「gzip compressed data」と言い、tar/bsdtar は読めて、pacman だけが落ちるのか。**

`file` コマンドはマジックナンバー判定しか見ない。gzip の先頭 10 bytes (`1f 8b 08 ...`) が正しければ「gzip だ」と返す。圧縮データの中身も末尾の CRC32 / ISIZE も検査しない。だから「ヘッダだけ正常で中身が腐っている gzip」は、file の目には正常に映る。

gzip の末尾には 8 bytes のフッタがあって、前半 4 bytes が展開後データの CRC32、後半 4 bytes が展開後サイズ (ISIZE) を保持している。cat.net 版と公式版を末尾から見比べるとこうだった。

```text
official : ... 22 45 8a [77 f0 1f f4 15 22 be] [00 00 0a 00]
cat.net  : ... 22 45 8a [14 ef e0 2f bc c4 4c fd] [00 00 0a 00]
                        ↑ ここから化けている
```

- ISIZE (展開後サイズ) は両方とも `0x000a0000` = 655360 bytes で同じ主張をしている
- CRC32 は完全に違う (`0xbe2215f4` vs `0xfd4cc4bc`)
- ストリーム末尾 deflate ブロックも違う

つまり「展開後サイズはこれだけになるはず」という宣言は揃っているのに、実データが化けて CRC が合わない、という典型的なランダム破損の挙動。core.db は CRC error、extra.db は format violation と破損タイプが分かれているのもランダム破損らしさを補強する（攻撃や改竄なら、もう少し系統だった壊れ方をする）。

## tar/bsdtar は読めて pacman が読めない理由

ここで libarchive を共通に使っているのに挙動が分かれる理由が見える。

- GNU tar / bsdtar は末尾の CRC エラーを警告に留めて、読める分のエントリを返す（緩い）
- pacman (libalpm) は `sync_db_populate` の中で tar header checksum と gzip 整合性を厳格にチェックして、おかしければ即エラー

`pacman --debug -Sy` を回すと、まさに `sync_db_populate (be_sync.c: 489)` の中で落ちているのが確認できる。同じライブラリでも呼び出し側の厳格さで挙動が変わるという話でした。

## HTTP 304 で再ダウンロードを拒否される

「じゃあ -Syy で強制再取得すればいいじゃん」と思って叩いたら、ここでも一発で詰まる。pacman --debug のログを見ると cat.net は新しい内容を持っているはずなのに 304 を返してくる。

```text
debug: core.db: using time condition 1776675365
debug: core.db: response code 304
debug: core.db: file met time condition
```

pacman は `If-Modified-Since` をつけて取りに行く。本来サーバーは更新があれば 200 と新しいバイト列を返す。が cat.net は **新しい内容があるのに 304 Not Modified を返してくる**。pacman は「変わってないんですね」と素直に受け取って、ローカルの壊れた DB を使い続ける。`-Syy` でも変わらない。これでミラー側で勝手に直っても、こちらに伝わってこない構造になっていました。

## なぜミラーが固定されたままだったのか ─ reflector の沈黙

普通なら週次の `reflector.timer` が mirrorlist を更新してくれているはずなので、cat.net がそんなに長く先頭に居座るわけがない。journalctl を遡ったらこうだった。

```text
Mar 30 21:09:38 reflector: failed to retrieve mirrorstatus data:
Apr 06 22:04:45 reflector: URLError: Temporary failure in name resolution
Apr 13 19:16:29 reflector: URLError: Temporary failure in name resolution
Apr 20 22:03:58 reflector: URLError: Temporary failure in name resolution
```

3 週連続で DNS 解決に失敗して死んでいる。`Apr 20 22:03:58` の失敗時刻は、ラップトップのサスペンド復帰と同じ秒だった。

タイムラインを並べるとこう。

| 時刻            | イベント                                        |
| --------------- | ----------------------------------------------- |
| Apr 20 02:26:13 | サスペンド突入                                  |
| Apr 20 22:03:58 | サスペンド復帰 (蓋を開けた)                     |
| Apr 20 22:03:58 | reflector.service が即時発火 (Persistent=true)  |
| Apr 20 22:04:02 | NetworkManager が WiFi 再接続 / DHCP lease 取得 |

復帰と WiFi 再接続には 4 秒の差がある。`reflector.timer` は `Persistent=true` なので、サスペンド中に発火すべきだった分が復帰した瞬間にまとめて発火する。**ところがその時点で DNS はまだ使えない**。reflector は archlinux.org を引けず、URLError で即死する。

「いやでも reflector.service には `After=network-online.target` と `Wants=network-online.target` が入ってるはずでは？」と思って確認したらその通り入っていた。が、ここに 2 つ目の罠がある。**`network-online.target` はサスペンド前から active のままなので、復帰時に再評価されない**。systemd から見れば network-online は「もうとっくに達成済み」なので、`After=` 制約は素通りする。

これは Wake-from-suspend と timer 持ち越しが組み合わさったときの典型的な落とし穴でした。

## 3 要因の合流

ここまでをまとめるとこうなる。

| 要因                                                      | いつから                |
| --------------------------------------------------------- | ----------------------- |
| reflector がサスペンド復帰直後の DNS 失敗で毎週死んでいた | 2026-03-30 頃から       |
| mirrorlist が 2026-03-23 時点のまま固定、1 番目が cat.net | 2026-03-30 以降更新なし |
| cat.net が破損 DB を配信、しかも 304 を誤って返す         | 2026-04-20 頃           |

どれか 1 つでも欠けていれば踏まなかった。reflector が動いていれば cat.net は先頭から落ちていた。mirrorlist が手動で更新されていれば同じ。cat.net が 304 を正しく返さなければ -Syy で復旧できた。3 つが同じ日に重なって初めて、`pacman -Syu` が無限に同じエラーを吐く状況が生まれていました。

## 復旧手順

即時復旧の手順から書く。

```bash
# 壊れた DB を消して公式ミラーから直接取得し直す
sudo rm /var/lib/pacman/sync/core.db /var/lib/pacman/sync/extra.db
sudo curl -fLo /var/lib/pacman/sync/core.db \
  https://geo.mirror.pkgbuild.com/core/os/x86_64/core.db
sudo curl -fLo /var/lib/pacman/sync/extra.db \
  https://geo.mirror.pkgbuild.com/extra/os/x86_64/extra.db

# mirrorlist から cat.net を即座に除外
sudo sed -i 's|^Server = https://mirrors.cat.net|#Server = https://mirrors.cat.net|' \
  /etc/pacman.d/mirrorlist

# これでアップグレードが通る
sudo pacman -Syyu
```

恒久対策は 2 案ある。どちらかというと A 案を採った。

**A 案: reflector に DNS が引けるまで待たせる。**

```bash
sudo systemctl edit reflector.service
```

```ini
[Service]
ExecStartPre=/bin/sh -c 'for i in $(seq 1 60); do getent hosts archlinux.org >/dev/null 2>&1 && exit 0; sleep 1; done; exit 1'
```

最大 60 秒、archlinux.org が引けるまで待ってから reflector 本体を走らせる。サスペンド復帰直後の WiFi 再接続待ちもこれで吸収できる。

**B 案: タイマーの持ち越しをやめる。**

```bash
sudo systemctl edit reflector.timer
```

```ini
[Timer]
Persistent=false
```

サスペンド中に発火するはずだったタイミングはスキップする。次回の週次タイミングを待つ。シンプルだが、長時間サスペンドが続くと最大 1 週間 mirrorlist が古いまま残るリスクがある。

## 注意点・ハマりどころ

- `file` コマンドの「gzip compressed data」を信用してはいけない。gzip ヘッダのマジックナンバーしか見ていない。中身が腐っていても気付かない。整合性を見たいなら `gzip -l` か `gzip -t` を使う
- tar / bsdtar が読めても pacman が読めるとは限らない。libarchive を共通に使っていても、呼び出し側 (libalpm) の検査が厳格なので、ゆるい CLI 系ツールでの動作確認はあてにならない
- `pacman -U` は sync DB を見ないので、sync DB が壊れていてもキャッシュからの再インストールはできる。**復旧中に pacman 本体や libarchive を入れ直したい時はこのルートが使える**
- ミラーが HTTP 304 を誤って返すケースがある。`-Syy` を信用しきらないこと。疑わしい時はミラーを変えるか手で curl
- `network-online.target` はサスペンドを跨いで再評価されない。`After=network-online.target` を入れていても、復帰直後の DNS 未準備状態で発火する可能性がある。DNS が必要なサービスは `ExecStartPre` で明示的に待たせる方が確実

## 結果

- 即時復旧: 公式ミラーから手で DB を取得し直し、cat.net を mirrorlist から外して `pacman -Syyu` 通った
- 恒久対策: reflector.service に DNS 待ちの ExecStartPre を入れて、サスペンド復帰直後の DNS 失敗で死なないようにした
- 副産物: pacman --debug、gzip フォーマット手読み、systemd の wake-from-suspend 挙動という、別の障害でも効くデバッグ手筋を 3 つ手に入れた

## まとめ

- 同じ libarchive を使っていてもツールごとに厳格さが違う ─ tar/bsdtar が読めても pacman が読めるとは限らない
- `file` は gzip ヘッダしか見ない。整合性を見るなら `gzip -l` か `gzip -t`
- HTTP 304 を誤って返すミラーが存在する ─ `pacman -Syy` でも壊れた DB から脱出できない罠
- `network-online.target` はサスペンド復帰で再評価されない ─ DNS 必須サービスは ExecStartPre で明示的に待つ
- 複合障害は単独要因では起きない。3 要因がたまたま同じ日に合流したから踏んだ

## 参考リンク

- [Arch 公式ミラーステータス](https://archlinux.org/mirrors/status/)
- [pacman(8) ドキュメント](https://man.archlinux.org/man/pacman.8)
- [reflector(1)](https://man.archlinux.org/man/reflector.1)
- [systemd.timer(5) ─ Persistent= の挙動](https://man.archlinux.org/man/systemd.timer.5)
- [RFC 1952 ─ GZIP file format specification](https://datatracker.ietf.org/doc/html/rfc1952)
