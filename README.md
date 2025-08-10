# Kohei Wada's Personal Blog

A modern, bilingual (Japanese/English) personal blog built with [Astro](https://astro.build/), featuring tag-based categorization, RSS feed support, and a clean, minimalist design.

🌐 **Live Site**: [https://kohei-wada-blog.netlify.app/](https://kohei-wada-blog.netlify.app/)

## Features

- 🚀 **Fast & Modern**: Built with Astro for optimal performance
- 🌍 **Bilingual**: Japanese and English content support
- 🏷️ **Tag System**: Organize posts with tags and browse by category
- 📱 **Responsive**: Mobile-first design with clean typography
- 📊 **Social Sharing**: Built-in share buttons for major platforms
- 📡 **RSS Feed**: Automatic RSS feed generation
- 🔍 **SEO Optimized**: Meta tags, sitemap, and structured data
- ✅ **Type Safe**: Full TypeScript support with strict type checking
- 🧪 **Well Tested**: Comprehensive test suite with Vitest
- 🎨 **Analytics**: Google Analytics integration

## Development Commands

All commands are run from the root of the project, from a terminal:

| Command | Action |
|---------|--------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server at `localhost:4321` |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview production build locally |
| `npm run new-post` | Create new blog post with interactive prompts |
| `npm run test` | Run tests interactively |
| `npm run test:run` | Run all tests once (CI mode) |
| `npm run test:coverage` | Generate test coverage report |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run typecheck` | Run TypeScript type checking |

## Project Structure

```
/
├── public/                    # Static assets
│   ├── favicon.svg
│   └── fonts/                 # Atkinson font family
├── src/
│   ├── assets/               # Blog images and assets
│   ├── components/           # Reusable Astro components
│   │   ├── Analytics.astro   # Google Analytics
│   │   ├── BaseHead.astro    # HTML head with meta tags
│   │   ├── Footer.astro      # Site footer
│   │   ├── FormattedDate.astro # Date formatting component
│   │   ├── Header.astro      # Site navigation
│   │   ├── HeaderLink.astro  # Navigation link with active state
│   │   └── ShareButtons.astro # Social media share buttons
│   ├── content/              # Content collections
│   │   ├── blog/             # Blog post markdown files
│   │   └── blog-template.md  # Template for new posts
│   ├── layouts/              # Page layouts
│   │   ├── BaseLayout.astro  # Base layout with common elements
│   │   └── BlogPost.astro    # Blog post layout
│   ├── pages/                # File-based routing
│   │   ├── blog/             # Blog routes
│   │   ├── tags/             # Tag-based routes
│   │   ├── about.astro       # About page
│   │   ├── contact.astro     # Contact page
│   │   ├── index.astro       # Homepage
│   │   └── rss.xml.js        # RSS feed generator
│   ├── styles/
│   │   └── global.css        # Global styles
│   ├── consts.ts             # Site configuration constants
│   └── content.config.ts     # Content schema definition
├── scripts/
│   └── new-post.js           # Interactive post creation script
├── tests/                    # Test files
│   ├── components/           # Component tests
│   ├── unit/                 # Unit tests
│   └── setup.ts              # Test configuration
├── astro.config.mjs          # Astro configuration
├── vitest.config.ts          # Test configuration
├── eslint.config.js          # ESLint configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies and scripts
```

## Components Overview

### Core Components

- **`BaseHead.astro`**: Common HTML head elements including meta tags, SEO, and analytics
- **`Header.astro`**: Site navigation with active page detection
- **`Footer.astro`**: Site footer with social links
- **`FormattedDate.astro`**: Consistent date formatting across the site

### Blog-Specific Components

- **`ShareButtons.astro`**: Social media sharing (Twitter/X, Facebook, LinkedIn, Hatena, Pocket)
- **`HeaderLink.astro`**: Navigation links with active state styling

### Layouts

- **`BaseLayout.astro`**: Common page structure with header and footer
- **`BlogPost.astro`**: Blog post layout with metadata, content, and share buttons

## Content Management

### Blog Posts

Blog posts are written in Markdown/MDX and stored in `src/content/blog/`. Each post requires frontmatter:

```yaml
---
title: 'Your Post Title'
description: 'Brief description of the post'
pubDate: '2023-12-25'
tags: ['javascript', 'astro', 'web-development']
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
│   ├── consts.test.ts
│   ├── content.config.test.ts
│   ├── pages.test.ts
│   └── rss.xml.test.ts
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

Google Analytics is configured in `src/components/Analytics.astro`. Update the tracking ID as needed.

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
