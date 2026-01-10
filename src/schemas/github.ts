import { z } from 'zod';

/**
 * GitHub Event schema
 */
export const GitHubEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  repo: z.object({
    name: z.string(),
  }),
  created_at: z.string(),
  payload: z.object({
    commits: z
      .array(
        z.object({
          message: z.string(),
          sha: z.string(),
        })
      )
      .optional(),
    pull_request: z
      .object({
        title: z.string(),
      })
      .optional(),
    issue: z
      .object({
        title: z.string(),
      })
      .optional(),
  }),
});

/**
 * GitHub Repository schema
 */
export const GitHubRepoSchema = z.object({
  name: z.string(),
  full_name: z.string(),
  html_url: z.string().url(),
  description: z.string().nullable(),
  stargazers_count: z.number().int().nonnegative(),
  language: z.string().nullable(),
  updated_at: z.string(),
  pushed_at: z.string(),
});

/**
 * API response array schemas
 */
export const GitHubEventsResponseSchema = z.array(GitHubEventSchema);
export const GitHubReposResponseSchema = z.array(GitHubRepoSchema);

// Type exports (for compatibility with existing types/index.ts)
export type GitHubEventFromSchema = z.infer<typeof GitHubEventSchema>;
export type GitHubRepoFromSchema = z.infer<typeof GitHubRepoSchema>;

/**
 * Safely parse API response
 * @param data GitHub Events API response
 * @returns Parsed result. Returns empty array on failure
 */
export function parseGitHubEvents(data: unknown): GitHubEventFromSchema[] {
  const result = GitHubEventsResponseSchema.safeParse(data);
  if (!result.success) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('GitHub Events parse error:', result.error.message);
    }
    return [];
  }
  return result.data;
}

/**
 * Safely parse API response
 * @param data GitHub Repos API response
 * @returns Parsed result. Returns empty array on failure
 */
export function parseGitHubRepos(data: unknown): GitHubRepoFromSchema[] {
  const result = GitHubReposResponseSchema.safeParse(data);
  if (!result.success) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('GitHub Repos parse error:', result.error.message);
    }
    return [];
  }
  return result.data;
}
