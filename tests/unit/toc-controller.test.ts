import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  TocStateManager,
  isMobileViewport,
  shouldCollapseOnInit,
  findActiveHeadingId,
  updateTocLinkActiveState,
} from '../../src/utils/toc-controller';

describe('toc-controller', () => {
  describe('TocStateManager', () => {
    beforeEach(() => {
      vi.stubGlobal('localStorage', {
        store: {} as Record<string, string>,
        getItem(key: string) {
          return this.store[key] || null;
        },
        setItem(key: string, value: string) {
          this.store[key] = value;
        },
        clear() {
          this.store = {};
        },
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should return false when no stored state', () => {
      expect(TocStateManager.getCollapsedState()).toBe(false);
    });

    it('should return true when stored state is "true"', () => {
      localStorage.setItem('toc-collapsed', 'true');
      expect(TocStateManager.getCollapsedState()).toBe(true);
    });

    it('should return false when stored state is "false"', () => {
      localStorage.setItem('toc-collapsed', 'false');
      expect(TocStateManager.getCollapsedState()).toBe(false);
    });

    it('should save collapsed state', () => {
      TocStateManager.setCollapsedState(true);
      expect(localStorage.getItem('toc-collapsed')).toBe('true');

      TocStateManager.setCollapsedState(false);
      expect(localStorage.getItem('toc-collapsed')).toBe('false');
    });
  });

  describe('isMobileViewport', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should return true for mobile width', () => {
      vi.stubGlobal('window', { innerWidth: 600 });
      expect(isMobileViewport()).toBe(true);
    });

    it('should return true for exactly 768px', () => {
      vi.stubGlobal('window', { innerWidth: 768 });
      expect(isMobileViewport()).toBe(true);
    });

    it('should return false for desktop width', () => {
      vi.stubGlobal('window', { innerWidth: 1024 });
      expect(isMobileViewport()).toBe(false);
    });
  });

  describe('shouldCollapseOnInit', () => {
    beforeEach(() => {
      vi.stubGlobal('localStorage', {
        store: {} as Record<string, string>,
        getItem(key: string) {
          return this.store[key] || null;
        },
        setItem(key: string, value: string) {
          this.store[key] = value;
        },
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should return true on mobile', () => {
      vi.stubGlobal('window', { innerWidth: 600 });
      expect(shouldCollapseOnInit()).toBe(true);
    });

    it('should return true when previously collapsed', () => {
      vi.stubGlobal('window', { innerWidth: 1024 });
      localStorage.setItem('toc-collapsed', 'true');
      expect(shouldCollapseOnInit()).toBe(true);
    });

    it('should return false on desktop with no stored state', () => {
      vi.stubGlobal('window', { innerWidth: 1024 });
      expect(shouldCollapseOnInit()).toBe(false);
    });
  });

  describe('findActiveHeadingId', () => {
    it('should return empty string for empty headings', () => {
      const headings: Element[] = [];
      expect(findActiveHeadingId(headings)).toBe('');
    });

    it('should return id of heading at or above scroll threshold', () => {
      const mockHeadings = [
        { id: 'heading-1', getBoundingClientRect: () => ({ top: 50 }) },
        { id: 'heading-2', getBoundingClientRect: () => ({ top: 150 }) },
      ] as unknown as Element[];

      expect(findActiveHeadingId(mockHeadings)).toBe('heading-1');
    });

    it('should return last heading id when multiple are above threshold', () => {
      const mockHeadings = [
        { id: 'heading-1', getBoundingClientRect: () => ({ top: -100 }) },
        { id: 'heading-2', getBoundingClientRect: () => ({ top: 50 }) },
        { id: 'heading-3', getBoundingClientRect: () => ({ top: 200 }) },
      ] as unknown as Element[];

      expect(findActiveHeadingId(mockHeadings)).toBe('heading-2');
    });
  });

  describe('updateTocLinkActiveState', () => {
    beforeEach(() => {
      vi.stubGlobal('document', {
        querySelector: vi.fn((selector: string) => {
          if (selector === 'a[href="#heading-1"]') {
            return { classList: { add: vi.fn(), remove: vi.fn() } };
          }
          return null;
        }),
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should remove active class from all links', () => {
      const removeClassSpy = vi.fn();
      const mockLinks = [
        { classList: { remove: removeClassSpy } },
        { classList: { remove: removeClassSpy } },
      ] as unknown as Element[];

      updateTocLinkActiveState(mockLinks, '');

      expect(removeClassSpy).toHaveBeenCalledTimes(2);
      expect(removeClassSpy).toHaveBeenCalledWith('active');
    });

    it('should add active class to matching link', () => {
      const addClassSpy = vi.fn();
      vi.stubGlobal('document', {
        querySelector: vi.fn(() => ({
          classList: { add: addClassSpy },
        })),
      });

      const mockLinks = [{ classList: { remove: vi.fn() } }] as unknown as Element[];

      updateTocLinkActiveState(mockLinks, 'heading-1');

      expect(addClassSpy).toHaveBeenCalledWith('active');
    });
  });
});
