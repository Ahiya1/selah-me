# Code Patterns and Conventions - Iteration 2

## File Structure

```
selah-me/
├── app/
│   ├── api/selah/route.ts    # API endpoint
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main page
├── components/
│   ├── SelahContainer.tsx    # Main state container
│   ├── SelahInput.tsx        # Input form
│   └── SessionComplete.tsx   # Completion view
├── lib/
│   ├── questions.ts          # Question pool
│   ├── exits.ts              # Exit sentences
│   ├── prompts.ts            # AI prompts
│   ├── validation.ts         # Input validation
│   └── rate-limit.ts         # Rate limiting
├── e2e/                      # NEW: E2E tests
│   └── selah-flow.spec.ts    # Happy path test
├── __tests__/                # Unit tests
├── playwright.config.ts      # NEW: Playwright config
└── README.md                 # NEW: Documentation
```

## E2E Test Patterns

### Playwright Configuration

**File:** `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

**Key configuration decisions:**
- Single browser (Chromium) for speed
- CI uses single worker to avoid flakiness
- Web server auto-starts dev server
- GitHub reporter for CI visibility
- Retries only in CI (2 retries)

### E2E Test Structure

**File:** `e2e/selah-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Selah Session Flow', () => {
  test('completes full session from question to close nudge', async ({ page }) => {
    // Navigate to home
    await page.goto('/');

    // Verify question appears
    const question = page.locator('p.text-lg');
    await expect(question).toBeVisible();
    await expect(question).not.toBeEmpty();

    // Verify input is focused
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    await expect(textarea).toBeFocused();

    // Verify submit button exists
    const submitButton = page.getByRole('button', { name: 'Continue' });
    await expect(submitButton).toBeVisible();

    // Type response
    await textarea.fill('I am present in this moment.');

    // Submit
    await submitButton.click();

    // Verify loading state
    await expect(page.getByRole('button', { name: '...' })).toBeVisible();

    // Wait for session complete (AI response may take time)
    await expect(page.getByText('Close this tab.')).toBeVisible({
      timeout: 15000,
    });

    // Verify input is gone (session is complete)
    await expect(textarea).not.toBeVisible();

    // Verify no retry/continue button exists
    await expect(
      page.getByRole('button', { name: 'Continue' })
    ).not.toBeVisible();
  });

  test('prevents empty submission', async ({ page }) => {
    await page.goto('/');

    const textarea = page.locator('textarea');
    const submitButton = page.getByRole('button', { name: 'Continue' });

    await expect(textarea).toBeVisible();
    await expect(submitButton).toBeVisible();

    // Empty textarea - button should be disabled
    await expect(textarea).toHaveValue('');
    await expect(submitButton).toBeDisabled();

    // Type something - button should be enabled
    await textarea.fill('test');
    await expect(submitButton).toBeEnabled();

    // Clear - button should be disabled again
    await textarea.fill('');
    await expect(submitButton).toBeDisabled();
  });
});
```

### E2E Test Naming Convention

- Test files: `{feature}.spec.ts` in `e2e/` directory
- Test descriptions: User-focused behavior descriptions
- Use `test.describe()` for grouping related tests

### E2E Selector Strategy

**Priority order (most reliable first):**
1. `getByRole()` - accessibility-based, most stable
2. `getByText()` - visible text content
3. CSS selectors with semantic classes - fallback

```typescript
// Preferred: role-based
page.getByRole('button', { name: 'Continue' })
page.getByRole('textbox')

// Acceptable: text-based
page.getByText('Close this tab.')

// Fallback: CSS selector
page.locator('p.text-lg')
page.locator('textarea')
```

### E2E Wait Patterns

```typescript
// Wait for element visibility with timeout
await expect(element).toBeVisible({ timeout: 15000 });

// Wait for navigation
await page.waitForURL('/some-path');

// Wait for network idle (use sparingly)
await page.waitForLoadState('networkidle');
```

## CI/CD Patterns

### Updated CI Workflow

**File:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  quality:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: TypeScript typecheck
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Run unit tests
        run: npm run test -- --run

      - name: Install Playwright
        run: npx playwright install chromium --with-deps

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

      - name: Build
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: npm run build
```

**Key improvements:**
- Added `concurrency` to cancel outdated runs
- Playwright installation before E2E tests
- E2E tests with API key from secrets
- Single job for simplicity (small project)

### CI Debugging Pattern

If E2E tests fail in CI:

```yaml
# Add artifact upload for debugging
- name: Upload Playwright report
  uses: actions/upload-artifact@v4
  if: failure()
  with:
    name: playwright-report
    path: playwright-report/
    retention-days: 7
```

## Vercel Deployment Patterns

### CLI Deployment

```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Deploy from project root
cd /home/ahiya/Ahiya/selah-me
npx vercel

# Follow prompts:
# - Link to existing project? No (first time)
# - What's your project name? selah-me
# - Directory? ./ (default)
# - Override settings? No

# Set environment variable
npx vercel env add ANTHROPIC_API_KEY production

# Deploy to production
npx vercel --prod
```

### Vercel Environment Variables

Set via CLI:
```bash
npx vercel env add ANTHROPIC_API_KEY production
# Paste the API key value when prompted
```

Or via Vercel Dashboard:
1. Go to project settings
2. Navigate to Environment Variables
3. Add `ANTHROPIC_API_KEY` with value
4. Select "Production" environment

### Vercel Deployment Verification

```bash
# Get deployment URL
npx vercel ls

# Test production
curl -s https://selah-me.vercel.app | head -20
```

## README Pattern

**File:** `README.md`

```markdown
# selah

A brief pause.

## Setup

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd selah-me
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env.local
   ```

4. Add your Anthropic API key to `.env.local`:
   ```
   ANTHROPIC_API_KEY=your-key-here
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

6. Open http://localhost:3000

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests |
| `npm run lint` | Check code quality |
| `npm run typecheck` | Check TypeScript types |

## Deployment

Deploy to Vercel:

1. Push to GitHub
2. Connect repository to Vercel
3. Add `ANTHROPIC_API_KEY` environment variable
4. Deploy
```

**README principles (per vision):**
- Minimal, practical content
- Setup instructions only
- No marketing language
- No feature descriptions
- Commands in table format for clarity

## Testing Patterns (Production Mode)

### Test File Naming Conventions

| Test Type | Pattern | Location |
|-----------|---------|----------|
| Unit tests | `{module}.test.ts` | `__tests__/` directory |
| E2E tests | `{feature}.spec.ts` | `e2e/` directory |

### Coverage Expectations

| Module Type | Minimum | Current |
|-------------|---------|---------|
| API routes | 80% | 100% |
| lib utilities | 90% | 100% |
| Overall | 80% | 100% |

### Test Data Pattern

```typescript
// Consistent test input
const validInput = 'I am present in this moment.';
const emptyInput = '';
const maxLengthInput = 'a'.repeat(500);
const overLengthInput = 'a'.repeat(501);
```

## Security Patterns (Production Mode)

### Environment Variable Access

```typescript
// Server-side only - correct
const apiKey = process.env.ANTHROPIC_API_KEY;

// NEVER expose to client
// WRONG: const apiKey = process.env.NEXT_PUBLIC_API_KEY;
```

### Input Validation Pattern

```typescript
// lib/validation.ts - already implemented
const MAX_INPUT_LENGTH = 500;

export function validateInput(input: unknown): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }
  if (!input.trim()) {
    throw new Error('Input cannot be empty');
  }
  if (input.length > MAX_INPUT_LENGTH) {
    throw new Error(`Input cannot exceed ${MAX_INPUT_LENGTH} characters`);
  }
  return input.trim();
}
```

### Error Response Pattern

```typescript
// API error responses - generic messages only
return NextResponse.json(
  { error: 'Something went wrong.' },
  { status: 500 }
);

// NEVER expose internal details:
// WRONG: { error: error.message, stack: error.stack }
```

## Error Handling Patterns (Production Mode)

### API Error Handling

```typescript
// app/api/selah/route.ts pattern
try {
  // ... process request
} catch (error) {
  console.error('API error:', error); // Log for debugging
  return NextResponse.json(
    { error: 'Something went wrong.' },
    { status: 500 }
  );
}
```

### Client Error Display

```typescript
// components/SelahContainer.tsx pattern
const [error, setError] = useState<string | null>(null);

// On API error
setError('Something went wrong. Please try again.');

// Display
{error && <p className="text-red-600 text-sm">{error}</p>}
```

## Component Update Pattern

### SessionComplete Nudge Fix

**Before:**
```typescript
<p className="text-sm text-gray-500 mt-8">You can close this tab now.</p>
```

**After:**
```typescript
<p className="text-sm text-gray-500 mt-8">Close this tab.</p>
```

**Rationale:** Vision emphasizes directness. "Close this tab." is more aligned with exit sentence examples like "Close this now."

## next.config.ts Pattern

**Updated configuration:**
```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
```

**Purpose:** Silences the lockfile warning during Vercel builds without affecting functionality.

## Import Order Convention

```typescript
// 1. External packages
import { test, expect } from '@playwright/test';

// 2. Next.js imports
import { NextResponse } from 'next/server';

// 3. React imports
import { useState, useEffect } from 'react';

// 4. Internal modules (absolute paths)
import { validateInput } from '@/lib/validation';

// 5. Types
import type { NextConfig } from 'next';
```

## Code Quality Standards

- TypeScript strict mode enabled
- ESLint with Next.js config
- No `any` types
- All functions have return types
- All async functions use try/catch
- No unused variables or imports
