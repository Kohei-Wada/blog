import type { CollectionEntry } from 'astro:content';

/**
 * Create a mock blog post for testing (CollectionEntry<'blog'>)
 */
export function createMockPost(
  overrides: {
    id?: string;
    title?: string;
    description?: string;
    pubDate?: Date | string;
    tags?: string[];
  } = {}
): CollectionEntry<'blog'> {
  const id = overrides.id ?? 'test-post';
  const pubDate =
    overrides.pubDate instanceof Date
      ? overrides.pubDate
      : new Date(overrides.pubDate ?? '2025-01-01');
  return {
    id,
    body: '',
    collection: 'blog' as const,
    data: {
      title: overrides.title ?? 'Test Post',
      description: overrides.description ?? 'Test description',
      pubDate,
      tags: overrides.tags ?? ['test'],
    },
  } as CollectionEntry<'blog'>;
}

// テスト用の日付生成ヘルパー
export function createTestDate(dateString: string): Date {
  return new Date(dateString);
}

// 日付フォーマットテストヘルパー
export function formatTestDate(date: Date): string {
  return date.toLocaleDateString('en-us', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
