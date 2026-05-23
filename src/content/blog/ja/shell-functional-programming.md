---
title: 'シェルで関数型プログラミング'
description: 'Unix パイプラインを関数合成として捉え、map/filter/foldの基本部品でログ解析やデータ処理を行う方法'
pubDate: 'Jan 09 2026'
tags: ['Shell', 'Bash', 'awk', '関数型プログラミング', 'Unix']
---

以前、[AWKを超えて：HaskellをUnixパイプラインに持ち込む](/ja/blog/haskell-unix-pipelines/)という記事を書きました。Haskell でパイプライン処理を書く話です。

ただ、そもそものアイデアはこの記事の内容でした。ログを grep や awk で漁っていると、「これ、filter して map して fold してるだけだな」と気づいたのが始まりです。

シェルでの関数型プログラミングの基本は、**改行区切りのテキストをリストとして捉える**ことです。

```
a
b
c
```

これを `["a", "b", "c"]` と見なせば、あとは map, filter, fold を適用するだけです。

構造化ログや専用ツールがある時代ですが、素の Unix コマンドだけでも関数型的に考えれば大抵のことはできます。

この記事の目的は、**少ないコマンドでできるだけ汎用的な操作ができるようにする**ことです。覚えるコマンドを最小限に抑えつつ、組み合わせで多くのことを実現する。そのための基本部品を整理しました。

---

## Unix パイプラインと関数合成

Unix の哲学「一つのことをうまくやる小さなプログラムを組み合わせる」は、関数型プログラミングの「小さな純粋関数を合成する」という考え方と本質的に同じです。

パイプライン `|` は関数合成そのものです。多くの Unix コマンドは入力を受け取り出力を返す純粋関数として動作します。

```bash
cat access.log | grep "ERROR" | awk '{print $4}' | sort | uniq -c
```

これは「filter → map → sort → fold」の合成です。

---

## 高階関数

### Map

リストの各要素に関数を適用して新しいリストを生成します。

**while での実装:**

```bash
command | while read -r a; do
  # map-function
done

# 例：奇数偶数判定
seq 10 | while read -r a; do
  if ((a % 2)); then
    echo odd
  else
    echo even
  fi
done
```

**xargs での実装:**

```bash
xargs -I {} bash -c 'echo "processing: {}"'
```

xargs は `-P` オプションで並列処理もできます。

```bash
# 4並列で処理
xargs -P 4 -I {} bash -c 'process {}'
```

GNU parallel という専用ツールもありますが、入っていない環境が多いです。xargs なら大抵の Unix 系システムに標準で入っています。

注意点として、バックスラッシュを含むデータは `-r` オプションで生読み込みします。パイプ処理では `for` より `while` が汎用的です。

### Filter

条件に合致する要素のみを抽出します。

**grep での実装（文字列パターン）:**

```bash
grep 'pattern'
```

**awk での実装（数値や複雑な条件）:**

```bash
awk 'NR % 2 == 0 { print }'  # 偶数行のみ
awk '$1 >= 100 { print }'     # 第一フィールドが100以上
```

使い分けの指針：

- シンプルな文字列 → `grep`
- 数値・フィールド処理 → `awk`
- 複雑な条件・外部コマンド連携 → `while`

### Fold（畳み込み）

リストの要素を順次処理して単一の値を生成します。

**foldl（左畳み込み）:**

```bash
seq 10 | awk '{sum += $1} END {print sum}'
```

**foldr（右畳み込み）:**

```bash
seq 10 | tac | awk '{sum += $1} END {print sum}'
```

正直なところ、畳み込みはシェルだと難しいです。単純な合計やカウントなら awk で済みますが、複雑な集計になると厳しい。CSV に変換して SQLite にパイプする方が楽なケースも多いです。

```bash
# CSVをSQLiteで集計
cat data.csv | sqlite3 :memory: '.mode csv' '.import /dev/stdin t' 'SELECT col1, SUM(col2) FROM t GROUP BY col1'
```

ただ、これは関数型の考えから逸脱している気もします。良いアプローチがあれば教えてください。

---

## リスト操作

### 無限リスト

```bash
yes             # 無限に "y" を出力
seq infinity    # 1, 2, 3, ... の無限リスト
```

### take / drop

```bash
head -n 10 file       # 先頭10行を取得（take）
tail -n +11 file      # 11行目以降を取得（drop 10）
```

### takeWhile / dropWhile

```bash
# takeWhile: 条件を満たす間だけ取得
awk '$1 < 100 { print } $1 >= 100 { exit }'

# dropWhile: 条件を満たす間スキップし、それ以降すべて取得
awk '!found && $1 < 100 { next } { found=1; print }'
```

### uniq（uniqBy）

特定フィールドでの重複除去です。

```bash
awk '!seen[$1]++'    # 第一カラムで uniqBy
awk '!seen[$2]++'    # 第二カラムで uniqBy
```

---

## 集合演算

集合演算みたいなことは `comm` で大体できます。

### 和集合（Union）

```bash
cat set1 set2 | sort -u

# ソート済みの場合
sort -m -u set1 set2
```

### 積集合（Intersection）

```bash
comm -12 <(sort set1) <(sort set2)

# または
grep -Fxf set1 set2
```

### 差集合（Difference）

```bash
# set1 にあって set2 にない
comm -23 <(sort set1) <(sort set2)

# set2 にあって set1 にない
comm -13 <(sort set1) <(sort set2)
```

**注意:** `comm` は入力がソート済みである必要があります。また、`<(...)` はプロセス置換で、bash/zsh の機能です。POSIX sh では動きません。

### 直積集合（Cartesian Product）

```bash
awk 'NR==FNR {a[NR]=$0; next} {for (i in a) print a[i], $0}' set1 set2
```

awk の `NR==FNR` パターンは、1つ目のファイル処理中は true、2つ目以降は false になることを利用しています。

---

## データ変換

### zip

複数セットの要素を結合します。

```bash
paste set1 set2           # タブ区切り
paste -d ',' set1 set2    # カンマ区切り
```

### 射影（Projection）

特定フィールドを抽出します。

```bash
cut -d ' ' -f 1,3 file    # 第1, 第3フィールドを取得
awk '{print $1, $3}'      # 同じことを awk で
```

### split（chunksOf n）

```bash
cat file | paste - - -       # 3行ずつグループ化
xargs -L 3                   # 3行ずつ処理
split -l 100 file prefix_    # 100行ずつファイル分割
```

---

## 文字列処理

### String → [String]

```bash
echo "ABCDEFG" | fold -w 1    # 1文字ずつ分割
echo "a,b,c" | tr ',' '\n'    # 区切り文字で分割
```

### String → Int

```bash
echo "hello" | wc -c          # バイト数
awk '{print length}'          # 文字数（複数行対応）
```

---

## 実践例

### ログ解析

これらを組み合わせた例です。

```bash
# エラーログから、時間帯ごとのエラー数を集計
cat app.log \
  | grep "ERROR" \                    # filter: エラー行のみ
  | awk '{print $1}' \                # map: タイムスタンプ抽出
  | cut -d ':' -f 1 \                 # map: 時（hour）のみ
  | sort \                            # sort
  | uniq -c \                         # fold: カウント
  | sort -rn                          # sort: 多い順
```

関数型的に見ると、filter → map → map → sort → fold → sort です。

### 死にかけのサーバーからファイルを救出する

以前、大きいファイルを引き上げようとすると再起動してしまうサーバーがありました。仕方ないので、ファイルを小分けにしてアーカイブを作ることにしました。

```bash
find /data/ -type f | split -l 20 --verbose \
  | cut -d ' ' -f 3 | xargs -I {} bash -c 'tar -T {} -czf {}.tgz && rm {}'
```

**注意:** macOS の `split` は `--verbose` オプションがありません。GNU coreutils が必要です（`brew install coreutils` で `gsplit` として使用可能）。

これも関数型的に見ると：

- `find` でファイルリスト生成（リスト生成）
- `split -l 20` で20個ずつ分割（chunksOf 20）
- `cut` でファイル名抽出（map）
- `xargs` で各チャンクをアーカイブ（map）

専用ツールがなくても、基本部品の組み合わせで乗り切れます。

---

## まとめ

- Unix パイプラインは関数合成そのもの
- map は `while read` や `xargs`
- filter は `grep` や `awk`
- fold は `awk '{...} END {...}'`
- 集合演算は `comm`, `sort -u`, `grep -Fxf`

専用ツールがあればそれを使うべきですが、基本部品を知っておけば、どんな環境でも対応できます。

個人的には、これらを組み合わせてその場で実行するのがきつくなってきたら Python に切り替えています。ワンライナーで収まるうちはシェル、複雑になったらスクリプト言語、という使い分けです。

---

## 関連記事

- [AWKを超えて：HaskellをUnixパイプラインに持ち込む](/ja/blog/haskell-unix-pipelines/)
