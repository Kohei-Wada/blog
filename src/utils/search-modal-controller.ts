import { UI_CONFIG } from '../constants/ui';
import type { SearchItem, SearchResult } from './search';

export interface SearchModalState {
  selectedIndex: number;
  results: SearchResult[];
}

export function createInitialState(): SearchModalState {
  return { selectedIndex: 0, results: [] };
}

export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function highlightMatches(text: string, query: string): string {
  const safe = escapeHtml(text);
  const q = query.trim();
  if (!q) return safe;
  const regex = new RegExp(escapeRegExp(q), 'gi');
  return safe.replace(regex, m => `<span class="match">${m}</span>`);
}

const PREVIEW_BODY_CHARS = 200;

function formatPubDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function renderRow(item: SearchItem, index: number, selectedIndex: number, query: string): string {
  const selected = index === selectedIndex;
  const prefix = selected ? '❯' : ' ';
  const title = query ? highlightMatches(item.title, query) : escapeHtml(item.title);
  const tagText = item.tags.length > 0 ? ` · ${item.tags.slice(0, 3).join(', ')}` : '';
  const meta = `${formatPubDate(item.pubDate)}${tagText}`;
  return `<a
      href="${escapeHtml(item.url)}"
      class="search-result-row${selected ? ' is-selected' : ''}"
      role="option"
      id="search-result-${index}"
      aria-selected="${selected ? 'true' : 'false'}"
      data-index="${index}"
      data-id="${escapeHtml(item.id)}"
    ><span class="search-result-prefix" aria-hidden="true">${prefix}</span><span class="search-result-body"><span class="search-result-title">${title}</span><span class="search-result-meta">${escapeHtml(meta)}</span></span></a>`;
}

export function renderEmptyResultsHtml(): string {
  return '<div class="search-empty">No matching articles</div>';
}

export function renderResultListHtml(
  results: SearchResult[],
  selectedIndex: number,
  query: string
): string {
  if (results.length === 0) return renderEmptyResultsHtml();
  return results
    .slice(0, UI_CONFIG.SEARCH_MAX_RESULTS)
    .map((r, i) => renderRow(r.item, i, selectedIndex, query))
    .join('');
}

export function renderRecentPostsHtml(items: SearchItem[], selectedIndex: number): string {
  if (items.length === 0) return renderEmptyResultsHtml();
  return items
    .slice(0, UI_CONFIG.SEARCH_MAX_RESULTS)
    .map((item, i) => renderRow(item, i, selectedIndex, ''))
    .join('');
}

export function renderPreviewHtml(item: SearchItem | null): string {
  if (!item) {
    return '<div class="search-preview-empty">Select an article to preview it</div>';
  }
  const excerpt = item.body.slice(0, PREVIEW_BODY_CHARS);
  const ellipsis = item.body.length > PREVIEW_BODY_CHARS ? '…' : '';
  const tagsHtml =
    item.tags.length > 0
      ? `<section class="search-preview-section">
          <h3 class="search-preview-heading">TAGS</h3>
          <p class="search-preview-tags">${item.tags.map(t => escapeHtml(t)).join(', ')}</p>
        </section>`
      : '';
  return `<article class="search-preview">
    <header class="search-preview-header">
      <h2 class="search-preview-title">${escapeHtml(item.title)}</h2>
      <p class="search-preview-date">${escapeHtml(formatPubDate(item.pubDate))}</p>
    </header>
    <section class="search-preview-section">
      <h3 class="search-preview-heading">DESCRIPTION</h3>
      <p class="search-preview-description">${escapeHtml(item.description)}</p>
    </section>
    <section class="search-preview-section">
      <h3 class="search-preview-heading">EXCERPT</h3>
      <p class="search-preview-excerpt">${escapeHtml(excerpt)}${ellipsis}</p>
    </section>
    ${tagsHtml}
  </article>`;
}

export function renderStatusBarHtml(selectedIndex: number, total: number): string {
  const current = total === 0 ? 0 : selectedIndex + 1;
  return `<span class="search-status-count">${current} / ${total}</span>
    <span class="search-status-hints">
      <kbd>↑↓</kbd> navigate
      <kbd>↵</kbd> open
      <kbd>⎋</kbd> close
    </span>`;
}

export function handleKeyboardNavigation(
  key: string,
  ctrlKey: boolean,
  currentIndex: number,
  resultsCount: number
): number {
  const maxIndex = Math.min(resultsCount - 1, UI_CONFIG.SEARCH_MAX_RESULTS - 1);
  const isDown = key === 'ArrowDown' || (ctrlKey && key === 'j');
  const isUp = key === 'ArrowUp' || (ctrlKey && key === 'k');
  if (isDown) return Math.min(currentIndex + 1, maxIndex);
  if (isUp) return Math.max(currentIndex - 1, 0);
  return currentIndex;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return true;
  if (target.isContentEditable) return true;
  return false;
}

export function isSearchShortcut(event: KeyboardEvent): boolean {
  if ((event.ctrlKey || event.metaKey) && event.key === 'k') return true;
  if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey) {
    return !isEditableTarget(event.target);
  }
  return false;
}
