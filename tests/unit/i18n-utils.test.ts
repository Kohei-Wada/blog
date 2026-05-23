import { describe, it, expect } from 'vitest';
import { localeFromUrl, siblingUrl, otherLocale } from '../../src/utils/i18n';

describe('i18n utils', () => {
  describe('localeFromUrl', () => {
    it('returns en for URLs without a /ja/ prefix', () => {
      expect(localeFromUrl(new URL('http://x/'))).toBe('en');
      expect(localeFromUrl(new URL('http://x/blog/foo'))).toBe('en');
      expect(localeFromUrl(new URL('http://x/tags/'))).toBe('en');
    });

    it('returns ja for URLs that begin with /ja/ (or are exactly /ja)', () => {
      expect(localeFromUrl(new URL('http://x/ja/'))).toBe('ja');
      expect(localeFromUrl(new URL('http://x/ja/blog/foo'))).toBe('ja');
      expect(localeFromUrl(new URL('http://x/ja'))).toBe('ja');
    });
  });

  describe('otherLocale', () => {
    it('toggles en <-> ja', () => {
      expect(otherLocale('en')).toBe('ja');
      expect(otherLocale('ja')).toBe('en');
    });
  });

  describe('siblingUrl', () => {
    it('swaps the leading locale segment en -> ja', () => {
      expect(siblingUrl('/en/', 'en', 'ja')).toBe('/ja/');
      expect(siblingUrl('/en/blog/taskdog', 'en', 'ja')).toBe('/ja/blog/taskdog');
    });

    it('swaps the leading locale segment ja -> en', () => {
      expect(siblingUrl('/ja/', 'ja', 'en')).toBe('/en/');
      expect(siblingUrl('/ja/blog/taskdog', 'ja', 'en')).toBe('/en/blog/taskdog');
    });

    it('returns the same path when target locale equals current locale', () => {
      expect(siblingUrl('/en/blog/foo', 'en', 'en')).toBe('/en/blog/foo');
      expect(siblingUrl('/ja/blog/foo', 'ja', 'ja')).toBe('/ja/blog/foo');
    });
  });
});
