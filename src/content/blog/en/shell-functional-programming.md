---
title: 'Functional Programming in the Shell'
description: 'Treating Unix pipelines as function composition, and using map/filter/fold as building blocks for log analysis and data processing'
pubDate: 'Jan 09 2026'
tags: ['Shell', 'Bash', 'awk', 'Functional Programming', 'Unix']
---

A while back I wrote [Beyond AWK: Bringing Haskell to Unix Pipelines](/en/blog/haskell-unix-pipelines/), about writing pipeline-style processing in Haskell.

But the original idea actually came from what I'm covering in this post. While digging through logs with grep and awk, it hit me: "Wait, I'm just filtering, mapping, and folding." That's where it started.

The foundation of functional programming in the shell is to **treat newline-separated text as a list**.

```
a
b
c
```

Once you see this as `["a", "b", "c"]`, all that's left is applying map, filter, and fold.

We live in an age of structured logs and dedicated tools, but if you think functionally, you can pull off most things with plain old Unix commands.

The goal of this post is to **handle as wide a range of operations as possible with as few commands as possible**. Keep the set of commands you have to memorize small, but combine them to accomplish a lot. I've laid out the basic building blocks for that.

---

## Unix Pipelines and Function Composition

The Unix philosophy — "combine small programs that do one thing well" — is essentially the same idea as functional programming's "compose small pure functions."

The pipe `|` is function composition, literally. Many Unix commands behave like pure functions that take input and return output.

```bash
cat access.log | grep "ERROR" | awk '{print $4}' | sort | uniq -c
```

This is a composition of "filter → map → sort → fold."

---

## Higher-Order Functions

### Map

Apply a function to each element of a list to produce a new list.

**With `while`:**

```bash
command | while read -r a; do
  # map-function
done

# Example: odd/even check
seq 10 | while read -r a; do
  if ((a % 2)); then
    echo odd
  else
    echo even
  fi
done
```

**With `xargs`:**

```bash
xargs -I {} bash -c 'echo "processing: {}"'
```

`xargs` can also parallelize with the `-P` option.

```bash
# Process 4 in parallel
xargs -P 4 -I {} bash -c 'process {}'
```

There's a dedicated tool called GNU parallel, but it isn't installed in most environments. `xargs` ships with virtually every Unix-like system by default.

A couple of caveats: use the `-r` option to read input literally when the data contains backslashes. For pipeline processing, `while` is more general-purpose than `for`.

### Filter

Extract only the elements that match a condition.

**With `grep` (string patterns):**

```bash
grep 'pattern'
```

**With `awk` (numeric or complex conditions):**

```bash
awk 'NR % 2 == 0 { print }'  # even-numbered lines only
awk '$1 >= 100 { print }'     # first field >= 100
```

Guidelines for picking one:

- Simple string match → `grep`
- Numeric / field-based → `awk`
- Complex conditions, or chaining with external commands → `while`

### Fold

Process elements in sequence to produce a single value.

**foldl (left fold):**

```bash
seq 10 | awk '{sum += $1} END {print sum}'
```

**foldr (right fold):**

```bash
seq 10 | tac | awk '{sum += $1} END {print sum}'
```

Honestly, folding is rough in the shell. Simple sums or counts are fine with awk, but anything beyond that gets painful. Converting to CSV and piping it into SQLite is often easier.

```bash
# Aggregate CSV with SQLite
cat data.csv | sqlite3 :memory: '.mode csv' '.import /dev/stdin t' 'SELECT col1, SUM(col2) FROM t GROUP BY col1'
```

That said, this feels like a departure from the functional way of thinking. If you have a better approach, let me know.

---

## List Operations

### Infinite Lists

```bash
yes             # infinite "y"
seq infinity    # infinite list 1, 2, 3, ...
```

### take / drop

```bash
head -n 10 file       # first 10 lines (take)
tail -n +11 file      # from line 11 onward (drop 10)
```

### takeWhile / dropWhile

```bash
# takeWhile: take while the condition holds
awk '$1 < 100 { print } $1 >= 100 { exit }'

# dropWhile: skip while the condition holds, then take everything after
awk '!found && $1 < 100 { next } { found=1; print }'
```

### uniq (uniqBy)

Deduplicate by a specific field.

```bash
awk '!seen[$1]++'    # uniqBy first column
awk '!seen[$2]++'    # uniqBy second column
```

---

## Set Operations

You can pull off most set-like operations with `comm`.

### Union

```bash
cat set1 set2 | sort -u

# If already sorted
sort -m -u set1 set2
```

### Intersection

```bash
comm -12 <(sort set1) <(sort set2)

# Or
grep -Fxf set1 set2
```

### Difference

```bash
# In set1 but not set2
comm -23 <(sort set1) <(sort set2)

# In set2 but not set1
comm -13 <(sort set1) <(sort set2)
```

**Note:** `comm` requires sorted input. Also, `<(...)` is process substitution, a bash/zsh feature — it won't work in POSIX sh.

### Cartesian Product

```bash
awk 'NR==FNR {a[NR]=$0; next} {for (i in a) print a[i], $0}' set1 set2
```

The awk `NR==FNR` pattern works because it's true while processing the first file and false for subsequent ones.

---

## Data Transformation

### zip

Combine elements from multiple sets.

```bash
paste set1 set2           # tab-separated
paste -d ',' set1 set2    # comma-separated
```

### Projection

Pull out specific fields.

```bash
cut -d ' ' -f 1,3 file    # fields 1 and 3
awk '{print $1, $3}'      # same thing in awk
```

### split (chunksOf n)

```bash
cat file | paste - - -       # group every 3 lines
xargs -L 3                   # process 3 lines at a time
split -l 100 file prefix_    # split file into 100-line chunks
```

---

## String Processing

### String → [String]

```bash
echo "ABCDEFG" | fold -w 1    # split into individual characters
echo "a,b,c" | tr ',' '\n'    # split by delimiter
```

### String → Int

```bash
echo "hello" | wc -c          # byte count
awk '{print length}'          # character count (multi-line aware)
```

---

## Practical Examples

### Log Analysis

Putting these together:

```bash
# Aggregate error counts per hour from an error log
cat app.log \
  | grep "ERROR" \                    # filter: error lines only
  | awk '{print $1}' \                # map: extract timestamp
  | cut -d ':' -f 1 \                 # map: hour only
  | sort \                            # sort
  | uniq -c \                         # fold: count
  | sort -rn                          # sort: descending
```

Functionally, this is filter → map → map → sort → fold → sort.

### Rescuing Files from a Dying Server

I once had a server that would reboot whenever I tried to pull a large file off it. There was no other option, so I split the files into smaller chunks and archived them.

```bash
find /data/ -type f | split -l 20 --verbose \
  | cut -d ' ' -f 3 | xargs -I {} bash -c 'tar -T {} -czf {}.tgz && rm {}'
```

**Note:** macOS's `split` doesn't have a `--verbose` option. You need GNU coreutils (install with `brew install coreutils` and use it as `gsplit`).

Viewed functionally:

- `find` generates the file list (list generation)
- `split -l 20` splits into chunks of 20 (chunksOf 20)
- `cut` extracts the filename (map)
- `xargs` archives each chunk (map)

Even without a dedicated tool, you can get by with combinations of the basic building blocks.

---

## Wrap-up

- Unix pipelines _are_ function composition
- map → `while read` or `xargs`
- filter → `grep` or `awk`
- fold → `awk '{...} END {...}'`
- set ops → `comm`, `sort -u`, `grep -Fxf`

If a dedicated tool exists, use it. But knowing the basic building blocks means you can cope in any environment.

Personally, once combining these on the fly starts to hurt, I switch to Python. While it fits in a one-liner I stay in the shell; once it gets complicated, I move to a scripting language.

---

## Related Posts

- [Beyond AWK: Bringing Haskell to Unix Pipelines](/en/blog/haskell-unix-pipelines/)
