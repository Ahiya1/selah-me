# Master Explorer 1: Architecture & Complexity Report

## Explorer ID
master-explorer-1

## Focus Area
Architecture & Complexity Analysis

## Vision Summary

Selah-me is a minimalist presence tool - a single-page web application that creates brief 30-second pauses to return the user to direct presence in life. It uses AI (Claude or OpenAI) to ask one grounding question, reflect the user's response in a single sentence, and then push them back into life with an exit sentence. The tool deliberately resists becoming important or creating attachment. Success is measured by decreased usage over time.

---

## Architecture Assessment

### Project Type
**Greenfield** - No existing codebase. Only git initialization and planning files present.

### Component Structure

```
selah-me/
├── app/
│   ├── page.tsx              # Main (and only) page
│   ├── layout.tsx            # Root layout with minimal styling
│   ├── globals.css           # Minimal Tailwind imports
│   └── api/
│       └── reflect/
│           └── route.ts      # Server-side AI API route
├── components/
│   ├── SelahSession.tsx      # Main session flow component
│   └── Input.tsx             # Text input component
├── lib/
│   ├── ai.ts                 # AI client abstraction (Claude/OpenAI)
│   ├── questions.ts          # Opening question list and rotation
│   ├── exits.ts              # Exit sentence list and rotation
│   └── prompts.ts            # System prompt constant
├── __tests__/                # Test files
│   ├── questions.test.ts
│   ├── api.test.ts
│   └── e2e/
│       └── session.test.ts
├── .env.local                # API keys (gitignored)
├── .env.example              # Template for required env vars
├── tailwind.config.ts        # Minimal Tailwind configuration
├── next.config.ts            # Next.js configuration
└── package.json
```

### Data Flow

```
1. User opens page
   └── Random opening question selected from list
   └── Question displayed (no preamble)

2. User types response and submits
   └── POST to /api/reflect with user text

3. Server-side API route
   └── Constructs prompt with system instructions
   └── Calls Claude or OpenAI API
   └── Returns reflection + exit sentence

4. UI displays response
   └── Reflection line shown
   └── Exit sentence shown
   └── Session marked complete

5. Session ends
   └── UI nudges user to close tab
   └── No back button, no retry
```

### Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js 14+ (App Router) | Specified in vision, provides API routes |
| Language | TypeScript | Type safety, specified in vision |
| Styling | Tailwind CSS | Minimal config, specified in vision |
| AI Provider | Claude API or OpenAI | Keys from environment variables |
| Testing | Jest + React Testing Library | Standard for Next.js |
| E2E Testing | Playwright | Already present in project (.playwright-mcp) |

### Architectural Pattern

**Minimal Single-Page Application with Server-Side API**

- No client-side state management library needed (useState sufficient)
- No database or persistence layer
- No authentication layer
- Server-side API route handles AI calls (keeps keys secure)
- Linear, one-way flow (no navigation, no history)

---

## Complexity Assessment

### Overall Complexity: **SIMPLE**

### Complexity Breakdown

| Dimension | Level | Rationale |
|-----------|-------|-----------|
| Features | Simple | 4 core features only (question, input, reflection, exit) |
| Data Layer | None | No database, no persistence |
| Authentication | None | Single user, no accounts |
| State Management | Minimal | Single linear flow, no complex state |
| External Integrations | Simple | One AI API call per session |
| UI Complexity | Minimal | Single page, no navigation |

### Recommended Iterations: **2**

Rationale: While the project is simple, production mode requires:
- Test coverage setup and implementation
- CI/CD pipeline configuration
- Security hardening
- Visual polish

Two iterations allow clean separation:
1. Core functionality with basic testing
2. Polish, comprehensive testing, and production readiness

### Key Technical Challenges

1. **API Key Security**
   - Must use server-side API route (not client-side)
   - Environment variables must be properly configured
   - No accidental key exposure in logs or errors

2. **AI Response Compliance**
   - AI must follow strict system prompt constraints
   - Responses must be minimal (1-2 sentences)
   - Tone must be "almost boring" - not wise or therapeutic

3. **UI Flow Enforcement**
   - No back button inside experience
   - No retry button
   - Session must feel "complete" after exit

4. **Test Mocking Strategy**
   - AI responses must be mockable for testing
   - E2E tests need predictable AI responses

---

## Production Requirements

### Testing Needs

| Test Type | Coverage Target | Tools |
|-----------|-----------------|-------|
| Unit Tests | Question/exit rotation, lib functions | Jest |
| Integration Tests | API route with mocked AI | Jest + node-mocks-http |
| Component Tests | UI components in isolation | React Testing Library |
| E2E Tests | Full session flow | Playwright |

**Specific Test Cases:**
- Opening question is from approved list
- Exit sentence is from approved list
- API route returns valid JSON
- UI flow progresses correctly (question -> input -> reflection -> exit)
- No way to "go back" in UI
- Session can complete successfully

### CI/CD Needs

```yaml
# GitHub Actions workflow structure
name: CI
on: [push, pull_request]
jobs:
  test:
    - checkout
    - setup node
    - install dependencies
    - run linting
    - run unit tests
    - run integration tests
    - run e2e tests (with mocked AI)

  deploy:
    needs: test
    if: main branch
    - deploy to Vercel/similar
```

### Security Needs

1. **API Key Handling**
   - `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` in environment
   - Server-side only (Next.js API route)
   - Never logged or exposed in errors
   - `.env.local` in `.gitignore`
   - `.env.example` with placeholder values

2. **Request Validation**
   - API route validates request body
   - Rejects empty or malformed input
   - Basic rate limiting consideration (optional for single user)

3. **Response Handling**
   - No sensitive data in responses
   - Error messages do not expose internals

---

## Iteration Breakdown Recommendation

### Iteration 1: Core Loop

**Vision:** Build the complete working flow from question to exit.

**Scope:**
- Next.js project scaffold with TypeScript and Tailwind
- API route for AI integration (/api/reflect)
- AI client abstraction (support both Claude and OpenAI)
- System prompt implementation (exact text from vision)
- Opening questions list with random selection
- Exit sentences list with random selection
- Single page UI with:
  - Opening question display
  - Text input field
  - Submit button
  - Reflection display
  - Exit sentence display
  - "Session complete" state
- Basic visual styling (white/off-white, black text, one font)
- Environment variable setup
- Basic unit tests for lib functions
- Integration test for API route

**Why First:**
- Establishes the complete working product
- Proves AI integration works correctly
- Validates the core user experience

**Estimated Duration:** 4-6 hours

**Risk Level:** LOW

**Success Criteria:**
- User can open page, see question, type response, see reflection, see exit
- AI responses follow system prompt constraints
- No persistence between page refreshes
- All basic tests pass

---

### Iteration 2: Polish + Production Hardening

**Vision:** Refine the experience and prepare for production deployment.

**Scope:**
- Visual refinement
  - Exact typography and spacing
  - Minimal, clean aesthetic
  - Mobile responsiveness
- Close-tab nudge behavior after exit
- Question/exit rotation improvement (ensure variety)
- Comprehensive test coverage
  - E2E tests with Playwright
  - Edge case handling
  - Error state testing
- CI/CD pipeline setup (GitHub Actions)
- Production deployment configuration
- Security review and hardening
- Documentation (minimal - just setup instructions)

**Dependencies:**
- Requires Iteration 1 complete
- Uses components and patterns from Iteration 1

**Estimated Duration:** 3-4 hours

**Risk Level:** LOW

**Success Criteria:**
- Visual design matches vision (minimal, clean)
- All tests pass in CI
- Production deployment works
- Security checklist complete

---

## Risk Assessment

### Low Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Tech stack unfamiliarity | Low | Next.js and TypeScript are well-documented |
| Requirements unclear | None | Vision document is extremely detailed |
| Scope creep | Low | Vision explicitly lists anti-features |

### Medium Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI prompt compliance | Medium | Test responses against examples in vision; tune prompt if needed |
| Browser "close tab" behavior | Medium | Use subtle messaging rather than forcing behavior |
| API rate limits | Medium | Add basic error handling; single user makes this unlikely |

### No High Risks Identified

This is a simple, well-scoped project with clear requirements and mature technology choices.

---

## Dependency Graph

```
Iteration 1: Core Loop
├── Project Scaffold (Next.js, TypeScript, Tailwind)
│   └── no dependencies
├── AI Integration (lib/ai.ts, api/reflect/route.ts)
│   └── depends on: Project Scaffold, Environment Variables
├── Question/Exit Logic (lib/questions.ts, lib/exits.ts)
│   └── depends on: Project Scaffold
├── System Prompt (lib/prompts.ts)
│   └── depends on: Project Scaffold
├── UI Components (page.tsx, components/)
│   └── depends on: All above
└── Basic Tests
    └── depends on: All above

    ↓

Iteration 2: Polish + Production
├── Visual Refinement
│   └── depends on: Iteration 1 UI
├── Comprehensive Tests
│   └── depends on: Iteration 1 Components
├── CI/CD Pipeline
│   └── depends on: Test Suite
└── Production Deployment
    └── depends on: CI/CD, All Tests Passing
```

---

## Technology Recommendations

### Greenfield Recommendations

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| Next.js Version | 14+ with App Router | Modern, specified in vision |
| TypeScript Config | Strict mode | Catch errors early |
| Tailwind | Minimal preset | Only colors, typography, spacing |
| AI Client | Anthropic SDK first, OpenAI fallback | Claude mentioned first in vision |
| Testing | Jest + RTL + Playwright | Standard, reliable stack |
| Deployment | Vercel | Optimal for Next.js |

### Environment Variables

```bash
# .env.example
ANTHROPIC_API_KEY=your-key-here
# OR
OPENAI_API_KEY=your-key-here
```

---

## Notes & Observations

1. **The vision document is exceptionally clear** - This reduces risk significantly. The system prompt is complete, the interaction flow is defined, and anti-patterns are explicitly called out.

2. **The "self-destruction rule" is philosophical, not technical** - The application should be built as specified, but the rule about deleting the app if it becomes important is guidance for the user/maintainer, not a technical requirement.

3. **Production mode testing should mock AI responses** - For reliable CI, AI calls should be mocked with responses that match the expected format. Real AI testing can be done manually.

4. **The project is intentionally anti-engagement** - This is rare and important. The success metrics (decreasing usage) should inform testing: there's no need to optimize for engagement or retention.

5. **Mobile responsiveness is implicit** - The vision mentions "web only" but users may open on phones. Simple responsive design should be included.

---

*Exploration completed: 2026-01-14*
*This report informs master planning decisions*
