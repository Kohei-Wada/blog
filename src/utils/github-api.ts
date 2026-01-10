import type { GitHubEvent, GitHubRepo } from '../types/index.js';
import GitHubCacheManager from './github-cache-manager.js';
import { TIME_MS } from '../constants/time.js';

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
      created_at: new Date(Date.now() - TIME_MS.ONE_DAY).toISOString(),
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
      updated_at: new Date(Date.now() - TIME_MS.ONE_DAY).toISOString(),
      pushed_at: new Date(Date.now() - TIME_MS.ONE_DAY).toISOString(),
    },
    {
      name: 'learning-rust',
      full_name: 'Kohei-Wada/learning-rust',
      html_url: 'https://github.com/Kohei-Wada/learning-rust',
      description: 'Rust学習用リポジトリ',
      stargazers_count: 3,
      language: 'Rust',
      updated_at: new Date(Date.now() - TIME_MS.TWO_DAYS).toISOString(),
      pushed_at: new Date(Date.now() - TIME_MS.TWO_DAYS).toISOString(),
    },
  ];

  return { events: mockEvents, repos: mockRepos };
}

// GitHub APIからデータ取得（キャッシュ機能付き）
export async function fetchGitHubData() {
  // 開発環境でGitHub APIを無効化
  if (import.meta.env.PUBLIC_DISABLE_GITHUB_API === 'true') {
    console.log('GitHub API disabled in development mode - using mock data');
    return getMockData();
  }

  // プロダクション環境ではキャッシュマネージャーを使用
  const cacheManager = GitHubCacheManager.getInstance();
  return await cacheManager.getOrFetch();
}

// 日付フォーマット
export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / TIME_MS.ONE_DAY);

  if (days === 0) return '今日';
  if (days === 1) return '昨日';
  if (days < 7) return `${days}日前`;
  if (days < 30) return `${Math.floor(days / 7)}週間前`;
  return `${Math.floor(days / 30)}ヶ月前`;
}
