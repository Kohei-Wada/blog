import { UI_CONFIG } from '../constants/ui';
import type { SearchResult } from './search';

/**
 * Search modal state
 */
export interface SearchModalState {
  selectedIndex: number;
  results: SearchResult[];
}

/**
 * Create initial search modal state
 */
export function createInitialState(): SearchModalState {
  return {
    selectedIndex: -1,
    results: [],
  };
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Generate HTML for search results
 */
export function renderResultsHtml(results: SearchResult[], selectedIndex: number): string {
  if (results.length === 0) {
    return '<div class="search-no-results">該当する記事が見つかりません</div>';
  }

  return results
    .slice(0, UI_CONFIG.SEARCH_MAX_RESULTS)
    .map(
      (result, index) => `
      <a
        href="${escapeHtml(result.item.url)}"
        class="search-result-item"
        role="option"
        aria-selected="${index === selectedIndex}"
        data-index="${index}"
      >
        <div class="search-result-content">
          <div class="search-result-title">${escapeHtml(result.item.title)}</div>
          <div class="search-result-description">${escapeHtml(result.item.description)}</div>
          ${
            result.item.tags.length > 0
              ? `<div class="search-result-tags">
              ${result.item.tags.map((tag: string) => `<span class="search-result-tag">${escapeHtml(tag)}</span>`).join('')}
            </div>`
              : ''
          }
        </div>
      </a>
    `
    )
    .join('');
}

/**
 * Generate empty state HTML
 */
export function renderEmptyHtml(): string {
  return '<div class="search-empty">検索ワードを入力してください</div>';
}

/**
 * Handle keyboard navigation
 * Returns updated selected index
 */
export function handleKeyboardNavigation(
  key: string,
  currentIndex: number,
  resultsCount: number
): number {
  const maxIndex = Math.min(resultsCount - 1, UI_CONFIG.SEARCH_MAX_RESULTS - 1);

  switch (key) {
    case 'ArrowDown':
      return Math.min(currentIndex + 1, maxIndex);
    case 'ArrowUp':
      return Math.max(currentIndex - 1, 0);
    default:
      return currentIndex;
  }
}

/**
 * Check if keyboard shortcut is search toggle (Cmd+K / Ctrl+K)
 */
export function isSearchShortcut(event: KeyboardEvent): boolean {
  return (event.metaKey || event.ctrlKey) && event.key === 'k';
}
