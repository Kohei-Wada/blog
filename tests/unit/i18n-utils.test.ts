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
    it('adds /ja prefix when going from en to ja', () => {
      expect(siblingUrl('/', 'en', 'ja')).toBe('/ja/');
      expect(siblingUrl('/blog/taskdog', 'en', 'ja')).toBe('/ja/blog/taskdog');
    });

    it('strips /ja prefix when going from ja to en', () => {
      expect(siblingUrl('/ja/', 'ja', 'en')).toBe('/');
      expect(siblingUrl('/ja/blog/taskdog', 'ja', 'en')).toBe('/blog/taskdog');
    });

    it('returns the same path when target locale equals current locale', () => {
      expect(siblingUrl('/blog/foo', 'en', 'en')).toBe('/blog/foo');
      expect(siblingUrl('/ja/blog/foo', 'ja', 'ja')).toBe('/ja/blog/foo');
    });
  });
});
