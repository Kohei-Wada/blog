import { describe, it, expect } from 'vitest';
import { SITE_TITLE, SITE_DESCRIPTION, GITHUB_URL, GOOGLE_FORMS_URL } from './consts';

describe('consts', () => {
  it('should export correct site title', () => {
    expect(SITE_TITLE).toBe('Kohei Wada');
    expect(typeof SITE_TITLE).toBe('string');
  });

  it('should export valid site description', () => {
    expect(SITE_DESCRIPTION).toContain('ようこそ');
    expect(typeof SITE_DESCRIPTION).toBe('string');
    expect(SITE_DESCRIPTION.length).toBeGreaterThan(0);
  });

  it('should export valid GitHub URL', () => {
    expect(GITHUB_URL).toBe('https://github.com/Kohei-Wada');
    expect(GITHUB_URL).toMatch(/^https:\/\/github\.com\/[\w-]+$/);
  });

  it('should export valid Google Forms URL', () => {
    expect(GOOGLE_FORMS_URL).toContain('docs.google.com/forms');
    expect(GOOGLE_FORMS_URL).toMatch(/^https:\/\/docs\.google\.com\/forms/);
  });

  it('should have all constants as strings', () => {
    expect(typeof SITE_TITLE).toBe('string');
    expect(typeof SITE_DESCRIPTION).toBe('string');
    expect(typeof GITHUB_URL).toBe('string');
    expect(typeof GOOGLE_FORMS_URL).toBe('string');
  });
});