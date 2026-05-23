import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createInitialState,
  escapeHtml,
  highlightMatches,
  renderResultListHtml,
  renderRecentPostsHtml,
  renderPreviewHtml,
  renderEmptyResultsHtml,
  renderStatusBarHtml,
  handleKeyboardNavigation,
  isSearchShortcut,
} from '../../src/utils/search-modal-controller';
import type { SearchItem, SearchResult } from '../../src/utils/search';

function mockItem(overrides: Partial<SearchItem> = {}): SearchItem {
  return {
    id: 'post-1',
    title: 'Test Post',
    description: 'Test description',
    tags: ['tag1', 'tag2'],
    pubDate: '2025-01-01T00:00:00.000Z',
    url: '/blog/test-post/',
    body: 'Body excerpt that should appear in the preview pane.',
    ...overrides,
  };
}

function mockResult(item: SearchItem, score = 0.1): SearchResult {
  return { item, refIndex: 0, score };
}

describe('search-modal-controller', () => {
  describe('createInitialState', () => {
    it('returns default state', () => {
      const state = createInitialState();
      expect(state.selectedIndex).toBe(0);
      expect(state.results).toEqual([]);
    });
  });

  describe('escapeHtml', () => {
    beforeEach(() => {
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

    it('escapes HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toContain('&lt;');
      expect(escapeHtml('<script>alert("xss")</script>')).toContain('&gt;');
    });

    it('passes plain text through', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World');
    });
  });

  describe('highlightMatches', () => {
    it('wraps a matched substring in a span', () => {
      const html = highlightMatches('Hello World', 'World');
      expect(html).toBe('Hello <span class="match">World</span>');
    });

    it('is case-insensitive', () => {
      const html = highlightMatches('Hello World', 'world');
      expect(html).toBe('Hello <span class="match">World</span>');
    });

    it('escapes the input text', () => {
      const html = highlightMatches('<b>safe</b>', 'safe');
      expect(html).toContain('&lt;b&gt;');
      expect(html).toContain('<span class="match">safe</span>');
    });

    it('returns escaped text unchanged when query is empty', () => {
      expect(highlightMatches('<x>', '')).toBe('&lt;x&gt;');
    });

    it('returns escaped text unchanged when query does not match', () => {
      expect(highlightMatches('<x>', 'zzz')).toBe('&lt;x&gt;');
    });

    it('highlights every occurrence', () => {
      const html = highlightMatches('foo bar foo', 'foo');
      expect(html.match(/<span class="match">foo<\/span>/g)?.length).toBe(2);
    });

    it('escapes regex metacharacters in the query', () => {
      const html = highlightMatches('a.b.c', '.');
      expect(html.match(/<span class="match">\.<\/span>/g)?.length).toBe(2);
    });
  });

  describe('renderResultListHtml', () => {
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

    it('renders one option per result', () => {
      const results = [
        mockResult(mockItem({ id: 'a', title: 'Alpha' })),
        mockResult(mockItem({ id: 'b', title: 'Bravo' })),
      ];
      const html = renderResultListHtml(results, 0, '');
      expect(html.match(/role="option"/g)?.length).toBe(2);
    });

    it('marks the selected row with aria-selected="true" and ❯ prefix', () => {
      const results = [
        mockResult(mockItem({ id: 'a', title: 'Alpha' })),
        mockResult(mockItem({ id: 'b', title: 'Bravo' })),
      ];
      const html = renderResultListHtml(results, 1, '');
      expect(html).toContain('aria-selected="true"');
      expect(html).toContain('❯');
    });

    it('renders an empty-state message when results is empty', () => {
      expect(renderResultListHtml([], 0, 'foo')).toBe(renderEmptyResultsHtml());
    });

    it('highlights the query in result titles', () => {
      const results = [mockResult(mockItem({ title: 'Astro と SSG の話' }))];
      const html = renderResultListHtml(results, 0, 'Astro');
      expect(html).toContain('<span class="match">Astro</span>');
    });
  });

  describe('renderRecentPostsHtml', () => {
    it('renders rows for plain items (no highlighting)', () => {
      const items = [mockItem({ id: 'a', title: 'Alpha' }), mockItem({ id: 'b', title: 'Bravo' })];
      const html = renderRecentPostsHtml(items, 0);
      expect(html.match(/role="option"/g)?.length).toBe(2);
      expect(html).not.toContain('<span class="match">');
    });

    it('marks the selected row', () => {
      const items = [mockItem({ id: 'a' }), mockItem({ id: 'b' })];
      const html = renderRecentPostsHtml(items, 1);
      expect(html).toContain('aria-selected="true"');
    });
  });

  describe('renderPreviewHtml', () => {
    it('returns an empty placeholder when item is null', () => {
      const html = renderPreviewHtml(null);
      expect(html).toContain('search-preview-empty');
    });

    it('shows the title, description, and body excerpt for the selected item', () => {
      const item = mockItem({
        title: 'My title',
        description: 'My description',
        body: 'a'.repeat(500),
      });
      const html = renderPreviewHtml(item);
      expect(html).toContain('My title');
      expect(html).toContain('My description');
      expect(html).toContain('a'.repeat(200));
      // excerpt should not contain the full 500 chars
      expect(html).not.toContain('a'.repeat(220));
    });

    it('lists tags when present', () => {
      const item = mockItem({ tags: ['Astro', 'SSG'] });
      const html = renderPreviewHtml(item);
      expect(html).toContain('Astro');
      expect(html).toContain('SSG');
    });
  });

  describe('renderStatusBarHtml', () => {
    it('shows the match count using 1-based selection index', () => {
      const html = renderStatusBarHtml(0, 14);
      expect(html).toContain('1 / 14');
    });

    it('shows 0 / 0 when there are no results', () => {
      const html = renderStatusBarHtml(0, 0);
      expect(html).toContain('0 / 0');
    });
  });

  describe('handleKeyboardNavigation', () => {
    it('moves down on ArrowDown', () => {
      expect(handleKeyboardNavigation('ArrowDown', false, 0, 5)).toBe(1);
    });

    it('moves up on ArrowUp', () => {
      expect(handleKeyboardNavigation('ArrowUp', false, 3, 5)).toBe(2);
    });

    it('treats Ctrl+J as down', () => {
      expect(handleKeyboardNavigation('j', true, 0, 5)).toBe(1);
    });

    it('treats Ctrl+K as up', () => {
      expect(handleKeyboardNavigation('k', true, 3, 5)).toBe(2);
    });

    it('does not move on plain j or k (no ctrl)', () => {
      expect(handleKeyboardNavigation('j', false, 2, 5)).toBe(2);
      expect(handleKeyboardNavigation('k', false, 2, 5)).toBe(2);
    });

    it('clamps to [0, count - 1]', () => {
      expect(handleKeyboardNavigation('ArrowDown', false, 4, 5)).toBe(4);
      expect(handleKeyboardNavigation('ArrowUp', false, 0, 5)).toBe(0);
    });

    it('caps at SEARCH_MAX_RESULTS - 1', () => {
      expect(handleKeyboardNavigation('ArrowDown', false, 9, 15)).toBe(9);
    });

    it('returns current index for unrelated keys', () => {
      expect(handleKeyboardNavigation('Enter', false, 3, 5)).toBe(3);
      expect(handleKeyboardNavigation('Escape', false, 3, 5)).toBe(3);
    });
  });

  describe('isSearchShortcut', () => {
    it('returns true for Ctrl+K', () => {
      const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
      expect(isSearchShortcut(event)).toBe(true);
    });

    it('returns true for Cmd+K (macOS)', () => {
      const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
      expect(isSearchShortcut(event)).toBe(true);
    });

    it('returns true for `/` when not typing in a text input', () => {
      const event = new KeyboardEvent('keydown', { key: '/' });
      // simulate target = body (default)
      expect(isSearchShortcut(event)).toBe(true);
    });

    it('returns false for `/` when target is an input element', () => {
      const event = new KeyboardEvent('keydown', { key: '/' });
      const input = document.createElement('input');
      Object.defineProperty(event, 'target', { value: input, writable: false });
      expect(isSearchShortcut(event)).toBe(false);
    });

    it('returns false for `/` when target is a textarea', () => {
      const event = new KeyboardEvent('keydown', { key: '/' });
      const textarea = document.createElement('textarea');
      Object.defineProperty(event, 'target', { value: textarea, writable: false });
      expect(isSearchShortcut(event)).toBe(false);
    });

    it('returns false for `/` when target is contenteditable', () => {
      const event = new KeyboardEvent('keydown', { key: '/' });
      const div = document.createElement('div');
      div.setAttribute('contenteditable', 'true');
      Object.defineProperty(event, 'target', { value: div, writable: false });
      expect(isSearchShortcut(event)).toBe(false);
    });

    it('returns false for a bare K', () => {
      const event = new KeyboardEvent('keydown', { key: 'k' });
      expect(isSearchShortcut(event)).toBe(false);
    });

    it('returns false for Ctrl + other key', () => {
      const event = new KeyboardEvent('keydown', { key: 'j', ctrlKey: true });
      expect(isSearchShortcut(event)).toBe(false);
    });
  });
});
