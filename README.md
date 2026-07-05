# wada-dev Blog

A modern, bilingual personal blog built with [Astro](https://astro.build/), styled after Unix man pages, with comprehensive testing and automated deployment.

🌐 **Live Site**: [https://wada-dev.com/](https://wada-dev.com/)

## ✨ Key Features

- 🚀 **High Performance**: Static site generation with optimal loading
- 🌍 **Bilingual Content**: Japanese and English blog posts
- 📖 **Man-Page Style**: Terminal-inspired design and navigation
- 🔍 **Client-Side Search**: Fuzzy search powered by fuse.js
- 🧪 **Well Tested**: 155 tests with comprehensive coverage
- 📱 **Fully Responsive**: Mobile-first design

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# → http://localhost:4321

# Verify ja + en post parity
npm run check:posts

# Run tests
npm run test

# Build for production
npm run build
```

## 📚 Documentation

For detailed technical documentation:

**[📖 Complete Documentation →](./docs/)**

- [Development Guide](./docs/development.md) - Setup, commands, TDD workflow
- [Architecture](./docs/architecture.md) - System design, components, data flow
- [Testing](./docs/testing.md) - 155 tests, coverage, strategies
- [Deployment](./docs/deployment.md) - Netlify, CI/CD, monitoring
- [Content Creation](./docs/content-creation.md) - **How to write & ship a post**: format, frontmatter, the worth-publishing test, and PII-masking rules
- [API Specifications](./docs/api-specifications.md) - RSS feed, sitemap
- [Troubleshooting](./docs/troubleshooting.md) - Common issues, solutions

## 🎯 Tech Stack

- **Framework**: [Astro](https://astro.build/) (Static Site Generator)
- **Styling**: CSS with CSS variables for theming
- **Content**: MDX with frontmatter validation
- **Search**: [fuse.js](https://www.fusejs.io/) client-side fuzzy search
- **Testing**: Vitest + Testing Library
- **Deployment**: Netlify with automated CI/CD

---

Personal blog project maintained by Kohei Wada
