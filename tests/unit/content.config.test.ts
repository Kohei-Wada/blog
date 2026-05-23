import { describe, it, expect } from 'vitest';
import { z } from 'zod';

describe('Content Config Schema', () => {
  // ブログポストのスキーマテスト
  const blogSchema = z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  });

  it('should validate valid blog post frontmatter', () => {
    const validFrontmatter = {
      title: 'Test Blog Post',
      description: 'A test blog post description',
      pubDate: '2023-12-25',
      tags: ['test', 'blog'],
    };

    const result = blogSchema.safeParse(validFrontmatter);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.title).toBe('Test Blog Post');
      expect(result.data.pubDate).toBeInstanceOf(Date);
      expect(result.data.tags).toEqual(['test', 'blog']);
    }
  });

  it('should fail validation for missing required fields', () => {
    const invalidFrontmatter = {
      title: 'Test Blog Post',
      // description is missing
      pubDate: '2023-12-25',
    };

    const result = blogSchema.safeParse(invalidFrontmatter);
    expect(result.success).toBe(false);
  });

  it('should provide default empty array for tags if not provided', () => {
    const frontmatterWithoutTags = {
      title: 'Test Blog Post',
      description: 'A test blog post description',
      pubDate: '2023-12-25',
    };

    const result = blogSchema.safeParse(frontmatterWithoutTags);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.tags).toEqual([]);
    }
  });

  it('should coerce string dates to Date objects', () => {
    const frontmatter = {
      title: 'Test Blog Post',
      description: 'A test blog post description',
      pubDate: '2023-12-25T10:30:00Z',
    };

    const result = blogSchema.safeParse(frontmatter);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.pubDate).toBeInstanceOf(Date);
    }
  });
});
