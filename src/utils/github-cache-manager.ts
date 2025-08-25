import type { GitHubEvent, GitHubRepo } from '../types/index.js';
import { GITHUB_API_ENDPOINTS, GITHUB_API_PARAMS } from '../constants/api.js';

export interface GitHubData {
  events: GitHubEvent[];
  repos: GitHubRepo[];
}

/**
 * GitHubデータのキャッシュ管理を行うシングルトンクラス
 * ビルド時に複数のページで同じデータが必要な場合、1回のAPI呼び出しで全体をまかなう
 */
class GitHubCacheManager {
  private static instance: GitHubCacheManager | null = null;
  private cachedData: GitHubData | null = null;
  private fetchPromise: Promise<GitHubData> | null = null;
  private fetchCount = 0;
  private cacheHits = 0;

  private constructor() {}

  /**
   * シングルトンインスタンスを取得
   */
  static getInstance(): GitHubCacheManager {
    if (!GitHubCacheManager.instance) {
      GitHubCacheManager.instance = new GitHubCacheManager();
    }
    return GitHubCacheManager.instance;
  }

  /**
   * キャッシュからデータを取得、なければAPIから取得
   * 複数の同時呼び出しでも1回のAPI呼び出しに集約される
   */
  async getOrFetch(): Promise<GitHubData> {
    // キャッシュがある場合は即座に返す
    if (this.cachedData) {
      this.cacheHits++;
      console.log(`📦 GitHub API cache hit (${this.cacheHits})`);
      return this.cachedData;
    }

    // 既にfetch中の場合は同じPromiseを返す（重複API呼び出し防止）
    if (this.fetchPromise) {
      console.log('⏳ GitHub API fetch in progress, waiting...');
      return this.fetchPromise;
    }

    // 初回API呼び出し
    console.log('🌐 GitHub API first fetch - will be cached for subsequent requests');
    this.fetchPromise = this.fetchFromAPI();

    try {
      this.cachedData = await this.fetchPromise;
      this.fetchCount++;
      console.log(`✅ GitHub API fetched and cached (fetch #${this.fetchCount})`);
      return this.cachedData;
    } catch (error) {
      // エラーの場合はPromiseをリセットして次回再試行可能にする
      this.fetchPromise = null;
      throw error;
    }
  }

  /**
   * GitHub APIから実際にデータを取得
   */
  private async fetchFromAPI(): Promise<GitHubData> {
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

  /**
   * キャッシュ統計を取得（デバッグ用）
   */
  getStats() {
    return {
      fetchCount: this.fetchCount,
      cacheHits: this.cacheHits,
      isCached: this.cachedData !== null,
    };
  }

  /**
   * キャッシュをクリア（テスト用）
   */
  clearCache() {
    this.cachedData = null;
    this.fetchPromise = null;
    this.fetchCount = 0;
    this.cacheHits = 0;
  }
}

export default GitHubCacheManager;
