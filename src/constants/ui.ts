// UI-related constants
export const UI_CONFIG = {
  // Scroll detection threshold (pixels)
  SCROLL_THRESHOLD: 100,

  // Search modal settings
  SEARCH_MAX_RESULTS: 10,
  SEARCH_DEBOUNCE_MS: 200,
} as const;

// Archive year range validation
export const ARCHIVE_YEAR_RANGE = {
  MIN: 1900,
  MAX: 2100,
} as const;

export type UiConfig = typeof UI_CONFIG;
export type ArchiveYearRange = typeof ARCHIVE_YEAR_RANGE;
