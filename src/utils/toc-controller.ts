import { UI_CONFIG } from '../constants/ui';

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
