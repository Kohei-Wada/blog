import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logGitHubApiStats } from '@/utils/build-stats';
import GitHubCacheManager from '@/utils/github-cache-manager';

// Mock GitHubCacheManager
vi.mock('@/utils/github-cache-manager', () => {
  return {
    default: {
      getInstance: vi.fn(),
    },
  };
});

describe('build-stats', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('logGitHubApiStats', () => {
    it('should not output logs when no API calls or cache hits', () => {
      vi.mocked(GitHubCacheManager.getInstance).mockReturnValue({
        getStats: () => ({
          fetchCount: 0,
          cacheHits: 0,
          isCached: false,
        }),
      } as unknown as GitHubCacheManager);

      logGitHubApiStats();

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should output statistics when API calls exist', () => {
      vi.mocked(GitHubCacheManager.getInstance).mockReturnValue({
        getStats: () => ({
          fetchCount: 5,
          cacheHits: 3,
          isCached: true,
        }),
      } as unknown as GitHubCacheManager);

      logGitHubApiStats();

      expect(consoleSpy).toHaveBeenCalled();
      const allCalls = consoleSpy.mock.calls.flat().join('\n');
      expect(allCalls).toContain('GitHub API Usage Statistics');
      expect(allCalls).toContain('API calls made: 5');
      expect(allCalls).toContain('Cache hits: 3');
      expect(allCalls).toContain('Cache hit rate: 38%');
      expect(allCalls).toContain('Active');
    });

    it('should output logs when only cache hits exist', () => {
      vi.mocked(GitHubCacheManager.getInstance).mockReturnValue({
        getStats: () => ({
          fetchCount: 0,
          cacheHits: 10,
          isCached: true,
        }),
      } as unknown as GitHubCacheManager);

      logGitHubApiStats();

      expect(consoleSpy).toHaveBeenCalled();
      const allCalls = consoleSpy.mock.calls.flat().join('\n');
      expect(allCalls).toContain('Cache hit rate: 100%');
    });

    it('should display Empty when cache is inactive', () => {
      vi.mocked(GitHubCacheManager.getInstance).mockReturnValue({
        getStats: () => ({
          fetchCount: 2,
          cacheHits: 0,
          isCached: false,
        }),
      } as unknown as GitHubCacheManager);

      logGitHubApiStats();

      const allCalls = consoleSpy.mock.calls.flat().join('\n');
      expect(allCalls).toContain('Empty');
    });

    it('should display saved calls count when both API calls and cache hits exist', () => {
      vi.mocked(GitHubCacheManager.getInstance).mockReturnValue({
        getStats: () => ({
          fetchCount: 3,
          cacheHits: 7,
          isCached: true,
        }),
      } as unknown as GitHubCacheManager);

      logGitHubApiStats();

      const allCalls = consoleSpy.mock.calls.flat().join('\n');
      expect(allCalls).toContain('API calls saved by caching: 7');
    });
  });
});
