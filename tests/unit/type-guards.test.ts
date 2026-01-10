import { describe, it, expect } from 'vitest';
import { hasGitHubStats, isGitHubStatsLogged } from '@/utils/type-guards';

describe('type-guards', () => {
  describe('hasGitHubStats', () => {
    it('should return false when _githubStatsLogged is not present', () => {
      const obj = {} as typeof globalThis;
      expect(hasGitHubStats(obj)).toBe(false);
    });

    it('should return true when _githubStatsLogged is present', () => {
      const obj = { _githubStatsLogged: true } as typeof globalThis;
      expect(hasGitHubStats(obj)).toBe(true);
    });

    it('should return true when _githubStatsLogged is false', () => {
      const obj = { _githubStatsLogged: false } as typeof globalThis;
      expect(hasGitHubStats(obj)).toBe(true);
    });

    it('should work as a type guard', () => {
      const obj = { _githubStatsLogged: true } as typeof globalThis;
      if (hasGitHubStats(obj)) {
        // TypeScript should recognize _githubStatsLogged exists
        expect(obj._githubStatsLogged).toBe(true);
      }
    });
  });

  describe('isGitHubStatsLogged', () => {
    it('should return false when _githubStatsLogged is not present', () => {
      const obj = {} as typeof globalThis;
      expect(isGitHubStatsLogged(obj)).toBe(false);
    });

    it('should return false when _githubStatsLogged is false', () => {
      const obj = { _githubStatsLogged: false } as typeof globalThis;
      expect(isGitHubStatsLogged(obj)).toBe(false);
    });

    it('should return true when _githubStatsLogged is true', () => {
      const obj = { _githubStatsLogged: true } as typeof globalThis;
      expect(isGitHubStatsLogged(obj)).toBe(true);
    });

    it('should work as a type guard', () => {
      const obj = { _githubStatsLogged: true } as typeof globalThis;
      if (isGitHubStatsLogged(obj)) {
        // TypeScript should recognize _githubStatsLogged exists
        expect(obj._githubStatsLogged).toBe(true);
      }
    });
  });
});
