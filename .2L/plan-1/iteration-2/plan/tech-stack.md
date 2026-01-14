# Technology Stack - Iteration 2 Additions

## Existing Stack (Unchanged)

- **Framework:** Next.js 15 with App Router
- **React:** 19.0.0
- **Styling:** Tailwind CSS 3.4
- **AI:** Anthropic SDK 0.32.0
- **Testing:** Vitest 2.0 with 100% coverage
- **Node.js:** 20

## New Dependencies

### Playwright (E2E Testing)

**Package:** `@playwright/test`
**Version:** Latest (^1.40.0)

**Rationale:**
1. Industry standard for E2E testing
2. Excellent Next.js integration
3. Built-in web server management
4. Reliable waits and assertions
5. Cross-browser support (using Chromium only for speed)

**Installation:**
```bash
npm install -D @playwright/test
npx playwright install chromium
```

## No New Dependencies Needed

The following are already in place:
- Build tooling (Next.js handles everything)
- Deployment (Vercel auto-detects Next.js)
- CI/CD (GitHub Actions existing workflow)

## Vercel Configuration

**vercel.json:** Not required. Vercel auto-detects Next.js 15.

**Environment Variables (Vercel Dashboard):**
| Variable | Required | Notes |
|----------|----------|-------|
| `ANTHROPIC_API_KEY` | Yes | API key for Claude |

**Build Settings (All Defaults):**
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm ci`
- Node.js Version: 20

## Updated package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

## Updated CI Pipeline

```yaml
# Additional steps for E2E
- name: Install Playwright
  run: npx playwright install chromium --with-deps

- name: Run E2E tests
  run: npm run test:e2e
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

## next.config.ts Update

Add `outputFileTracingRoot` to silence lockfile warning:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
```

## Bundle Size (Unchanged)

| Route | Size | First Load JS |
|-------|------|---------------|
| `/` | 1.17 kB | 103 kB |
| `/api/selah` | 123 B | 102 kB |

No performance impact from Iteration 2 changes.

## Security Posture (Verified)

| Check | Status |
|-------|--------|
| API key server-side only | Yes (no NEXT_PUBLIC_) |
| .env.local in .gitignore | Yes |
| Input validation | Yes (max 500 chars) |
| Rate limiting | Yes (10 req/min) |
| Generic error messages | Yes |
| HTTPS | Yes (Vercel default) |
