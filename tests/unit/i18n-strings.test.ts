import { describe, it, expect } from 'vitest';
import { t, type Locale } from '../../src/i18n/strings';

describe('i18n strings', () => {
  it('returns the requested locale value for a known key', () => {
    expect(t('recentPosts', 'ja')).toBe('最近の記事');
    expect(t('recentPosts', 'en')).toBe('Recent posts');
  });

  it('falls back to ja when the en value is missing', () => {
    expect(t('jaOnlyFixture' as Parameters<typeof t>[0], 'en')).toBe(
      t('jaOnlyFixture' as Parameters<typeof t>[0], 'ja')
    );
  });

  it('exposes the Locale type as the union of supported locales', () => {
    const ja: Locale = 'ja';
    const en: Locale = 'en';
    expect([ja, en]).toEqual(['ja', 'en']);
  });
});
