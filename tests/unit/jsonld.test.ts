import { describe, it, expect } from 'vitest';
import {
  generateBlogPostingSchema,
  generateWebSiteSchema,
  generateOrganizationSchema,
  generatePersonSchema,
  combineSchemas,
} from '../../src/utils/jsonld';
import { SITE_TITLE, SOCIAL_LINKS } from '../../src/consts';

const blogPostingProps = {
  title: 'Test Post',
  description: 'Test description',
  url: 'https://wada-dev.com/en/blog/test-post/',
  inLanguage: 'en',
  datePublished: new Date('2026-01-15T00:00:00Z'),
  authorName: 'Kohei Wada',
};

describe('generateBlogPostingSchema', () => {
  it('maps props onto a BlogPosting schema', () => {
    const schema = generateBlogPostingSchema(blogPostingProps);

    expect(schema['@type']).toBe('BlogPosting');
    expect(schema.headline).toBe('Test Post');
    expect(schema.description).toBe('Test description');
    expect(schema.url).toBe('https://wada-dev.com/en/blog/test-post/');
    expect(schema.inLanguage).toBe('en');
    expect(schema.datePublished).toBe('2026-01-15T00:00:00.000Z');
    expect(schema.author).toMatchObject({
      '@type': 'Person',
      name: 'Kohei Wada',
      sameAs: SOCIAL_LINKS,
    });
    expect(schema.publisher).toMatchObject({
      '@type': 'Organization',
      name: SITE_TITLE,
      url: 'https://wada-dev.com',
    });
    expect(schema.mainEntityOfPage['@id']).toBe(blogPostingProps.url);
  });

  it('falls back to datePublished when dateModified is absent', () => {
    const schema = generateBlogPostingSchema(blogPostingProps);
    expect(schema.dateModified).toBe(schema.datePublished);
  });

  it('uses dateModified when provided', () => {
    const schema = generateBlogPostingSchema({
      ...blogPostingProps,
      dateModified: new Date('2026-02-01T00:00:00Z'),
    });
    expect(schema.dateModified).toBe('2026-02-01T00:00:00.000Z');
  });

  it('omits image when none is given', () => {
    const schema = generateBlogPostingSchema(blogPostingProps);
    expect(schema.image).toBeUndefined();
  });

  it('resolves a relative image src against the page url', () => {
    const schema = generateBlogPostingSchema({
      ...blogPostingProps,
      image: { src: '/assets/cover.png', width: 1200, height: 630, format: 'png' },
    });
    expect(schema.image).toEqual({
      '@type': 'ImageObject',
      url: 'https://wada-dev.com/assets/cover.png',
      width: 1200,
      height: 630,
    });
  });
});

describe('generateWebSiteSchema', () => {
  it('maps props onto a WebSite schema with inLanguage', () => {
    const schema = generateWebSiteSchema({
      name: SITE_TITLE,
      description: 'Site description',
      url: 'https://wada-dev.com/',
      inLanguage: 'ja',
    });

    expect(schema).toEqual({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_TITLE,
      description: 'Site description',
      url: 'https://wada-dev.com/',
      inLanguage: 'ja',
    });
  });

  it('does not emit a SearchAction (no /search page exists)', () => {
    const schema = generateWebSiteSchema({
      name: SITE_TITLE,
      description: 'Site description',
      url: 'https://wada-dev.com/',
      inLanguage: 'en',
    });
    expect(schema).not.toHaveProperty('potentialAction');
  });
});

describe('generateOrganizationSchema', () => {
  it('includes logo only when provided', () => {
    const base = { name: SITE_TITLE, url: 'https://wada-dev.com/', sameAs: SOCIAL_LINKS };

    expect(generateOrganizationSchema(base).logo).toBeUndefined();
    expect(
      generateOrganizationSchema({ ...base, logo: 'https://wada-dev.com/logo.png' }).logo
    ).toEqual({
      '@type': 'ImageObject',
      url: 'https://wada-dev.com/logo.png',
    });
  });
});

describe('generatePersonSchema', () => {
  it('includes optional fields only when provided', () => {
    const minimal = generatePersonSchema({ name: 'Kohei Wada' });
    expect(minimal).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Kohei Wada',
    });

    const full = generatePersonSchema({
      name: 'Kohei Wada',
      url: 'https://wada-dev.com/',
      jobTitle: 'Software Engineer',
    });
    expect(full.url).toBe('https://wada-dev.com/');
    expect(full.jobTitle).toBe('Software Engineer');
  });
});

describe('combineSchemas', () => {
  it('wraps schemas in a single @graph and strips per-schema @context', () => {
    const website = generateWebSiteSchema({
      name: SITE_TITLE,
      description: 'Site description',
      url: 'https://wada-dev.com/',
      inLanguage: 'en',
    });
    const person = generatePersonSchema({ name: 'Kohei Wada' });

    const combined = combineSchemas([website, person]) as {
      '@context': string;
      '@graph': Array<Record<string, unknown>>;
    };

    expect(combined['@context']).toBe('https://schema.org');
    expect(combined['@graph']).toHaveLength(2);
    combined['@graph'].forEach(node => {
      expect(node).not.toHaveProperty('@context');
    });
    expect(combined['@graph'][0]['@type']).toBe('WebSite');
    expect(combined['@graph'][1]['@type']).toBe('Person');
  });
});
