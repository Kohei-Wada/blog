import { UI_CONFIG } from '../constants/ui';

// Constants
const STORAGE_KEY = 'toc-collapsed';
const MOBILE_BREAKPOINT = 768;

/**
 * TOC state manager for localStorage operations
 */
export const TocStateManager = {
  /**
   * Get collapsed state from localStorage
   */
  getCollapsedState(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === 'true';
  },

  /**
   * Save collapsed state to localStorage
   */
  setCollapsedState(collapsed: boolean): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, collapsed.toString());
  },
};

/**
 * Check if current viewport is mobile size
 */
export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

/**
 * Determine if TOC should be initially collapsed
 */
export function shouldCollapseOnInit(): boolean {
  return TocStateManager.getCollapsedState() || isMobileViewport();
}

/**
 * Find the currently active heading based on scroll position
 * @param headings - Array of heading elements with id attributes
 * @returns The id of the active heading, or empty string if none
 */
export function findActiveHeadingId(headings: NodeListOf<Element> | Element[]): string {
  let activeId = '';

  for (const heading of headings) {
    const rect = heading.getBoundingClientRect();
    if (rect.top <= UI_CONFIG.SCROLL_THRESHOLD) {
      activeId = heading.id;
    }
  }

  return activeId;
}

/**
 * Update active class on TOC links
 * @param tocLinks - TOC link elements
 * @param activeId - ID of the active heading
 */
export function updateTocLinkActiveState(
  tocLinks: NodeListOf<Element> | Element[],
  activeId: string
): void {
  // Remove active class from all links
  for (const link of tocLinks) {
    link.classList.remove('active');
  }

  // Add active class to current section link
  if (activeId) {
    const activeLink = document.querySelector(`a[href="#${CSS.escape(activeId)}"]`);
    activeLink?.classList.add('active');
  }
}
