import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { findActiveHeadingId, updateTocLinkActiveState } from '../../src/utils/toc-controller';

describe('toc-controller', () => {
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
