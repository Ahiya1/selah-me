# 2L Iteration 2 Plan - Selah Polish and Deployment

## Project Vision

Iteration 2 finalizes the selah application for production. The core loop is complete and tested (100% coverage). This iteration focuses on:
1. Minor UX refinement (close-tab nudge wording)
2. E2E test infrastructure with Playwright
3. CI/CD pipeline enhancement
4. Production deployment to Vercel
5. Documentation (README.md)

## Success Criteria

Specific, measurable criteria for Iteration 2 completion:

- [ ] Close-tab nudge uses direct wording: "Close this tab."
- [ ] Playwright installed and configured
- [ ] E2E happy-path test passes locally
- [ ] E2E test runs in CI pipeline
- [ ] README.md exists with setup instructions
- [ ] next.config.ts lockfile warning resolved
- [ ] Application deployed to Vercel
- [ ] ANTHROPIC_API_KEY configured in Vercel
- [ ] Production URL works end-to-end

## Iteration 2 Scope

**In Scope:**
- Fix close-tab nudge wording (vision compliance)
- Install Playwright and create config
- Write E2E happy-path test
- Update CI workflow for E2E tests
- Add test:e2e script to package.json
- Create README.md with setup instructions
- Fix next.config.ts lockfile warning
- Deploy to Vercel using CLI
- Set ANTHROPIC_API_KEY in Vercel environment
- Verify production deployment

**Out of Scope (Not Needed):**
- Visual design changes (already matches vision)
- Additional unit tests (100% coverage exists)
- Response streaming (short responses)
- Error boundary (simple single-page app)
- Mobile viewport E2E tests (manual verification sufficient)

## Development Phases

1. **Exploration** - Complete
2. **Planning** - Current
3. **Building** - 2 parallel builders (~1 hour each)
4. **Integration** - Not needed (independent tasks)
5. **Validation** - 15 minutes
6. **Deployment** - Included in Builder 2 scope

## Timeline Estimate

- Exploration: Complete
- Planning: Complete
- Building: ~1 hour (2 parallel builders)
- Validation: ~15 minutes
- Total: ~1.5 hours

## Risk Assessment

### Low Risks
- **Vercel deployment issues:** Next.js is well-supported; auto-detection works
- **Playwright CI flakiness:** Mitigated with retries and proper waits

### Minimal Risks
- **API key exposure:** Already server-side only, verified in exploration
- **Security vulnerabilities:** Minimal attack surface, input validation exists

## Integration Strategy

Builders work on independent tasks:
- Builder 1: Code changes (SessionComplete, Playwright, CI)
- Builder 2: Documentation and deployment (README, Vercel)

No file conflicts expected. Builders can merge outputs directly.

## Deployment Plan

1. Builder 2 runs `npx vercel` CLI
2. Connects GitHub repository to Vercel
3. Sets ANTHROPIC_API_KEY environment variable
4. Triggers production deployment
5. Verifies production URL works

## Files to Modify

| File | Builder | Change |
|------|---------|--------|
| `components/SessionComplete.tsx` | 1 | Fix nudge wording |
| `package.json` | 1 | Add Playwright + test:e2e script |
| `playwright.config.ts` | 1 | Create new |
| `e2e/selah-flow.spec.ts` | 1 | Create new |
| `.github/workflows/ci.yml` | 1 | Add Playwright steps |
| `next.config.ts` | 2 | Add outputFileTracingRoot |
| `README.md` | 2 | Create new |
