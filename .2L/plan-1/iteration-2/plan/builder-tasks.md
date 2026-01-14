# Builder Task Breakdown - Iteration 2

## Overview

2 builders working in parallel on independent tasks.
No file conflicts expected between builders.
Estimated completion: ~1 hour each.

## Builder Assignment Strategy

- **Builder 1:** Code changes (component fix, E2E setup, CI update)
- **Builder 2:** Documentation and deployment (README, config fix, Vercel)

Tasks are independent - no blocking dependencies between builders.

---

## Builder-1: Polish + E2E Testing

### Scope

Fix the close-tab nudge wording for vision compliance, set up Playwright E2E testing infrastructure, and update CI pipeline to run E2E tests.

### Complexity Estimate

**MEDIUM**

Multiple files to create/modify, but straightforward patterns provided. No need to split.

### Success Criteria

- [ ] Close-tab nudge reads "Close this tab." (not "You can close this tab now.")
- [ ] `@playwright/test` installed as dev dependency
- [ ] `playwright.config.ts` created and configured
- [ ] `e2e/selah-flow.spec.ts` created with happy-path test
- [ ] `test:e2e` script added to package.json
- [ ] E2E test passes locally: `npm run test:e2e`
- [ ] CI workflow updated with Playwright steps
- [ ] All existing tests still pass: `npm run test -- --run`

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `components/SessionComplete.tsx` | Modify | Fix nudge wording |
| `package.json` | Modify | Add Playwright dependency + script |
| `playwright.config.ts` | Create | Playwright configuration |
| `e2e/selah-flow.spec.ts` | Create | E2E happy-path test |
| `.github/workflows/ci.yml` | Modify | Add Playwright install + E2E steps |

### Dependencies

**Depends on:** Nothing
**Blocks:** Nothing (independent of Builder 2)

### Implementation Notes

1. **SessionComplete.tsx change:**
   - Line 11: Change `"You can close this tab now."` to `"Close this tab."`
   - Single line change, no structural modifications

2. **Playwright installation:**
   ```bash
   npm install -D @playwright/test
   npx playwright install chromium
   ```

3. **package.json script additions:**
   ```json
   "test:e2e": "playwright test",
   "test:e2e:ui": "playwright test --ui"
   ```

4. **E2E test considerations:**
   - Use 15 second timeout for AI response wait
   - Test both happy path and empty submission prevention
   - Use role-based selectors for reliability

5. **CI workflow additions:**
   - Add `concurrency` group to cancel outdated runs
   - Install Playwright with `--with-deps` for headless browser support
   - Run E2E tests with API key from secrets

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use Playwright Configuration pattern for `playwright.config.ts`
- Use E2E Test Structure pattern for `selah-flow.spec.ts`
- Use Updated CI Workflow pattern for `.github/workflows/ci.yml`
- Use E2E Selector Strategy (prefer `getByRole()`)

### Testing Requirements

- Run existing unit tests: `npm run test -- --run`
- Run new E2E tests: `npm run test:e2e`
- Verify CI workflow syntax with: `npx yaml-lint .github/workflows/ci.yml` (if available)

### Verification Steps

```bash
# 1. Verify nudge fix
grep "Close this tab" components/SessionComplete.tsx

# 2. Verify Playwright installed
grep "@playwright/test" package.json

# 3. Run E2E tests locally
npm run test:e2e

# 4. Verify all existing tests pass
npm run test -- --run
```

---

## Builder-2: Documentation + Deployment

### Scope

Create README.md documentation, fix the next.config.ts lockfile warning, and deploy the application to Vercel with proper environment configuration.

### Complexity Estimate

**MEDIUM**

Deployment involves external service (Vercel) but is well-documented. README is minimal.

### Success Criteria

- [ ] README.md created with setup instructions
- [ ] README follows minimal style (no marketing, just setup)
- [ ] next.config.ts has `outputFileTracingRoot` added
- [ ] Build runs without lockfile warning
- [ ] Application deployed to Vercel
- [ ] ANTHROPIC_API_KEY set in Vercel environment
- [ ] Production URL responds correctly
- [ ] Full session flow works on production

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `README.md` | Create | Setup documentation |
| `next.config.ts` | Modify | Add outputFileTracingRoot |

### External Actions (Not Files)

- Install Vercel CLI: `npm install -g vercel`
- Run `npx vercel` to link and deploy
- Set `ANTHROPIC_API_KEY` environment variable in Vercel
- Run `npx vercel --prod` for production deployment

### Dependencies

**Depends on:** Nothing
**Blocks:** Nothing (independent of Builder 1)

### Implementation Notes

1. **README.md content:**
   - Keep minimal per vision: "Almost boring"
   - Setup steps only
   - Commands table for clarity
   - No feature descriptions or marketing
   - See README Pattern in patterns.md

2. **next.config.ts update:**
   ```typescript
   import type { NextConfig } from 'next';

   const nextConfig: NextConfig = {
     outputFileTracingRoot: process.cwd(),
   };

   export default nextConfig;
   ```

3. **Vercel deployment sequence:**
   ```bash
   # First-time setup
   npx vercel
   # Answer prompts (project name: selah-me, defaults for rest)

   # Add environment variable
   npx vercel env add ANTHROPIC_API_KEY production
   # Paste API key when prompted

   # Production deployment
   npx vercel --prod
   ```

4. **Production verification:**
   - Navigate to production URL
   - Complete full session flow
   - Verify AI response appears
   - Verify close-tab nudge displays

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use README Pattern for documentation format
- Use next.config.ts Pattern for config update
- Use CLI Deployment pattern for Vercel setup

### Testing Requirements

- Build locally to verify no warnings: `npm run build`
- Verify README renders correctly (view on GitHub or locally)
- Test production URL manually after deployment

### Verification Steps

```bash
# 1. Verify README exists
cat README.md

# 2. Verify next.config.ts update
grep "outputFileTracingRoot" next.config.ts

# 3. Verify build has no lockfile warning
npm run build 2>&1 | grep -i "lockfile"  # Should have no output

# 4. Verify Vercel deployment
npx vercel ls

# 5. Test production URL (replace with actual URL)
curl -s https://selah-me.vercel.app | head -5
```

---

## Builder Execution Summary

### Parallel Execution

Both builders can start immediately and work in parallel:

| Builder | Focus | Estimated Time |
|---------|-------|----------------|
| Builder-1 | Component fix, Playwright, CI | ~45 minutes |
| Builder-2 | README, Config, Vercel | ~45 minutes |

### No Integration Needed

Builders work on completely separate files:
- Builder 1: `SessionComplete.tsx`, `playwright.config.ts`, `e2e/*`, `ci.yml`, `package.json`
- Builder 2: `README.md`, `next.config.ts`

Only `package.json` might have a minor merge if both modify it, but:
- Builder 1 adds dependencies and scripts
- Builder 2 does not modify package.json

### Post-Build Verification

After both builders complete:

1. Run full test suite:
   ```bash
   npm run test -- --run
   npm run test:e2e
   ```

2. Verify build:
   ```bash
   npm run build
   ```

3. Check production:
   - Visit production URL
   - Complete full session
   - Verify "Close this tab." appears

### Final Checklist

- [ ] Close-tab nudge is direct
- [ ] E2E tests pass
- [ ] CI has E2E step
- [ ] README exists
- [ ] No lockfile warning
- [ ] Vercel deployment live
- [ ] Production works end-to-end

---

## Appendix: Quick Reference Commands

### Builder 1 Commands
```bash
# Install Playwright
npm install -D @playwright/test
npx playwright install chromium

# Run E2E tests
npm run test:e2e

# Run all tests
npm run test -- --run
```

### Builder 2 Commands
```bash
# Verify build
npm run build

# Deploy to Vercel
npx vercel
npx vercel env add ANTHROPIC_API_KEY production
npx vercel --prod

# Check deployment
npx vercel ls
```
