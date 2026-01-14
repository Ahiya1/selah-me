# Builder Task Breakdown

## Overview

**3 primary builders** will work in parallel with defined dependencies.

| Builder | Focus | Complexity | Est. Time |
|---------|-------|------------|-----------|
| Builder 1 | Project scaffold, types, lib modules | MEDIUM | 2-3 hours |
| Builder 2 | API route, AI integration, env setup | MEDIUM | 2-3 hours |
| Builder 3 | Page component, UI components, styling | MEDIUM | 2-3 hours |

**Total parallel time:** ~2-3 hours (builders work simultaneously)
**Integration time:** ~30 minutes

## Builder Assignment Strategy

- **Builder 1** establishes foundation (types, lib modules) - commits first
- **Builder 2** depends on lib modules from Builder 1
- **Builder 3** depends on types from Builder 1 and API from Builder 2
- Each builder owns specific directories to prevent conflicts
- All builders must include tests for their work (PRODUCTION mode)

---

## Builder 1: Foundation

### Scope

Establish the project scaffold, type definitions, and all pure library modules. This builder creates the foundation that other builders depend on.

### Complexity Estimate

**MEDIUM**

Straightforward implementation of pure functions and type definitions. No external dependencies or complex logic.

### Success Criteria

- [ ] Next.js 15 project initialized with TypeScript strict mode
- [ ] Tailwind CSS configured with minimal theme (selah-bg, selah-text colors)
- [ ] All type definitions in `types/index.ts`
- [ ] `lib/prompts.ts` with exact system prompt from vision
- [ ] `lib/questions.ts` with all 8 questions and `getRandomQuestion()`
- [ ] `lib/exits.ts` with all 8 exits and `getRandomExitSentence()`
- [ ] `lib/validation.ts` with `validateSelahRequest()` and `validateUserMessage()`
- [ ] `lib/rate-limit.ts` with `checkRateLimit()` and `resetRateLimit()`
- [ ] Unit tests for all lib functions
- [ ] Test coverage >= 70% for lib modules
- [ ] TypeScript compiles without errors

### Files to Create

```
selah-me/
├── app/
│   ├── globals.css           # Tailwind imports
│   └── layout.tsx            # Root layout with minimal styling
├── lib/
│   ├── prompts.ts            # System prompt constant
│   ├── questions.ts          # Opening questions + selection
│   ├── exits.ts              # Exit sentences + selection
│   ├── validation.ts         # Input validation functions
│   └── rate-limit.ts         # Rate limiting logic
├── types/
│   └── index.ts              # All TypeScript type definitions
├── __tests__/
│   └── lib/
│       ├── validation.test.ts
│       ├── questions.test.ts
│       ├── exits.test.ts
│       └── rate-limit.test.ts
├── .env.example              # Environment template
├── .gitignore                # Include .env.local
├── tailwind.config.ts        # Minimal Tailwind config
├── postcss.config.mjs        # PostCSS config
├── vitest.config.ts          # Vitest configuration
├── tsconfig.json             # TypeScript strict config
├── next.config.ts            # Next.js config
└── package.json              # Dependencies and scripts
```

### Dependencies

**Depends on:** Nothing (first builder)

**Blocks:** Builder 2, Builder 3

### Implementation Notes

1. **System prompt must be exact** - Copy verbatim from vision document in patterns.md
2. **Questions end with period** - "What is here." not "What is here?"
3. **Exit weighting** - Primary exits should be 3x more likely than secondary
4. **Validation** - Return discriminated union, not throw errors
5. **Rate limiting** - Simple in-memory Map is sufficient

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use Type Definitions pattern for `types/index.ts`
- Use Questions Module pattern for `lib/questions.ts`
- Use Exits Module pattern for `lib/exits.ts`
- Use Validation Module pattern for `lib/validation.ts`
- Use Rate Limiting Module pattern for `lib/rate-limit.ts`
- Use Vitest Configuration pattern for `vitest.config.ts`
- Use Unit Test patterns for all test files

### Testing Requirements

| Module | Tests Required | Coverage Target |
|--------|----------------|-----------------|
| `validation.ts` | 8+ test cases | 90% |
| `questions.ts` | 5+ test cases | 90% |
| `exits.ts` | 4+ test cases | 90% |
| `rate-limit.ts` | 5+ test cases | 90% |

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:coverage": "vitest --coverage"
  }
}
```

### Dependencies to Install

**Production:**
- `next@15`
- `react@19`
- `react-dom@19`

**Development:**
- `typescript@5`
- `@types/node`
- `@types/react`
- `@types/react-dom`
- `tailwindcss@3`
- `postcss`
- `vitest`
- `@vitejs/plugin-react`
- `jsdom`
- `@vitest/coverage-v8`
- `eslint`
- `eslint-config-next@15`

---

## Builder 2: API Route

### Scope

Implement the API route that proxies AI requests to Anthropic Claude, including environment validation, error handling, and response parsing.

### Complexity Estimate

**MEDIUM**

Requires careful handling of external API, error cases, and response parsing. Mocking for tests adds complexity.

### Success Criteria

- [ ] API route at `/api/selah` accepting POST requests
- [ ] Anthropic SDK integration with exact system prompt
- [ ] Request validation using `lib/validation.ts`
- [ ] Rate limiting using `lib/rate-limit.ts`
- [ ] Proper error handling (validation, rate limit, API errors, config errors)
- [ ] Exit sentence selected server-side (not by AI)
- [ ] API key validated server-side only
- [ ] Integration tests with mocked Anthropic client
- [ ] Test coverage >= 70% for API route
- [ ] No sensitive information in error responses

### Files to Create

```
selah-me/
├── app/
│   └── api/
│       └── selah/
│           └── route.ts      # POST handler
├── lib/
│   └── ai.ts                 # Anthropic client wrapper (optional)
└── __tests__/
    └── api/
        └── selah.test.ts     # API route tests
```

### Dependencies

**Depends on:** Builder 1 (lib modules, types)

**Blocks:** Builder 3 (API must work for UI integration)

### Implementation Notes

1. **API key server-side only** - Never use `NEXT_PUBLIC_` prefix
2. **Exit sentence server-side** - Call `getRandomExitSentence()` in route, not AI
3. **AI response parsing** - AI returns reflection only; route adds exit
4. **Error messages terse** - "Something went wrong." is correct
5. **Rate limit by IP** - Use `x-forwarded-for` header or "anonymous"
6. **Never log API keys** - Log errors but sanitize sensitive data

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use Standard POST Handler pattern for `app/api/selah/route.ts`
- Use API Route Test Pattern for `__tests__/api/selah.test.ts`
- Use Security Patterns for API key handling
- Use Error Handling Patterns for consistent responses

### Testing Requirements

| Test Case | Description |
|-----------|-------------|
| Missing message | Returns 400 validation_error |
| Empty message | Returns 400 validation_error |
| Missing question | Returns 400 validation_error |
| Valid request | Returns 200 with reflection and exitSentence |
| Missing API key | Returns 500 config_error |
| Rate limit exceeded | Returns 429 rate_limit |
| AI API error | Returns 500 api_error |
| No sensitive info leaked | Error responses sanitized |

### Mocking Strategy

```typescript
// Mock Anthropic SDK at module level
vi.mock('@anthropic-ai/sdk', () => {
  const mockCreate = vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'There is presence here.' }],
  });

  return {
    default: vi.fn().mockImplementation(() => ({
      messages: { create: mockCreate },
    })),
    RateLimitError: class RateLimitError extends Error {},
  };
});
```

### Additional Dependencies

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "latest"
  }
}
```

---

## Builder 3: UI Components

### Scope

Implement the page component and UI components that handle the user interaction flow from question display to session completion.

### Complexity Estimate

**MEDIUM**

State management for linear flow is straightforward. Main complexity is handling loading states and error display correctly.

### Success Criteria

- [ ] Main page component at `app/page.tsx` with state management
- [ ] `SelahInput` component with textarea and submit button
- [ ] `SessionComplete` component with reflection, exit, and close nudge
- [ ] Random question selected on page load (client-side)
- [ ] Forward-only flow (no back, no retry, no reset)
- [ ] Loading state with disabled input
- [ ] Error display that allows retry
- [ ] Minimal styling per vision (no animations, no colors, no decoration)
- [ ] TypeScript compiles without errors
- [ ] Components render correctly in all phases

### Files to Create

```
selah-me/
├── app/
│   └── page.tsx              # Main page component
└── components/
    ├── SelahInput.tsx        # Text input with submit
    └── SessionComplete.tsx   # End state display
```

### Dependencies

**Depends on:** Builder 1 (types, lib modules), Builder 2 (API route)

**Blocks:** Nothing (final builder)

### Implementation Notes

1. **Client Component** - Page must be `'use client'` for state
2. **Question on mount** - Use `useEffect` to select question client-side
3. **Don't render until question loaded** - Return `null` while question is empty
4. **Forward-only flow** - No way to go back or retry (except error -> input)
5. **No animations** - No `transition-*`, no `animate-*`
6. **Loading indicator** - Simple "..." text, not spinner
7. **Close tab nudge** - Subtle text: "You can close this tab now."

### Patterns to Follow

Reference patterns from `patterns.md`:
- Use Client Component Structure pattern for `app/page.tsx`
- Use Input Component Pattern for `components/SelahInput.tsx`
- Use Session Complete Component Pattern for `components/SessionComplete.tsx`
- Use Styling Patterns for all visual elements

### State Machine

```
┌──────────┐
│  input   │ ← Initial state, question displayed
└────┬─────┘
     │ (user submits)
     ▼
┌──────────┐
│ loading  │ ← Input disabled, "..." shown
└────┬─────┘
     │
     ├──── (success) ────▶ ┌──────────┐
     │                      │ complete │ ← Reflection + exit shown
     │                      └──────────┘
     │
     └──── (error) ────▶ [back to input with error message]
```

### Visual Requirements

| Element | Styling |
|---------|---------|
| Container | `max-w-md mx-auto px-6 py-16` |
| Question | `text-lg` |
| Textarea | `w-full p-4 border border-gray-300 resize-none` |
| Button | `px-6 py-2 border border-selah-text` |
| Reflection | `text-base` |
| Exit sentence | `text-base font-medium` |
| Close nudge | `text-sm text-gray-500 mt-8` |
| Error | `text-red-600 text-sm` |

### Testing Note

Component tests are deferred to Iteration 2. For Iteration 1, manual testing is sufficient for UI components. Focus testing effort on lib modules and API route.

---

## Builder Execution Order

### Phase 1: Foundation (Builder 1)

Builder 1 works independently to establish:
- Project scaffold
- Type definitions
- All lib modules
- Unit tests

**Commit when:** All lib tests pass, TypeScript compiles

### Phase 2: API + UI (Builders 2 & 3 in parallel)

After Builder 1 commits:

**Builder 2:**
- Pulls Builder 1's work
- Implements API route
- Adds API tests

**Builder 3:**
- Pulls Builder 1's work
- Implements UI components
- Can mock API initially if needed

### Phase 3: Integration

After Builders 2 & 3 commit:
- Merge all branches
- Run full test suite
- Manual end-to-end testing
- Fix any integration issues

---

## Integration Notes

### Shared Files (Owned by Builder 1)

| File | Owner | Consumers |
|------|-------|-----------|
| `types/index.ts` | Builder 1 | All builders |
| `lib/validation.ts` | Builder 1 | Builder 2 |
| `lib/questions.ts` | Builder 1 | Builder 3 |
| `lib/exits.ts` | Builder 1 | Builder 2 |
| `lib/prompts.ts` | Builder 1 | Builder 2 |
| `lib/rate-limit.ts` | Builder 1 | Builder 2 |

### Potential Conflict Areas

| Area | Risk | Mitigation |
|------|------|------------|
| `package.json` | MEDIUM | Builder 1 creates, others add deps in separate commits |
| `app/layout.tsx` | LOW | Builder 1 creates, no modifications needed |
| `app/globals.css` | LOW | Builder 1 creates, no modifications needed |

### Import Path Convention

All builders must use `@/` alias for imports:

```typescript
// CORRECT
import { validateSelahRequest } from '@/lib/validation';
import type { SelahRequest } from '@/types';

// WRONG
import { validateSelahRequest } from '../lib/validation';
```

---

## Validation Checklist

Before marking iteration complete:

### Builder 1 Checklist
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] Coverage >= 70% for lib modules
- [ ] `.env.example` exists with placeholder

### Builder 2 Checklist
- [ ] API returns correct response format
- [ ] Validation errors return 400
- [ ] Rate limit errors return 429
- [ ] API errors return 500 with sanitized message
- [ ] API key never exposed in responses
- [ ] All API tests pass

### Builder 3 Checklist
- [ ] Page loads with random question
- [ ] User can type and submit
- [ ] Loading state disables input
- [ ] Success shows reflection and exit
- [ ] Error allows retry
- [ ] No animations present
- [ ] Styling matches vision (minimal, boring)

### Integration Checklist
- [ ] Full flow works: question -> input -> submit -> reflection -> exit
- [ ] Refresh loads new random question
- [ ] Error handling works end-to-end
- [ ] `npm run build` succeeds
- [ ] No TypeScript errors
- [ ] All tests pass
- [ ] Coverage >= 70% overall

---

*Task breakdown created: 2026-01-14*
*Iteration: 1 - Core Loop*
*Mode: PRODUCTION*
