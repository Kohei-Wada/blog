import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import GitHubCacheManager from '../../src/utils/github-cache-manager.js';

// Mock data for testing
const mockGitHubData = {
  events: [
    {
      id: 'test-event-1',
      type: 'PushEvent',
      repo: { name: 'test/repo' },
      created_at: '2023-01-01T00:00:00Z',
      payload: {
        commits: [
          {
            message: 'test commit',
            sha: 'abc123',
          },
        ],
      },
    },
  ],
  repos: [
    {
      name: 'test-repo',
      full_name: 'test/test-repo',
      html_url: 'https://github.com/test/test-repo',
      description: 'Test repository',
      stargazers_count: 10,
      language: 'TypeScript',
      updated_at: '2023-01-01T00:00:00Z',
      pushed_at: '2023-01-01T00:00:00Z',
    },
  ],
};

// Mock globalThis.fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('GitHubCacheManager', () => {
  beforeEach(() => {
    // Clear cache before each test
    GitHubCacheManager.getInstance().clearCache();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = GitHubCacheManager.getInstance();
      const instance2 = GitHubCacheManager.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(GitHubCacheManager);
    });

    it('should return the same instance across multiple calls', () => {
      const instances = Array.from({ length: 5 }, () => GitHubCacheManager.getInstance());

      instances.forEach(instance => {
        expect(instance).toBe(instances[0]);
      });
    });
  });

  describe('API calls and caching', () => {
    it('should make API call on first request and cache the result', async () => {
      // Mock API responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGitHubData.events,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGitHubData.repos,
        });

      const manager = GitHubCacheManager.getInstance();
      const result = await manager.getOrFetch();

      expect(result).toEqual(mockGitHubData);
      expect(mockFetch).toHaveBeenCalledTimes(2); // events + repos

      // Verify cache statistics
      const stats = manager.getStats();
      expect(stats.fetchCount).toBe(1);
      expect(stats.cacheHits).toBe(0);
      expect(stats.isCached).toBe(true);
    });

    it('should return cached result on subsequent calls', async () => {
      // Mock API responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGitHubData.events,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGitHubData.repos,
        });

      const manager = GitHubCacheManager.getInstance();

      // First call
      const result1 = await manager.getOrFetch();
      expect(result1).toEqual(mockGitHubData);

      // Second call (from cache)
      const result2 = await manager.getOrFetch();
      expect(result2).toEqual(mockGitHubData);
      expect(result2).toBe(result1); // Same object reference

      // API should only be called once
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Verify cache statistics
      const stats = manager.getStats();
      expect(stats.fetchCount).toBe(1);
      expect(stats.cacheHits).toBe(1);
    });

    it('should only make one API call for multiple concurrent requests', async () => {
      // Mock API responses with delay
      let callCount = 0;
      mockFetch.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        callCount++;
        return {
          ok: true,
          json: async () => (callCount === 1 ? mockGitHubData.events : mockGitHubData.repos),
        };
      });

      const manager = GitHubCacheManager.getInstance();

      // Multiple concurrent calls
      const promises = Array.from({ length: 5 }, () => manager.getOrFetch());
      const results = await Promise.all(promises);

      // All should return the same result
      results.forEach(result => {
        expect(result).toEqual(mockGitHubData);
      });

      // API should only be called twice (events + repos)
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Verify cache statistics: first call is fetch, others would be cache hits
      // However, for concurrent calls, all wait for the same Promise, so cacheHits is 0
      const stats = manager.getStats();
      expect(stats.fetchCount).toBe(1);
      expect(stats.cacheHits).toBe(0); // No cache hits for concurrent calls
    });
  });

  describe('Error handling', () => {
    it('should return empty arrays when events API fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });
      // repos API won't be called due to events API error

      const manager = GitHubCacheManager.getInstance();
      const result = await manager.getOrFetch();

      expect(result).toEqual({
        events: [],
        repos: [],
      });
    });

    it('should return events data when repos API fails', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGitHubData.events,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          statusText: 'Forbidden',
        });

      const manager = GitHubCacheManager.getInstance();
      const result = await manager.getOrFetch();

      expect(result).toEqual({
        events: mockGitHubData.events,
        repos: [],
      });
    });

    it('should return empty data on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const manager = GitHubCacheManager.getInstance();
      const result = await manager.getOrFetch();

      expect(result).toEqual({
        events: [],
        repos: [],
      });
    });

    it('should retry after fetch error when cache is cleared', async () => {
      const manager = GitHubCacheManager.getInstance();

      // First call fails
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result1 = await manager.getOrFetch();
      expect(result1).toEqual({ events: [], repos: [] });

      // Clear cache before retry
      manager.clearCache();

      // Second call succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGitHubData.events,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGitHubData.repos,
        });

      const result2 = await manager.getOrFetch();
      expect(result2).toEqual(mockGitHubData);
    });
  });

  describe('Statistics', () => {
    it('should have zero statistics initially', () => {
      const manager = GitHubCacheManager.getInstance();
      const stats = manager.getStats();

      expect(stats).toEqual({
        fetchCount: 0,
        cacheHits: 0,
        isCached: false,
      });
    });

    it('should update statistics after API call', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGitHubData.events,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGitHubData.repos,
        });

      const manager = GitHubCacheManager.getInstance();
      await manager.getOrFetch();

      const stats = manager.getStats();
      expect(stats.fetchCount).toBe(1);
      expect(stats.isCached).toBe(true);
    });

    it('should accurately count cache hits', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGitHubData.events,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGitHubData.repos,
        });

      const manager = GitHubCacheManager.getInstance();

      // First call
      await manager.getOrFetch();

      // Cached calls
      await manager.getOrFetch();
      await manager.getOrFetch();

      const stats = manager.getStats();
      expect(stats.fetchCount).toBe(1);
      expect(stats.cacheHits).toBe(2);
    });
  });

  describe('Cache clearing', () => {
    it('should reset cache and statistics when clearCache is called', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGitHubData.events,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGitHubData.repos,
        });

      const manager = GitHubCacheManager.getInstance();

      // Create cache
      await manager.getOrFetch();
      expect(manager.getStats().isCached).toBe(true);

      // Clear cache
      manager.clearCache();

      const stats = manager.getStats();
      expect(stats).toEqual({
        fetchCount: 0,
        cacheHits: 0,
        isCached: false,
      });
    });

    it('should make API call again after clearCache', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGitHubData.events,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGitHubData.repos,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGitHubData.events,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGitHubData.repos,
        });

      const manager = GitHubCacheManager.getInstance();

      // First API call
      await manager.getOrFetch();
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Clear cache
      manager.clearCache();

      // Second API call
      await manager.getOrFetch();
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });
});
