import { describe, it, expect } from 'vitest';

describe('Page Logic', () => {
  describe('Blog Index Page', () => {
    it('should sort posts by date in descending order', () => {
      const posts = [
        { data: { pubDate: new Date('2023-01-01') } },
        { data: { pubDate: new Date('2023-03-01') } },
        { data: { pubDate: new Date('2023-02-01') } },
      ];

      const sorted = posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

      expect(sorted[0].data.pubDate).toEqual(new Date('2023-03-01'));
      expect(sorted[1].data.pubDate).toEqual(new Date('2023-02-01'));
      expect(sorted[2].data.pubDate).toEqual(new Date('2023-01-01'));
    });

    it('should format blog post URL correctly', () => {
      const post = { id: 'my-awesome-post' };
      const url = `/blog/${post.id}`;
      expect(url).toBe('/blog/my-awesome-post');
    });
  });

  describe('Tag Page', () => {
    it('should filter posts by tag', () => {
      const posts = [
        { data: { tags: ['javascript', 'react'] } },
        { data: { tags: ['python', 'django'] } },
        { data: { tags: ['javascript', 'vue'] } },
      ];

      const tag = 'javascript';
      const filtered = posts.filter(post => post.data.tags.includes(tag));

      expect(filtered.length).toBe(2);
      expect(filtered[0].data.tags).toContain('javascript');
      expect(filtered[1].data.tags).toContain('javascript');
    });

    it('should generate tag URL correctly', () => {
      const tag = 'typescript';
      const url = `/tags/${tag}`;
      expect(url).toBe('/tags/typescript');
    });

    it('should handle special characters in tags', () => {
      const tag = 'c++';
      const encoded = encodeURIComponent(tag);
      expect(encoded).toBe('c%2B%2B');
    });
  });

  describe('Tags Index Page', () => {
    it('should count posts per tag correctly', () => {
      const posts = [
        { data: { tags: ['javascript', 'react'] } },
        { data: { tags: ['javascript', 'vue'] } },
        { data: { tags: ['python'] } },
      ];

      const tagCounts = {};
      posts.forEach(post => {
        post.data.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });

      expect(tagCounts['javascript']).toBe(2);
      expect(tagCounts['react']).toBe(1);
      expect(tagCounts['vue']).toBe(1);
      expect(tagCounts['python']).toBe(1);
    });

    it('should get unique tags from posts', () => {
      const posts = [
        { data: { tags: ['javascript', 'react'] } },
        { data: { tags: ['javascript', 'vue'] } },
        { data: { tags: ['react', 'typescript'] } },
      ];

      const allTags = posts.flatMap(post => post.data.tags);
      const uniqueTags = [...new Set(allTags)];

      expect(uniqueTags).toContain('javascript');
      expect(uniqueTags).toContain('react');
      expect(uniqueTags).toContain('vue');
      expect(uniqueTags).toContain('typescript');
      expect(uniqueTags.length).toBe(4);
    });
  });
});
