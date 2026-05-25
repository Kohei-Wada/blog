---
title: 'ターミナルで地球儀を回す ── 自作 ttymap で飛行機も地震も ISS も眺める'
description: 'ベクタタイルを Unicode Braille + ANSI 256色でレンダリングして、ターミナルの中に動く地球儀を出す ttymap という自作ツールの紹介。上空を飛ぶ ADS-B 航空機、直近の地震、頭上を通過する衛星、traceroute のホップまで地図に重ねて眺められる。すべての機能が Lua プラグインで、設定もシーン演出も Lua で書ける。'
pubDate: 'May 25 2026'
tags: ['個人開発', 'Rust', 'TUI', 'Lua']
seeAlso: ['taskdog-cli-task-management-tool']
---

ターミナルに地球儀を出した。`ttymap` と打つと braille 文字で世界地図が描かれて、`hjkl` で動かせる。それだけなら昔からある端末マップビューアだが、これはその上で **今この瞬間に自宅上空を飛んでいる飛行機**を出したり、**直近24時間の地震**を色付きで撒いたり、**頭上を通過する ISS** を追いかけたりできる。全部ターミナルの中で、256色の braille で。

![ttymap のデフォルト表示。ヘルプパネルと衛星トラッカー付き](https://raw.githubusercontent.com/Kohei-Wada/ttymap/main/assets/ttymap-default.png)

デモ動画とスクリーンショットは repo の README にまとめてある: <https://github.com/Kohei-Wada/ttymap>

## 何これ

地図のコアは素直だ。Mapbox Vector Tile をデコードして Mercator で投影し、1セルあたり 2×4 のサブピクセルを持つ Unicode Braille に焼いて、ANSI 256色を乗せる。フィーチャは R-tree で空間インデックスしてある。`mapscii` 系の「端末に地図」をやる部分はこの一段で、ここだけ取り出してもまともなビューアになる。

操作は vim 風だ。`hjkl` でパン、`b`/`w` で速いパン、`C-u`/`C-d` で半画面パン、`a`/`z` でズーム、`gg` で世界全体、`0` でリセット。マウスのドラッグとスクロールも効く。`:` でコマンドパレット、`/` で Nominatim の地名検索。`?` を押すと、今アクティブなキーマップとプラグインのパレット項目から生成された生きたチートシートが出る。

ここまでは「端末で動く地図ビューア」の話だ。面白くなるのはこの上に乗るプラグインから。

## プラグインで見せる

ttymap の機能はほぼ全部がプラグインで、18個がランタイムに同梱されている。「ttymap とは何のためのものか」への答えは、結局この一覧になる。見て楽しいものを目的別に並べる。

### 地球を眺める

- **`aircraft`** ── OpenSky の公開 ADS-B フィードから、今飛んでいる航空機のマーカーを地図に出す。サイドバーに高度・速度のリストが並び、Enter でその機体に地図を寄せる。自宅の上空を眺めると、思った以上に飛んでいる。
- **`quake`** ── USGS の直近24時間・マグニチュード2.5以上の地震を色付きマーカーで撒く。サイドバーにリストが出て、最大マグニチュードの震源に自動でジャンプする。
- **`satellite`** ── ISS や Hubble などを複数同時に追跡する。CelesTrak から TLE を取得して、軌道伝播（SGP4）を Lua で回している。
- **`wiki`** ── Wikipedia の geosearch。近くの記事をマーカーと side panel で出し、Enter で抜粋段落を開く。

### 遊ぶ

- **`geo_quiz`** ── 「制限時間内にこの都市を探せ」。お題が出て、約30秒で地図の中心をできるだけ近づける。Enter で submit すると、カメラが自分の解答と正解の両方を ◎ マーカーと結線で収める画へ飛ぶ。スコアは累積の誤差km（ゴルフ式、少ないほど良い）。easy は国名表示、hard は無し。
- **`travel`** ── 日本とイタリアの周遊ルートが最初から入っていて、pre-overview → 各都市ループ → post-overview の演出付きツアーが流れる。後述の `ttymap.director` で駆動している。
- **`autospin`** ── カメラが東へ一定速度でドリフトし、対蹠経線でループする。「これは地球儀だ」を示すデモ。手で動かすと止まる。
- **`antipode`** ── パレットから、球面上の正反対の点へ飛ぶ。「今いる場所の地球の裏側はどこか」。
- **`here`** ── IP ジオロケーションで現在地を割り出して、カメラを自宅へ飛ばす。

### ネットワークを地図に

- **`traceroute`** ── `r` でホスト名を入れると、`traceroute(8)` が次ホップを解決するたびに、経路の polyline がホップごとに地図上を伸びていく。サイドバーにホップ一覧（Enter でそのルータへ飛ぶ）、ホップごとの色グラデーション、連続する `*` はパネル上で畳まれる。パケットが世界のどこを通っているか目で追える。
- **`ping_simulation`** ── 都市間を ping し合う成長アニメーション。アニメ polyline オーバーレイのリファレンス実装。

プラグインはそれぞれ `runtime/lua/plugin/` 下の単一の `*.lua`（または `init.lua` 入りディレクトリ）で、自分でプラグインを書くときのチュートリアルとして読める。

## ただのビューアじゃない

ここが ttymap を「インタラクティブなビューア」から「プログラマブルな地球儀」に押し上げている部分だ。

まず、**設定が Lua** だ。`~/.config/ttymap/init.lua` に書く。TOML と違って条件分岐や計算で値を決められる ── これが地味に効く。

そして **scriptable scenes**。`ttymap.animation.fly_to`（フレーム単位のパン/ズーム）と `ttymap.director`（`fly` / `wait` / `tween` を持つコルーチンスケジューラ）がある。プラグインは、複数ステップのカメラ＋オーバーレイの演出を手続き的な Lua として振り付けられる。ツアーを書くとこうなる:

```lua
local director = require "ttymap.director"

director.run(function()
    ttymap.notify("Starting tour")
    director.fly(139.69, 35.69, 10)   -- カメラが東京に着くまで yield
    director.wait(120)                -- 60fps で約2秒そこに留まる
    director.fly(-74.00, 40.71, 10)   -- ニューヨークへ滑空
    director.wait(120)
    director.fly(2.35, 48.86, 10)     -- パリへ
    director.wait(120)
end)
```

`director.fly` はカメラが到着するまで yield する。だから手続き的に「東京へ飛ぶ → 待つ → NY へ飛ぶ」と書くだけで、非同期のアニメーションが順番に流れる。さっきの `travel` プラグインの正体はこれだ。

ユーザープラグインは `~/.config/ttymap/lua/plugin/` に置く。Neovim 風の stem-dedup なので、同名ファイルで同梱プラグインを上書きできる。

## 試す

単一ユーザインストール、root 不要:

```bash
git clone https://github.com/Kohei-Wada/ttymap
cd ttymap
make install
```

`~/.cargo/bin/ttymap` と `~/.local/share/ttymap/`（同梱ランタイム）が入る。`cargo install` 単体だとランタイムが置かれないので「`make install` した?」と即 fail する。

起動:

```bash
ttymap                                       # デフォルト位置
ttymap --lat 35.68 --lon 139.76 --zoom 10    # 東京
ttymap --style bright                        # 明るいテーマ
```

「現在地に飛びたい」なら `:` パレットから `here` プラグインを呼ぶ。

ヘッドレスのスナップショットも撮れる。ダッシュボードや cron、パイプ向け:

```bash
ttymap snap --lat 35.68 --lon 139.76 --zoom 12               # → stdout
ttymap snap --lat 35.68 --lon 139.76 --zoom 12 -o tokyo.ans  # → ファイル
```

`snap` は生の xterm-256 ANSI を吐く。対応端末で `cat` するか `less -R` に流せば見える。

## まだ WIP

日常的に使える程度には安定しているが、まだ WIP だ。CLI フラグ、Lua の表面、config スキーマは予告なく変わりうる。中身は Rust 2024 edition の7クレット workspace で、ビルドは `protox` を使うので system `protoc` は要らない。

コードとデモ動画はここ: <https://github.com/Kohei-Wada/ttymap>
