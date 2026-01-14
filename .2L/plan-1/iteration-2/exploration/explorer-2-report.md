# Explorer 2: Deployment Requirements - Iteration 2

## Executive Summary

The selah-me application is well-structured for Vercel deployment with minimal configuration needed. The codebase has solid unit/integration tests (Vitest) but no E2E tests yet. Security fundamentals are already in place: API keys are server-side only, .gitignore covers secrets, and error messages are sanitized. Primary work needed: add Playwright for E2E testing, create README.md, and configure Vercel environment variables.

---

## Vercel Setup

### Configuration Requirements

**vercel.json is NOT required.** Vercel auto-detects Next.js 15 App Router projects and configures them correctly. The default build settings work perfectly.

### Environment Variables to Configure in Vercel

| Variable | Value | Notes |
|----------|-------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` | Required. Set in Vercel Dashboard > Settings > Environment Variables |

**Steps to deploy:**
1. Connect GitHub repo to Vercel
2. Add `ANTHROPIC_API_KEY` environment variable
3. Deploy - no other configuration needed

### Build Configuration (Already Correct)

- **Build Command:** `npm run build` (default)
- **Output Directory:** `.next` (default)
- **Install Command:** `npm ci` (default)
- **Node.js Version:** 20 (matches CI)

### Warning to Address

The build shows a warning about multiple lockfiles:
```
Warning: Next.js inferred your workspace root, but it may not be correct.
We detected multiple lockfiles...
```

**Recommendation:** Add to `next.config.ts`:
```typescript
const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
};
```

This silences the warning without affecting functionality.

---

## E2E Testing

### Current State

- **Playwright:** Not installed
- **E2E tests:** None exist
- **Unit tests:** Comprehensive (6 test files in `__tests__/`)
- **Coverage:** Good for lib functions and API route

### Playwright Setup Requirements

**1. Install Dependencies:**
```bash
npm install -D @playwright/test
npx playwright install chromium
```

**2. Create `playwright.config.ts`:**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
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
  },
});
```

**3. Add to `package.json`:**
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### Required E2E Tests

Create `e2e/selah-flow.spec.ts`:

| Test | Description | Priority |
|------|-------------|----------|
| Happy path | Load page, see question, type response, see reflection, see exit sentence, see close nudge | HIGH |
| Empty submit | Type nothing, button disabled | MEDIUM |
| Error display | Mock API error, see error message | MEDIUM |
| Question rotation | Verify question appears from allowed list | LOW |
| Mobile viewport | Test responsive layout | LOW |

**Minimum viable E2E test:**
```typescript
import { test, expect } from '@playwright/test';

test('complete selah session flow', async ({ page }) => {
  await page.goto('/');
  
  // Question is visible
  await expect(page.locator('p.text-lg')).toBeVisible();
  
  // Input is visible
  const textarea = page.locator('textarea');
  await expect(textarea).toBeVisible();
  await expect(textarea).toBeFocused();
  
  // Type and submit
  await textarea.fill('I feel present in this moment');
  await page.getByRole('button', { name: 'Continue' }).click();
  
  // Loading state
  await expect(page.getByRole('button', { name: '...' })).toBeVisible();
  
  // Session complete
  await expect(page.getByText('You can close this tab now.')).toBeVisible({ timeout: 10000 });
  
  // Input is gone
  await expect(textarea).not.toBeVisible();
});
```

### CI Integration

Add to `.github/workflows/ci.yml`:
```yaml
- name: Install Playwright
  run: npx playwright install chromium --with-deps

- name: Run E2E tests
  run: npm run test:e2e
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

**Note:** E2E tests require a real API key or mocking. For CI, consider:
1. Using a test API key with low rate limits
2. Mocking the API route for E2E tests using Playwright route interception

---

## Security Checklist

### Already Complete

| Item | Status | Location |
|------|--------|----------|
| API key server-side only | DONE | `ANTHROPIC_API_KEY` (no NEXT_PUBLIC_ prefix) |
| .env.local in .gitignore | DONE | `.gitignore` line 28-29 |
| .env.example committed | DONE | `/home/ahiya/Ahiya/selah-me/.env.example` |
| Error messages sanitized | DONE | API returns generic "Something went wrong." |
| No secrets in error responses | DONE | Tested in `__tests__/api/selah.test.ts` |
| Input validation | DONE | Max 500 chars, empty check |
| Rate limiting | DONE | 10 requests per minute per IP |

### To Verify Before Production

| Item | Action Required |
|------|-----------------|
| Verify .env.local not in git history | Run `git log --all --oneline -- .env.local` (should be empty) |
| HTTPS enforced | Vercel handles automatically |
| Rate limit in production | Current in-memory rate limiting resets on redeploy - acceptable for single-user app |

### Security Assessment: LOW RISK

This is a single-user, stateless application with:
- No database
- No user authentication
- No personal data storage
- Server-side only API key
- Input validation in place

---

## Documentation

### README.md Requirements

**File:** `/home/ahiya/Ahiya/selah-me/README.md` (does not exist)

**Minimal README template:**
```markdown
# selah

A brief pause.

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment file:
   ```bash
   cp .env.example .env.local
   ```
4. Add your Anthropic API key to `.env.local`
5. Run development server:
   ```bash
   npm run dev
   ```
6. Open http://localhost:3000

## Deployment

Deploy to Vercel:
1. Connect repository to Vercel
2. Add `ANTHROPIC_API_KEY` environment variable
3. Deploy
```

### .env.example Status: COMPLETE

Current content is sufficient:
```
ANTHROPIC_API_KEY=your-anthropic-api-key-here
```

---

## Production Optimizations

### Bundle Size Analysis

**Current build output (EXCELLENT):**

| Route | Size | First Load JS |
|-------|------|---------------|
| `/` (main page) | 1.17 kB | 103 kB |
| `/_not-found` | 994 B | 103 kB |
| `/api/selah` | 123 B | 102 kB |

**Shared JS:** 102 kB (includes React 19)

**Assessment:** Bundle sizes are optimal for this minimal application. No optimization needed.

### Performance Considerations

| Aspect | Status | Notes |
|--------|--------|-------|
| Static shell | GOOD | Page shell is pre-rendered |
| API route cold start | ACCEPTABLE | Single API route, fast |
| Image optimization | N/A | No images used |
| Font loading | EXCELLENT | Uses system font stack |
| CSS | MINIMAL | Tailwind with purge |

### Potential Improvements (Optional)

1. **Add loading skeleton:** The page currently returns `null` while question loads
   - Consider showing a minimal loading state instead
   - Low priority - question loads instantly client-side

2. **Response streaming:** Currently waits for full AI response
   - Could implement streaming for faster perceived response
   - Low priority - responses are very short (1-2 sentences)

---

## Deployment Tasks (Ordered)

### Pre-Deployment

1. **Fix lockfile warning** - Add `outputFileTracingRoot` to next.config.ts
2. **Create README.md** - Minimal setup instructions
3. **Install Playwright** - Add dev dependency
4. **Create playwright.config.ts** - Configure for Chromium + dev server
5. **Write E2E test** - At minimum: happy path flow
6. **Update package.json** - Add `test:e2e` script
7. **Update CI workflow** - Add Playwright install and E2E test step

### Deployment

8. **Connect to Vercel** - Link GitHub repository
9. **Set environment variable** - Add `ANTHROPIC_API_KEY` in Vercel dashboard
10. **Deploy** - Trigger first deployment
11. **Verify** - Test full flow on production URL

### Post-Deployment

12. **Document production URL** - Add to README if desired
13. **Monitor** - Check Vercel deployment logs for any issues

---

## Questions for Planner

1. **E2E API mocking:** Should E2E tests use real API calls or mock the Anthropic API? Real calls provide true end-to-end testing but require API key and incur costs.

2. **Mobile testing:** Should Playwright tests include mobile viewports? The app is mobile-responsive but not explicitly tested.

3. **Error boundary:** Should we add a React error boundary around the main component for production resilience?

---

## File Summary

| File | Exists | Needs Changes |
|------|--------|---------------|
| `vercel.json` | No | Not needed |
| `next.config.ts` | Yes | Add outputFileTracingRoot |
| `README.md` | No | Create minimal |
| `.env.example` | Yes | Complete |
| `.gitignore` | Yes | Complete |
| `playwright.config.ts` | No | Create |
| `e2e/selah-flow.spec.ts` | No | Create |
| `package.json` | Yes | Add test:e2e script |
| `.github/workflows/ci.yml` | Yes | Add Playwright steps |
