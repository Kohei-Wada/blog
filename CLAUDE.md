# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Communication

- 常に日本語で会話する

## Project Overview

This is a personal blog built with Astro, a modern static site generator. The site is deployed to Netlify at <https://kohei-wada-blog.netlify.app/>. It features a bilingual blog (Japanese/English) with tag-based categorization and RSS feed support.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run test` - Run tests interactively with Vitest
- `npm run test:ui` - Open Vitest UI in browser
- `npm run test:run` - Run all tests once (CI mode)
- `npm run test:coverage` - Generate test coverage report
- `npm run lint` - Run ESLint on all files
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run typecheck` - Run TypeScript type checking
- `npx prettier --write .` - Format code with Prettier
- `./new-post.sh` - Create new blog post from template

## Development Philosophy

### Test-Driven Development (TDD)

- 原則としてテスト駆動開発（TDD）で進める
- 期待される入出力に基づき、まずテストを作成する
- 実装コードは書かず、テストのみを用意する
- テストを実行し、失敗を確認する
- テストが正しいことを確認できた段階でコミットする
- その後、テストをパスさせる実装を進める
- 実装中はテストを変更せず、コードを修正し続ける
- すべてのテストが通過するまで繰り返す

## Testing

### Test Framework

- **Vitest**: Modern test runner with TypeScript support
- **Happy-DOM**: Lightweight DOM environment for testing
- **Testing Library**: DOM utilities and assertions
- **Jest-DOM**: Additional matchers for DOM testing

### Test Structure

- Unit tests: `src/**/*.test.ts` - Test individual components and utilities
- Test setup: `src/test/setup.ts` - Global test configuration
- Configuration: `vitest.config.ts` - Vitest settings and aliases with `@` path alias
- Pre-commit hooks: husky + lint-staged for automatic formatting and linting

### CI/CD

- GitHub Actions workflow: `.github/workflows/test.yml`
- Automated testing on Node.js 18 & 20
- Quality checks: typecheck → lint → test → build
- Automatic PR validation and deployment previews
- Additional workflows: gitleaks security scan, pre-commit auto-update

## Architecture

### Content Management

- Blog posts are stored in `src/content/blog/` as Markdown/MDX files
- Content schema is defined in `src/content.config.ts` with frontmatter validation
- Blog template is at `src/content/blog-template.md`
- New posts are created with timestamp-based slugs via `new-post.sh`

### Key Components

- `src/components/` - Reusable Astro components (Analytics, BaseHead, Header, etc.)
- `src/layouts/` - Page layouts (BaseLayout, BlogPost)
- `src/pages/` - File-based routing for pages and dynamic blog routes
- `src/consts.ts` - Global site configuration (title, description, URLs)

### Styling

- Global CSS in `src/styles/global.css`
- Uses Atkinson font family (loaded from `public/fonts/`)

### Static Assets

- Blog placeholder images in `src/assets/`
- Favicon and fonts in `public/`

## Site Configuration

The site title, description, and external URLs are centralized in `src/consts.ts`. The Astro config (`astro.config.mjs`) includes MDX and sitemap integrations with the Netlify deployment URL.

## Blog Post Structure

Each blog post requires frontmatter with:

- `title` - Post title
- `description` - Post description  
- `pubDate` - Publication date
- `tags` - Array of tags
- Optional: `updatedDate`, `heroImage`
