# Testing Guide

This directory contains test utilities and setup files for the Impersonator Extension project.

## Test Framework

We use **Vitest** as our test framework along with **React Testing Library** for component tests.

### Why Vitest?

- ⚡ **Fast**: Built on Vite for instant test execution
- 🔄 **Watch mode**: Re-runs tests on file changes
- 📊 **Coverage**: Built-in code coverage with v8
- 🎨 **UI**: Optional browser-based UI for test exploration
- ✅ **Compatible**: Jest-compatible API

## Running Tests

```bash
# Run tests in watch mode (recommended during development)
yarn test

# Run tests once (for CI/CD)
yarn test:run

# Run tests with coverage report
yarn test:coverage

# Open Vitest UI in browser
yarn test:ui
```

## Test Structure

```
src/
├── test/
│   ├── setup.ts           # Global test setup
│   └── README.md          # This file
├── contexts/
│   └── __tests__/
│       └── NetworksContext.test.tsx
├── components/
│   └── Settings/
│       └── __tests__/
│           └── Chains.test.tsx
└── data/
    └── __tests__/
        └── defaultNetworks.test.ts
```

## Test Coverage

Our tests cover:

### Unit Tests
- **NetworksContext**: Merge logic, migration, enable/disable, reset
- **defaultNetworks**: Network data validation, utility functions

### Component Tests
- **Chains**: UI rendering, search, filtering, toggles

### Mocked APIs
- `chrome.storage.sync` - Browser storage API
- `chrome.tabs` - Browser tabs API
- `chrome.runtime` - Extension runtime API

## Writing Tests

### Example Unit Test

```typescript
import { describe, it, expect } from 'vitest';

describe('myFunction', () => {
  it('should return correct value', () => {
    const result = myFunction(input);
    expect(result).toBe(expected);
  });
});
```

### Example Component Test

```typescript
import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';

it('should render component', () => {
  render(
    <ChakraProvider>
      <MyComponent />
    </ChakraProvider>
  );

  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### Example Async Test with Chrome API

```typescript
import { vi } from 'vitest';

const mockStorageGet = vi.fn();
global.chrome = {
  storage: {
    sync: { get: mockStorageGet }
  }
} as any;

it('should load from storage', async () => {
  mockStorageGet.mockResolvedValue({ data: 'value' });

  const result = await loadFromStorage();

  expect(result).toBe('value');
});
```

## Test Best Practices

1. **Arrange-Act-Assert**: Structure tests clearly
   ```typescript
   it('should do something', () => {
     // Arrange
     const input = setupInput();

     // Act
     const result = doSomething(input);

     // Assert
     expect(result).toBe(expected);
   });
   ```

2. **Use descriptive test names**
   - ✅ `it('should return enabled networks when filtering')`
   - ❌ `it('works')`

3. **Test user behavior, not implementation**
   - ✅ `fireEvent.click(button); expect(screen.getByText('Success'))`
   - ❌ `component.setState({ clicked: true })`

4. **Clean up after each test**
   - Automatically handled by `afterEach(cleanup)` in setup.ts
   - Mock functions cleared with `vi.clearAllMocks()`

5. **Use `waitFor` for async operations**
   ```typescript
   await waitFor(() => {
     expect(screen.getByText('Loaded')).toBeInTheDocument();
   });
   ```

## Coverage Goals

| Metric | Target | Current |
|--------|--------|---------|
| Statements | >80% | TBD |
| Branches | >75% | TBD |
| Functions | >80% | TBD |
| Lines | >80% | TBD |

## CI/CD Integration

Tests run automatically on:
- Every commit (via GitHub Actions)
- Pull request creation
- Before deployment

## Troubleshooting

### Tests failing with "chrome is not defined"

Make sure `setup.ts` is importing correctly:
```typescript
import '@/test/setup';
```

### Component tests failing with theme errors

Wrap components in `ChakraProvider`:
```typescript
<ChakraProvider theme={theme}>
  <YourComponent />
</ChakraProvider>
```

### Async tests timing out

Increase timeout or check for missing `await`:
```typescript
await waitFor(() => {
  expect(result).toBeDefined();
}, { timeout: 5000 });
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
