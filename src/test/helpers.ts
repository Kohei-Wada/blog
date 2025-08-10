import { vi } from 'vitest';

type TestPost = {
  id: string;
  data: {
    title: string;
    pubDate: Date;
    tags: string[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type MockResponse = {
  _meta?: Record<string, unknown>;
  [key: string]: unknown;
};

// テスト用の日付生成ヘルパー
export function createTestDate(dateString: string): Date {
  return new Date(dateString);
}

// テスト用の投稿データ生成ヘルパー
export function createTestPost(overrides: Partial<TestPost> = {}): TestPost {
  const defaultData = {
    title: 'Test Post',
    pubDate: new Date('2023-01-01'),
    tags: ['test'],
  };

  return {
    id: 'test-post',
    data: {
      ...defaultData,
      ...overrides.data,
    },
    ...overrides,
  };
}

// テスト用の投稿配列生成ヘルパー
export function createTestPosts(count: number = 3) {
  return Array.from({ length: count }, (_, i) =>
    createTestPost({
      id: `test-post-${i + 1}`,
      data: {
        title: `Test Post ${i + 1}`,
        pubDate: new Date(`2023-0${i + 1}-01`),
        tags: ['test', `tag${i + 1}`],
      },
    })
  );
}

// URL エンコーディングテストヘルパー
export function testUrlEncoding(input: string): string {
  return encodeURIComponent(input);
}

// 日付フォーマットテストヘルパー
export function formatTestDate(date: Date): string {
  return date.toLocaleDateString('en-us', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// コンソールモックヘルパー
export function createConsoleMock() {
  const originalConsole = globalThis.console;

  const mockConsole = {
    ...console,
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  globalThis.console = mockConsole;

  return {
    mockConsole,
    restoreConsole: () => {
      globalThis.console = originalConsole;
    },
  };
}

// 環境変数モックヘルパー
export function mockEnvironmentVariable(key: string, value: string) {
  vi.stubGlobal('import', {
    meta: {
      env: {
        [key]: value,
      },
    },
  });
}

// fetchモックヘルパー
export function createFetchMock(responses: MockResponse[] = []) {
  const mockFetch = vi.fn();

  responses.forEach(response => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(response),
      status: 200,
      statusText: 'OK',
      ...response._meta, // レスポンスのメタデータをオーバーライド可能
    });
  });

  vi.stubGlobal('fetch', mockFetch);

  return mockFetch;
}

// ソートヘルパー（投稿の日付順）
export function sortPostsByDate(posts: TestPost[], descending: boolean = true) {
  return posts.sort((a, b) => {
    const aDate = a.data.pubDate.valueOf();
    const bDate = b.data.pubDate.valueOf();
    return descending ? bDate - aDate : aDate - bDate;
  });
}

// タグフィルターヘルパー
export function filterPostsByTag(posts: TestPost[], tag: string) {
  return posts.filter(post => post.data.tags.includes(tag));
}

// タグ集計ヘルパー
export function countTagsFromPosts(posts: TestPost[]): Record<string, number> {
  const tagCounts: Record<string, number> = {};

  posts.forEach(post => {
    post.data.tags.forEach((tag: string) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  return tagCounts;
}

// ユニークタグ取得ヘルパー
export function getUniqueTagsFromPosts(posts: TestPost[]): string[] {
  const allTags = posts.flatMap(post => post.data.tags);
  return [...new Set(allTags)];
}
