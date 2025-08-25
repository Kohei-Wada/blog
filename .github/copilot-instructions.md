# GitHub Copilot Code Review Instructions

## Project Context

This is a personal blog built with Astro, featuring bilingual content (Japanese/English) and GitHub API integration. The project follows Test-Driven Development (TDD) principles with comprehensive test coverage.

## Code Review Focus Areas

### Security & Safety

- Check for proper sanitization of external data before logging
- Validate API response handling and error cases
- Ensure no secrets or sensitive information are exposed
- Review authentication and authorization patterns

### Performance & Scalability

- Evaluate API call efficiency and caching strategies
- Check for unnecessary re-renders or computations
- Review bundle size impact of new dependencies
- Assess build-time performance implications

### Code Quality & Maintainability

- Ensure TypeScript types are properly defined
- Check for consistent error handling patterns
- Validate test coverage for new functionality
- Review code organization and modularity

### Documentation & Standards

- Check for JSDoc comments on public APIs
- Ensure README updates reflect new features
- Validate consistent code formatting and linting
- Review commit message quality and PR descriptions

## Testing Standards

- All new features must include comprehensive unit tests
- Integration tests for API interactions
- Mock external dependencies appropriately
- Maintain 90%+ test coverage on critical paths

## Framework-Specific Considerations

### Astro

- Check for proper component hydration strategies
- Validate server-side vs client-side code separation
- Review static site generation implications
- Ensure proper meta tag and SEO handling

### GitHub API Integration

- Review rate limiting and error handling
- Check caching strategies for build optimization
- Validate mock data usage in development
- Ensure graceful degradation when API is unavailable

## Style Guidelines

- Use TypeScript strict mode
- Follow ESLint and Prettier configurations
- Keep console.log statements conditional for production
- Use meaningful variable and function names
- Prefer composition over inheritance

## Architecture Principles

- Single Responsibility Principle for functions/classes
- Dependency injection for testability
- Immutable data patterns where possible
- Clean separation between business logic and UI

## Review Priorities

1. **Critical**: Security vulnerabilities, breaking changes
2. **High**: Performance issues, test failures
3. **Medium**: Code quality, documentation
4. **Low**: Style preferences, minor optimizations
