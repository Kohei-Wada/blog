# Testing Guide

## 🧪 Testing Strategy

This project follows **Test-Driven Development (TDD)** with comprehensive coverage of critical functionality.

**Current Status**: 84+ tests with high coverage of core utilities and business logic.

## 🛠️ Test Framework Stack

- **[Vitest](https://vitest.dev/)**: Modern test runner with TypeScript support
- **[Happy-DOM](https://github.com/capricorn86/happy-dom)**: Lightweight DOM environment
- **[Testing Library](https://testing-library.com/)**: DOM utilities and best practices
- **[@vitest/ui](https://vitest.dev/guide/ui.html)**: Interactive test runner UI

## 📋 Test Commands

### Basic Testing

```bash
npm run test           # Interactive test runner with UI
npm run test:ui        # Open Vitest UI in browser
npm run test:run       # Run all tests once (CI mode)
npm run test:coverage  # Generate coverage report
```

### Targeted Testing

```bash
# Run specific test file
vitest run tests/unit/consts.test.ts

# Run tests matching pattern
vitest run -t "GitHub"

# Run tests in watch mode
vitest watch tests/unit/
```

## 🗂️ Test Structure

### Directory Organization

```
tests/
├── components/              # Component logic tests
│   ├── FormattedDate.test.ts
│   ├── HeaderLink.test.ts
│   └── ShareButtons.test.ts
├── unit/                    # Unit tests for utilities
│   ├── archive-utils.test.ts
│   ├── GitHub-cache-manager.test.ts
│   ├── related-posts.test.ts
│   └── ...
└── setup.ts                 # Test configuration
```

### Test Categories

**Unit Tests** (`tests/unit/`):

- Pure function testing
- Business logic validation
- Data transformation utilities
- Configuration validation

**Component Logic Tests** (`tests/components/`):

- Component behavior (not rendering)
- Props validation
- Event handling logic
- State management

## 📊 Current Test Coverage

### Key Areas Covered

1. **Core Utilities** (100% coverage)

   - Date formatting and calculations
   - Archive organization
   - Related post algorithms
   - Hero image randomization

2. **GitHub API Integration** (100% coverage)

   - Cache manager singleton behavior
   - API call optimization
   - Error handling and fallbacks
   - Statistics tracking

3. **Content Management** (95%+ coverage)

   - Content schema validation
   - RSS feed generation
   - Page route generation

4. **Component Logic** (90%+ coverage)
   - Share button URL generation
   - Header link active states
   - Date display formatting

## 🎯 TDD Workflow

### Red-Green-Refactor Cycle

1. **🔴 Red**: Write failing test for desired behavior
2. **🟢 Green**: Write minimal code to make test pass
3. **🔵 Refactor**: Improve code while keeping tests passing
4. **✅ Commit**: Only commit when all tests pass

### Example TDD Session

```typescript
// 1. Write test first (RED)
describe('formatRelativeDate', () => {
  it('should format dates within last week', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    expect(formatRelativeDate(twoDaysAgo)).toBe('2日前');
  });
});

// 2. Run test - it fails ❌
// 3. Write minimal implementation (GREEN)
export function formatRelativeDate(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
  return `${days}日前`;
}

// 4. Test passes ✅
// 5. Refactor for edge cases, maintain green ✅
```

## 🧩 Testing Patterns

### Mocking External Dependencies

```typescript
// Mock fetch for API tests
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock file system operations
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  existsSync: vi.fn(),
}));
```

### Testing Async Operations

```typescript
it('should handle async GitHub API calls', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    JSON: async () => mockData,
  });

  const result = await fetchGitHubData();
  expect(result).toEqual(expectedData);
});
```

### Testing Error Scenarios

```typescript
it('should handle network errors gracefully', async () => {
  mockFetch.mockRejectedValue(new Error('Network error'));

  const result = await fetchGitHubData();
  expect(result).toEqual({ events: [], repos: [] });
});
```

## 📈 Coverage Reports

### Generate Coverage Report

```bash
npm run test:coverage
```

**Output location**: `coverage/index.HTML`

### Coverage Targets

- **Unit Tests**: 95%+ line coverage
- **Critical Paths**: 100% coverage
- **Error Handling**: All error paths tested

### Key Metrics

- **Statements**: 90%+
- **Branches**: 85%+
- **Functions**: 95%+
- **Lines**: 90%+

## ✅ Test Quality Guidelines

### Writing Good Tests

1. **Descriptive Names**: Test names should explain the expected behavior
2. **Single Responsibility**: Each test should verify one specific behavior
3. **Independence**: Tests should not depend on each other
4. **Fast Execution**: Unit tests should complete in milliseconds
5. **Deterministic**: Tests should produce consistent results

### Test Structure (AAA Pattern)

```typescript
it('should calculate days difference correctly', () => {
  // Arrange
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-01-05');

  // Act
  const result = calculateDaysDifference(startDate, endDate);

  // Assert
  expect(result).toBe(4);
});
```

## 🔧 Configuration

### Test Setup (`tests/setup.ts`)

```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/dom';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend expect with DOM matchers
expect.extend(matchers);

// Cleanup DOM after each test
afterEach(() => {
  cleanup();
});
```

### Vitest Config (`vitest.config.ts`)

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      reporter: ['text', 'HTML', 'JSON'],
      exclude: ['tests/**', 'dist/**'],
    },
  },
});
```

## 🐛 Debugging Tests

### Debug Failing Tests

```bash
# Run with verbose output
npm run test -- --reporter=verbose

# Run single test file for debugging
vitest run tests/unit/problematic-test.test.ts

# Use browser debugger
vitest --inspect-brk
```

### Common Issues

- **Async operations**: Ensure proper `await` usage
- **Mock cleanup**: Use `beforeEach` to reset mocks
- **DOM state**: Clean up DOM between tests
- **Timezone issues**: Use fixed dates in tests

---

_See [Development Guide](./development.md) for TDD workflow integration_
