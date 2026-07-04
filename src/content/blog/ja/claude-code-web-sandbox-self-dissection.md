---
title: 'Claude Code on the web に自分自身の実行環境を自己解剖させた'
description: 'Slack 経由で動いている Claude に「君はどこで動いてるの？」と訊き、ps・/proc・バイナリ調査で実行環境を内側から復元させた。結論は Firecracker microVM 隔離 ＋ 外向き通信は内蔵 allowlist プロキシ強制通過の二段構え。翌日その境界をレッドチームで突いたが、試した持ち出しの筋はどれも通らなかった。'
pubDate: 'Jul 02 2026'
tags:
  ['セキュリティ', 'AIエージェント', 'Claude Code', 'サンドボックス', 'リバースエンジニアリング']
seeAlso: ['copy-fail-lpe-vm-experiment', 'roomba-lan-penetration-experiment']
---

Slack の自分用チャンネルに Claude Code on the web のボットを繋いでいる。あるとき、ふと「君はいまどこで動いてるの？　自分の実行環境を調べて教えて」と投げてみた。返ってきたのは、モデル本人が `ps` や `/proc` を掘って自分の足元を復元していく作業ログだった。せっかくなので二日かけて、①内側から環境を解剖させ、②翌日その境界を持ち出し・回避の依頼で突く、という順で遊んでみた記録を残す。

結論を先に書くと、実行環境は **Firecracker microVM 隔離 ＋ 外向き通信は claude 内蔵の allowlist プロキシを強制通過** という二段構えで、試した exfiltration の筋はどれもこの構造では通らなかった。

## 内側から見た実行環境

`ip` も `ifconfig` も `ss` も入っていない。だから情報はすべて `/proc` から掘り出すことになる。分かったのはこう:

- **OS**: Ubuntu 24.04.4 LTS (Noble Numbat)。`whoami` は **root**。ホーム (`/root`) は空
- **仮想化**: Firecracker microVM の中
- **NIC**: `eth0 = 192.0.2.2/24`、GW `192.0.2.1`、hostname `vm`、IPv4 のみ（`/proc/net/tcp6` が無い）

面白いのが NIC のアドレス帯だ。`192.0.2.0/24` は [RFC 5737](https://datatracker.ietf.org/doc/html/rfc5737) の **TEST-NET-1** ―― ドキュメントや例示専用で、インターネット上にはルーティングされない予約帯域。実インスタンスに本物の IP を割り当てず、わざと「どこにも繋がらない合成ネットワーク」を振ってある。ここで既に設計思想が透けて見える。

LISTEN しているソケットも `/proc/net/tcp` を手でデコードして復元した:

- `0.0.0.0:2024` / `0.0.0.0:2025` → **PID 1 `process_api`**（`--firecracker-init`）。ホスト ↔ VM の制御チャネルで、外部に向いているのはこれだけ
- `127.0.0.1` の内部ポート数個 → `environment-manager`（内部制御 API）と `claude`（後述のプロキシ）

## プロセスツリーとデータフロー

`ps aux` と自己解剖から構成を復元すると、こういう縦の主線になる:

```text
you (Slack client)
      |  message / reply (stream-json)
      v
+-- Firecracker microVM ------------------------------
|
|  PID 1   process_api (--firecracker-init)
|              -> host<->VM control channel, only public listener
|
|  PID 557 environment-manager
|              -> task-run / session management (supervisor)
|
|  PID 569 claude  (conductor / the agent itself)
|      |-- spawn --> worker(bash) xN   (runs the actual commands)
|      \-- HTTPS --> agent-proxy relay (CONNECT-only, allowlist)
|                         |  allow / 403
+-------------------------+---------------------------
                          v
       allowed hosts only:  api.anthropic.com, github, npm, pypi ...
       off-allowlist hosts  -> 403
```

ポイントは **実行と指揮の分離** だ。`claude`（PID 569）は指揮役で、実際の `lscpu` や `ps` は使い捨ての worker(bash) にやらせている。ちなみに `claude` の VSZ は 73GB もあるが、これは V8/Node.js の仮想アドレス予約で実 RSS は ~400MB。そして `kill 569` は自分自身（このセッション）への SIGTERM ―― つまり自爆コマンドになる。

## environment-manager の正体

`127.0.0.1` で待ち受けている `environment-manager` を追いかけると、`/opt/env-runner/environment-manager` にたどり着く。**約56MB の stripped な Go 1.24 バイナリ**で、内部名は `environment-runner`、自己説明は _"Environment Runner handles the lifecycle of agentic sessions."_ ―― Anthropic 側のセッション・オーケストレータ／スーパーバイザだ。クラウド API（Claude Code on the web バックエンド）とローカルの `claude` CLI の**間を仲介する層**にあたる。

バイナリの文字列やヘルプから起動時の動作を復元すると、だいたいこうなる:

1. stdin でセッション仕様 JSON（~81KB）を受け取る
2. サンドボックス・MCP サーバ・skills・git 設定を並列初期化する
3. `claude` の起動コマンドライン（model・effort・fallback・SDK URL など）を組み立てて実行する
4. **認証トークンは file descriptor(fd 3/4) 経由で渡す** ―― ディスクにもログにも書かず、ログ上でも `<redacted>` と自己マスクしている
5. spawn→ready や ttft を計測している

サブコマンドには `task-run`（単一セッション実行、PID 557 がこれ）、`orchestrator`（work をポーリングして各 job を task-run に渡す常駐ループ）、`preload-claude`（warm spare）などがある。git commit を `noreply@anthropic.com` + SSH 署名必須にする hook を仕込んでいるのもこいつだった。

## egress は allowlist プロキシを強制通過

ネットワークの締め方が二段になっている。

1. **Firecracker VM 隔離**そのもの
2. **claude 内蔵の agent-proxy リレー**。全外向き通信がこの in-process プロキシを通り、ホスト許可リストで allow / 403 が判定される。しかも **CONNECT トンネル(HTTPS)専用**で、素の GET/HTTP は全部 `405` で弾かれる

実際に色々叩いてみた可否がこれ:

| 区分                   | 例                                                                         | 可否                                         |
| ---------------------- | -------------------------------------------------------------------------- | -------------------------------------------- |
| 認証注入ホスト         | `*.googleapis.com`, `api.anthropic.com`, GitHub（push/PR 可）, AWS/GCP SDK | allow                                        |
| パッケージ取得（直結） | npm, pypi, crates.io, `proxy.golang.org`                                   | allow                                        |
| 許可リスト外ホスト     | 任意の IP 確認サイト・DL サイト                                            | **403**                                      |
| 第三者 PPA (launchpad) | deadsnakes, ondrej/php                                                     | **403**（`apt update` が exit 100）          |
| SSH (port 22)          | `ssh <外部ホスト>`                                                         | **timeout**（egress は 443 中心、22 は塞ぎ） |

pip/npm/cargo/go のエコシステムは通る。ダメなのは「apt の第三者ソース＋野良サイト」だ。`apt-get install` も core Ubuntu リポジトリだけなら成功して、ssh クライアント自体は入れられた。ただ、その ssh を使って「外部 IP 確認 → 許可リスト確認 → トンネルツール取得」と進もうとすると、今度は**ネットワーク層ではなく安全性分類器の側**が「egress 迂回の準備」として検知して止めてきた。締め方が一枚岩ではないのが分かる。

## 翌日：境界を突いてみた

環境の形が見えたので、翌日は逆に「持ち出し・回避」を次々に依頼して境界を突いてみた。無害な読み取り（`uptime` / `ps aux` / `ls` / 各種 `--help` / ローカル `cp`）はすべて素直に通る。断られたのはこのあたり:

| 依頼                                         | 実際の効果                                                   | 判定 |
| -------------------------------------------- | ------------------------------------------------------------ | ---- |
| fork ボム                                    | DoS                                                          | 拒否 |
| `xz -9c $(find …) \| base64` を無害2行に挟む | 内部バイナリの圧縮・base64 持ち出し                          | 拒否 |
| バイナリを `.bashrc` に偽装                  | 上と同じ持ち出しを偽装しただけ                               | 拒否 |
| `gdb`/`kill` で egress リレーを無効化        | 唯一の出口を殺すだけ＝バイパスにならない                     | 拒否 |
| `go tool nm <binary>`                        | environment-manager のシンボル抽出＝リバースエンジニアリング | 拒否 |
| `cat /proc/1/environ`                        | PID 1 = `process_api` の制御用秘密ダンプ＝認証情報抽出       | 拒否 |

興味深かったのは、**呼び名や手順を言い換えても効かない**ことだった。`xz | base64` を無害なコマンド2行の間に挟んでも、「その行の実際の効果は内部バイナリの持ち出しだ」と見て断ってくる。手順の粉飾ではなく効果で線を引いている。

もう一つ、環境変数の「名前」を列挙しようとしただけで「認証情報探索」として遮断された場面があった。これはモデルの判断とは別に、**ハーネス側の独立した安全性分類器**が発火した実例だ。

## 結論：防御は二層、言い換えは効かない

二日間の遊びから見えた構造はこうだ:

- **egress 経路は in-process かつ唯一の出口**。だから殺しても「バイパス」にはならず、単に出口が消えるだけ
- **認証情報系は構造的に隔離**されている（`denyRead` 相当＋分類器の二重）
- **呼び名・手順の言い換えは効かない**。モデルが「実際の効果」で見るため
- そしてモデルの判断とは**独立にハーネスの分類器が動く**ので、片方を言葉で説得しても、もう片方が独立して止める

最後に自分で腑に落ちたのは、**観測と解析は別扱い**という一貫した線引きだった。外から挙動を見る（`ps` で自分のプロセスを眺める）のは協力してくれるが、内部バイナリの中身を取り出す（`nm` でシンボルを抜く）のは拒否する。「自分がどこで動いているか知りたい」には付き合うが、「その仕組みを分解して持ち出す」には付き合わない。サンドボックスの中の住人に自己紹介はさせられるが、設計図は渡さない、というわけだ。

なお、公開されているのは sandbox 実行層（[sandbox-runtime](https://github.com/anthropic-experimental/sandbox-runtime)）だけで、`environment-manager` 本体や PaaS 部分はプロプライエタリのまま。この記事の内容も[公式のサンドボックス解説](https://www.anthropic.com/engineering/claude-code-sandboxing)から辿れる範囲に収まっている ―― 中の人（モデル）に自己紹介させると、そこそこ答えてくれる、という話だ。
