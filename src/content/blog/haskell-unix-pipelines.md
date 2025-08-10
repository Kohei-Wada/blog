---
title: 'AWKを超えて：HaskellをUnixパイプラインに持ち込む'
description: 'HaskellをUnixパイプラインに持ち込む'
pubDate: 'Aug 10 2025'
updatedDate: 'Aug 10 2025'
tags: ['Haskell', 'ghci', 'shell芸']
heroImage: '../../assets/blog-placeholder-2.jpg'
---

## 1. 開発者の日常から生まれた課題

### 「実務でもっとHaskellを使いたい。」

関数型プログラミングの美しさを知ってしまった開発者にとって、これは切実な願いです。しかし現実には「実用的でない」「導入コストが高い」といった理由で敬遠され、職場でHaskellを使う機会はほとんどありません。

せめて日常のちょっとした作業でHaskellを使えないでしょうか？ふと見ると、シェルのパイプラインはまるで関数合成のようです。

```bash
cat file | grep pattern | sort | uniq
```

パイプライン = 関数合成。この直感に「Haskellが入り込めるはずだ」という思いが強まります。

### AWKの壁

ワンライナーで少し長めの処理をしたいとき、候補に挙がるのはAWKです。でも…

- 「AWKの配列の書き方、なんだっけ？」
- 「forループの構文は…？」

結局ググって時間を無駄にし、シェル芸の楽しさが薄れてしまう経験、ありませんか？

## 2. ひらめきの瞬間：phsの誕生

### 私の3大課題

1. 実務でHaskellを使う機会がない
2. シェルパイプラインでもっと強力な処理をしたい
3. AWKの文法をいちいち思い出すのが面倒

既存の`stack script`や`cabal script`も試しましたが、初回実行が遅すぎます。ちょっとした処理に数秒待つのは現実的ではありません。

### 「Haskellはもっと使えるはず」

そう確信していた私は、**だったら作ってしまえ**と決意しました。`ghc -e`による即時実行を使えば、パイプラインにHaskellを直接組み込めるのではないでしょうか？
それが**phs**(PipeLine Haskell Script)です。

## 3. phsと日常の作業

### 例0：stack scriptは遅すぎる

```bash
#!/usr/bin/env stack
-- stack script --resolver lts-22.33
main = interact (show . length . lines)
```

このコード、初回実行に数秒かかります。結果、`wc -l`で済ませてしまい、Haskellは日常から遠ざかります。

**phsなら瞬時に実行：**

```bash
cat file.txt | ./phs --all 'length'
```

### 例1：各行の文字数

AWKではこうなります：

```bash
awk '{print length($0)}' file.txt
```

でもphsなら直感的に：

```bash
cat files.txt | ./phs 'length'
```

### 例2：単語数と文字数

```bash
# AWK
awk '{print NF, length($0)}' file.txt

# phs
./phs '\s -> (length (words s), length s)'
```

### 例3：数値の合計

```bash
# AWK
awk '{sum=0; for(i=1;i<=NF;i++) sum+=$i; print sum}'

# phs
./phs 'sum . map read . words'
```

## 4. AWKとHaskell（phs）の徹底比較

UNIX文化におけるテキスト処理の定番といえばAWKです。しかしphsは、AWKが得意な分野もカバーしつつ、さらに表現力を拡張できます。

| 項目             | AWK                  | phs（Haskell）                |
| ---------------- | -------------------- | ----------------------------- |
| **初回実行速度** | 瞬時                 | 瞬時（`ghc -e`利用）          |
| **文法**         | 独自構文（C風）      | 標準Haskell                   |
| **関数・型**     | 組み込みは限られる   | Haskell標準ライブラリが使える |
| **数値処理**     | 浮動小数点が基本     | 型に応じて精度管理可能        |
| **拡張性**       | 外部コマンドに頼る   | モジュール追加で拡張可能      |
| **学習コスト**   | 独自文法の暗記が必要 | Haskellを知っていればゼロ     |

### 基本的なテキスト処理での比較

#### 各行の文字数カウント

```bash
# AWK
awk '{print length($0)}'

# phs
./phs 'length'
```

#### 各行の最初の10文字を取得

```bash
# AWK
awk '{print substr($0, 1, 10)}'

# phs
./phs 'take 10'
```

#### 大文字のみの行をフィルタ

```bash
# AWK（正規表現）
awk '/^[A-Z]+$/'

# phs（関数型）
./phs 'all isUpper'
```

### 数値処理での比較

#### 各行の数値の合計

```bash
# AWK（命令型のループ）
awk '{sum=0; for(i=1;i<=NF;i++) sum+=$i; print sum}'

# phs（関数合成）
./phs 'sum . map read . words'
```

#### 全行の数値の合計

```bash
# AWK（複雑な状態管理）
awk '{for(i=1;i<=NF;i++) total+=$i} END {print total}'

# phs（シンプルな関数合成）
./phs --all 'sum . map read'
```

### 例：各行の単語数

**AWK:**

```bash
awk '{print NF}' file.txt
```

**phs:**

```bash
./phs 'length . words'
```

### 数学的アルゴリズムでの圧倒的差

#### フィボナッチ数列の最初の10項

**AWK（複雑な反復処理）:**

```bash
awk 'BEGIN{a=1;b=1;for(i=1;i<=10;i++){print a;c=a+b;a=b;b=c}}'
```

**phs（エレガントな再帰定義）:**

```bash
seq 1 10 | ./phs 'let fib n = if n <= 2 then 1 else fib (n-1) + fib (n-2) in fib . read'
```

#### コラッツ予想

**AWK（冗長な命令型コード）:**

```bash
awk '{n=$1; while(n>1){if(n%2==0)n=n/2;else n=3*n+1; print n}}'
```

**phs（数式をそのまま表現）:**

```bash
seq 10 | ./phs 'let collatz n = if n == 1 then [1] else n : collatz (if even n then n `div` 2 else 3*n+1) in collatz . read'
```

#### べき集合

**AWK:** やりたくない（多次元配列が必要）

**phs:** 数学的定義をそのまま書ける

```bash
echo "abc" | ./phs 'let powerset [] = [[]]; powerset (x:xs) = powerset xs ++ map (x:) (powerset xs) in powerset'
```

### 高度なテキスト処理

#### 行のソート

```bash
# AWK（外部コマンドに依存）
awk '{print}' | sort

# phs（内蔵関数で完結）
./phs --all 'sort'
```

#### 重複行の除去

```bash
# AWK（外部コマンドが必要）
awk '{print}' | sort | uniq

# phs（一発で解決）
./phs --all 'nub'
```

#### 行の順序を逆転

```bash
# AWK（複雑な実装が必要）
awk '{a[NR]=$0} END {for(i=NR;i>0;i--) print a[i]}'

# phs（直感的）
./phs --all 'reverse'
```

#### 全行を一つの文字列に結合

```bash
# AWK（改行の処理が面倒）
awk '{printf "%s%s", (NR>1?" ":""), $0} END {print ""}'

# phs（自然な表現）
./phs --all 'unwords'
```

**結論:**

- AWKは「行・列単位の単純処理」には最適
- phsは「数学的・再帰的処理」「型安全な集計」「関数型変換」に強く、ワンライナーで記述可能
- 特に複雑なアルゴリズムでは、AWKが命令型の冗長なコードになるのに対し、phsは数学的定義をそのまま表現できる

## 5. 数学的アルゴリズムでの優位性

### コラッツ予想

**AWK:** 命令型で冗長

```bash
awk '{n=$1; while(n>1){if(n%2==0)n=n/2;else n=3*n+1; print n}}'
```

**phs:** 数式をそのまま表現可能

```bash
seq 10 | ./phs 'let collatz n = if n == 1 then [1] else n : collatz (if even n then n `div` 2 else 3*n+1) in collatz . read'
```

### べき集合

**AWK:** やりたくない

**phs:** 数学的定義をそのまま書ける

```bash
echo "abc" | ./phs 'let powerset [] = [[]]; powerset (x:xs) = powerset xs ++ map (x:) (powerset xs) in powerset'
```

## 6. phsのシンプルさ

phsの実装は驚くほどシンプルです：

- コマンドライン解析
- `ghc -e`による即時評価
- 設定ファイル読み込み

これだけで動く軽量実装です。速度の秘密は`ghc -e`による**事前コンパイル不要の即時実行**にあります。

### 現在の課題と今後の改善点

phsは軽量実装のため、いくつかの制約があります：

**文字列の表示問題:**

```bash
echo "hello" | ./phs 'id'
# 出力: "hello"  (ダブルクォートが付く)
```

これは`Show`インスタンスを使って結果を表示しているためです。

でも、普段からシェルを使っている人なら：

```bash
echo "hello" | ./phs 'id' | tr -d '"'
# 出力: hello  (ダブルクォートを削除)
```

で解決ですね（笑）

現在のシンプルな実装では、全ての結果を`show`で統一することで軽量性を実現しています。「完璧を求めるより、まず動くものを」というUnix哲学に従った設計です。細かい調整は、シェルの他のツールと組み合わせて解決するのがUnix流ということで！

## 7. 既存ツールとの差別化

| 手法         | 初回実行 | 2回目以降 | 学習コスト   |
| ------------ | -------- | --------- | ------------ |
| stack script | 3-5秒    | 瞬時      | 中           |
| cabal script | 2-4秒    | 瞬時      | 中           |
| AWK          | 瞬時     | 瞬時      | 高（忘れる） |
| **phs**      | **瞬時** | **瞬時**  | **低**       |

### 学習・研究

- アルゴリズム検証
- 数列の生成と分析

```bash
# 平方数の和
seq 1 100 | ./phs --all 'sum . map (\x -> let t = read x in t * t)'

# 完全数の検索
seq 1 1000 | ./phs --all 'let isPerfect n = sum [i | i <- [1..n-1], n `mod` i == 0] == n in \xs -> filter isPerfect $ map read xs'
```

## 8. 未来への期待

phsは「日常のHaskell利用」を現実にしました：

- AWKの文法を思い出す必要なし
- 関数型プログラミングの美しさを日常で

## 9. 今日から始めるphs

```bash
git clone https://github.com/Kohei-Wada/phs.git
cd phs
chmod +x phs

echo "hello world" | ./phs 'reverse'
```

そして気づくはずです。「あ、これ便利じゃん」と。（笑）

**リポジトリ:** https://github.com/Kohei-Wada/phs

---

**Haskellをもっと日常に使っていこう！**

phsは単なるツールではありません。Haskellを日常の作業に取り入れるための第一歩です。あなたも一緒に、関数型プログラミングの美しさを日常の業務に活かしていきませんか？

きっと、コードを書くことがもっと楽しくなるはずです。
