---
title: 'DiffusionGemma を vLLM で RTX 5090 にローカル構築する：最先端モデル × 最先端 GPU の「一度きりの開拓コスト」'
description: 'Google の拡散言語モデル DiffusionGemma を、自宅の RTX 5090 (Blackwell / 32GB) に vLLM の OpenAI 互換サーバとして立て、Open WebUI から普通のモデルとして使えるようにした。NixOS で宣言的・on-demand に構築する過程で踏んだ罠（VRAM precheck の即死、クラッシュループで固着するコンテナ、NVFP4 量子化以外は載らない 32GB 制約）と、そこから得た「成熟モデルはワンライン、最先端は一度だけ手で開拓」という教訓。'
pubDate: 'Jun 21 2026'
tags: ['ローカルLLM', 'vLLM', 'RTX5090', 'ホームラボ', 'NixOS', 'AI']
seeAlso: ['rtx5090-blackwell-headless-gsp-watchdog']
---

## はじめに

[前回の記事](/ja/blog/rtx5090-blackwell-headless-gsp-watchdog)では、自宅の RTX 5090 (Blackwell) を 24/7 で回すための GSP ハング対策を書いた。今回はその上で動かすモデルの話──Google の拡散言語モデル **DiffusionGemma** を、この 5090 にローカルで立てた記録だ。

先に結論を言う。**体感で ~300 tok/s と確かに速い**。が、Open WebUI の web 検索が統合されない等で周辺はまだ未成熟で、**日常使いというより「速さを試す実験枠」が分相応**だった。だからこの記事は「最高のローカルモデルを手に入れた」という武勇伝ではなく、**最先端モデルを最先端 GPU で動かすときに一度だけ払う開拓コスト**の記録として書く。

## なぜ ollama では駄目で vLLM なのか

DiffusionGemma は普通の自己回帰モデルではない。**block diffusion**──ブロック間は自己回帰、ブロック内は拡散で並列に確定させる──という生成方式で、これが速さの源泉だ。1トークンずつ左から生成しないので、原理的に生成レイテンシが短い。

問題は配信スタックがそのぶん特殊になること。

- **ollama は不可**。公式ライブラリに無く、ollama は llama.cpp の diffusion デコード経路を露出しない。GGUF も llama.cpp の diffusion CLI 用で、OpenAI 互換サーバにはならない。
- **vLLM が唯一の OpenAI 互換経路**だった。Open WebUI に「普通のモデル」として挿せるのはこれだけ。Open WebUI 自体がマルチモーダルなハブなので、新しいツールを足すのではなく**バックエンドを一つ増やすだけ**で済む。

## 32GB に載せるには NVFP4 一択

RTX 5090 の VRAM は 32GB。ここに DiffusionGemma を載せようとすると量子化の選択肢は狭い。

- bf16 は 96GB 級、INT8 でも 48GB 必要。**32GB に載るのは NVFP4 だけ**。
- 使ったのは `nvidia/diffusiongemma-26B-A4B-it-NVFP4`。ライセンスは gated=False なので HF トークンも要らない。

## 検証済みレシピ（podman 直叩き）

最終的に通った起動コマンドはこれ：

```bash
podman run -d --name vllm-diffusiongemma \
  --device=nvidia.com/gpu=all --network=host \
  -v /srv/models/hf-cache:/root/.cache/huggingface \
  -e VLLM_USE_V2_MODEL_RUNNER=1 -e HF_HUB_DISABLE_XET=1 \
  docker.io/vllm/vllm-openai:gemma-x86_64-cu130 \
  nvidia/diffusiongemma-26B-A4B-it-NVFP4 \
  --host 0.0.0.0 --port 8000 --max-num-seqs 4 \
  --attention-backend TRITON_ATTN \
  --enable-auto-tool-choice --tool-call-parser gemma4 --reasoning-parser gemma4 \
  --gpu-memory-utilization 0.7
```

ポイントが二つ。

- **イメージタグはホストの CUDA に合わせる**。CUDA 13.x なら `gemma-x86_64-cu130`。
- アーキ `DiffusionGemmaForBlockDiffusion` は **gemma イメージに組み込み済み**なので `--trust-remote-code` が要らない。これは地味だが安全上の勘所で、モデル repo の任意コードを実行しない＝RCE 懸念がゼロということだ。

cold 起動は ~140s（torch.compile + マルチモーダルの warmup。重みキャッシュ後）。`/v1/models` と `/v1/chat/completions` が立てば成功。

## 罠1：VRAM precheck で即死する

最初に `--gpu-memory-utilization 0.9` で立てようとして、起動前に落ちた。

```text
ValueError: Free memory ... less than desired
```

vLLM は起動前に `util × TOTAL(32GiB) ≤ 今の空き VRAM` を要求する。ところが nvidia-persistenced などのベースラインで ~4GiB 持っていかれていて、空きは ~27GiB しかない。だから 0.9（~29GiB 要求）は precheck で即死する。**ベースライン分を引いた値にしないといけない**。0.7（~22GiB）なら通り、256K context も維持できた。

## 罠2：クラッシュループで固着するコンテナ

起動に失敗して restart ループに入ると、殺し損ねたコンテナが "Stopping" のまま固着して、`podman rm -f` がタイムアウトするようになった（メインスレッドが `Z`、子スレッドが `S`）。

最初は GPU かドライバが wedge したかと疑ったが、**nvidia-smi は応答していた**ので、それは切り分けで否定できた。GPU は無事で、固着しているのはコンテナ側だけ。reboot せずに除去できた手順がこれ：

```bash
systemctl stop podman-vllm-diffusiongemma   # restart ループを止める
systemctl reset-failed podman-vllm-diffusiongemma
kill -9 <pid>
podman rm -f --time 1 vllm-diffusiongemma
```

「GPU が壊れた」と「コンテナが固着した」を nvidia-smi の応答有無で切り分けるのが勘所だった。

## NixOS で on-demand に宣言化する

GPU は 1 枚しかないので、大きい ollama モデルと VRAM を食い合う。そこで「普段は寝かせ、使うときだけ起動」する on-demand 運用にした。`oci-containers` で宣言しつつ、systemd で排他制御する：

- `conflicts = ["ollama.service"]` — vLLM 起動で ollama が止まり、VRAM が空く。
- `wantedBy = lib.mkForce []` — boot 時に自動起動しない。

普段は dormant。`systemctl start podman-vllm-diffusiongemma` で起こし、終わったら stop して `start ollama` で戻す。Open WebUI 側は env 一行（`OPENAI_API_BASE_URLS = "http://127.0.0.1:8000/v1"` + ダミー key）で繋がり、vLLM 停止中はそのモデルが一覧から消えるだけだ。

## 所感と一般化できる教訓

速さ（block diffusion）は本物だった。だが Open WebUI の web 検索が効かない、penalty 系パラメータが無視される、default の max_tokens が 256 など、日常運用には角が多い。なので**実験枠として設定だけ残置**することにした（再開は systemctl 一発、イメージと重みはキャッシュ済み）。

ここから引き出せる一般化はこれだ：

> **成熟モデルはワンライン、最先端は一度だけ手で開拓 → 宣言化すれば以後ワンライン。**

最先端モデル × 新世代 GPU は、ソフトウェアスタックが最も未整備な交差点だ。そして厄介なのは、**eval（モデルのロード可否）が通っても、実機の resource precheck で初めて落ちる**こと。机上の検証では見えず、ランタイムで初めて顕在化する種類の障害がここに集中する。だからこそ一度きりの手作業で開拓し、通った構成を宣言的に固めてしまえば、次回からは `systemctl start` 一発で再現できる。その「一度きりの開拓コスト」を払う価値があるかを見極めるのが、この手の実験の本質だと思う。
