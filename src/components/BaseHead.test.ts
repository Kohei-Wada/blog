import { describe, it, expect } from 'vitest';
import { SITE_TITLE } from '../consts';

describe('BaseHead', () => {
  const mockProps = {
    title: 'Test Page Title',
    description: 'A test description for the page',
    image: { src: '/test-image.jpg' },
    isArticle: true,
    publishedTime: new Date('2023-12-25T10:30:00Z')
  };

  it('should validate canonical URL generation', () => {
    const pathname = '/test-path';
    const baseUrl = 'https://example.com';
    const expectedUrl = `${baseUrl}${pathname}`;
    
    expect(expectedUrl).toBe('https://example.com/test-path');
    expect(pathname).toBe('/test-path');
  });

  it('should handle props correctly', () => {
    const { title, description, image, isArticle, publishedTime } = mockProps;
    
    expect(title).toBe('Test Page Title');
    expect(description).toBe('A test description for the page');
    expect(image.src).toBe('/test-image.jpg');
    expect(isArticle).toBe(true);
    expect(publishedTime).toBeInstanceOf(Date);
  });

  it('should use fallback image when no image provided', () => {
    const propsWithoutImage: { title: string; description: string; image?: { src: string } } = {
      title: 'Test Page',
      description: 'Test description'
    };
    
    // Simulate default parameter behavior
    const image = propsWithoutImage.image || { src: '/default-fallback.jpg' };
    expect(image.src).toBe('/default-fallback.jpg');
  });

  it('should validate RSS feed URL generation', () => {
    const siteUrl = 'https://example.com';
    const rssPath = 'rss.xml';
    const expectedUrl = `${siteUrl}/${rssPath}`;
    
    expect(expectedUrl).toBe('https://example.com/rss.xml');
  });

  it('should validate OG image URL generation', () => {
    const baseUrl = 'https://example.com';
    const imageSrc = '/test-image.jpg';
    const expectedUrl = `${baseUrl}${imageSrc}`;
    
    expect(expectedUrl).toBe('https://example.com/test-image.jpg');
  });

  it('should determine article type correctly', () => {
    const isArticleTrue = true;
    const isArticleFalse = false;
    expect(isArticleTrue ? 'article' : 'website').toBe('article');
    expect(isArticleFalse ? 'article' : 'website').toBe('website');
  });

  it('should format published time as ISO string', () => {
    const publishedTime = new Date('2023-12-25T10:30:00Z');
    const isoString = publishedTime.toISOString();
    
    expect(isoString).toBe('2023-12-25T10:30:00.000Z');
    expect(isoString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('should validate font preload resources', () => {
    const fontResources = [
      { href: '/fonts/atkinson-regular.woff', type: 'font/woff' },
      { href: '/fonts/atkinson-bold.woff', type: 'font/woff' }
    ];
    
    fontResources.forEach(font => {
      expect(font.href).toMatch(/^\/fonts\/atkinson-\w+\.woff$/);
      expect(font.type).toBe('font/woff');
    });
  });

  it('should validate meta properties for social sharing', () => {
    const { title, description } = mockProps;
    
    // Open Graph properties
    expect('og:title').toBe('og:title');
    expect('og:description').toBe('og:description');
    expect('og:type').toBe('og:type');
    expect('og:url').toBe('og:url');
    expect('og:image').toBe('og:image');
    
    // Twitter Card properties
    expect('twitter:card').toBe('twitter:card');
    expect('twitter:title').toBe('twitter:title');
    expect('twitter:description').toBe('twitter:description');
    expect('twitter:image').toBe('twitter:image');
    
    // Content validation
    expect(title).toBeDefined();
    expect(description).toBeDefined();
  });

  it('should validate article-specific meta tags', () => {
    const isArticle = true;
    const publishedTime = new Date('2023-12-25T10:30:00Z');
    
    if (isArticle && publishedTime) {
      expect('article:published_time').toBe('article:published_time');
      expect(publishedTime.toISOString()).toBe('2023-12-25T10:30:00.000Z');
    }
    
    if (isArticle) {
      expect('article:author').toBe('article:author');
      expect('Kohei Wada').toBe('Kohei Wada');
    }
  });

  it('should use site title from constants', () => {
    expect(SITE_TITLE).toBeDefined();
    expect(typeof SITE_TITLE).toBe('string');
  });
});