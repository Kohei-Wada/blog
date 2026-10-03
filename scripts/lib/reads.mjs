// Map GA4 pagePath rows to post ids (`<lang>/<slug>`) and sum them.

const POST_PATH = /^\/(?:(ja|en)\/)?blog\/([^/]+)\/?$/;

/** @param {string} path */
export function pathToPostId(path) {
  const clean = path.split(/[?#]/)[0];
  const m = POST_PATH.exec(clean);
  if (!m) return null;
  // Bare /blog/<slug> predates the English-default flip and served ja posts.
  return `${m[1] ?? 'ja'}/${m[2]}`;
}

/**
 * @param {Array<{ path: string; count: number }>} rows
 * @param {Set<string>} knownIds
 * @returns {Record<string, number>}
 */
export function aggregateReads(rows, knownIds) {
  /** @type {Record<string, number>} */
  const sums = {};
  for (const { path, count } of rows) {
    const id = pathToPostId(path);
    if (id && knownIds.has(id)) sums[id] = (sums[id] ?? 0) + count;
  }
  return Object.fromEntries(Object.keys(sums).sort().map(k => [k, sums[k]]));
}
