import type { MarkdownHeading, TocItem } from '../types/index';

/**
 * Build a hierarchical table of contents structure from markdown headings
 *
 * @param headings - Array of headings extracted from markdown
 * @returns Hierarchical TocItem array (h2 as root, h3 as sub-items)
 */
export function buildTocStructure(headings: MarkdownHeading[]): TocItem[] {
  const toc: TocItem[] = [];
  const stack: TocItem[] = [];

  for (const heading of headings) {
    // Exclude h1 (article title)
    if (heading.depth === 1) continue;

    const tocItem: TocItem = {
      ...heading,
      subheadings: [],
    };

    // Pop items from stack that are deeper or equal to current depth
    while (stack.length > 0 && stack[stack.length - 1].depth >= heading.depth) {
      stack.pop();
    }

    if (stack.length === 0) {
      // Root level (h2)
      toc.push(tocItem);
    } else {
      // Add as child of parent heading
      stack[stack.length - 1].subheadings.push(tocItem);
    }

    stack.push(tocItem);
  }

  return toc;
}
