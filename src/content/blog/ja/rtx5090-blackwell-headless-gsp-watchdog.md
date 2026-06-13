---
title: 'Blackwell(RTX5090)を24時間ヘッドレスで動かす本丸はGSPハング、"壊れる前提"のwatchdogで受けた'
description: 'コンシューマ最新世代のRTX5090(Blackwell)を24/7無人のAIサーバにするのは、コミュニティ実績ほぼゼロのパイオニア領域だった。nvidia-open一択・CUDA sm_120の罠といった既知の落とし穴に加え、本丸はin-placeリセット不可のGSP heartbeat timeoutハング。実装前にdeep-researchで地雷を洗い出し、「いつか必ず吊る」前提でnvidia-smi無反応→自動rebootのwatchdogをNixOSに宣言的に組んだ話。'
pubDate: 'Jun 14 2026'
tags: ['NixOS', 'NVIDIA', 'RTX5090', 'homelab', '自宅サーバ', 'トラブルシューティング']
---

## はじめに

[前回の記事](/ja/blog/nixos-home-ai-server-install-gotchas)で、自宅AIサーバのOSにNixOSを選んでベースインストールするところまで書いた。OSが入れば次はGPUを有効にして本来の目的——ローカルLLMを24時間動かす——に進む。だがここに一番の難所があった。**GSP heartbeat timeout**という、現状未解決のハングバグだ。

GPUは**RTX5090(Blackwell世代)**。コンシューマ最新世代をサーバに転用するのは、コミュニティ実績がほぼゼロの**パイオニア領域**で、安定運用の前例がない。だから今回は「動かしてから困る」のではなく、**実装に入る前に地雷を洗い出してから踏む**ことにした。この記事は、その調査でわかった既知問題と、「いつか必ず吊る」前提で組んだwatchdog設計の実録だ。

なお正直に書いておくと、これは「GSPで何度もクラッシュした武勇伝」ではない。**未然に調べて、壊れる前提で受けを用意した**話だ。一次体験として書くのはその設計判断のほうだ。

## まず確定事項：ドライバとCUDA

ハマる前に潰せる、調べれば確定する部分から。

### ドライバは `nvidia-open` 一択

Blackwellはプロプライエタリドライバが**完全非対応**(NVIDIA公式)。選択肢は無く、NixOSは driver >= 560 で `open` の明示を**assertionで強制**してくる。ヘッドレス運用では`nvidiaPersistenced`も要る——これがGPUをheadlessでも起きたままにしておくための正解だ。

```nix
hardware.nvidia = {
  open = true;              # Blackwell は唯一の選択肢
  nvidiaPersistenced = true; # headless で GPU を初期化したまま保つ
};
```

### CUDA / 推論スタックの罠

- **sm_120はCUDA 12.8+が必須**。nixpkgsのデフォルト`cudaPackages`は意図的に12系に据え置かれているので、`cudaCapabilities = ["12.0"]`を明示する必要がある。公式docのBlackwell例はsm_100(datacenter)のみで、consumerのsm_120は死角になっている。
- **llama.cpp系はarch `120a`が必須**。plainな`120`はMXFP4でptxasエラーになる。Ollamaもこの影響圏内なので、GPU offloadが効いているかは実測で確かめる前提でいた方がいい。

ここまでは「調べれば正解が確定する」レイヤー。問題は次だ。

## 本丸：GSP heartbeat timeout

24/7運用で一番怖いのがこれ。GPUのファームウェア(GSP)が突然応答しなくなり、GPUごと吊る。

- 症状は **Xid 119/109/79/8** に加えて、**Xidすら出さない無音ハング**もある。
- **負荷依存ではなく、アイドル時にも発生する報告がある**。「重い推論を回さなければ安全」ではない。
- NVIDIA公式の`open-gpu-kernel-modules`で issue #1080 / #1111 がオープン中(2026-06時点)。つまり**未解決**。

そして一番効いてくるのが、**起きた後の復帰が地獄**だという点だ。

- クラッシュ後は **通常のリセットが効かない**("WPR2 already up")。PCI Secondary Bus Reset + モジュールリロード、さもなくば**電源断**しか確実な復帰手段がない。
- `open`ドライバでは、定番回避策の**GSP無効化が構造的に不可能**。NixOSはassertionでhard-failするし、`NVreg_EnableGpuFirmware=0`は無視される。

要するに「設定で予防」はできず、「**吊ったら再起動するしかない**」のが現実だった。

## だから"壊れる前提"でwatchdogを組んだ

予防できないなら、**吊ったことを検知して自動で復帰させる**しかない。in-placeリセットが効かない以上、確実な復帰手段は再起動だ。NixOSにsystemdのwatchdogを宣言的に組んだ:

```nix
systemd = {
  services.gpu-watchdog = {
    description = "Reboot if nvidia-smi stops responding (GSP wedge)";
    path = [config.hardware.nvidia.package.bin];
    script = ''
      if ! timeout 60 nvidia-smi > /dev/null 2>&1; then
        echo "nvidia-smi unresponsive for 60s — rebooting" \
          | systemd-cat -p err -t gpu-watchdog
        systemctl reboot
      fi
    '';
    serviceConfig.Type = "oneshot";
  };

  timers.gpu-watchdog = {
    wantedBy = ["timers.target"];
    timerConfig = {
      OnBootSec = "5min";
      OnUnitActiveSec = "5min";
    };
  };
};
```

5分おきに`nvidia-smi`を叩き、**60秒返ってこなければGPUが吊ったと判断して`systemctl reboot`**する。荒っぽいが、リセットが効かない相手には再起動が最も確実なので割り切った。無人運用なので「朝起きたら固まっていた」を避けられればいい。

緩和策も(n=1〜3のanecdoteレベルだが)あわせて入れた。**電力capだ**:

```nix
# RTX 5090 TDP=575W。推論もFrigateも400W未満で足りる。
# アイドルは~70Wで一定。ピーク draw だけ抑える。
script = ''nvidia-smi -pl 400'';
```

GSPハングには**PSU起因のXid 119事例**(電源交換で解消した報告)があり、電力スパイクを抑えるのは理にかなっている。本機はそもそもATX 3.1ネイティブの1300W Platinumを積んでいるが、ピークを抑えて余裕を持たせる意味でcapした。

## Ubuntuに替えれば避けられる？ → No

「事例の多いUbuntuにすれば安定するのでは」は当然の発想だが、調べた結論はNoだった。

**GSP問題はディストリ非依存**だ。報告はMint/Fedora等でも出ているし、Blackwellはどのディストリでも`nvidia-open`一択なので、踏む地雷は共通。Ubuntuに替えて得られるのは**事例の多さだけで、クラッシュ自体は回避できない**。その対価にNixOSのrollbackと宣言的構成を失うのは割に合わない。

落とし所は前回と同じ:**NixOS続行 + watchdogで自動復帰前提 + 切り分け用のUbuntu Live USBを1本**。詰まったときに「GPU自体の問題かNix設定の問題か」を切り分ける保険だけ持つ。

## まとめ

コンシューマ最新GPUをサーバにするパイオニア領域には、**in-placeリセット不可級の地雷(GSP heartbeat timeout)**が普通に埋まっていた。設定で予防できない以上、「壊れない」ことを目指すより「**壊れる前提で自動復帰を組む**」方が現実的だ。

そしてこういうとき、宣言的構成の効きが地味に大きい。watchdogも電力capも全部`configuration.nix`にコードとして残るので、**復帰設計そのものが再現可能な資産になる**。SSDが飛んでもこの受けごと再構築できる。前回書いた「rollbackの安心感」と同じ話で、パイオニア領域を走るほどこの性質がありがたい。

実際にGSPで吊る瞬間を踏むかどうかは、これから運用しながら確かめていく。watchdogの発動ログが残り始めたら、また追記したい。
