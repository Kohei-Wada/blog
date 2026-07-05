# API Specifications

## 📡 RSS Feed Generation

### RSS Endpoint

**URL**: `https://wada-dev.com/rss.xml`
**Format**: RSS 2.0 XML standard
**Content**: All published English blog posts

### Feed Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<RSS version="2.0">
  <channel>
    <title>wada-dev Blog</title>
    <description>Personal blog about web development and technology</description>
    <link>https://wada-dev.com/</link>

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

**Source**: `src/pages/rss.xml.js`
**Build Time**: Generated during static site build
**Update Frequency**: Every deployment (when posts change)

```javascript
export async function GET(context) {
  const posts = await getCollection('blog');
  const enPosts = posts.filter(post => getPostLang(post.id) === 'en');
  return rss({
    title: SITE_TITLE,
    description: t('siteDescription', 'en'),
    site: context.site,
    items: enPosts.map(post => ({
      ...post.data,
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

---

_See [Architecture Guide](./architecture.md) for system integration details_
