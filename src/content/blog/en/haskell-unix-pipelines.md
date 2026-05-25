---
title: 'Beyond AWK: Bringing Haskell into Unix Pipelines'
description: 'Bringing Haskell into Unix pipelines'
pubDate: 'Aug 10 2025'
tags: ['Haskell', 'ghci', 'shell-tricks']
---

## 1. A Problem Born from Daily Developer Life

### "I want to use Haskell more in real work."

For any developer who has tasted the beauty of functional programming, this is a heartfelt wish. But the reality is that Haskell gets shunned as "impractical" or "too expensive to introduce," and there are almost no opportunities to use it at work.

Couldn't we at least use Haskell for the small everyday tasks? When you stop and look, a shell pipeline really does resemble function composition.

```bash
cat file | grep pattern | sort | uniq
```

Pipeline = function composition. The more I sat with that intuition, the more convinced I became that Haskell ought to fit right in.

### The AWK Wall

When you want to do something a bit longer than a typical one-liner, AWK comes to mind. But...

- "How do you write an array in AWK again?"
- "What's the syntax for a for loop...?"

Haven't you ended up wasting time on Google, watching all the fun of shell trickery slip away?

## 2. The Moment of Inspiration: The Birth of phs

### My Three Big Problems

1. No chance to use Haskell at work
2. Wanting more powerful processing inside shell pipelines
3. Hating having to look up AWK syntax every time

I tried existing options like `stack script` and `cabal script`, but the first run is way too slow. Waiting several seconds for a trivial bit of processing just isn't practical.

### "Haskell ought to be more usable than this"

Convinced of that, I figured **fine, I'll just build it myself**. If we use `ghc -e` for immediate execution, couldn't we drop Haskell directly into a pipeline?
That is **phs** (PipeLine Haskell Script).

## 3. phs in Everyday Work

### Example 0: stack script is too slow

```bash
#!/usr/bin/env stack
-- stack script --resolver lts-22.33
main = interact (show . length . lines)
```

This code takes several seconds on its first run. So you end up reaching for `wc -l` instead, and Haskell drifts further out of daily life.

**With phs, it's instant:**

```bash
cat file.txt | ./phs --all 'length'
```

### Example 1: Character count per line

In AWK:

```bash
awk '{print length($0)}' file.txt
```

But with phs, it's intuitive:

```bash
cat files.txt | ./phs 'length'
```

### Example 2: Word count and character count

```bash
# AWK
awk '{print NF, length($0)}' file.txt

# phs
./phs '\s -> (length (words s), length s)'
```

### Example 3: Sum of numbers

```bash
# AWK
awk '{sum=0; for(i=1;i<=NF;i++) sum+=$i; print sum}'

# phs
./phs 'sum . map read . words'
```

## 4. A Thorough Comparison of AWK and Haskell (phs)

The classic text-processing tool of UNIX culture is AWK. But phs covers what AWK is good at while pushing expressiveness even further.

| Item                   | AWK                            | phs (Haskell)                           |
| ---------------------- | ------------------------------ | --------------------------------------- |
| **First-run speed**    | Instant                        | Instant (via `ghc -e`)                  |
| **Syntax**             | Custom syntax (C-like)         | Standard Haskell                        |
| **Functions / types**  | Built-ins are limited          | Haskell's standard library is available |
| **Numeric processing** | Floating point by default      | Precision managed via types             |
| **Extensibility**      | Relies on external commands    | Extensible by adding modules            |
| **Learning cost**      | Must memorize a custom grammar | Zero if you already know Haskell        |

### Comparison on basic text processing

#### Count characters per line

```bash
# AWK
awk '{print length($0)}'

# phs
./phs 'length'
```

#### Take the first 10 characters of each line

```bash
# AWK
awk '{print substr($0, 1, 10)}'

# phs
./phs 'take 10'
```

#### Filter lines that are uppercase only

```bash
# AWK (regex)
awk '/^[A-Z]+$/'

# phs (functional)
./phs 'all isUpper'
```

### Comparison on numeric processing

#### Sum of numbers per line

```bash
# AWK (imperative loop)
awk '{sum=0; for(i=1;i<=NF;i++) sum+=$i; print sum}'

# phs (function composition)
./phs 'sum . map read . words'
```

#### Sum of numbers across all lines

```bash
# AWK (messy state handling)
awk '{for(i=1;i<=NF;i++) total+=$i} END {print total}'

# phs (simple function composition)
./phs --all 'sum . map read'
```

### Example: word count per line

**AWK:**

```bash
awk '{print NF}' file.txt
```

**phs:**

```bash
./phs 'length . words'
```

### Where the gap really shows: mathematical algorithms

#### First 10 terms of the Fibonacci sequence

**AWK (a tangle of iteration):**

```bash
awk 'BEGIN{a=1;b=1;for(i=1;i<=10;i++){print a;c=a+b;a=b;b=c}}'
```

**phs (an elegant recursive definition):**

```bash
seq 1 10 | ./phs 'let fib n = if n <= 2 then 1 else fib (n-1) + fib (n-2) in fib . read'
```

#### Collatz conjecture

**AWK (verbose imperative code):**

```bash
awk '{n=$1; while(n>1){if(n%2==0)n=n/2;else n=3*n+1; print n}}'
```

**phs (the formula expressed as-is):**

```bash
seq 10 | ./phs 'let collatz n = if n == 1 then [1] else n : collatz (if even n then n `div` 2 else 3*n+1) in collatz . read'
```

#### Power set

**AWK:** I don't want to (you'd need multi-dimensional arrays)

**phs:** You can write the mathematical definition verbatim

```bash
echo "abc" | ./phs 'let powerset [] = [[]]; powerset (x:xs) = powerset xs ++ map (x:) (powerset xs) in powerset'
```

### Advanced text processing

#### Sorting lines

```bash
# AWK (depends on an external command)
awk '{print}' | sort

# phs (self-contained via built-in functions)
./phs --all 'sort'
```

#### Removing duplicate lines

```bash
# AWK (needs external commands)
awk '{print}' | sort | uniq

# phs (solved in one shot)
./phs --all 'nub'
```

#### Reversing line order

```bash
# AWK (requires a clunky implementation)
awk '{a[NR]=$0} END {for(i=NR;i>0;i--) print a[i]}'

# phs (intuitive)
./phs --all 'reverse'
```

#### Joining all lines into a single string

```bash
# AWK (newline handling is a pain)
awk '{printf "%s%s", (NR>1?" ":""), $0} END {print ""}'

# phs (natural)
./phs --all 'unwords'
```

**Conclusion:**

- AWK is ideal for "simple row/column processing"
- phs shines at "mathematical or recursive processing," "type-safe aggregation," and "functional transformations," all writable as one-liners
- Especially for complex algorithms, AWK turns into verbose imperative code, while phs can express the mathematical definition directly

## 5. The Edge in Mathematical Algorithms

### Collatz conjecture

**AWK:** imperative and verbose

```bash
awk '{n=$1; while(n>1){if(n%2==0)n=n/2;else n=3*n+1; print n}}'
```

**phs:** the formula expressed directly

```bash
seq 10 | ./phs 'let collatz n = if n == 1 then [1] else n : collatz (if even n then n `div` 2 else 3*n+1) in collatz . read'
```

### Power set

**AWK:** I don't want to

**phs:** write the mathematical definition verbatim

```bash
echo "abc" | ./phs 'let powerset [] = [[]]; powerset (x:xs) = powerset xs ++ map (x:) (powerset xs) in powerset'
```

## 6. The Simplicity of phs

The implementation of phs is shockingly simple:

- Command-line parsing
- Immediate evaluation via `ghc -e`
- Config file loading

That's all you need for a lightweight implementation that works. The secret to its speed is `ghc -e`'s **immediate execution with no precompilation required**.

### Current limitations and future improvements

Because phs is a lightweight implementation, it has a few constraints:

**String display issue:**

```bash
echo "hello" | ./phs 'id'
# Output: "hello"  (double quotes are included)
```

This happens because results are displayed using the `Show` instance.

But anyone who regularly uses the shell can just do:

```bash
echo "hello" | ./phs 'id' | tr -d '"'
# Output: hello  (double quotes removed)
```

Problem solved (lol).

The current simple implementation stays lightweight by running every result through `show` uniformly. It's a design that follows the Unix philosophy of "rather than chasing perfection, get something working first." Any fine-grained tweaking is best handled by combining it with other shell tools — that's the Unix way!

## 7. How phs Sets Itself Apart from Existing Tools

| Approach     | First run   | Subsequent runs | Learning cost     |
| ------------ | ----------- | --------------- | ----------------- |
| stack script | 3-5 sec     | Instant         | Medium            |
| cabal script | 2-4 sec     | Instant         | Medium            |
| AWK          | Instant     | Instant         | High (you forget) |
| **phs**      | **Instant** | **Instant**     | **Low**           |

### Learning and research

- Algorithm exploration
- Generating and analyzing number sequences

```bash
# Sum of squares
seq 1 100 | ./phs --all 'sum . map (\x -> let t = read x in t * t)'

# Searching for perfect numbers
seq 1 1000 | ./phs --all 'let isPerfect n = sum [i | i <- [1..n-1], n `mod` i == 0] == n in \xs -> filter isPerfect $ map read xs'
```

## 8. Looking Ahead

phs has made "everyday Haskell" a reality:

- No need to recall AWK syntax
- The beauty of functional programming, every day

## 9. Getting Started with phs Today

```bash
git clone https://github.com/Kohei-Wada/phs.git
cd phs
chmod +x phs

echo "hello world" | ./phs 'reverse'
```

And you'll notice: "oh, this is actually handy." (lol)

**Repository:** https://github.com/Kohei-Wada/phs

---

**Let's bring Haskell more into daily life!**

phs is more than just a tool. It's a first step toward folding Haskell into everyday work. Why not join me in bringing the beauty of functional programming into your daily tasks?

I'm pretty sure it'll make writing code a lot more fun.
