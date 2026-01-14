# 2L Iteration Plan - Selah-me

## Project Vision

Selah-me is a minimal single-page web application that creates brief pauses returning the user to direct presence in life. It is not a productivity tool, wellness app, or meditation guide. It is a doorway that refuses to become important.

**Core Philosophy:** If selah-me is working correctly, usage decreases over time. That is success, not failure.

## What We Are Building (Iteration 1)

The complete working flow from opening question to exit sentence:

1. User opens the page
2. AI displays one opening question
3. User types a brief response
4. AI reflects the response in one plain sentence
5. AI delivers an exit sentence
6. Session ends - user closes tab

**Total interaction time:** 30 seconds maximum.

## Success Criteria

Specific, measurable criteria for MVP completion:

- [ ] User can open page and see a randomly selected opening question
- [ ] User can type a response (1-500 characters)
- [ ] User can submit and receive AI reflection + exit sentence
- [ ] AI responses follow system prompt constraints (plain, grounded, minimal)
- [ ] No persistence between page refreshes
- [ ] No conversation history
- [ ] No retry or back button functionality
- [ ] TypeScript compiles without errors (strict mode)
- [ ] All unit tests pass
- [ ] Test coverage >= 70%
- [ ] Environment variables properly secured (no NEXT_PUBLIC for keys)

## MVP Scope

**In Scope:**
- Next.js 15 project scaffold with App Router
- Single page UI (`app/page.tsx`)
- API route for AI proxy (`/api/selah`)
- Anthropic Claude integration with exact system prompt
- Opening questions list with random selection (8 questions)
- Exit sentences list with weighted random selection (8 sentences)
- Input validation (length, empty check)
- Basic error handling (validation, API errors, rate limit)
- Simple in-memory rate limiting
- Minimal visual styling (off-white background, black text, system font)
- Environment variable setup (.env.local, .env.example)
- Unit tests for lib functions
- Integration tests for API route with mocked AI

**Out of Scope (Post-MVP / Iteration 2):**
- Visual polish and fine-tuning
- Mobile responsiveness optimization
- Close-tab nudge behavior
- E2E tests with Playwright
- CI/CD pipeline
- Production deployment to Vercel
- Security review checklist

## Development Phases

1. **Exploration** - COMPLETE
2. **Planning** - CURRENT (this document)
3. **Building** - Estimated 4-6 hours (parallel builders)
4. **Integration** - Estimated 30 minutes
5. **Validation** - Estimated 30 minutes
6. **Deployment** - Deferred to Iteration 2

## Timeline Estimate

| Phase | Duration | Status |
|-------|----------|--------|
| Exploration | 30 min | COMPLETE |
| Planning | 30 min | COMPLETE |
| Building | 4-6 hours | PENDING |
| Integration | 30 min | PENDING |
| Validation | 30 min | PENDING |
| **Total** | **~6-8 hours** | |

## Risk Assessment

### High Risks

| Risk | Mitigation |
|------|------------|
| AI response format varies unexpectedly | Robust parsing with fallback defaults ("You are here." / "Close this now.") |
| AI tone drifts from "almost boring" to helpful/warm | System prompt is exact; manual testing required after implementation |

### Medium Risks

| Risk | Mitigation |
|------|------------|
| TypeScript strict mode causes friction | Proper typing from start; no `any` shortcuts |
| Test coverage falls short of 70% | Tests are required deliverable per builder task |
| Rate limiting edge cases | Simple implementation; manual verification |

### Low Risks

| Risk | Mitigation |
|------|------------|
| Tailwind purge removes needed styles | Production build verification |
| Environment variable misconfiguration | Clear .env.example with validation in code |

## Integration Strategy

Builder outputs will be merged in this order:

1. **Builder 1 (Foundation)** commits first - establishes project structure, types, and lib modules
2. **Builder 2 (API)** builds on foundation - API route depends on lib modules
3. **Builder 3 (UI)** completes the stack - Page component depends on types and API

**Conflict Prevention:**
- Each builder owns specific directories
- Types defined in `types/index.ts` by Builder 1 - shared by all
- Import paths use `@/` alias consistently
- No shared mutable state between modules

**Integration Points:**
- `lib/` modules are pure functions - no side effects, easy to test in isolation
- API route imports from lib - clear dependency direction
- Page component calls API route via fetch - loose coupling

## Deployment Plan

**Iteration 1:** Local development only. Run with `npm run dev`.

**Iteration 2:** Production deployment to Vercel with GitHub Actions CI/CD.

## Critical Implementation Notes

1. **System prompt must be used exactly as written in vision** - no modifications, improvements, or paraphrasing
2. **Questions end with period, not question mark** - "What is here." not "What is here?"
3. **No animations whatsoever** - vision explicitly prohibits them
4. **Error messages are intentionally terse** - "Something went wrong." is correct
5. **Forward-only flow** - no back buttons, no retries, no state resets
6. **Exit sentence selected server-side** - not by AI, for consistency and testability

---

*Plan created: 2026-01-14*
*Iteration: 1 - Core Loop*
*Mode: PRODUCTION*
