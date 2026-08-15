---
title: 'Qwen3.8 27B を RTX 5090 に載せた実測 ── vLLM に移せなかった理由'
description: '発表当日に Qwen3.8 27B を 32GB のカードで動かした記録。ランタイムのバージョン壁、context 長ごとの VRAM 実測、そして「同時実行のために vLLM へ移す」を試して失敗した全経緯。4bit と称する配布を実測したら 18GB を下回るものが無かった話と、画像入力がクライアント側の設定で握り潰されていた話。'
pubDate: '2026-08-15T15:00+09:00'
tags: ['ローカルLLM', 'ollama', 'RTX5090', 'AI', 'ホームラボ']
seeAlso: ['local-llm-eval-harness-reuse']
---

## はじめに

Qwen3.8 27B が出たので、自宅の RTX 5090（32GB）に載せた。多段のエージェント作業でどうだったかは[評価スクリプトの設計だけが生き残った](/ja/blog/local-llm-eval-harness-reuse)に書いたので、こちらは数字と、途中でぶつかった壁をまとめておく。

ollama では生成が前世代の約2倍出た。**vLLM には移せなかった。**

## まずランタイムのバージョン壁

`ollama pull qwen3.8:27b` がこれで弾かれる。

```text
Error: pull model manifest: 412:
The model you are attempting to pull requires a newer version of Ollama.
```

必要なのは **0.32.12 以降**。このアーキテクチャ対応が入ったのがそのリリースで、0.32.13 では developer instructions の扱いが追加されている。

うちは NixOS で管理していて、数日前に確認した時点では nixpkgs が 0.32.3、master でも 0.32.7 だった。overlay で 0.32.13 を pin して解決している。ここで一つ罠があって、ollama は llama.cpp をバージョンごとに固定しており、`LLAMA_CPP_VERSION` が 0.32.13 では `b10380` を指す。nixpkgs 側の pin（b10091）のままだと互換パッチの適用に失敗するので、そちらも合わせて上げる必要がある。

非公式の GGUF（unsloth 版）なら 0.32.9 でも引けた。ただしそれは後で速度に効いてくる。

## 速度

同じ箱・同じランタイム（0.32.13）・同じ4問で測った。

| モデル           | 生成速度           |
| ---------------- | ------------------ |
| Qwen3.6 27B      | 72〜73 tok/s       |
| Muse Glimmer 30B | 75 tok/s           |
| **Qwen3.8 27B**  | **124〜149 tok/s** |

約2倍。ここで引っかかったのが、**同じ Qwen3.8 でも非公式 GGUF を 0.32.9 で動かした時は 72 tok/s しか出なかった**ことだ。ランタイムと配布物を同時に変えているので切り分けはできていない（前者は28トークンだけの短い生成で測っていて、基準としても粗い）。それでも倍近い差がある以上、古いランタイムで動かすとこのモデルの取り柄が相当削れる、とは言えると思う。

### thinking の長さ

体感差としてはこちらの方が大きかった。「ある市の名物を3つ、JSON配列だけで出力せよ。説明もマークダウンも禁止」という問いに対し、Qwen3.6 は思考ブロックだけで数千トークンを使い、`Wait, ... Actually, ... Let's double-check` を延々ループして29.3秒かかった。Qwen3.8 は10行ほどで決めて2.7秒。

出力の形式はどちらも守った。中身はどちらも怪しかった。

## context 長ごとの VRAM

同じモデル（q4、17GB）で `num_ctx` だけ変えて実測した。

| num_ctx | VRAM 合計 | 差分   |
| ------- | --------- | ------ |
| 32,768  | 19.7GB    | —      |
| 131,072 | 23.6GB    | +3.9GB |
| 262,144 | 29.2GB    | +9.5GB |

重みが 17GB なので、**256K を要求すると残り 12GB 前後を KV キャッシュ（と activation）が持っていく**計算になる。32GB のカードで native context を通すと余裕は 3GB ちょっとしかない。

なお `num_ctx` が効いていることは `ollama ps` の CONTEXT 列ではなく、VRAM がこう単調に反応することで確認している（ollama のバージョンによっては native 未満の `num_ctx` が無視されることがある）。

「思ったより VRAM を食う」と感じたら、だいたい context の設定が理由になる。実際に 256K を使う場面がないなら 128K に落とすだけで 5.6GB 空く。

## vLLM に移そうとして失敗した話

**動機**は同時実行だった。うちの環境では ollama の `OLLAMA_NUM_PARALLEL` が 1 になっていて、1リクエストずつしか処理しない。実測でも、2本同時に投げると片方が完全に待たされる。

```text
単独        2577ms
同時2本  A = 1874ms   ← 先に処理された
         B = 4164ms   ← A の完了を待った
```

vLLM の continuous batching なら、これが本当に並列になる。公式の recipe もあり、vLLM 本体は要件の 0.17.0 を大きく超えて 0.27.1。`qwen38-x86_64-cu130` という day-zero ビルドのイメージまで用意されている。行けると思った。

### 壁1: 「4bit」が 4bit ではない

vLLM 用に NVFP4 の重みを引いたら、**ロード後の VRAM が約 23GB** だった。27B の 4bit なら 14〜15GB のはずで、明らかに重い。

気になって HuggingFace にある Qwen3.8 27B の 4bit 系配布のサイズを比較した。

| 配布                               | safetensors 合計 |
| ---------------------------------- | ---------------- |
| philbert440/…W4A16-AWQ             | 18.21 GiB        |
| gittensor-model-hub/…NVFP4-RTX5090 | 19.18 GiB        |
| cyankiwi/…AWQ-INT4                 | 19.57 GiB        |
| unsloth/…NVFP4                     | 21.81 GiB        |
| goldhub/…INT4-W4A16-AutoRound      | 26.37 GiB        |

**主要な5つを実測した限り、15GB 級は一つも無かった。** vision tower と DeltaNet 側の一部が高精度のまま残るためらしく、どれも 18〜26GiB に収まっている。

一方 ollama の q4 は 17GB（`ollama list` のディスク上サイズなので、上の表の safetensors 合計とは測り方が違う点は注意）。いずれにせよ、実際に引いた NVFP4 は VRAM 上で 23GB を占めたので、**同じモデルなのに 5〜6GB 重い状態から始まる**ことになる。

### 壁2: CUDA グラフが入らない

`--gpu-memory-utilization 0.9` で起動すると、KV を確保する前に落ちる。

```text
torch.OutOfMemoryError: CUDA out of memory. Tried to allocate 784.00 MiB.
GPU 0 has a total capacity of 31.36 GiB of which 195.69 MiB is free.
```

`--max-model-len` を 256K から 64K まで落としても、**同じ場所で同じサイズの確保に失敗した**。理由はスタックトレースを読んで分かった。要約するとこうなっている。

```text
determine_available_memory()
  └ profile_cudagraph_memory()        ← gpu_model_runner.py:6722
      └ _init_minimal_kv_cache_for_profiling()   ← :6606
```

CUDA グラフのメモリプロファイリングは `determine_available_memory` の中、つまり **KV サイズを決める前**に走る。だから context 長をいくら下げても、この段階で必要な量は変わらない。

### 壁3: eager にすると遅い

`--enforce-eager` で CUDA グラフを切ると起動する。ただし vLLM 自身が KV の残量を教えてくれる。

```text
Available KV cache memory: 5.42 GiB
（204800 には 6.56 GiB 必要）
→ estimated maximum model length is 167776
```

163840 で起動に成功した。が、そこで測った生成速度が **27.8 tok/s**。ollama の 143 tok/s に対して5分の1。さらに、

```text
GPU KV cache size: 165,316 tokens
Maximum concurrency for 163,840 tokens per request: 1.01x
```

**同時実行 1.01倍。** 最大 context を使うと1リクエストしか入らない。同時実行が欲しくて移そうとしたのに、その同時実行が最初に犠牲になった。

### どちらを使うか

|          | ollama        | vLLM（成立した唯一の構成） |
| -------- | ------------- | -------------------------- |
| 生成速度 | **143 tok/s** | 27.8 tok/s                 |
| context  | **262,144**   | 163,840                    |
| 同時実行 | 逐次          | 1.01x                      |

残った可能性は一番軽い AWQ（18.21 GiB）で、OOM 時の不足が約 100MB だったことを考えると、4.8GiB 軽くなればグラフは通る公算が高い。ただ得られるのは同時実行だけで、そのために素性の知れない個人の量子化を信用することになる。品質が落ちていないか確かめるには評価をやり直す必要があるので、今回はそこで止めた。

なお動いた部分もある。`--served-model-name` でリポジトリパスを平坦な別名にでき（クライアントによってはスラッシュを扱えない）、`--tool-call-parser qwen3_coder` は正しく `tool_calls` を返した。vLLM 側の起動ログでは Gated DeltaNet 用の Triton/FLA カーネルが選択されているのも確認できる。

## おまけ: 画像が届いていなかった

Qwen3.8 はマルチモーダルだが、エージェント CLI 経由で画像を送ったら「このモデルは画像入力に対応していません」と返ってきた。

ollama を直接叩くと、native API でも OpenAI 互換エンドポイントでも画像は正しく処理される。モデルもサーバも問題ない。

原因はクライアント側の設定で、`attachment: true` だけでは足りず **`modalities` の指定が要る**というものだった。無いと画像パートが「画像非対応」というテキストに差し替えられて送られる。モデルが言ったように見えた文言は、クライアントが書いたものだった。

```json
"modalities": { "input": ["text", "image"], "output": ["text"] }
```

これを足したら通った。同じ設定不足は、以前から使っていた別の vision モデルでも起きていた。機構が完全に設定依存で、その設定がずっと無かった以上、**以前から同じ状態だった可能性が高い**。上流にも複数 issue が上がっている問題なので、OpenAI 互換プロバイダ経由で vision モデルを使っているなら確認する価値がある。

## まとめ

- ランタイムは 0.32.12 以降が必須。古いと速度が大きく落ちる
- 32GB カードで native 256K は通るが、KV に 12GB 前後を持っていかれる
- マルチモーダルが動かない時は、まずクライアント側の設定を疑う

そして vLLM の件で分かったのは、**原因は vLLM でもモデルでもなく、単に vLLM 用の重みが数GB 重いことだった**ということだ。32GB という枠の中では、その数GB が KV と CUDA グラフを同時に圧迫して、context も速度も同時実行も連鎖して崩れる。カードの容量というのは、足りているうちは意識しないが、足りなくなると一つではなく全部が同時に足りなくなる。
