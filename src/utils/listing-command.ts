import type { Page } from 'astro';

// Turn a base listing command (e.g. `ls -l blog/`) into one that reflects the
// slice shown on the current page, so the annotation reads as a real command
// and makes the count visible. A single-page listing is left untouched.
export function buildListingCommand(
  base: string,
  page: Pick<Page, 'currentPage' | 'lastPage' | 'start' | 'end'>
): string {
  if (page.lastPage <= 1) return base;
  const from = page.start + 1;
  const to = page.end + 1;
  if (page.currentPage === 1) return `${base} | head -n ${to}`;
  return `${base} | sed -n '${from},${to}p'`;
}
