# wada-dev Blog

A modern, bilingual personal blog built with [Astro](https://astro.build/), featuring intelligent GitHub API caching, comprehensive testing, and automated deployment.

🌐 **Live Site**: [https://wada-dev.com/](https://wada-dev.com/)

## ✨ Key Features

- 🚀 **High Performance**: Static site generation with optimal loading
- 🌍 **Bilingual Content**: Japanese and English blog posts
- 📊 **GitHub Integration**: Live repository activity with smart caching
- 🧪 **Well Tested**: 84+ tests with comprehensive coverage
- ⚡ **Fast Builds**: Optimized API usage (22 calls → 1 call)
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

## 🛠️ Development Setup

Create `.env` file for development (avoids GitHub API rate limits):

```bash
PUBLIC_DISABLE_GITHUB_API=true
```

## 📚 Documentation

For detailed technical documentation:

**[📖 Complete Documentation →](./docs/)**

- [Development Guide](./docs/development.md) - Setup, commands, TDD workflow
- [Architecture](./docs/architecture.md) - System design, components, caching
- [Testing](./docs/testing.md) - 84+ tests, coverage, strategies
- [Deployment](./docs/deployment.md) - Netlify, CI/CD, monitoring
- [Content Creation](./docs/content-creation.md) - **How to write & ship a post**: format, frontmatter, the worth-publishing test, and PII-masking rules
- [API Specifications](./docs/api-specifications.md) - GitHub integration, RSS
- [Troubleshooting](./docs/troubleshooting.md) - Common issues, solutions

## 🎯 Tech Stack

- **Framework**: [Astro](https://astro.build/) (Static Site Generator)
- **Styling**: CSS with CSS variables for theming
- **Content**: MDX with frontmatter validation
- **Testing**: Vitest + Testing Library
- **Deployment**: Netlify with automated CI/CD
- **Caching**: Custom GitHub API cache system

---

Personal blog project maintained by Kohei Wada
