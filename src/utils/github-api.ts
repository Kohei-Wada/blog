import type { GitHubEvent, GitHubRepo } from '../types/index.js';
import { GITHUB_API_ENDPOINTS, GITHUB_API_PARAMS } from '../constants/api.js';

// 開発環境用のモックデータ
function getMockData() {
  const mockEvents: GitHubEvent[] = [
    {
      id: 'mock-1',
      type: 'PushEvent',
      repo: { name: 'Kohei-Wada/blog' },
      created_at: new Date().toISOString(),
      payload: {
        commits: [
          {
            message: 'feat: GitHub API無効化設定を追加',
            sha: 'mock-sha-1',
          },
        ],
      },
    },
    {
      id: 'mock-2',
      type: 'PushEvent',
      repo: { name: 'Kohei-Wada/sample-project' },
      created_at: new Date(Date.now() - 86400000).toISOString(),
      payload: {
        commits: [
          {
            message: 'fix: バグ修正とリファクタリング',
            sha: 'mock-sha-2',
          },
        ],
      },
    },
  ];

  const mockRepos: GitHubRepo[] = [
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
}

// GitHub APIからデータ取得
export async function fetchGitHubData() {
  // 開発環境でGitHub APIを無効化
  if (import.meta.env.PUBLIC_DISABLE_GITHUB_API === 'true') {
    console.log('GitHub API disabled in development mode - using mock data');
    return getMockData();
  }

  try {
    // 最近のイベント取得
    const eventsResponse = await globalThis.fetch(
      `${GITHUB_API_ENDPOINTS.EVENTS}?per_page=${GITHUB_API_PARAMS.EVENTS_PER_PAGE}`
    );

    if (!eventsResponse.ok) {
      // レート制限の場合は警告レベルでログ出力
      if (eventsResponse.status === 403) {
        console.warn(`GitHub API rate limit exceeded. Status: ${eventsResponse.status}`);
      } else {
        console.error(`Events API error: ${eventsResponse.status} ${eventsResponse.statusText}`);
      }
      return { events: [], repos: [] };
    }

    const events: GitHubEvent[] = await eventsResponse.json();

    // 最近更新されたリポジトリ取得
    const reposResponse = await globalThis.fetch(
      `${GITHUB_API_ENDPOINTS.REPOS}?sort=${GITHUB_API_PARAMS.REPOS_SORT}&per_page=${GITHUB_API_PARAMS.REPOS_PER_PAGE}`
    );

    if (!reposResponse.ok) {
      // レート制限の場合は警告レベルでログ出力
      if (reposResponse.status === 403) {
        console.warn(`GitHub API rate limit exceeded. Status: ${reposResponse.status}`);
      } else {
        console.error(`Repos API error: ${reposResponse.status} ${reposResponse.statusText}`);
      }
      return { events, repos: [] };
    }

    const repos: GitHubRepo[] = await reposResponse.json();

    return { events, repos };
  } catch (error) {
    // ネットワークエラーやJSONパースエラーなど
    console.warn(
      'GitHub API unavailable:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return { events: [], repos: [] };
  }
}

// 日付フォーマット
export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return '今日';
  if (days === 1) return '昨日';
  if (days < 7) return `${days}日前`;
  if (days < 30) return `${Math.floor(days / 7)}週間前`;
  return `${Math.floor(days / 30)}ヶ月前`;
}
