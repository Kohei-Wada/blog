import { describe, it, expect } from 'vitest';
import { localeFromUrl, siblingUrl, otherLocale } from '../../src/utils/i18n';

describe('i18n utils', () => {
  describe('localeFromUrl', () => {
    it('returns ja for URLs without an /en/ prefix', () => {
      expect(localeFromUrl(new URL('http://x/'))).toBe('ja');
      expect(localeFromUrl(new URL('http://x/blog/foo'))).toBe('ja');
      expect(localeFromUrl(new URL('http://x/tags/'))).toBe('ja');
    });

    it('returns en for URLs that begin with /en/ (or are exactly /en)', () => {
      expect(localeFromUrl(new URL('http://x/en/'))).toBe('en');
      expect(localeFromUrl(new URL('http://x/en/blog/foo'))).toBe('en');
      expect(localeFromUrl(new URL('http://x/en'))).toBe('en');
    });
  });

  describe('otherLocale', () => {
    it('toggles ja <-> en', () => {
      expect(otherLocale('ja')).toBe('en');
      expect(otherLocale('en')).toBe('ja');
    });
  });

  describe('siblingUrl', () => {
    it('adds /en prefix when going from ja to en', () => {
      expect(siblingUrl('/', 'ja', 'en')).toBe('/en/');
      expect(siblingUrl('/blog/taskdog', 'ja', 'en')).toBe('/en/blog/taskdog');
    });

    it('strips /en prefix when going from en to ja', () => {
      expect(siblingUrl('/en/', 'en', 'ja')).toBe('/');
      expect(siblingUrl('/en/blog/taskdog', 'en', 'ja')).toBe('/blog/taskdog');
    });

    it('returns the same path when target locale equals current locale', () => {
      expect(siblingUrl('/blog/foo', 'ja', 'ja')).toBe('/blog/foo');
      expect(siblingUrl('/en/blog/foo', 'en', 'en')).toBe('/en/blog/foo');
    });
  });
});
