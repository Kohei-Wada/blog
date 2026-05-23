---
title: "Rewiring a running process's output (fd) with gdb"
description: 'A trick that uses gdb not as a debugger but as a "tool for rewriting a running process''s file descriptors." You can switch stdout to a log file mid-run, or re-point it at another pts. Silly, but handy once you know it.'
pubDate: 'May 23 2026'
tags: ['gdb', 'debugging', 'linux']
---

## Introduction

Sometimes you want to re-point a running process's output somewhere else without stopping it. You can do it just by attaching to the process with gdb and calling the `close` and `open` system calls directly. Using gdb not as a debugger but as a "tool for rewriting a running process's file descriptors."

There's a long-running process you've left going, and now you wish you'd kept its logs in a file. Or you want to peek at its output from another terminal. Normally you'd restart it with `> log.txt` appended, but sometimes you don't want to — or can't — stop it.

File descriptors are managed per process, and when you close one, the number gets reused. Using that property, you can close stdout (fd 1) or stderr (fd 2) and reopen a different file, rewiring where the output goes.

## How to do it

First attach to the target process with gdb.

```bash
sudo gdb -p PID
```

Then just `close` the fd and reopen it with `open`. Descriptors are assigned the lowest free number, so if you close 1 and `open` right away, the return value is 1.

```text
(gdb) p close(1)            # close stdout
$1 = 0                      # success; the process can no longer write to stdout
(gdb) p open("/dev/pts/5", 1)  # open pts5 write-only
$2 = 1                      # success; file descriptor 1 is returned
(gdb) p close(2)            # close stderr
$3 = 0                      # success
(gdb) p open("/dev/pts/5", 1)  # open pts5 write-only
$4 = 2                      # file descriptor 2 is returned
(gdb) detach
```

Open a path like `"/tmp/app.log"` instead of `/dev/pts/5` and you switch stdout to a log file mid-run. The second argument to `open` is the flags; here we pass write-only (`O_WRONLY` = 1).

## Caveats

- If you don't `open` right after `close`, the freed fd number can get taken by something else and the numbers shift. If you're targeting 1, close 1 and open immediately.
- While gdb is attached, the target process is stopped. Always resume it with `detach`.
- Anything that already had the old output open (the far end of a pipe, say) won't receive the post-rewire output.
- To rewire child processes or multiple pts at once, you need to walk them recursively (see the reference link).

## Wrap-up

- gdb works as a "tool for rewriting a running process's file descriptors" too.
- `close(fd)` → `open(path, flags)` rewires where output goes.
- It gives you small-scale flexibility: grab logs from a process you don't want to stop, or divert its output to another terminal.

## References

- [Recursively walking processes to rewire all their pts (Japanese)](https://inaz2.hatenablog.com/entry/2015/11/24/232735)
- [Advanced gdb topics (Japanese)](https://doss.eidos.ic.i.u-tokyo.ac.jp/html/advanced_gdb.html)
