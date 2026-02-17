import type { GitHubEvent, GitHubRepo } from '../schemas/github';
import { GITHUB_API_ENDPOINTS, GITHUB_API_PARAMS } from '../constants/api';
import { getErrorMessage } from './error-utils';
import { parseGitHubEvents, parseGitHubRepos } from '../schemas/github';

export interface GitHubData {
  events: GitHubEvent[];
  repos: GitHubRepo[];
}

/**
 * Singleton class for managing GitHub data cache
 * When multiple pages need the same data during build, serves all requests with a single API call
 */
class GitHubCacheManager {
  private static instance: GitHubCacheManager | null = null;
  private cachedData: GitHubData | null = null;
  private fetchPromise: Promise<GitHubData> | null = null;
  private fetchCount = 0;
  private cacheHits = 0;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): GitHubCacheManager {
    if (!GitHubCacheManager.instance) {
      GitHubCacheManager.instance = new GitHubCacheManager();
    }
    return GitHubCacheManager.instance;
  }

  /**
   * Get data from cache, or fetch from API if not cached
   * Multiple concurrent calls are consolidated into a single API request
   */
  async getOrFetch(): Promise<GitHubData> {
    // Return immediately if data is cached
    if (this.cachedData) {
      this.cacheHits++;
      if (process.env.NODE_ENV !== 'production') {
        console.log(`📦 GitHub API cache hit (${this.cacheHits})`);
      }
      return this.cachedData;
    }

    // Return the same Promise if already fetching (prevents duplicate API calls)
    if (this.fetchPromise) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('⏳ GitHub API fetch in progress, waiting...');
      }
      return this.fetchPromise;
    }

    // First API call
    if (process.env.NODE_ENV !== 'production') {
      console.log('🌐 GitHub API first fetch - will be cached for subsequent requests');
    }
    this.fetchPromise = this.fetchFromAPI();

    try {
      this.cachedData = await this.fetchPromise;
      this.fetchCount++;
      if (process.env.NODE_ENV !== 'production') {
        console.log(`✅ GitHub API fetched and cached (fetch #${this.fetchCount})`);
      }
      return this.cachedData;
    } catch (error: unknown) {
      // Reset Promise on error to allow retry on next call
      this.fetchPromise = null;
      throw error;
    }
  }

  /**
   * Actually fetch data from GitHub API
   */
  private async fetchFromAPI(): Promise<GitHubData> {
    try {
      // Fetch recent events
      const eventsResponse = await globalThis.fetch(
        `${GITHUB_API_ENDPOINTS.EVENTS}?per_page=${GITHUB_API_PARAMS.EVENTS_PER_PAGE}`
      );

      if (!eventsResponse.ok) {
        // Log warning for rate limiting
        if (eventsResponse.status === 403) {
          console.warn('GitHub API rate limit exceeded');
        } else {
          console.error(`Events API error: HTTP ${eventsResponse.status}`);
        }
        return { events: [], repos: [] };
      }

      const eventsData: unknown = await eventsResponse.json();
      const events: GitHubEvent[] = parseGitHubEvents(eventsData);

      // Fetch recently updated repositories
      const reposResponse = await globalThis.fetch(
        `${GITHUB_API_ENDPOINTS.REPOS}?sort=${GITHUB_API_PARAMS.REPOS_SORT}&per_page=${GITHUB_API_PARAMS.REPOS_PER_PAGE}`
      );

      if (!reposResponse.ok) {
        // Log warning for rate limiting
        if (reposResponse.status === 403) {
          console.warn('GitHub API rate limit exceeded');
        } else {
          console.error(`Repos API error: HTTP ${reposResponse.status}`);
        }
        return { events, repos: [] };
      }

      const reposData: unknown = await reposResponse.json();
      const repos: GitHubRepo[] = parseGitHubRepos(reposData);

      return { events, repos };
    } catch (error: unknown) {
      // Network errors, JSON parse errors, etc.
      console.warn('GitHub API unavailable:', getErrorMessage(error));
      return { events: [], repos: [] };
    }
  }

  /**
   * Get cache statistics (for debugging)
   */
  getStats() {
    return {
      fetchCount: this.fetchCount,
      cacheHits: this.cacheHits,
      isCached: this.cachedData !== null,
    };
  }

  /**
   * Clear cache (for testing)
   */
  clearCache() {
    this.cachedData = null;
    this.fetchPromise = null;
    this.fetchCount = 0;
    this.cacheHits = 0;
  }
}

export default GitHubCacheManager;
