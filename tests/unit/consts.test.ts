import { describe, it, expect } from 'vitest';
import { SITE_TITLE, GITHUB_URL, ZENN_URL } from '../../src/consts';
import { t } from '../../src/i18n/strings';

describe('consts', () => {
  it('should export correct site title', () => {
    expect(SITE_TITLE).toBe('wada-dev');
    expect(typeof SITE_TITLE).toBe('string');
  });

  it('should resolve locale-aware site description', () => {
    expect(t('siteDescription', 'ja')).toContain('ようこそ');
    expect(t('siteDescription', 'en')).toMatch(/[A-Za-z]/);
    expect(t('siteDescription', 'en')).not.toContain('ようこそ');
  });

  it('should export valid GitHub URL', () => {
    expect(GITHUB_URL).toBe('https://github.com/Kohei-Wada');
    expect(GITHUB_URL).toMatch(/^https:\/\/github\.com\/[\w-]+$/);
  });

  it('should export valid Zenn URL', () => {
    expect(ZENN_URL).toBe('https://zenn.dev/koheiwada');
    expect(ZENN_URL).toMatch(/^https:\/\/zenn\.dev\/[\w]+$/);
  });

  it('should have all constants as strings', () => {
    expect(typeof SITE_TITLE).toBe('string');
    expect(typeof GITHUB_URL).toBe('string');
    expect(typeof ZENN_URL).toBe('string');
  });
});
