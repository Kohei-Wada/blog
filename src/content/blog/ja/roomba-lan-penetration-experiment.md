---
title: '自宅のルンバに LAN 越しから侵入してみた'
description: '自分のルンバ i2 に対して、物理操作なし・クラウドAPI未使用・LAN 完結の条件で、どこまで情報を抜き攻撃できるか実験した。MQTT 認証は堅牢だったがクラウド通信遮断は容易、最終的に dorita980 のマジックパケットで MQTT パスワードを抽出した。'
pubDate: 'May 23 2026'
tags: ['セキュリティ', 'IoT', 'リバースエンジニアリング', 'Home Assistant']
---

> ⚠️ 本実験は **自分の所有機器・自分の LAN 内で** 実施したもの。他人の機器や他人のネットワークに対して同じことをやるのは違法です。

## はじめに

自宅 LAN にある iRobot Roomba i2（自分の所有物、母艦になっている個体）に対して、どこまで情報を抜き、どこまで操作できるかを実験しました。情報収集は丸見えに近い水準でできたが、MQTT 認証の壁は厚く、ネットワーク経由だけでの完全制御は達成できなかった。最終的には dorita980 コミュニティが解析したマジックパケットで MQTT パスワードを抽出する（ボタン押下込み）所まで到達しました。

ルンバを Home Assistant 経由で動かすために MQTT パスワードを抽出する標準手順があります（HA 公式 integration もこれ）。だが裏側で何が起きているのか、認証のどの層が破られるのかは「黙って使う」だけでは分からない。クラウド経由ではなく LAN side だけで何が見えるかを実機で測りたかった、というのが動機です。

ターゲット情報:

| 項目           | 値                                    |
| -------------- | ------------------------------------- |
| モデル         | iRobot Roomba i2 (sku: i215860)       |
| ファームウェア | daredevil+2.6.0+daredevil-release+163 |
| IP             | 192.168.1.20                          |
| MAC            | OUI: iRobot                           |
| クラウド接続先 | AWS IoT (443/tcp)                     |

## Phase 1: 偵察

- **nmap でネットワークスキャン** → 16 台のデバイスを発見、MAC の OUI から iRobot を特定
- **UDP 5678 discovery プロトコル** → `echo -n "irobotmcs" | nc -u -w3 192.168.1.20 5678` で、デバイス名・BLID・ファームウェア・機能一覧が JSON で丸見え。**認証不要**
- **ポートスキャン（全 65535）** → 開放ポートは 8883/tcp (MQTT over TLS) のみ
- **TLS 証明書調査** → iRobot 自己署名のチェーンを取得。中間 CA "Robot Intermediate CA A01" が 2025 年末に失効済みという発見つき

## Phase 2: MQTT 認証への攻撃

- **デフォルトパスワード試行** → blid/空、blid/blid 等を paho-mqtt で試行。すべて rc=134 (Not Authorized)
- **レートリミットの発見** → 2-3 回の認証失敗で Connection refused。ブルートフォース対策あり
- **dorita980 マジックパケット試行** → `0xf005efcc3b2900` を送信。応答末尾が `0x03`（provisioning mode not active）。プロトコル自体は動いているがボタン押下が必要

## Phase 3: MITM（中間者攻撃）

- **ARP spoof** → scapy でルンバにゲートウェイ偽装。tshark でルンバの全通信がこちら経由になるのを確認
- **結果** → ルンバはクラウド（443/tcp）に TLS。全フレームが retransmission になり、**事実上クラウド通信を遮断できた**
- **iptables DNAT** → ルンバの 443/8883 宛通信を偽 MQTT サーバーへリダイレクト
- **偽 MQTT サーバー** → 自己署名証明書で TLS サーバーを立て、MQTT CONNECT からクレデンシャルを抜く設計
- **結果: TLS ハンドシェイク不成立** → ルンバはサーバー証明書を検証していて、偽証明書を拒否。接続自体が来なかった

## Phase 4: TCP RST インジェクション

scapy でクラウドサーバーになりすました TCP RST を複数 sequence number で投げて、ルンバの既存接続を切って再接続を誘発しようとした。が、再接続タイミングを捉えられず空振り。

## Phase 5: dorita980 マジックパケット（ボタン押下込み）

これが最終的な exfiltration の path。dorita980 コミュニティがリバースエンジニアリングしたマジックパケットで MQTT パスワードを抽出します。Home Assistant の roomba integration もこれがベースです。

```python
import ssl, socket

ROOMBA_IP = "192.168.1.20"
ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

sock = socket.create_connection((ROOMBA_IP, 8883), timeout=10)
tls = ctx.wrap_socket(sock)

# dorita980 が発見したマジックパケット
magic = bytes([0xf0, 0x05, 0xef, 0xcc, 0x3b, 0x29, 0x00])
tls.send(magic)

resp = tls.recv(1024)
# 応答の 8 バイト目以降がパスワード（null 終端）
password = resp[7:].split(b'\x00')[0].decode()
print(f"Password: {password}")
tls.close()
```

仕組みは:

1. ルンバの HOME / CLEAN ボタンを 2 秒長押し（ビープが鳴るまで）
2. 2 分以内に上記スクリプトを実行
3. `0xf0` は MQTT の予約パケットタイプ。iRobot は独自プロビジョニングプロトコルに流用している
4. プロビジョニングモード中（2 分間）に magic を送ると、MQTT パスワードを含むレスポンスが返る

パスワードを取った後にできること: 掃除の開始 / 停止 / ドック帰還、スケジュール変更、マップデータ取得、センサー情報リアルタイム取得、設定変更、など。クラウド不要で全部 LAN 側で完結します。

## 注意点・ハマりどころ

- **J7 シリーズ以降ではローカル抽出が潰されてクラウド API 経由のみ**。i2 のような世代ならまだ通る
- **ファームウェア更新で magic packet 経路は塞がれる可能性**
- **未実行だが有望な攻撃ベクトル**: クラウド + NTP 遮断で長期的に内部時計をズラし、TLS 証明書の有効期限判定を狂わせて偽サーバーを受け入れさせる。理論的には MQTT パスワード抽出に到達できるが時間がかかる
- **`ssl.CERT_NONE` でルンバの自己署名を黙認**しているのは検証用。本来は信頼できる証明書チェーンで検証すべき

## 結果（セキュリティ評価）

| 項目                 | 評価                                      |
| -------------------- | ----------------------------------------- |
| 情報漏洩（UDP 5678） | 脆弱（認証なしでデバイス情報丸見え）      |
| MQTT 認証            | 堅牢（レートリミット、固有パスワード）    |
| TLS 証明書検証       | 堅牢（サーバー証明書を検証、MITM を拒否） |
| クラウド通信の保護   | 脆弱（ARP spoof で容易に遮断可能）        |
| OTA 更新の保護       | クラウド遮断で無効化可能                  |
| 時刻依存の暗号検証   | 未検証（NTP 遮断で攻撃可能な可能性）      |

使ったツール: nmap / tshark / scapy / paho-mqtt / openssl / netcat / iptables。

## まとめ

- LAN 側だけで情報収集は丸見えに近い水準まで可能
- MQTT 認証本体は堅牢で、TLS 証明書検証もきちんと動いている
- クラウド通信は ARP spoof で意外と簡単に遮断できる
- 完全制御は dorita980 のマジックパケット（ボタン押下込み）が必要 ─ HA 公式 integration の裏側で動いている仕組み

## 参考リンク

- [dorita980 (GitHub)](https://github.com/koalazak/dorita980)
- [Home Assistant Roomba integration](https://www.home-assistant.io/integrations/roomba/)
- [iRobot Authentication Reverse Engineering (dorita980 wiki)](https://github.com/koalazak/dorita980/wiki)
