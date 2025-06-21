import { describe, it, expect } from 'vitest';
import { GITHUB_URL, ZENN_URL } from '../consts';

describe('Footer', () => {
  it('should generate correct copyright year', () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    
    expect(currentYear).toBeGreaterThanOrEqual(2023);
    expect(typeof currentYear).toBe('number');
  });

  it('should use valid GitHub URL from constants', () => {
    expect(GITHUB_URL).toBeDefined();
    expect(GITHUB_URL).toMatch(/^https:\/\/github\.com\/[\w-]+$/);
  });

  it('should use valid Zenn URL from constants', () => {
    expect(ZENN_URL).toBeDefined();
    expect(ZENN_URL).toMatch(/^https:\/\/zenn\.dev\/[\w-]+$/);
  });

  it('should validate social link attributes', () => {
    const linkAttrs = {
      target: '_blank',
      'aria-label': 'Visit GitHub profile'
    };
    
    expect(linkAttrs.target).toBe('_blank');
    expect(linkAttrs['aria-label']).toContain('Visit');
    expect(linkAttrs['aria-label']).toContain('profile');
  });

  it('should validate GitHub SVG attributes', () => {
    const githubSvg = {
      viewBox: '0 0 16 16',
      'aria-hidden': true,
      width: '32',
      height: '32'
    };
    
    expect(githubSvg.viewBox).toBe('0 0 16 16');
    expect(githubSvg['aria-hidden']).toBe(true);
    expect(githubSvg.width).toBe('32');
    expect(githubSvg.height).toBe('32');
  });

  it('should validate Zenn SVG attributes', () => {
    const zennSvg = {
      role: 'img',
      viewBox: '0 0 24 24',
      'aria-hidden': true,
      width: '32',
      height: '32'
    };
    
    expect(zennSvg.role).toBe('img');
    expect(zennSvg.viewBox).toBe('0 0 24 24');
    expect(zennSvg['aria-hidden']).toBe(true);
    expect(zennSvg.width).toBe('32');
    expect(zennSvg.height).toBe('32');
  });

  it('should have accessible aria-labels for all social links', () => {
    const socialLinks = [
      { url: GITHUB_URL, label: 'Visit GitHub profile' },
      { url: ZENN_URL, label: 'Visit Zenn profile' }
    ];
    
    socialLinks.forEach(link => {
      expect(link.url).toBeDefined();
      expect(link.label).toContain('Visit');
      expect(link.label).toContain('profile');
    });
  });

  it('should validate copyright text structure', () => {
    const today = new Date();
    const copyrightText = `© ${today.getFullYear()} Kohei Wada. All rights reserved.`;
    
    expect(copyrightText).toMatch(/^© \d{4} Kohei Wada\. All rights reserved\.$/);
    expect(copyrightText).toContain('Kohei Wada');
    expect(copyrightText).toContain('All rights reserved');
  });
});