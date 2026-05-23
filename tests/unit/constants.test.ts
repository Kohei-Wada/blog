import { describe, it, expect } from 'vitest';
import { UI_CONFIG, ARCHIVE_YEAR_RANGE } from '../../src/constants/ui';

describe('constants/ui', () => {
  describe('UI_CONFIG', () => {
    it('SCROLL_THRESHOLD should be a positive number', () => {
      expect(UI_CONFIG.SCROLL_THRESHOLD).toBe(100);
      expect(UI_CONFIG.SCROLL_THRESHOLD).toBeGreaterThan(0);
    });

    it('SEARCH_MAX_RESULTS should be a positive number', () => {
      expect(UI_CONFIG.SEARCH_MAX_RESULTS).toBe(10);
      expect(UI_CONFIG.SEARCH_MAX_RESULTS).toBeGreaterThan(0);
    });

    it('SEARCH_DEBOUNCE_MS should be a positive number', () => {
      expect(UI_CONFIG.SEARCH_DEBOUNCE_MS).toBe(200);
      expect(UI_CONFIG.SEARCH_DEBOUNCE_MS).toBeGreaterThan(0);
    });
  });

  describe('ARCHIVE_YEAR_RANGE', () => {
    it('should have valid min/max values', () => {
      expect(ARCHIVE_YEAR_RANGE.MIN).toBe(1900);
      expect(ARCHIVE_YEAR_RANGE.MAX).toBe(2100);
    });

    it('MIN should be less than MAX', () => {
      expect(ARCHIVE_YEAR_RANGE.MIN).toBeLessThan(ARCHIVE_YEAR_RANGE.MAX);
    });

    it('should cover reasonable year range', () => {
      const currentYear = new Date().getFullYear();
      expect(ARCHIVE_YEAR_RANGE.MIN).toBeLessThan(currentYear);
      expect(ARCHIVE_YEAR_RANGE.MAX).toBeGreaterThan(currentYear);
    });
  });
});
