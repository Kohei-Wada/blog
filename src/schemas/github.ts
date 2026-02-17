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
  payload: z
    .object({
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
    })
    .passthrough(), // Allow other fields for diverse event types
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

// Canonical type exports derived from Zod schemas
export type GitHubEvent = z.infer<typeof GitHubEventSchema>;
export type GitHubRepo = z.infer<typeof GitHubRepoSchema>;

/**
 * Safely parse an array response with a Zod schema.
 * Returns empty array on failure, logs warning in non-production.
 */
function safeParseArray<T>(schema: z.ZodType<T[]>, data: unknown, label: string): T[] {
  const result = schema.safeParse(data);
  if (!result.success) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`${label} parse error:`, result.error.message);
    }
    return [];
  }
  return result.data;
}

export function parseGitHubEvents(data: unknown): GitHubEvent[] {
  return safeParseArray(GitHubEventsResponseSchema, data, 'GitHub Events');
}

export function parseGitHubRepos(data: unknown): GitHubRepo[] {
  return safeParseArray(GitHubReposResponseSchema, data, 'GitHub Repos');
}
