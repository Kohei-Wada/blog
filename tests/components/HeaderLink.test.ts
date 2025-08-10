import { describe, it, expect } from 'vitest';

describe('HeaderLink logic', () => {
  it('should extract subpath correctly from pathname', () => {
    const testPaths = [
      { pathname: '/blog/post-title', expected: ['blog', 'post-title'] },
      { pathname: '/tags/javascript', expected: ['tags', 'javascript'] },
      { pathname: '/', expected: null },
      { pathname: '/about', expected: ['about'] },
    ];

    testPaths.forEach(({ pathname, expected }) => {
      const result = pathname.match(/[^/]+/g);
      expect(result).toEqual(expected);
    });
  });

  it('should determine active state correctly', () => {
    const testCases = [
      { href: '/', pathname: '/', expected: true },
      { href: '/blog', pathname: '/blog', expected: true },
      { href: '/blog', pathname: '/blog/post-title', expected: true },
      { href: '/tags', pathname: '/tags/javascript', expected: true },
      { href: '/about', pathname: '/blog', expected: false },
      { href: '/contact', pathname: '/', expected: false },
    ];

    testCases.forEach(({ href, pathname, expected }) => {
      const subpath = pathname.match(/[^/]+/g);
      const isActive = href === pathname || href === '/' + (subpath?.[0] || '');
      expect(isActive).toBe(expected);
    });
  });
});