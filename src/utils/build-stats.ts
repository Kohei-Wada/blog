import GitHubCacheManager from './github-cache-manager.js';

/**
 * ビルド完了時にGitHub API使用統計を表示
 */
export function logGitHubApiStats() {
  const cacheManager = GitHubCacheManager.getInstance();
  const stats = cacheManager.getStats();

  if (stats.fetchCount === 0 && stats.cacheHits === 0) {
    // API使用なし（モックデータのみ）
    return;
  }

  const totalRequests = stats.fetchCount + stats.cacheHits;
  const cacheHitRate = totalRequests > 0 ? Math.round((stats.cacheHits / totalRequests) * 100) : 0;

  console.log('\n📊 GitHub API Usage Statistics');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🌐 API calls made: ${stats.fetchCount}`);
  console.log(`📦 Cache hits: ${stats.cacheHits}`);
  console.log(`📈 Cache hit rate: ${cacheHitRate}%`);
  console.log(`💾 Current cache status: ${stats.isCached ? 'Active' : 'Empty'}`);

  if (stats.fetchCount > 0 && stats.cacheHits > 0) {
    const savedCalls = stats.cacheHits;
    console.log(`✅ API calls saved by caching: ${savedCalls}`);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}
