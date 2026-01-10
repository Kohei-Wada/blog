import type { GlobalThisWithStats } from '../types/index';

export function hasGitHubStats(
  obj: typeof globalThis
): obj is typeof globalThis & GlobalThisWithStats {
  return '_githubStatsLogged' in obj;
}

export function isGitHubStatsLogged(
  obj: typeof globalThis
): obj is typeof globalThis & GlobalThisWithStats {
  return hasGitHubStats(obj) && obj._githubStatsLogged === true;
}
