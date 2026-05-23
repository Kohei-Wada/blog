# API Specifications

## 🔗 GitHub API Integration

### Overview

The site integrates with GitHub's REST API to display repository activity and recent commits. A sophisticated caching system prevents rate limiting and optimizes build performance.

### GitHub API Cache System

**Problem Solved**:

- Multiple pages need GitHub data → 22+ API calls per build
- GitHub rate limit: 60 requests/hour (unauthenticated)
- Slow builds and potential failures

**Solution**:

```typescript
class GitHubCacheManager {
  private static instance: GitHubCacheManager;
  private cachedData: GitHubData | null = null;
  private fetchPromise: Promise<GitHubData> | null = null;

  // Singleton pattern ensures single API call per build
  static getInstance(): GitHubCacheManager;

  // Returns cached data or fetches once
  async getOrFetch(): Promise<GitHubData>;

  // Performance statistics
  getStats(): CacheStats;
}
```

### API Endpoints Used

#### 1. User Events

```
GET https://api.github.com/users/Kohei-Wada/events
```

**Response**: Recent public activity (pushes, PRs, issues)
**Rate Limit**: Shared 60/hour bucket
**Caching**: Single fetch per build, shared across all pages

#### 2. User Repositories

```
GET https://api.github.com/users/Kohei-Wada/repos?sort=updated&per_page=10
```

**Response**: Recently updated repositories
**Sorting**: By last update timestamp
**Limit**: 10 most recent repositories

### Data Types

```typescript
interface GitHubEvent {
  id: string;
  type: 'PushEvent' | 'CreateEvent' | 'IssuesEvent' | string;
  repo: {
    name: string;
  };
  created_at: string;
  payload: {
    commits?: Array<{
      message: string;
      sha: string;
    }>;
  };
}

interface GitHubRepo {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  updated_at: string;
  pushed_at: string;
}

interface GitHubData {
  events: GitHubEvent[];
  repos: GitHubRepo[];
}
```

### Error Handling

**Rate Limiting** (403 status):

```typescript
if (response.status === 403) {
  console.warn('GitHub API rate limit exceeded');
  return { events: [], repos: [] };
}
```

**Network Errors**:

```typescript
catch (error) {
  console.warn('GitHub API unavailable:', error.message);
  return { events: [], repos: [] };
}
```

**Graceful Degradation**:

- Empty data arrays on API failure
- UI components handle empty states
- No broken layouts or crashes

### Performance Metrics

**Before Caching**:

- 22 API calls per build
- ~30-60 seconds build time
- High rate limit risk

**After Caching**:

- 1 API call per build (95% reduction)
- ~5-10 seconds build time
- Minimal rate limit usage

**Statistics Output**:

```
📊 GitHub API Usage Statistics
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 API calls made: 1
📦 Cache hits: 21
📈 Cache hit rate: 95%
⚡ Performance improvement: ~2100ms saved
```

## 📡 RSS Feed Generation

### RSS Endpoint

**URL**: `https://wada-dev.com/rss.xml`
**Format**: RSS 2.0 XML standard
**Content**: All published blog posts

### Feed Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<RSS version="2.0">
  <channel>
    <title>wada-dev Blog</title>
    <description>Personal blog about web development and technology</description>
    <link>https://wada-dev.com/</link>
    <language>ja</language>

    <item>
      <title>Post Title</title>
      <description>Post description</description>
      <link>https://wada-dev.com/en/blog/post-slug/</link>
      <pubDate>Wed, 25 Jan 2024 00:00:00 GMT</pubDate>
      <guid>https://wada-dev.com/en/blog/post-slug/</guid>
    </item>
  </channel>
</RSS>
```

### Feed Generation

**Source**: `src/pages/RSS.xml.js`
**Build Time**: Generated during static site build
**Update Frequency**: Every deployment (when posts change)

```javascript
export async function GET(context) {
  const posts = await getCollection('blog');
  return RSS({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    items: posts.map(post => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/en/blog/${getPostSlug(post.id)}/`,
    })),
  });
}
```

## 🔍 Sitemap Generation

### Sitemap.xml

**URL**: `https://wada-dev.com/sitemap-index.xml`
**Format**: XML Sitemap Protocol
**Purpose**: SEO and search engine discovery

### Generated URLs

All URLs are locale-prefixed (`/en/...`, `/ja/...`); `/` redirects to `/en`.

**Static Pages** (per locale):

- `/en/`, `/ja/` (homepage)
- `/en/about/`, `/en/contact/`, `/en/privacy/`, `/en/projects/` (+ `/ja/...`)
- `/en/blog/` (blog index)
- `/en/archives/` (archive index)
- `/en/tags/` (tags index)

**Dynamic Pages** (per locale):

- `/en/blog/[slug]/` (individual posts)
- `/en/archives/[yearmonth]/` (monthly archives)
- `/en/tags/[tag]/` (tag-filtered posts)

### Configuration

```javascript
// Astro.config.mjs
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://wada-dev.com/',
  integrations: [sitemap()],
});
```

## 🔧 Development vs Production

### Environment Detection

**Development** (`.env` present):

```bash
PUBLIC_DISABLE_GITHUB_API=true
```

- Uses mock data
- No external API calls
- Faster development builds
- Offline development possible

**Production** (Netlify deployment):

- Live GitHub API integration
- Real-time repository data
- Cached API calls
- Full functionality

### Mock Data Structure

Development mock data matches production API structure:

```typescript
const mockEvents: GitHubEvent[] = [
  {
    id: 'mock-1',
    type: 'PushEvent',
    repo: { name: 'Kohei-Wada/blog' },
    created_at: new Date().toISOString(),
    payload: {
      commits: [
        {
          message: 'feat: GitHub API caching implementation',
          sha: 'mock-sha-1',
        },
      ],
    },
  },
];
```

## 📊 Monitoring & Analytics

### API Usage Tracking

**Build Logs**: API call counts and timing
**Error Rates**: Failed request percentage
**Cache Efficiency**: Hit rate statistics

### Performance Monitoring

**Metrics Tracked**:

- GitHub API response times
- Cache hit/miss ratios
- Build time improvements
- Error frequency

**Alerting**:

- Rate limit warnings
- Extended API outages
- Build failures due to API issues

---

_See [Architecture Guide](./architecture.md) for system integration details_
