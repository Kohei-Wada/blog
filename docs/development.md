# Development Guide

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# → http://localhost:4321
```

## 📋 Development Commands

### Core Development

```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build locally
```

### Testing

```bash
npm run test        # Run tests interactively with Vitest UI
npm run test:ui     # Open Vitest UI in browser
npm run test:run    # Run all tests once (CI mode)
npm run test:coverage # Generate test coverage report
```

### Code Quality

```bash
npm run lint        # Run ESLint
npm run lint:fix    # Run ESLint with auto-fix
npm run typecheck   # Run TypeScript type checking
npm run markdown:lint # Lint markdown files
npm run markdown:fix  # Fix markdown lint issues
```

### Content Management

```bash
npm run new-post    # Create new blog post with interactive prompts
```

### Maintenance

```bash
npm audit           # Check for security vulnerabilities
npm audit fix       # Auto-fix security issues
```

## 🛠️ Development Environment

### Prerequisites

- Node.js 18+
- npm (or pnpm/yarn)

### Environment Configuration

Create `.env` file in project root for development:

```bash
# .env (development only)
PUBLIC_DISABLE_GITHUB_API=true  # Disable GitHub API calls, use mock data
PUBLIC_DISABLE_ADSENSE=true     # Disable AdSense in development
```

**Why disable GitHub API in development?**

- Avoids rate limiting (60 requests/hour for unauthenticated requests)
- Faster build times (no network requests)
- Consistent mock data for UI development
- Works offline

## 🔄 Development Workflow

### Test-Driven Development (TDD)

This project follows TDD principles:

1. **Write tests first** based on expected input/output behavior
2. **Run tests** and confirm they fail (red)
3. **Write minimal code** to make tests pass (green)
4. **Refactor** code while keeping tests green
5. **Commit** only when all tests pass

### Quality Gates

Run full quality check before committing:

```bash
npm run typecheck && npm run lint && npm run test:run && npm run build
```

### Git Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes following TDD
3. Run quality checks
4. Commit with descriptive message
5. Push and create pull request

## 📁 Project Structure

```
├── src/
│   ├── components/         # Astro components
│   │   ├── shared/        # Reusable UI components
│   │   ├── blog/          # Blog-specific components
│   │   └── integrations/  # External service integrations
│   ├── content/           # Blog posts (MDX)
│   ├── layouts/           # Page layouts
│   ├── pages/             # File-based routing
│   ├── styles/            # Global styles
│   ├── utils/             # Utility functions
│   └── types/             # TypeScript type definitions
├── tests/                 # Test files
├── public/                # Static assets
└── scripts/               # Build scripts
```

## 🔧 Common Tasks

### Adding New Components

1. Create component in appropriate directory
2. Follow existing naming conventions
3. Add TypeScript types
4. Write tests in `tests/` directory
5. Update Storybook if needed

### Working with Content

- Blog posts go in `src/content/blog/en/` and `src/content/blog/ja/` — both
  locales required (parity is enforced by `npm run check:posts` + pre-commit)
- Images in `src/assets/`
- Follow the frontmatter schema in `src/content.config.ts`
- See [Content Creation](./content-creation.md) and the `write-post` skill

### Debugging

- Use browser dev tools for client-side debugging
- Check terminal output for build-time issues
- Use `console.log` in component scripts (server-side)
- Astro DevTools extension for component inspection

## 🎯 Performance Considerations

- Use Astro's partial hydration wisely
- Optimize images with Sharp integration
- Minimize client-side JavaScript
- Leverage static generation for SEO
- Monitor bundle size in build output

---

_See [Testing Guide](./testing.md) for detailed test information_
