---
title: 'Hyprland を終了しても Waybar が残る理由と、exec start-hyprland で解決する話'
description: 'Linuxのプロセス管理の仕組みと、Hyprland の正しい起動方法について'
pubDate: 'Jan 07 2026'
tags: ['Linux', 'Hyprland', 'Arch Linux', 'wayland']
---

最近 Hyprland を触っていて、しょうもないことにハマったので共有します。

## ずっと Hyprland を直接起動していた

私は Arch Linux の tty から、ずっとこんな感じで Hyprland を起動していました。

```bash
Hyprland
```

どこかの Wiki か記事に書いてあったのをそのまま真似した形です。

## ある日「start-hyprland を使え」という警告が出始めた

あるタイミングから、Hyprland を起動すると`start-hyprland`経由で起動しろという警告が出るようになりました。
調べてみると、これは 0.53 の Breaking Change でした。`start-hyprland` が正式な launcher になり、watchdog などの挙動がそこで管理されるようになったという変更です。

## その頃、Waybar が kill されていないことに気づく

`start-hyprland`が何者なのかを調べたく、Hyprlandを起動したり終了したり繰り返していたのですが、Hyprland を終了しても Waybar や fcitx5 が生きていることに気づきました。
`hyprland.conf` の `exec-once` ではこんな設定をしていました。

```bash
exec-once = waybar & hyprpaper & fcitx5 & swaync & hypridle
```

普通に考えると、Hyprland が終了 → 子プロセスである Waybar たちも終了、となってもよさそうなのですが、なぜか Waybar は残る。

## exec start-hyprland を使うと全部一緒に終了する

試しに tty でこうしました。

```bash
exec start-hyprland
```

すると挙動が変わります。Hyprland を終了すると tty からもログアウトされ、Waybar などもまとめて kill される。めちゃくちゃスッキリしました。

## なぜ違うのか──「親が死んでも子は死なない」という Linux の仕様

ここが今回の核心です。

私は最初「親プロセスが終了したら子プロセスも自動で終了する」と思っていました。でも実際は違いました。

**Linux では、親プロセスが終了しても子プロセスは自動で kill されません。** 孤児（orphan）になった子プロセスは PID 1（systemd）が引き取り、そのまま動き続けます。

```text
# 親が死ぬ前
Hyprland (PID 100)
 └── waybar (PID 101, PPID=100)

# 親が死んだ後
waybar (PID 101, PPID=1)  ← systemd が引き取った
```

つまり Hyprland が死んでも Waybar が残るのは普通のことでした。

## 「親が死んだら子も死ぬ」という印象はどこから来たのか

おそらく以下の経験からそう思い込んでいました。

- **ターミナルを閉じると子も死ぬ** — これは親の終了ではなく、ターミナルから SIGHUP が送られるから。
- **Ctrl+C で全部止まる** — これはフォアグラウンドのプロセスグループに SIGINT が送られるから。
- **シェルスクリプト終了で子も止まる** — シェルが明示的に子を kill している場合がある。

どれも「親プロセスの終了」ではなく「シグナル」や「シェルの後処理」の話だったんですね。

## exec start-hyprland だと何が起きるのか

tty にログインすると、最初に bash などのログインシェルが動きます。通常はこうです。

```text
login → bash → Hyprland
```

しかし `exec start-hyprland` を使うと：

```text
login → exec start-hyprland → Hyprland
```

`exec` はシェル自身を完全に別プロセスに置き換えます。つまり：

- ログインシェル = Hyprland になる
- Hyprland が「セッションの顔」になる
- Hyprland が終了するとセッション終了扱いになる
- systemd がセッション内のプロセスを全部 kill する

だから Waybar も落ちますし、tty もログアウトされます。

## loginctl で見るとよく分かる

`loginctl session-status` を見ると、こんな感じで同じセッションに乗っています。

```text
session-1.scope
 ├─ start-hyprland
 ├─ Hyprland
 ├─ waybar
 └─ ...
```

セッションが閉じる = まとめて終了、ということです。

## start-hyprland が推奨された理由

Hyprland 0.53 からは、watchdog FD の管理、環境変数の準備、wrapper としての役割などを launcher が担うようになりました。今後は `exec start-hyprland` を使うのが正式な起動方法です。

## まとめ

- Hyprland を直接起動すると Waybar が生き残るのは、Linux では親プロセス終了 ≠ 子プロセス自動 kill だから
- 孤児になったプロセスは systemd (PID 1) が引き取って動き続ける
- `exec start-hyprland` を使うとセッションそのものが終了するので、全部まとめてきれいに落ちる
- 「親が死んだら子も死ぬ」という印象は、シグナルやシェルの後処理と混同していた

## 参考文献

- [Hyprland Update 53](https://hypr.land/news/update53/)
