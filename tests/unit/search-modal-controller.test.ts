import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createInitialState,
  escapeHtml,
  renderResultsHtml,
  renderEmptyHtml,
  handleKeyboardNavigation,
  isSearchShortcut,
} from '../../src/utils/search-modal-controller';
import type { SearchResult } from '../../src/utils/search';

describe('search-modal-controller', () => {
  describe('createInitialState', () => {
    it('should return initial state with default values', () => {
      const state = createInitialState();
      expect(state.selectedIndex).toBe(-1);
      expect(state.results).toEqual([]);
    });
  });

  describe('escapeHtml', () => {
    beforeEach(() => {
      // Mock document.createElement for Node.js environment
      vi.stubGlobal('document', {
        createElement: vi.fn(() => ({
          textContent: '',
          get innerHTML() {
            return this.textContent
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
          },
        })),
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toContain('&lt;');
      expect(escapeHtml('<script>alert("xss")</script>')).toContain('&gt;');
    });

    it('should handle plain text', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World');
    });

    it('should escape ampersands', () => {
      expect(escapeHtml('A & B')).toContain('&amp;');
    });
  });

  describe('renderResultsHtml', () => {
    const mockResults: SearchResult[] = [
      {
        item: {
          id: 'post-1',
          title: 'Test Post',
          description: 'Test description',
          tags: ['tag1', 'tag2'],
          pubDate: '2025-01-01',
          url: '/blog/test-post/',
        },
        refIndex: 0,
        score: 0.5,
      },
    ];

    beforeEach(() => {
      vi.stubGlobal('document', {
        createElement: vi.fn(() => ({
          textContent: '',
          get innerHTML() {
            return this.textContent;
          },
        })),
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should render no results message when results is empty', () => {
      const html = renderResultsHtml([], 0);
      expect(html).toContain('該当する記事が見つかりません');
    });

    it('should render result items', () => {
      const html = renderResultsHtml(mockResults, 0);
      expect(html).toContain('Test Post');
      expect(html).toContain('Test description');
      expect(html).toContain('tag1');
      expect(html).toContain('tag2');
    });

    it('should mark selected item with aria-selected', () => {
      const html = renderResultsHtml(mockResults, 0);
      expect(html).toContain('aria-selected="true"');
    });

    it('should include href for navigation', () => {
      const html = renderResultsHtml(mockResults, 0);
      expect(html).toContain('href="/blog/test-post/"');
    });
  });

  describe('renderEmptyHtml', () => {
    it('should return empty state message', () => {
      const html = renderEmptyHtml();
      expect(html).toContain('検索ワードを入力してください');
      expect(html).toContain('search-empty');
    });
  });

  describe('handleKeyboardNavigation', () => {
    it('should increment index on ArrowDown', () => {
      expect(handleKeyboardNavigation('ArrowDown', 0, 5)).toBe(1);
      expect(handleKeyboardNavigation('ArrowDown', 4, 5)).toBe(4); // Max at resultsCount - 1
    });

    it('should decrement index on ArrowUp', () => {
      expect(handleKeyboardNavigation('ArrowUp', 3, 5)).toBe(2);
      expect(handleKeyboardNavigation('ArrowUp', 0, 5)).toBe(0); // Min at 0
    });

    it('should not exceed max results limit', () => {
      // With 15 results, max should be 9 (SEARCH_MAX_RESULTS - 1)
      expect(handleKeyboardNavigation('ArrowDown', 8, 15)).toBe(9);
      expect(handleKeyboardNavigation('ArrowDown', 9, 15)).toBe(9);
    });

    it('should return current index for other keys', () => {
      expect(handleKeyboardNavigation('Enter', 3, 5)).toBe(3);
      expect(handleKeyboardNavigation('Escape', 3, 5)).toBe(3);
    });
  });

  describe('isSearchShortcut', () => {
    it('should return true for Cmd+K', () => {
      const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
      expect(isSearchShortcut(event)).toBe(true);
    });

    it('should return true for Ctrl+K', () => {
      const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
      expect(isSearchShortcut(event)).toBe(true);
    });

    it('should return false for just K', () => {
      const event = new KeyboardEvent('keydown', { key: 'k' });
      expect(isSearchShortcut(event)).toBe(false);
    });

    it('should return false for Cmd+other key', () => {
      const event = new KeyboardEvent('keydown', { key: 'j', metaKey: true });
      expect(isSearchShortcut(event)).toBe(false);
    });
  });
});
