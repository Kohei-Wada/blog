---
title: 'GhostBSDを使ってみた'
description: 'GhostBSDをインストールしてSSH設定、ZFS、jailなどを試してみた記録。Linuxユーザー視点でのBSD体験記。'
pubDate: 'Feb 15 2026'
tags: ['FreeBSD', 'GhostBSD', 'ZFS']
---

暇だったのと、昔GhostBSDをインストールしたものの使い方がわからずやめた記憶があり、今ならAIに聞けるのでいろいろ楽しいかと思い、再挑戦してみた。

## インストール

bootable USBを作って起動するだけ。
[ここ](https://www.ghostbsd.org/download)からISOファイルをダウンロードしてbootable usbを作成する。
Linuxで作成したが書き込むデバイスを間違えると死ぬので注意。

```bash
lsblk # 書き込むデバイスを確認
sudo dd if=GhostBSD-25.02-R14.3p2.iso of=/dev/sda bs=4M status=progress oflag=sync
```

起動! 結構イケメンだな。
しかもデフォルトのshellがfishでなんか新しいな。
BSDって古いイメージだったから思ってたのと全然違った。

![GhostBSDのデスクトップ](../../../assets/ghostbsd-desktop.png)

## sshdを起動するまで

### sshdの起動

デスクトップからマウスでごにょごにょいじるのはめんどいので、sshで接続できるようにして普段遣いのPCからshellにアクセスできるようにする。
（この記事のスクショとかはわざわざデスクトップで取っている。かっこいいから）
sshdの設定自体はLinuxと同じだが、ポートが開いているかの確認は `sockstat` を使う。

```bash
sudo service sshd start
sockstat -l # Linuxのss -tln的なやつ

```

`systemctl enable sshd`的なやつは `/etc/rc.conf`を編集することで実現できる。

```bash
sshd_enable="YES"
```

以下で起動しているか確認

```bash
sudo service sshd status
sudo service -e | grep sshd #enableか確認
```

### firewallの設定

sshdを起動してもfirewallがすべてblockしているので解放が必要だった。
GhostBSDはfirewallに `ipfw` というのを使っている。

```bash
sudo ipfw add 150 allow tcp from any to me 22 # 一時的にアクセス可能に。再起動したら消える
```

永続化するには `/etc/rc.conf` に以下を追加する。
起動時に `rc.conf` が展開されて `ipfw` の設定を自動で生成して適用するらしい。

```bash
firewall_myservices="22/tcp"
firewall_allowservices="<IP>"
```

これでSSHでアクセスできて作業がやりやすくなった。

## デスクトップの設定

ノートPCにインストールしたため、蓋を閉じるとsshdが止まることがあった。
以下でノートPCの蓋を閉じたときにsuspendしないようにした。

```bash
gsettings set org.mate.power-manager button-lid-battery "'nothing'"
gsettings set org.mate.power-manager button-lid-ac "'nothing'"
```

蓋を閉じたら画面をロックするようにdevdを設定。

```bash frame="terminal"
cat <<EOF | tee /usr/local/sbin/lid-desktop.sh
#!/bin/sh
sleep 1
if [ "$(sysctl -n dev.acpi_lid.0.state)" = "0" ]; then
  logger -t lid-desktop "Lid closed, locking screen"
  su - kohei -c "DISPLAY=:0 mate-screensaver-command -l"
fi
EOF

chmod +x /usr/local/sbin/lid-desktop.sh

sudo tee /usr/local/etc/devd/lid-desktop.conf << 'EOF'
notify 10 {
    match "system"          "ACPI";
    match "subsystem"       "Lid";
    match "notify"          "0x00";
    action "/usr/local/sbin/lid-desktop.sh";
};
EOF
sudo service devd restart
```

ここまででかなり使いやすくなった。
MATEデスクトップのことはよく知らないので、もっといい設定方法があるかもしれないがとりあえず動くようになった。
デスクトップをいじったりするのは今後やっていこうと思う。

## ZFSに驚いた

適当にlinuxで使えるコマンドを試していたところ、
`df -h` を実行したときにこの出力で驚いた。447GBのファイルシステムが大量にある。
こんな大量に447GBのディスクがあるのはありえないが、なんか容量が増えた感じがして嬉しい!

![df -hの出力。447GBのZFSファイルシステムが大量に並んでいる](../../../assets/ghostbsd-df.png)

これはZFSというLinuxではライセンス的にマージされていないファイルシステムらしい。
(ZFSのCDDLとLinuxのGPLがライセンス的に矛盾するらしい）
Linuxでよく使われている`ext4`と比較して以下のような特徴がある。

| 項目             | ext4                     | ZFS                                    |
| ---------------- | ------------------------ | -------------------------------------- |
| 種別             | ファイルシステムのみ     | ファイルシステム＋ボリュームマネージャ |
| 書き込み方式     | 上書き（ジャーナリング） | コピーオンライト                       |
| データ破損検出   | 不可                     | チェックサムで検出・自動修復           |
| スナップショット | 非対応                   | ネイティブ対応                         |
| RAID             | 別途mdadm等が必要        | 内蔵                                   |
| 圧縮             | 非対応                   | 対応                                   |
| メモリ消費       | 少ない                   | 多い                                   |

ファイルシステムを`zfs`と`zpool`という２つのコマンドだけで操作できて、スナップショットやRAID機能があるなんてすごい!
とりあえずスナップショットを試してみた。

```bash
sudo zfs snapshot zroot/home@before-test # snapshot作成
sudo zfs list -t snapshot # 確認
sudo zfs rollback zroot/home@before-test # ロールバック!
```

![ZFSスナップショットの実行結果](../../../assets/ghostbsd-zfs-snapshot.png)

すげぇ。まじで復元されとるやんけ。。。。

## jailを試す

BSDのナイスな機能としてjailというのがあるらしい。
Dockerなどのコンテナ技術の元になったやつで、自分で `tar` を展開したりするのが面倒だが、kernelだけの機能で実現されているのでdockerdなどが不要。
まあ、podmanで対応できるのかもしれないけど。。。。

ちょっとやってみる。

```bash
### ベースシステム作成
mkdir -p /jail/testjail
fetch https://download.freebsd.org/releases/amd64/14.0-RELEASE/base.txz
tar -xf base.txz -C /jail/testjail

### DNS情報コピー
cp /etc/resolv.conf /jail/testjail/etc/

### 設定作成
cat <<EOF | tee /etc/jail.conf
testjail {
    host.hostname = "testjail";
    ip4.addr = "192.168.1.100";
    path = "/jail/testjail";
    mount.devfs;
    exec.start = "/bin/sh /etc/rc";
    exec.stop = "/bin/sh /etc/rc.shutdown";
}
EOF

### 起動
service jail onestart testjail

### jail内のshell起動
jexec testjail /bin/sh

### 停止
service jail onestop testjail

```

![jailの実行結果](../../../assets/ghostbsd-jail.png)

Dockerやな。。。
やってみたけどコンテナにアクセスが簡単にできるので隔離されている感は薄い。
あと、設定もややめんどい。 (bastilleというツールで簡単に作れるらしいのでまた試そうとおもう。）Dockerfileって便利だなと思った。

## 驚いたこと

- 思ってたより新しいパッケージが入る。`pkg install neovim`でもnvim 0.11.6が入ったし、デフォルトのshellがfishだったりと新しいパッケージに対応している印象。Ubuntuとかよりも新しいかも。
- ZFSがすごい。snapshotが一瞬で取れる。なんか検証して破棄してみたいなことが簡単にできそう。DBのfullbackupとかも代替できたりするのかな。。？
- Linuxに比べてシステムがシンプルなきがする。少し触った印象だがfirewallやsshdなどのシステム関連の設定が一箇所に固まっている感じがする。`/etc/rc.conf` 。
  Linuxはカーネルとデバイスドライバだけが管理されてるのでユーザー空間はいろいろなパッケージの寄せ集めっぽいけど、ユーザー空間のパッケージも管理されているBSDだからこその使い心地なのかな。

## 微妙な点

- Wi-Fiが安定しない気がする。すぐ切れる。自分が設定を理解してないからの可能性は大いにある。
- systemdみたいにdaemonの依存関係をいい感じで管理してくれないみたいで、起動順序が結構大事らしい。自分が設定を理解、、、、

## 最後に

- 今後はGhostBSDをサブ機として使っていこうと思う
- 普段Linuxしか使ってないので、異国の地を旅行しているみたいな感じで楽しかった。
- ZFSがNASとかに良いらしいのでBSDの勉強がてらやってみようかな
- macOSはUser landがBSDベースらしいのでその練習にもなりそう
- fishをほぼ使ってないので触る場としても丁度いい（普段はbash）
