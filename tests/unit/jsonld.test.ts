import { describe, it, expect } from 'vitest';
import {
  generateBlogPostingSchema,
  generateWebSiteSchema,
  generateOrganizationSchema,
  generatePersonSchema,
  combineSchemas,
} from '@/utils/jsonld';

describe('jsonld', () => {
  describe('generateBlogPostingSchema', () => {
    it('should generate schema with required fields', () => {
      const schema = generateBlogPostingSchema({
        title: 'Test Article',
        description: 'Test description',
        url: 'https://example.com/blog/test-post/',
        datePublished: new Date('2024-01-15'),
        authorName: 'Test Author',
      });

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('BlogPosting');
      expect(schema.headline).toBe('Test Article');
      expect(schema.description).toBe('Test description');
      expect(schema.url).toBe('https://example.com/blog/test-post/');
      expect(schema.datePublished).toBe('2024-01-15T00:00:00.000Z');
      expect(schema.author['@type']).toBe('Person');
      expect(schema.author.name).toBe('Test Author');
    });

    it('should use datePublished for dateModified when not provided', () => {
      const schema = generateBlogPostingSchema({
        title: 'Test Article',
        description: 'Test description',
        url: 'https://example.com/blog/test-post/',
        datePublished: new Date('2024-01-15'),
        authorName: 'Test Author',
      });

      expect(schema.dateModified).toBe('2024-01-15T00:00:00.000Z');
    });

    it('should use provided dateModified when specified', () => {
      const schema = generateBlogPostingSchema({
        title: 'Test Article',
        description: 'Test description',
        url: 'https://example.com/blog/test-post/',
        datePublished: new Date('2024-01-15'),
        dateModified: new Date('2024-02-20'),
        authorName: 'Test Author',
      });

      expect(schema.datePublished).toBe('2024-01-15T00:00:00.000Z');
      expect(schema.dateModified).toBe('2024-02-20T00:00:00.000Z');
    });

    it('should include ImageObject when image is provided', () => {
      const schema = generateBlogPostingSchema({
        title: 'Test Article',
        description: 'Test description',
        url: 'https://example.com/blog/test-post/',
        datePublished: new Date('2024-01-15'),
        authorName: 'Test Author',
        image: {
          src: '/images/hero.jpg',
          width: 1200,
          height: 630,
          format: 'jpg',
        },
      });

      expect(schema.image).toBeDefined();
      expect(schema.image!['@type']).toBe('ImageObject');
      expect(schema.image!.width).toBe(1200);
      expect(schema.image!.height).toBe(630);
    });

    it('should include mainEntityOfPage', () => {
      const schema = generateBlogPostingSchema({
        title: 'Test Article',
        description: 'Test description',
        url: 'https://example.com/blog/test-post/',
        datePublished: new Date('2024-01-15'),
        authorName: 'Test Author',
      });

      expect(schema.mainEntityOfPage['@type']).toBe('WebPage');
      expect(schema.mainEntityOfPage['@id']).toBe('https://example.com/blog/test-post/');
    });
  });

  describe('generateWebSiteSchema', () => {
    it('should generate WebSite schema', () => {
      const schema = generateWebSiteSchema({
        name: 'Test Site',
        description: 'Test site description',
        url: 'https://example.com/',
      });

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('WebSite');
      expect(schema.name).toBe('Test Site');
      expect(schema.description).toBe('Test site description');
      expect(schema.url).toBe('https://example.com/');
    });

    it('should include SearchAction', () => {
      const schema = generateWebSiteSchema({
        name: 'Test Site',
        description: 'Test site description',
        url: 'https://example.com/',
      });

      expect(schema.potentialAction['@type']).toBe('SearchAction');
      expect(schema.potentialAction.target['@type']).toBe('EntryPoint');
      expect(schema.potentialAction.target.urlTemplate).toBe(
        'https://example.com/search?q={search_term_string}'
      );
    });
  });

  describe('generateOrganizationSchema', () => {
    it('should generate basic Organization schema', () => {
      const schema = generateOrganizationSchema({
        name: 'Test Organization',
        url: 'https://example.com/',
        sameAs: ['https://github.com/test', 'https://twitter.com/test'],
      });

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Organization');
      expect(schema.name).toBe('Test Organization');
      expect(schema.url).toBe('https://example.com/');
      expect(schema.sameAs).toEqual(['https://github.com/test', 'https://twitter.com/test']);
    });

    it('should include ImageObject when logo is provided', () => {
      const schema = generateOrganizationSchema({
        name: 'Test Organization',
        url: 'https://example.com/',
        sameAs: [],
        logo: 'https://example.com/logo.png',
      });

      expect(schema.logo).toBeDefined();
      expect(schema.logo!['@type']).toBe('ImageObject');
      expect(schema.logo!.url).toBe('https://example.com/logo.png');
    });

    it('should not include logo when not provided', () => {
      const schema = generateOrganizationSchema({
        name: 'Test Organization',
        url: 'https://example.com/',
        sameAs: [],
      });

      expect(schema.logo).toBeUndefined();
    });
  });

  describe('generatePersonSchema', () => {
    it('should generate Person schema with required fields only', () => {
      const schema = generatePersonSchema({
        name: 'Test Person',
      });

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Person');
      expect(schema.name).toBe('Test Person');
    });

    it('should include optional fields when provided', () => {
      const schema = generatePersonSchema({
        name: 'Test Person',
        url: 'https://example.com/',
        image: 'https://example.com/avatar.jpg',
        sameAs: ['https://github.com/test'],
        jobTitle: 'Software Engineer',
        description: 'Test profile description',
      });

      expect(schema.url).toBe('https://example.com/');
      expect(schema.image).toBe('https://example.com/avatar.jpg');
      expect(schema.sameAs).toEqual(['https://github.com/test']);
      expect(schema.jobTitle).toBe('Software Engineer');
      expect(schema.description).toBe('Test profile description');
    });

    it('should not include optional fields when not provided', () => {
      const schema = generatePersonSchema({
        name: 'Test Person',
        url: 'https://example.com/',
      });

      expect(schema.name).toBe('Test Person');
      expect(schema.url).toBe('https://example.com/');
      expect(schema.image).toBeUndefined();
      expect(schema.sameAs).toBeUndefined();
      expect(schema.jobTitle).toBeUndefined();
      expect(schema.description).toBeUndefined();
    });
  });

  describe('combineSchemas', () => {
    it('should combine multiple schemas with @graph', () => {
      const personSchema = generatePersonSchema({ name: 'Test Person' });
      const webSiteSchema = generateWebSiteSchema({
        name: 'Test Site',
        description: 'Test',
        url: 'https://example.com/',
      });

      const combined = combineSchemas([personSchema, webSiteSchema]) as {
        '@context': string;
        '@graph': Record<string, unknown>[];
      };

      expect(combined['@context']).toBe('https://schema.org');
      expect(Array.isArray(combined['@graph'])).toBe(true);
      expect(combined['@graph']).toHaveLength(2);
    });

    it('should remove @context from each schema', () => {
      const personSchema = generatePersonSchema({ name: 'Test Person' });
      const combined = combineSchemas([personSchema]) as {
        '@context': string;
        '@graph': Record<string, unknown>[];
      };

      // Each schema in @graph should not have @context
      const firstSchema = combined['@graph'][0];
      expect(firstSchema['@context']).toBeUndefined();
      expect(firstSchema['@type']).toBe('Person');
    });

    it('should return empty @graph when given empty array', () => {
      const combined = combineSchemas([]) as {
        '@context': string;
        '@graph': Record<string, unknown>[];
      };

      expect(combined['@context']).toBe('https://schema.org');
      expect(combined['@graph']).toEqual([]);
    });
  });
});
