# Troubleshooting Guide

## 🚨 Common Issues & Solutions

### Build Errors

#### TypeScript Compilation Errors

**Symptoms**:

```bash
error TS2307: Cannot find module '@/components/Header.Astro'
```

**Solutions**:

1. Check path alias configuration in `tsconfig.JSON`
2. Verify file exists at specified path
3. Clear TypeScript cache: `npx tsc --build --clean`
4. Restart VS Code TypeScript server

#### Missing Dependencies

**Symptoms**:

```bash
Module not found: Can't resolve 'package-name'
```

**Solutions**:

```bash
# Clean install dependencies
rm -rf node_modules package-lock.JSON
npm install

# Check if package is listed in package.JSON
npm list package-name

# Install missing package
npm install package-name
```

### Development Server Issues

#### Port Already in Use

**Symptoms**:

```bash
Error: listen EADDRINUSE: address already in use :::4321
```

**Solutions**:

```bash
# Kill process using port 4321
lsof -ti:4321 | xargs kill -9

# Or use different port
npm run dev -- --port 3000
```

#### Hot Reload Not Working

**Symptoms**: Changes not reflecting in browser

**Solutions**:

1. Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)
2. Clear browser cache and service workers
3. Restart development server
4. Check file watcher limits (Linux):

   ```bash
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

### GitHub API Issues

#### Rate Limiting

**Symptoms**:

```bash
GitHub API rate limit exceeded. Status: 403
```

**Solutions**:

1. **Development**: Enable mock data in `.env`

   ```bash
   PUBLIC_DISABLE_GITHUB_API=true
   ```

2. **Production**: Wait for rate limit reset (1 hour)
3. Consider GitHub token authentication for higher limits

#### Network Connectivity

**Symptoms**:

```bash
GitHub API unavailable: Network error
```

**Solutions**:

1. Check internet connection
2. Verify GitHub API status: [status.GitHub.com](https://www.githubstatus.com/)
3. Test API manually: `curl https://api.github.com/users/Kohei-Wada`
4. Enable development mock data as fallback

### Test Failures

#### Tests Not Running

**Symptoms**:

```bash
Command failed: vitest
```

**Solutions**:

1. Install test dependencies: `npm install`
2. Check Node.js version (requires 18+)
3. Clear test cache: `npx vitest run --no-cache`
4. Verify test files are in correct directory: `tests/`

#### Mock-related Errors

**Symptoms**:

```bash
TypeError: Cannot read property 'mockResolvedValue' of undefined
```

**Solutions**:

1. Check mock setup in test files
2. Verify `vi.fn()` imports from `vitest`
3. Clear mocks between tests: `vi.clearAllMocks()`
4. Reset modules if needed: `vi.resetModules()`

### Build & Deployment

#### Netlify Build Failures

**Symptoms**: Build fails in Netlify but works locally

**Common Causes & Solutions**:

1. **Node Version Mismatch**:

   ```toml
   # Netlify.toml
   [build.environment]
     NODE_VERSION = "18"
   ```

2. **Missing Environment Variables**:

   - Check Netlify dashboard environment settings
   - Ensure production secrets are configured

3. **Case Sensitivity Issues**:

   - Verify file/folder name casing
   - Check import statements match file names exactly

4. **Memory Issues**:

   ```toml
   # Netlify.toml
   [build]
     command = "NODE_OPTIONS='--max_old_space_size=4096' npm run build"
   ```

#### Deployment Timeout

**Symptoms**: Build exceeds time limit

**Solutions**:

1. Enable GitHub API caching (already implemented)
2. Optimize image sizes before commit
3. Remove unused dependencies
4. Use Netlify build plugins for optimization

### Content Issues

#### MDX Parsing Errors

**Symptoms**:

```bash
Error: Expected corresponding JSX closing tag for <Component>
```

**Solutions**:

1. Check JSX syntax in MDX files
2. Ensure all tags are properly closed
3. Verify component imports in MDX
4. Use markdown linting: `npm run markdown:lint`

#### Missing Images

**Symptoms**: Broken image links in posts

**Solutions**:

1. Check file path is correct relative to content file
2. Verify image exists in `src/assets/` directory
3. Reference images from the post body with Markdown (there is no `heroImage`
   frontmatter field):

   ```markdown
   ![alt text](../../assets/blog/image.jpg)
   ```

4. Check image file extensions match exactly

#### Frontmatter Validation Errors

**Symptoms**:

```bash
ZodError: Invalid frontmatter
```

**Solutions**:

1. Check frontmatter schema in `src/content.config.ts`
2. Verify required fields are present
3. Check date format: `YYYY-MM-DD`
4. Ensure tags are array format: `['tag1', 'tag2']`

### Performance Issues

#### Slow Build Times

**Diagnosis**:

```bash
# Enable verbose logging
npm run build -- --verbose

# Profile build performance
npm run build -- --stats
```

**Solutions**:

1. Optimize images before committing
2. Remove unused dependencies
3. Check for circular imports
4. Use development API mocking

#### Large Bundle Sizes

**Diagnosis**:

```bash
# Analyze bundle
npm run build
# Check dist/ folder sizes
```

**Solutions**:

1. Audit dependencies: `npm audit`
2. Remove unused imports
3. Use dynamic imports for large components
4. Optimize images and assets

## 🔧 Debug Commands

### Development Debugging

```bash
# Verbose development server
npm run dev -- --verbose

# Debug specific component
npm run dev -- --open /en/blog/test-post/

# Check TypeScript issues
npm run typecheck -- --watch
```

### Build Debugging

```bash
# Verbose build output
npm run build -- --verbose

# Check generated files
ls -la dist/

# Test production build locally
npm run preview
```

### Test Debugging

```bash
# Run specific test file
npm test -- tests/unit/GitHub-cache-manager.test.ts

# Debug test with logs
npm test -- --reporter=verbose

# Run tests in watch mode
npm test -- --watch
```

## 📞 Getting Help

### Log Analysis

When reporting issues, include:

1. **Error message** (full stack trace)
2. **Environment** (Node version, OS, browser)
3. **Steps to reproduce**
4. **Expected vs actual behavior**
5. **Recent changes** (last working version)

### Useful Log Locations

- **Development**: Terminal output
- **Netlify builds**: Deploy log in dashboard
- **GitHub Actions**: Workflow run details
- **Browser**: Developer console

### External Resources

- [Astro Documentation](https://docs.astro.build/)
- [Vitest Documentation](https://vitest.dev/)
- [Netlify Support](https://docs.netlify.com/)
- [GitHub API Documentation](https://docs.github.com/en/rest)

---

_For complex issues, check [Architecture Guide](./architecture.md) for system understanding_
