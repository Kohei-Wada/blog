import { describe, it, expect } from 'vitest';
import {
  GitHubEventSchema,
  GitHubRepoSchema,
  parseGitHubEvents,
  parseGitHubRepos,
} from '../../../src/schemas/github';

describe('github schemas', () => {
  describe('GitHubEventSchema', () => {
    it('should validate a valid PushEvent', () => {
      const validEvent = {
        id: 'event-123',
        type: 'PushEvent',
        repo: { name: 'user/repo' },
        created_at: '2025-01-01T00:00:00Z',
        payload: {
          commits: [{ message: 'test commit', sha: 'abc123' }],
        },
      };

      const result = GitHubEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it('should validate event with pull_request payload', () => {
      const validEvent = {
        id: 'event-456',
        type: 'PullRequestEvent',
        repo: { name: 'user/repo' },
        created_at: '2025-01-01T00:00:00Z',
        payload: {
          pull_request: { title: 'Add feature' },
        },
      };

      const result = GitHubEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it('should validate event with issue payload', () => {
      const validEvent = {
        id: 'event-789',
        type: 'IssuesEvent',
        repo: { name: 'user/repo' },
        created_at: '2025-01-01T00:00:00Z',
        payload: {
          issue: { title: 'Bug report' },
        },
      };

      const result = GitHubEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it('should accept event with empty payload', () => {
      const eventWithEmptyPayload = {
        id: 'event-123',
        type: 'WatchEvent',
        repo: { name: 'user/repo' },
        created_at: '2025-01-01T00:00:00Z',
        payload: {},
      };

      const result = GitHubEventSchema.safeParse(eventWithEmptyPayload);
      expect(result.success).toBe(true);
    });

    it('should reject event missing required fields', () => {
      const invalidEvent = {
        id: 'event-123',
        // missing type, repo, etc.
      };

      const result = GitHubEventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });

    it('should reject event with invalid repo structure', () => {
      const invalidEvent = {
        id: 'event-123',
        type: 'PushEvent',
        repo: 'invalid-repo', // should be an object
        created_at: '2025-01-01T00:00:00Z',
        payload: {},
      };

      const result = GitHubEventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });
  });

  describe('GitHubRepoSchema', () => {
    it('should validate a valid repository', () => {
      const validRepo = {
        name: 'test-repo',
        full_name: 'user/test-repo',
        html_url: 'https://github.com/user/test-repo',
        description: 'A test repository',
        stargazers_count: 42,
        language: 'TypeScript',
        updated_at: '2025-01-01T00:00:00Z',
        pushed_at: '2025-01-01T00:00:00Z',
      };

      const result = GitHubRepoSchema.safeParse(validRepo);
      expect(result.success).toBe(true);
    });

    it('should accept null for nullable fields', () => {
      const repoWithNulls = {
        name: 'test-repo',
        full_name: 'user/test-repo',
        html_url: 'https://github.com/user/test-repo',
        description: null,
        stargazers_count: 0,
        language: null,
        updated_at: '2025-01-01T00:00:00Z',
        pushed_at: '2025-01-01T00:00:00Z',
      };

      const result = GitHubRepoSchema.safeParse(repoWithNulls);
      expect(result.success).toBe(true);
    });

    it('should reject invalid URL', () => {
      const repoWithInvalidUrl = {
        name: 'test-repo',
        full_name: 'user/test-repo',
        html_url: 'not-a-valid-url',
        description: null,
        stargazers_count: 0,
        language: null,
        updated_at: '2025-01-01T00:00:00Z',
        pushed_at: '2025-01-01T00:00:00Z',
      };

      const result = GitHubRepoSchema.safeParse(repoWithInvalidUrl);
      expect(result.success).toBe(false);
    });

    it('should reject negative stargazers count', () => {
      const repoWithNegativeStars = {
        name: 'test-repo',
        full_name: 'user/test-repo',
        html_url: 'https://github.com/user/test-repo',
        description: null,
        stargazers_count: -1,
        language: null,
        updated_at: '2025-01-01T00:00:00Z',
        pushed_at: '2025-01-01T00:00:00Z',
      };

      const result = GitHubRepoSchema.safeParse(repoWithNegativeStars);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer stargazers count', () => {
      const repoWithFloatStars = {
        name: 'test-repo',
        full_name: 'user/test-repo',
        html_url: 'https://github.com/user/test-repo',
        description: null,
        stargazers_count: 3.5,
        language: null,
        updated_at: '2025-01-01T00:00:00Z',
        pushed_at: '2025-01-01T00:00:00Z',
      };

      const result = GitHubRepoSchema.safeParse(repoWithFloatStars);
      expect(result.success).toBe(false);
    });
  });

  describe('parseGitHubEvents', () => {
    it('should parse valid events array', () => {
      const events = [
        {
          id: 'event-1',
          type: 'PushEvent',
          repo: { name: 'user/repo' },
          created_at: '2025-01-01T00:00:00Z',
          payload: {},
        },
        {
          id: 'event-2',
          type: 'WatchEvent',
          repo: { name: 'user/other-repo' },
          created_at: '2025-01-02T00:00:00Z',
          payload: {},
        },
      ];

      const result = parseGitHubEvents(events);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('event-1');
      expect(result[1].id).toBe('event-2');
    });

    it('should return empty array for invalid data', () => {
      const result = parseGitHubEvents({ invalid: 'data' });
      expect(result).toEqual([]);
    });

    it('should return empty array for null', () => {
      const result = parseGitHubEvents(null);
      expect(result).toEqual([]);
    });

    it('should return empty array for undefined', () => {
      const result = parseGitHubEvents(undefined);
      expect(result).toEqual([]);
    });

    it('should return empty array for string', () => {
      const result = parseGitHubEvents('invalid');
      expect(result).toEqual([]);
    });
  });

  describe('parseGitHubRepos', () => {
    it('should parse valid repos array', () => {
      const repos = [
        {
          name: 'repo-1',
          full_name: 'user/repo-1',
          html_url: 'https://github.com/user/repo-1',
          description: 'First repo',
          stargazers_count: 10,
          language: 'TypeScript',
          updated_at: '2025-01-01T00:00:00Z',
          pushed_at: '2025-01-01T00:00:00Z',
        },
      ];

      const result = parseGitHubRepos(repos);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('repo-1');
    });

    it('should return empty array for invalid data', () => {
      const result = parseGitHubRepos('not an array');
      expect(result).toEqual([]);
    });

    it('should return empty array for array with invalid items', () => {
      const result = parseGitHubRepos([{ invalid: 'item' }]);
      expect(result).toEqual([]);
    });
  });
});
