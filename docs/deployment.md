# Deployment Guide

## 🚀 Deployment Overview

This site deploys automatically to **Netlify** with the following setup:

- **Production URL**: [https://wada-dev.com/](https://wada-dev.com/)
- **Auto-deploy**: Every push to `main` branch
- **Preview deploys**: For pull requests
- **Daily builds**: Scheduled at 00:00 JST to refresh GitHub activity

## 🔧 Netlify Configuration

### Build Settings

```toml
# Netlify.toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"
  NPM_VERSION = "9"

[[redirects]]
  from = "/*"
  to = "/404.HTML"
  status = 404
```

### Environment Variables

**Production Environment** (set in Netlify dashboard):

- No `PUBLIC_DISABLE_GITHUB_API` → GitHub API enabled
- No `PUBLIC_DISABLE_ADSENSE` → AdSense enabled
- Build uses live GitHub API data

**Development Environment** (`.env` file):

```bash
PUBLIC_DISABLE_GITHUB_API=true  # Use mock data
PUBLIC_DISABLE_ADSENSE=true     # Disable ads
```

## ⚙️ CI/CD Pipeline

### GitHub Actions Workflows

#### 1. Test Workflow (`.GitHub/workflows/test.yml`)

**Triggers**: Push, Pull Request
**Matrix**: Node.js 18 & 20

**Steps**:

1. Checkout code
2. Install dependencies
3. Type checking (`npm run typecheck`)
4. Linting (`npm run lint`)
5. Test execution (`npm run test:run`)
6. Production build (`npm run build`)

#### 2. Daily Build Workflow (`.GitHub/workflows/daily-Netlify-deploy.yml`)

**Schedule**: 00:00 JST daily
**Purpose**: Refresh GitHub activity data

**Flow**:

1. Run full test suite
2. If tests pass → Trigger Netlify build hook
3. Retry mechanism (3 attempts)
4. Error handling and notifications

```yaml
# Example workflow step
- name: Trigger Netlify build hook
  run: |
    curl --fail --request POST \
         --header "Content-Type: application/JSON" \
         --data '{}' \
         "${{ secrets.NETLIFY_BUILD_HOOK_URL }}"
```

### Pre-commit Hooks

**Tools**: Husky + lint-staged + pre-commit

**Automatic checks**:

- Code formatting (Prettier)
- Linting (ESLint)
- Type checking (TypeScript)
- Test execution (Vitest)
- Security scanning (gitleaks)

## 📊 Build Process

### Production Build Flow

```
1. Dependencies Installation
   ├── npm ci (clean install)
   └── Cache node_modules

2. Quality Checks
   ├── TypeScript compilation
   ├── ESLint validation
   ├── Test execution (84+ tests)
   └── Security scanning

3. Static Site Generation
   ├── Content processing (MDX → HTML)
   ├── GitHub API data fetching (1 call + cache)
   ├── Image optimization (Sharp)
   ├── Asset bundling & minification
   └── Sitemap & RSS generation

4. Deployment
   ├── Upload to Netlify CDN
   ├── DNS propagation
   └── Cache invalidation
```

### Build Performance

**Metrics**:

- **Build time**: ~2-3 minutes
- **GitHub API calls**: 1 (vs 22+ without caching)
- **Generated pages**: 22+
- **Bundle size**: < 50KB JavaScript

## 🔍 Monitoring & Analytics

### Build Status

**Netlify Dashboard**:

- Deploy status and logs
- Build performance metrics
- Preview deployments
- Form submissions (contact form)

**GitHub Actions**:

- Workflow run history
- Test results and coverage
- Security scan results

### Site Analytics

**Google Analytics 4**:

- Page views and user behavior
- Performance metrics
- Content engagement

**Core Web Vitals**:

- Lighthouse CI integration
- Performance monitoring
- SEO score tracking

## 🚨 Rollback Strategy

### Immediate Rollback

```bash
# Via Netlify CLI
Netlify deploy --prod --dir=dist-backup

# Via Netlify Dashboard
# → Deploys tab → Previous deploy → Publish
```

### Git-based Rollback

```bash
# Revert problematic commit
git revert <commit-hash>
git push origin main

# Force deployment of specific commit
git checkout <good-commit-hash>
git checkout -b hotfix/rollback
git push origin hotfix/rollback
# → Create PR → Merge
```

## 🔐 Security Configuration

### Netlify Security Headers

```toml
# Netlify.toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
```

### Secret Management

**GitHub Secrets**:

- `NETLIFY_BUILD_HOOK_URL`: For scheduled builds
- Repository access tokens (if needed)

**Netlify Environment**:

- Build environment variables
- Function environment variables (if applicable)

## 📱 Branch Protection

### Main Branch Rules

- ✅ Require pull request reviews
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Require linear history
- ❌ Allow force pushes (disabled)

### Required Status Checks

1. `test (18)` - Node.js 18 test matrix
2. `test (20)` - Node.js 20 test matrix
3. All quality gates must pass

## 🔄 Deployment Workflow

### Standard Deployment

1. **Development**:

   ```bash
   git checkout -b feature/new-feature
   # Make changes
   npm run test
   git commit -m "feat: add new feature"
   git push origin feature/new-feature
   ```

2. **Review**:

   - Create pull request
   - Automated tests run
   - Preview deployment created
   - Code review & approval

3. **Deploy**:

   ```bash
   git checkout main
   git merge feature/new-feature
   git push origin main
   # → Automatic Netlify deployment
   ```

### Emergency Deployment

For critical fixes:

```bash
git checkout main
git pull origin main
# Make urgent fix
git add .
git commit -m "hotfix: critical bug fix"
git push origin main
# → Immediate deployment
```

---

_See [Troubleshooting Guide](./troubleshooting.md) for deployment issues_
