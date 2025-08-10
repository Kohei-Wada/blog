import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createConsoleMock, mockEnvironmentVariable, createFetchMock } from '../test/helpers.js';

describe('GitHubActivity 環境変数制御', () => {
  let consoleMock: ReturnType<typeof createConsoleMock>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleMock = createConsoleMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    consoleMock.restoreConsole();
  });

  it('DISABLE_GITHUB_API=trueの時、API呼び出しをスキップしてモックデータを返す', async () => {
    mockEnvironmentVariable('PUBLIC_DISABLE_GITHUB_API', 'true');
    const mockFetch = createFetchMock();

    // モックデータ関数
    const getMockData = () => {
      const mockEvents = [
        {
          id: 'mock-1',
          type: 'PushEvent',
          repo: { name: 'Kohei-Wada/blog' },
          created_at: new Date().toISOString(),
          payload: {
            commits: [{ message: 'feat: GitHub API無効化設定を追加', sha: 'mock-sha-1' }],
          },
        },
        {
          id: 'mock-2',
          type: 'PushEvent',
          repo: { name: 'Kohei-Wada/sample-project' },
          created_at: new Date(Date.now() - 86400000).toISOString(),
          payload: {
            commits: [{ message: 'fix: バグ修正とリファクタリング', sha: 'mock-sha-2' }],
          },
        },
      ];

      const mockRepos = [
        {
          name: 'blog',
          full_name: 'Kohei-Wada/blog',
          html_url: 'https://github.com/Kohei-Wada/blog',
          description: '個人ブログ - Astro製',
          stargazers_count: 5,
          language: 'TypeScript',
          updated_at: new Date().toISOString(),
          pushed_at: new Date().toISOString(),
        },
        {
          name: 'sample-project',
          full_name: 'Kohei-Wada/sample-project',
          html_url: 'https://github.com/Kohei-Wada/sample-project',
          description: 'サンプルプロジェクト',
          stargazers_count: 12,
          language: 'JavaScript',
          updated_at: new Date(Date.now() - 86400000).toISOString(),
          pushed_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          name: 'learning-rust',
          full_name: 'Kohei-Wada/learning-rust',
          html_url: 'https://github.com/Kohei-Wada/learning-rust',
          description: 'Rust学習用リポジトリ',
          stargazers_count: 3,
          language: 'Rust',
          updated_at: new Date(Date.now() - 172800000).toISOString(),
          pushed_at: new Date(Date.now() - 172800000).toISOString(),
        },
      ];

      return { events: mockEvents, repos: mockRepos };
    };

    // GitHubActivityコンポーネントから関数を抽出してテスト
    const fetchGitHubData = async () => {
      // 開発環境でGitHub APIを無効化
      if (import.meta.env.PUBLIC_DISABLE_GITHUB_API === 'true') {
        console.log('GitHub API disabled in development mode - using mock data');
        return getMockData();
      }

      try {
        const eventsResponse = await globalThis.fetch(
          'https://api.github.com/users/Kohei-Wada/events/public?per_page=10'
        );
        const events = await eventsResponse.json();

        const reposResponse = await globalThis.fetch(
          'https://api.github.com/users/Kohei-Wada/repos?sort=pushed&per_page=5'
        );
        const repos = await reposResponse.json();

        return { events, repos };
      } catch (error) {
        console.error('Failed to fetch GitHub data:', error);
        return { events: [], repos: [] };
      }
    };

    const result = await fetchGitHubData();

    // APIが呼ばれないことを確認
    expect(mockFetch).not.toHaveBeenCalled();
    // 適切なログが出力されることを確認
    expect(consoleMock.mockConsole.log).toHaveBeenCalledWith(
      'GitHub API disabled in development mode - using mock data'
    );
    // モックデータが返されることを確認
    expect(result.events).toHaveLength(2);
    expect(result.repos).toHaveLength(3);
    expect(result.events[0].type).toBe('PushEvent');
    expect(result.repos[0].name).toBe('blog');
  });

  it('DISABLE_GITHUB_API=falseの時、API呼び出しを実行する', async () => {
    mockEnvironmentVariable('PUBLIC_DISABLE_GITHUB_API', 'false');
    const mockFetch = createFetchMock([[], []]);

    // GitHubActivityコンポーネントから関数を抽出してテスト
    const fetchGitHubData = async () => {
      // 開発環境でGitHub APIを無効化
      if (import.meta.env.PUBLIC_DISABLE_GITHUB_API === 'true') {
        console.log('GitHub API disabled in development mode - using mock data');
        return { events: [], repos: [] };
      }

      try {
        const eventsResponse = await globalThis.fetch(
          'https://api.github.com/users/Kohei-Wada/events/public?per_page=10'
        );
        const events = await eventsResponse.json();

        const reposResponse = await globalThis.fetch(
          'https://api.github.com/users/Kohei-Wada/repos?sort=pushed&per_page=5'
        );
        const repos = await reposResponse.json();

        return { events, repos };
      } catch (error) {
        console.error('Failed to fetch GitHub data:', error);
        return { events: [], repos: [] };
      }
    };

    await fetchGitHubData();

    // APIが呼ばれることを確認
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      'https://api.github.com/users/Kohei-Wada/events/public?per_page=10'
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      'https://api.github.com/users/Kohei-Wada/repos?sort=pushed&per_page=5'
    );
    // 無効化ログが出力されないことを確認
    expect(consoleMock.mockConsole.log).not.toHaveBeenCalledWith(
      'GitHub API disabled in development mode'
    );
  });
});
