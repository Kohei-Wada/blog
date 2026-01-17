import { describe, it, expect } from 'vitest';
import { buildTocStructure } from '../../src/utils/toc-builder';
import type { MarkdownHeading } from '../../src/types';

describe('toc-builder', () => {
  describe('buildTocStructure', () => {
    it('should return empty array for empty headings', () => {
      const result = buildTocStructure([]);
      expect(result).toEqual([]);
    });

    it('should exclude h1 headings (article title)', () => {
      const headings: MarkdownHeading[] = [
        { depth: 1, slug: 'title', text: 'Article Title' },
        { depth: 2, slug: 'section', text: 'Section' },
      ];

      const result = buildTocStructure(headings);

      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Section');
    });

    it('should handle h2 only headings as flat list', () => {
      const headings: MarkdownHeading[] = [
        { depth: 2, slug: 'intro', text: 'Introduction' },
        { depth: 2, slug: 'main', text: 'Main Content' },
        { depth: 2, slug: 'conclusion', text: 'Conclusion' },
      ];

      const result = buildTocStructure(headings);

      expect(result).toHaveLength(3);
      expect(result.map(item => item.text)).toEqual(['Introduction', 'Main Content', 'Conclusion']);
      result.forEach(item => {
        expect(item.subheadings).toEqual([]);
      });
    });

    it('should nest h3 under h2', () => {
      const headings: MarkdownHeading[] = [
        { depth: 2, slug: 'section-1', text: 'Section 1' },
        { depth: 3, slug: 'subsection-1-1', text: 'Subsection 1.1' },
        { depth: 3, slug: 'subsection-1-2', text: 'Subsection 1.2' },
        { depth: 2, slug: 'section-2', text: 'Section 2' },
      ];

      const result = buildTocStructure(headings);

      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('Section 1');
      expect(result[0].subheadings).toHaveLength(2);
      expect(result[0].subheadings[0].text).toBe('Subsection 1.1');
      expect(result[0].subheadings[1].text).toBe('Subsection 1.2');
      expect(result[1].text).toBe('Section 2');
      expect(result[1].subheadings).toEqual([]);
    });

    it('should preserve slug and depth in TocItem', () => {
      const headings: MarkdownHeading[] = [{ depth: 2, slug: 'my-section', text: 'My Section' }];

      const result = buildTocStructure(headings);

      expect(result[0]).toEqual({
        depth: 2,
        slug: 'my-section',
        text: 'My Section',
        subheadings: [],
      });
    });

    it('should handle h3 at the beginning (orphan h3)', () => {
      const headings: MarkdownHeading[] = [
        { depth: 3, slug: 'orphan', text: 'Orphan Subsection' },
        { depth: 2, slug: 'section', text: 'Section' },
      ];

      const result = buildTocStructure(headings);

      // h3が最初に来た場合、ルートレベルに追加される
      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('Orphan Subsection');
      expect(result[1].text).toBe('Section');
    });
  });
});
