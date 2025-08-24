# wada-dev Blog

A modern, bilingual (Japanese/English) personal blog built with [Astro](https://astro.build/), featuring tag-based categorization, RSS feed support, and a clean, minimalist design.

🌐 **Live Site**: [https://wada-dev.com/](https://wada-dev.com/)

## Features

- 🚀 **Fast & Modern**: Built with Astro for optimal performance
- 🌍 **Bilingual**: Japanese and English content support
- 🏷️ **Tag System**: Organize posts with tags and browse by category
- 📅 **Monthly Archives**: Browse posts by year and month with statistics
- 📱 **Responsive**: Mobile-first design with clean typography
- 📊 **Social Sharing**: Built-in share buttons for major platforms
- 📡 **RSS Feed**: Automatic RSS feed generation
- 🔍 **SEO Optimized**: Meta tags, sitemap, and structured data
- ✅ **Type Safe**: Full TypeScript support with strict type checking
- 🧪 **Well Tested**: Comprehensive test suite with Vitest
- 🎨 **Analytics**: Google Analytics integration

## Development Commands

All commands are run from the root of the project, from a terminal:

| Command                 | Action                                        |
| ----------------------- | --------------------------------------------- |
| `npm install`           | Install dependencies                          |
| `npm run dev`           | Start development server at `localhost:4321`  |
| `npm run build`         | Build production site to `./dist/`            |
| `npm run preview`       | Preview production build locally              |
| `npm run new-post`      | Create new blog post with interactive prompts |
| `npm run test`          | Run tests interactively                       |
| `npm run test:run`      | Run all tests once (CI mode)                  |
| `npm run test:coverage` | Generate test coverage report                 |
| `npm run lint`          | Run ESLint                                    |
| `npm run lint:fix`      | Run ESLint with auto-fix                      |
| `npm run typecheck`     | Run TypeScript type checking                  |

## Development Environment

### GitHub API Configuration

To avoid hitting GitHub API rate limits during development, create a `.env` file in the project root:

```bash
# .env
PUBLIC_DISABLE_GITHUB_API=true
```

This will:

- Disable GitHub API calls during development (`npm run dev`)
- Display mock data instead of live GitHub activity
- Prevent rate limiting issues
- Allow UI testing without external API dependencies

**Note**: This setting only affects development. Production deployments will use live GitHub API data.

## Project Structure

```
/
├── public/                    # Static assets
│   ├── favicon.svg
│   └── fonts/                 # Atkinson font family
├── src/
│   ├── assets/               # Blog images and assets
│   ├── components/           # Reusable Astro components
│   │   ├── shared/           # Shared components
│   │   │   ├── layout/       # Layout components
│   │   │   │   ├── BaseHead.Astro   # HTML head with meta tags
│   │   │   │   ├── Header.Astro     # Site navigation
│   │   │   │   └── Footer.Astro     # Site footer
│   │   │   └── ui/           # UI components
│   │   │       ├── Analytics.Astro      # Google Analytics
│   │   │       ├── FormattedDate.Astro  # Date formatting component
│   │   │       ├── HeroSection.Astro    # Homepage hero section
│   │   │       └── PageHeader.Astro     # Page headers with icons
│   │   ├── blog/             # Blog-specific components
│   │   │   ├── content/      # Blog content components
│   │   │   │   ├── PostCard.Astro    # Blog post preview card
│   │   │   │   ├── PostsGrid.Astro   # Grid layout for posts
│   │   │   │   └── RelatedPosts.Astro # Related posts display
│   │   │   └── navigation/   # Blog navigation components
│   │   │       ├── Sidebar.Astro     # Blog sidebar with tags
│   │   │       └── TableOfContents.Astro # Dynamic TOC
│   │   └── integrations/     # External service integrations
│   │       ├── ShareButtons.Astro    # Social media share buttons
│   │       ├── GitHubIcon.Astro      # GitHub icon component
│   │       ├── GitHubActivity.Astro  # GitHub activity display
│   │       ├── GitHubActiveRepos.Astro # Active repos
│   │       └── GitHubRecentCommits.Astro # Recent commits
│   ├── content/              # Content collections
│   │   ├── blog/             # Blog post markdown files
│   │   └── blog-template.md  # Template for new posts
│   ├── layouts/              # Page layouts
│   │   ├── BaseLayout.Astro  # Base layout with common elements
│   │   └── BlogPost.Astro    # Blog post layout
│   ├── pages/                # File-based routing
│   │   ├── archives/         # Monthly archive routes
│   │   │   ├── index.Astro   # Archive listing page
│   │   │   └── [yearmonth].Astro # Monthly archive pages
│   │   ├── blog/             # Blog routes
│   │   ├── tags/             # Tag-based routes
│   │   ├── about.Astro       # About page
│   │   ├── contact.Astro     # Contact page
│   │   ├── index.Astro       # Homepage
│   │   └── RSS.xml.js        # RSS feed generator
│   ├── styles/
│   │   └── global.CSS        # Global styles
│   ├── types/                # TypeScript type definitions
│   │   └── index.ts          # Shared type definitions
│   ├── utils/                # Utility functions
│   │   └── archive-utils.ts  # Monthly archive utilities
│   ├── consts.ts             # Site configuration constants
│   └── content.config.ts     # Content schema definition
├── scripts/
│   └── new-post.js           # Interactive post creation script
├── tests/                    # Test files
│   ├── components/           # Component tests
│   ├── unit/                 # Unit tests
│   └── setup.ts              # Test configuration
├── Astro.config.mjs          # Astro configuration
├── vitest.config.ts          # Test configuration
├── eslint.config.js          # ESLint configuration
├── tsconfig.JSON             # TypeScript configuration
└── package.JSON              # Dependencies and scripts
```

## Components Overview

### Shared Components

#### Layout Components (`shared/layout/`)

- **`BaseHead.Astro`**: Common HTML head elements including meta tags, SEO, and analytics
- **`Header.Astro`**: Site navigation with active page detection
- **`Footer.Astro`**: Site footer with social links

#### UI Components (`shared/ui/`)

- **`Analytics.Astro`**: Google Analytics integration
- **`FormattedDate.Astro`**: Consistent date formatting across the site
- **`HeroSection.Astro`**: Homepage hero section with avatar and links
- **`PageHeader.Astro`**: Page headers with icons and descriptions

### Blog Components

#### Content Components (`blog/content/`)

- **`PostCard.Astro`**: Blog post preview cards
- **`PostsGrid.Astro`**: Grid layout for post listings
- **`RelatedPosts.Astro`**: Related posts display based on tags and date proximity

#### Navigation Components (`blog/navigation/`)

- **`Sidebar.Astro`**: Blog sidebar with monthly archives, GitHub activity, and tag cloud
- **`TableOfContents.Astro`**: Dynamic table of contents with scroll tracking

### Integration Components (`integrations/`)

- **`ShareButtons.Astro`**: Social media sharing (Twitter/X, Facebook, LinkedIn, Hatena, Pocket)
- **`GitHubIcon.Astro`**: GitHub icon SVG component
- **`GitHubActivity.Astro`**: GitHub activity dashboard
- **`GitHubActiveRepos.Astro`**: Active repositories list
- **`GitHubRecentCommits.Astro`**: Recent commits display

### Layouts

- **`BaseLayout.Astro`**: Common page structure with header and footer
- **`BlogPost.Astro`**: Blog post layout with metadata, content, and share buttons

## Content Management

### Blog Posts

Blog posts are written in Markdown/MDX and stored in `src/content/blog/`. Each post requires frontmatter:

```yaml
---
title: 'Your Post Title'
description: 'Brief description of the post'
pubDate: '2023-12-25'
tags: ['JavaScript', 'Astro', 'web-development']
updatedDate: '2023-12-26' # Optional
heroImage: '../../assets/image.jpg' # Optional
---
```

### Creating New Posts

Use the interactive post creation script:

```bash
npm run new-post
```

This will prompt you for:

- Post title (used to generate URL slug)
- Description
- Tags (comma-separated)

The script automatically:

- Generates SEO-friendly slugs from titles
- Sets current date
- Creates the file with proper frontmatter
- Handles duplicate slugs

## Testing

The project uses [Vitest](https://vitest.dev/) with a comprehensive test suite:

- **Unit Tests**: Core functionality and utilities
- **Component Logic Tests**: Business logic for components
- **Integration Tests**: Page routing and content processing

### Test Structure

```
tests/
├── components/           # Component logic tests
│   ├── FormattedDate.test.ts
│   ├── HeaderLink.test.ts
│   └── ShareButtons.test.ts
├── unit/                 # Unit tests
│   ├── archive-utils.test.ts  # Archive utility tests
│   ├── consts.test.ts
│   ├── content.config.test.ts
│   ├── pages.test.ts
│   └── RSS.xml.test.ts
└── setup.ts              # Test configuration
```

## Deployment

The site is automatically deployed to [Netlify](https://www.netlify.com/) on every push to the main branch.

### Build Process

1. Install dependencies
2. Run type checking
3. Run linting
4. Run tests
5. Build static site
6. Deploy to Netlify

## Configuration

### Site Settings

Edit `src/consts.ts` to update:

- Site title and description
- External URLs (GitHub, Zenn, contact form)
- Social media links

### Analytics

Google Analytics is configured in `src/components/Analytics.Astro`. Update the tracking ID as needed.

## Development Philosophy

This project follows **Test-Driven Development (TDD)** principles:

1. Write tests first based on expected behavior
2. Implement code to make tests pass
3. Refactor while keeping tests green
4. Commit only when all tests pass

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Implement the feature
5. Ensure all tests pass
6. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

---

Built with ❤️ using [Astro](https://astro.build/)
