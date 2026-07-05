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
│   ├── GlobalNav.astro         # Site navigation
│   ├── LangSwitcher.astro      # ja/en locale switcher
│   ├── layout/            # Layout structure
│   │   └── BaseHead.astro      # HTML head with meta tags
│   └── ui/                # UI components
│       ├── Analytics.astro     # Google Analytics
│       ├── ManCommand.astro    # Man-page style command header
│       ├── Pagination.astro    # List pagination
│       └── SearchModal.astro   # Fuzzy search modal (fuse.js)
├── blog/                  # Blog-specific components
│   └── content/
│       └── PostsList.astro     # Post listing
└── integrations/          # External services
    └── AdSenseScript.astro     # Google AdSense
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

## 🗂️ File Structure & Routing

### File-Based Routing

Both locales are prefixed (`/en/...`, `/ja/...`); `/` redirects to `/en`. Logic
pages live once under `[lang]/` and generate both locales via `getStaticPaths`.

```
src/pages/
├── [lang]/                       # en + ja from one source
│   ├── index.astro               # Homepage (/en/, /ja/)
│   ├── blog/[...page].astro       # Blog listing (/en/blog/)
│   ├── blog/[...slug].astro       # Blog posts (/en/blog/post-slug/)
│   ├── archives/index.astro       # Archive listing (/en/archives/)
│   ├── archives/[yearmonth]/[...page].astro # (/en/archives/2024-01/)
│   ├── tags/index.astro           # All tags (/en/tags/)
│   ├── tags/[tag]/[...page].astro # Tag-filtered (/en/tags/JavaScript/)
│   └── search-index.json.ts       # Per-locale search index
├── en/  · ja/                    # prose pages: about, contact, privacy, projects
├── 404.astro                     # Custom 404
└── rss.xml.js                    # RSS feed
```

### Content Collections

```typescript
// src/content.config.ts
const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    seeAlso: z.array(z.string()).default([]),
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
