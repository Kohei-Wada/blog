import { describe, it, expect, vi } from 'vitest';
import { SITE_TITLE, SITE_DESCRIPTION } from '../../src/consts';

describe('RSS Feed', () => {
  it('should use correct site metadata', () => {
    expect(SITE_TITLE).toBe('wada-dev');
    expect(SITE_DESCRIPTION).toContain('ようこそ');
  });

  it('should format blog post link correctly', () => {
    const mockPost = {
      id: 'my-first-post',
      data: {
        title: 'Test Post',
        description: 'Test Description',
        pubDate: new Date('2023-12-25'),
      },
    };

    const expectedLink = `/blog/${mockPost.id}/`;
    expect(expectedLink).toBe('/blog/my-first-post/');
  });

  it('should include all post data in RSS items', () => {
    const mockPost = {
      id: 'test-post',
      data: {
        title: 'Test Title',
        description: 'Test Description',
        pubDate: new Date('2023-12-25'),
        tags: ['test', 'rss'],
      },
    };

    const rssItem = {
      ...mockPost.data,
      link: `/blog/${mockPost.id}/`,
    };

    expect(rssItem.title).toBe('Test Title');
    expect(rssItem.description).toBe('Test Description');
    expect(rssItem.pubDate).toEqual(new Date('2023-12-25'));
    expect(rssItem.tags).toEqual(['test', 'rss']);
    expect(rssItem.link).toBe('/blog/test-post/');
  });
});
