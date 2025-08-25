# Architecture Documentation

## 🏗️ High-Level Overview

This is a static site built with Astro, utilizing:

- **Static Site Generation (SSG)** for optimal performance
- **Content Collections API** for type-safe content management
- **Component Islands** for selective client-side hydration
- **File-based Routing** for intuitive page organization

## 📐 System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Content       │    │   Build Process  │    │   Static Site   │
│   (MDX + Data)  │───▶│   (Astro SSG)    │───▶│   (HTML/CSS/JS) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
       │                        │                       │
       ▼                        ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ • Blog Posts    │    │ • TypeScript     │    │ • SEO Optimized │
│ • Images        │    │ • Type Checking  │    │ • Fast Loading  │
│ • Metadata      │    │ • Asset Bundling │    │ • RSS Feeds     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🧩 Component Architecture

### Component Organization

```
src/components/
├── shared/                 # Reusable components
│   ├── layout/            # Layout structure
│   │   ├── BaseHead.Astro      # HTML head with meta tags
│   │   ├── Header.Astro        # Site navigation
│   │   └── Footer.Astro        # Site footer
│   └── ui/                # UI components
│       ├── FormattedDate.Astro # Date display
│       ├── HeroSection.Astro   # Homepage hero
│       └── ThemeToggle.Astro   # Dark/light mode
├── blog/                  # Blog-specific components
│   ├── content/          # Content display
│   │   ├── PostCard.Astro      # Post preview cards
│   │   ├── PostsGrid.Astro     # Grid layouts
│   │   └── RelatedPosts.Astro  # Related post suggestions
│   └── navigation/       # Blog navigation
│       ├── Sidebar.Astro       # Archive & tag navigation
│       └── TableOfContents.Astro # Dynamic TOC
└── integrations/          # External services
    ├── GitHubActivity.Astro    # GitHub API integration
    ├── ShareButtons.Astro      # Social sharing
    └── Analytics.Astro         # Google Analytics
```

### Component Design Principles

1. **Single Responsibility**: Each component has one clear purpose
2. **Props Interface**: Clear TypeScript interfaces for all props
3. **Scoped Styles**: Component-specific styling with CSS modules
4. **Server-First**: Most components render server-side for performance
5. **Progressive Enhancement**: Client-side features enhance base functionality

## 📊 Data Flow Architecture

### Content Pipeline

```
1. Content Creation
   ├── MDX files in src/content/blog/
   ├── Frontmatter schema validation (Zod)
   └── Asset processing (images, etc.)

2. Build-Time Processing
   ├── Content Collections API queries
   ├── Static route generation
   ├── RSS feed generation
   └── Sitemap creation

3. Runtime Features
   ├── Search functionality
   ├── Tag filtering
   ├── Archive navigation
   └── Related post suggestions
```

### GitHub API Integration

**Problem**: Multiple pages need GitHub data → Multiple API calls → Rate limiting

**Solution**: Intelligent caching system

```typescript
// Singleton cache manager
class GitHubCacheManager {
  // Single API call per build
  async getOrFetch(): Promise<GitHubData>;

  // Statistics tracking
  getStats(): CacheStats;
}
```

**Flow**:

1. First component requests GitHub data → API call + cache
2. Subsequent components → Cache hit (no API call)
3. Build completes → Single API call for 22+ pages

## 🗂️ File Structure & Routing

### File-Based Routing

```
src/pages/
├── index.Astro              # Homepage (/)
├── about.Astro              # About page (/about/)
├── contact.Astro            # Contact (/contact/)
├── blog/
│   ├── index.Astro          # Blog listing (/blog/)
│   └── [...slug].Astro      # Dynamic blog posts (/blog/post-slug/)
├── archives/
│   ├── index.Astro          # Archive listing (/archives/)
│   └── [yearmonth].Astro    # Monthly archives (/archives/2024-01/)
└── tags/
    ├── index.Astro          # All tags (/tags/)
    └── [tag].Astro          # Tag-filtered posts (/tags/JavaScript/)
```

### Content Collections

```typescript
// src/content.config.ts
const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    tags: z.array(z.string()),
    updatedDate: z.date().optional(),
    heroImage: z.string().optional(),
    featured: z.boolean().optional(),
  }),
});
```

## 🔧 Build Process

### Astro Build Pipeline

```
1. Content Collection Processing
   ├── Parse MDX files
   ├── Validate frontmatter schemas
   ├── Extract metadata
   └── Generate TypeScript types

2. Page Generation
   ├── Static route analysis
   ├── Dynamic route parameter generation
   ├── Component server-side rendering
   └── Asset bundling & optimization

3. Post-Processing
   ├── HTML minification
   ├── CSS optimization
   ├── Image processing (Sharp)
   ├── Sitemap generation
   └── RSS feed creation
```

### Asset Processing

- **Images**: Automatic WebP conversion, responsive sizes
- **CSS**: Scoped styling, automatic vendor prefixing
- **JavaScript**: Minimal client-side code, tree-shaking
- **Fonts**: Preloaded for performance

## 🎯 Performance Architecture

### Core Optimizations

1. **Static Generation**: All pages pre-rendered at build time
2. **Minimal JavaScript**: Only essential client-side code
3. **Image Optimization**: WebP format, lazy loading
4. **CSS Optimization**: Critical CSS inlined, non-critical deferred
5. **Caching Strategy**: Long-term caching with content hashing

### Metrics

- **Lighthouse Score**: 95+ across all metrics
- **Bundle Size**: < 50KB total JavaScript
- **Time to First Byte**: < 100ms
- **Core Web Vitals**: All metrics in green

## 🔌 Integration Points

### External Services

- **Netlify**: Hosting, forms, build hooks
- **GitHub API**: Repository activity data
- **Google Analytics**: Usage tracking
- **RSS**: Standard XML feed for syndication

### Development Tools

- **Vitest**: Testing framework
- **ESLint**: Code quality
- **Prettier**: Code formatting
- **TypeScript**: Type safety
- **Husky**: Git hooks for quality gates

---

_See [API Specifications](./api-specifications.md) for detailed integration docs_
