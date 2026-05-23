---
title: 'Claude Code に自宅 Alexa で進捗報告させる仕組みを作った'
description: '長時間動く Claude Code セッションの進捗を、横に置いた Echo Dot から日本語で読み上げさせる skill を作った。HA SSH add-on の sshd 制約、Amazon 側で _speak API が音にならない問題、JWT mint 経路、tmpfs で消えるスクリプトの永続化、まで一通り踏んだ実装記録。'
pubDate: 'May 23 2026'
tags: ['Home Assistant', 'Claude Code', 'Alexa', '個人開発']
seeAlso: ['roomba-lan-penetration-experiment']
---

## はじめに

Claude Code に長時間の作業を任せていると、画面を見ていないと進捗が分からない。横の Echo Dot から「今からこれをやります」「完了しました」と日本語で読ませる skill を作りました。実装は単純に見えて、HA SSH add-on の sshd 制約、Amazon 側で `_speak` 系 API が無音になる問題、`/tmp` が tmpfs で消える問題、と細かい落とし穴が続く。一通り踏み抜いた末の構成を記録します。

ちなみにこの記事自体、書いている最中の進捗（「日本語版を書きます」「検証します」「マージします」）が、まさにこの仕組みで書斎の Echo Dot から読み上げられていました。

Claude Code に多段の作業（ファイル編集 → CI 待ち → PR 作成、など）を任せていると、別作業に切り替えた瞬間に進捗が分からなくなる。CLI を見に行かなくても「これから X やります」「X 終わりました」が耳から届くと、安心して別のことができる。

家には Echo Dot がいくつかあるし、HA からは TTS が叩ける。だから「ssh homeassistant でスクリプトを呼んで Echo を喋らせるだけ」のはずでした。実際にやると 3 段くらい引っかかります。

## 最終的に成立した構成

```text
Claude Code skill (alexa-report)
    ↓ ssh homeassistant
HA SSH add-on
    ↓ python3 /homeassistant/scripts/ha_speak.py
HA Core REST API (auth: JWT mint from .storage/auth)
    ↓ POST /api/services/notify/send_message
Alexa Devices integration
    ↓ notify.<device>_announce
Echo Dot で発話 (チャイム + メッセージ)
```

3 つの設計判断:

| 判断                                                  | 理由                                                                                     |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `_announce` を使う、`_speak` ではない                 | Amazon 側で `Alexa.Speak` API が事実上 deprecate。200 OK が返るが音は鳴らない            |
| token は JWT mint、新規 long-lived token は発行しない | `.storage/auth` の `jwt_key` で短期 JWT を mint できる。UI に余計な token を生やさず済む |
| スクリプトは `/homeassistant/scripts/` 配下           | `/tmp` は tmpfs。HA を再起動するとスクリプトが消える                                     |

## 実装

### 1. SSH 鍵を Advanced SSH add-on の Configuration に登録

手動 `~/.ssh/authorized_keys` 追記は無効。アドオンは起動時に Configuration から authorized_keys を再生成するので、手動編集はアドオン再起動で消える。

HA UI → Settings → Add-ons → Advanced SSH & Web Terminal → Configuration → `authorized_keys:` に公開鍵を追加 → Save → Restart。

### 2. SSH alias と SFTP 非対応の罠

クライアント `~/.ssh/config`:

```text
Host homeassistant
  HostName 192.168.0.15
  User wada
  IdentityFile ~/.ssh/id_rsa
```

HA SSH add-on の sshd は **SFTP subsystem 無効**。OpenSSH 9+ の `scp` は SFTP 前提なので `subsystem request failed on channel 0` で落ちる。代わりに `ssh + cat` で流す:

```bash
ssh homeassistant 'cat > /homeassistant/scripts/ha_speak.py' < /path/to/ha_speak.py
# あるいは旧 SCP プロトコル
scp -O /path/to/ha_speak.py homeassistant:/homeassistant/scripts/
```

### 3. JWT mint スクリプト

`.storage/auth` の refresh_token の `jwt_key`（128 文字の hex）を使って HS256 で短期 JWT を mint する。PyJWT は SSH add-on に入っていないので標準 library で手組み:

```python
import json, base64, hmac, hashlib, time, urllib.request, sys

CLIENT_NAME = "claude-code"  # .storage/auth の refresh_token を選ぶキー
API = "http://homeassistant.local.hass.io:8123"

with open("/homeassistant/.storage/auth") as f:
    d = json.load(f)
tok = next(t for t in d["data"]["refresh_tokens"] if t.get("client_name") == CLIENT_NAME)

now = int(time.time())
b64 = lambda o: base64.urlsafe_b64encode(json.dumps(o, separators=(",", ":")).encode()).rstrip(b"=")
h = b64({"alg": "HS256", "typ": "JWT"})
p = b64({"iss": tok["id"], "iat": now, "exp": now + 300})
sig = base64.urlsafe_b64encode(
    hmac.new(tok["jwt_key"].encode(), h + b"." + p, hashlib.sha256).digest()
).rstrip(b"=")
token = (h + b"." + p + b"." + sig).decode()

def post(path, data):
    req = urllib.request.Request(
        API + path,
        data=json.dumps(data).encode(),
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        method="POST",
    )
    return urllib.request.urlopen(req, timeout=5).status

if sys.argv[1] == "speak":
    print(post("/api/services/notify/send_message",
               {"entity_id": sys.argv[3], "message": sys.argv[2]}))
```

### 4. Claude Code skill の本体

```bash
ssh homeassistant 'sudo python3 /homeassistant/scripts/ha_speak.py speak "blog draft を書きます" notify.koheisannoecho_dot_max_announce'
```

skill 内で `Before` / `After` の各ステップにこの shell を呼ぶラッパーを置いておくと、Claude Code が長時間作業のたびに自動的に声を出します。

### 5. Echo の entity 一覧

| 物理デバイス        | entity                                   |
| ------------------- | ---------------------------------------- |
| Echo Dot Max (書斎) | `notify.koheisannoecho_dot_max_announce` |
| Echo Dot (リビング) | `notify.echo_dot_announce`               |
| 二階                | `notify.er_jie_announce`                 |
| 全部の部屋          | `notify.quan_bu_nobu_wu_announce`        |

「全部の部屋」のような日本語グループ名は HA 側で pinyin slug 化される（`quan_bu_nobu_wu`）。グループ名を変えると slug が変わるので、新規追加時は `GET /api/services` で notify ドメインを叩いて確認するのが確実。

## 注意点・ハマりどころ

- **`Alexa.Speak` API は無音**: `notify.<x>_speak` を叩くと 200 OK が返るが音は鳴らない。`_announce` に変える必要がある（チャイムが鳴る欠点はあるが、現状の代替なし）
- **`.storage/auth` は root:0600**: `sudo python3` 必須
- **`/tmp` は tmpfs**: HA 再起動でスクリプトが消える。`/homeassistant/scripts/` に置く
- **`network-online.target` はサスペンド復帰で再評価されない**: HA 自体に直接関係ないが、TTS が依存する DNS が落ちる罠は systemd timer 全般にある
- **JWT 有効期限は 5 分**: 呼ぶたびに mint する前提。再利用しないので長くする必要なし

## 結果

- 長時間 Claude Code セッションで「何やってるか分からない」感が消えた
- 横で別作業しながら、音だけで進捗を確認できる
- skill 化したので新規プロジェクトでも `Skill alexa-report` を呼ぶだけで動く
- 「Echo Dot で読み上げる」というインタフェースが Claude Code 以外にも汎用化できることに気づき、CI 完了通知や Bash の長時間コマンド完了通知にも転用するようになった

## まとめ

- 仕組みは「ssh homeassistant → JWT mint → REST API → Alexa announce」だけ
- 3 つの落とし穴: SFTP 無効、`Alexa.Speak` 無音、`/tmp` 揮発
- 自作 skill にしておくと、Claude Code 以外の場面でも転用できる

## 参考リンク

- [Home Assistant REST API](https://developers.home-assistant.io/docs/api/rest/)
- [Authentication API ─ Home Assistant Developer Docs](https://developers.home-assistant.io/docs/auth_api/)
- [Alexa Devices integration](https://www.home-assistant.io/integrations/alexa_devices/)
