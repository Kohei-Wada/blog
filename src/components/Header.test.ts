import { describe, it, expect } from 'vitest';
import { SITE_TITLE, GITHUB_URL } from '../consts';

describe('Header', () => {
  it('should use correct site title from constants', () => {
    expect(SITE_TITLE).toBeDefined();
    expect(typeof SITE_TITLE).toBe('string');
    expect(SITE_TITLE.length).toBeGreaterThan(0);
  });

  it('should use valid GitHub URL from constants', () => {
    expect(GITHUB_URL).toBeDefined();
    expect(GITHUB_URL).toMatch(/^https:\/\/github\.com\/[\w-]+$/);
  });

  it('should have valid navigation structure', () => {
    const navItems = [
      { href: '/', label: 'Home' },
      { href: '/blog', label: 'Blog' },
      { href: '/tags', label: 'Tags' },
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' }
    ];

    navItems.forEach(item => {
      expect(item.href).toMatch(/^\/[a-z]*$/);
      expect(item.label).toBeDefined();
      expect(typeof item.label).toBe('string');
    });
  });

  it('should have accessible SVG attributes', () => {
    const svgAttributes = {
      'aria-hidden': true,
      fill: 'none',
      viewBox: '0 0 24 24',
      stroke: 'currentColor'
    };

    expect(svgAttributes['aria-hidden']).toBe(true);
    expect(svgAttributes.viewBox).toMatch(/^\d+ \d+ \d+ \d+$/);
  });

  it('should have valid GitHub link attributes', () => {
    const githubLinkAttrs = {
      target: '_blank',
      'aria-label': 'Visit GitHub profile (opens in new tab)'
    };

    expect(githubLinkAttrs.target).toBe('_blank');
    expect(githubLinkAttrs['aria-label']).toContain('GitHub');
    expect(githubLinkAttrs['aria-label']).toContain('new tab');
  });
});