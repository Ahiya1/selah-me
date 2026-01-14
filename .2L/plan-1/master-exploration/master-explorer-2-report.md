# Master Explorer 2: Technology & Dependencies Report

## Explorer ID
master-explorer-2

## Focus Area
Dependencies & Technology Assessment

## Vision Summary
A minimalist web application that creates brief 30-second pauses to return the user to direct presence. Single page, no persistence, no memory - intentionally simple to resist becoming important.

---

## Technology Stack

### Framework: Next.js 15 with App Router

**Recommendation:** Next.js 15.x with App Router (minimal configuration)

**Rationale:**
- App Router provides built-in API routes via Route Handlers - perfect for AI proxy endpoint
- Server Components reduce client-side JavaScript bundle (aligns with minimal philosophy)
- TypeScript support out of the box
- Vercel deployment is seamless
- No complex routing needed - single page application

**Configuration approach:**
```
npx create-next-app@latest selah-me --typescript --tailwind --app --no-src-dir --no-import-alias
```

**Key Next.js features to use:**
- Single `app/page.tsx` for the UI
- Single `app/api/selah/route.ts` for AI proxy
- Server-side environment variables (API keys never exposed to client)
- Edge runtime optional for API route (faster cold starts)

**Features to explicitly DISABLE or ignore:**
- No `next/image` optimization needed (no images)
- No `next/font` optimization (single system font preferred)
- No middleware
- No dynamic routes
- No SSG/ISR complexity

### Styling: Tailwind CSS (Minimal)

**Recommendation:** Tailwind CSS 3.4.x with aggressive purging

**Philosophy alignment:**
- Utility-first allows precise, minimal styling without custom CSS files
- Purging ensures tiny production bundle
- No component library - raw Tailwind only

**Minimal Tailwind config:**
```javascript
// tailwind.config.js
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Off-white background as specified
        'selah-bg': '#fafafa',
        'selah-text': '#1a1a1a',
      },
      fontFamily: {
        // Single font as specified - use system font stack
        sans: ['system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

**CSS budget:** Under 5KB total (achievable with utility-only approach)

### TypeScript Configuration

**Recommendation:** Strict mode enabled

```json
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

**Type safety focus:**
- AI response types strictly defined
- No `any` types allowed
- Exhaustive error handling types

### AI Integration

**Primary Recommendation:** Anthropic Claude API (claude-3-5-sonnet)

**Rationale for Claude over OpenAI:**
1. **Tone alignment:** Claude's default tone is more grounded and less performative
2. **Instruction following:** Claude excels at following nuanced system prompts
3. **No "helpful assistant" persona:** Easier to achieve the "almost boring" tone
4. **Cost efficiency:** Sonnet provides excellent quality at lower cost than GPT-4
5. **Consistent behavior:** Less tendency to add unsolicited warmth or advice

**Model selection:** `claude-3-5-sonnet-20241022`
- Fast response times (critical for 30-second interaction goal)
- Excellent instruction adherence
- Cost-effective for single-turn interactions

**Fallback option:** OpenAI GPT-4o-mini
- If Claude API unavailable
- Requires more aggressive system prompt to suppress helpfulness
- Slightly higher tendency to sound "wise" or "kind"

**API client approach:**
```typescript
// Use official SDK - no REST wrapper
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
```

---

## Dependencies

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | `^15.1.0` | Framework - App Router, API routes |
| `react` | `^19.0.0` | UI library (Next.js peer dep) |
| `react-dom` | `^19.0.0` | React DOM renderer |
| `@anthropic-ai/sdk` | `^0.39.0` | Claude API client |

**Total production dependencies:** 4 packages (minimal)

**Optional (if OpenAI fallback needed):**
| Package | Version | Purpose |
|---------|---------|---------|
| `openai` | `^4.77.0` | OpenAI API client (fallback only) |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | `^5.7.0` | Type checking |
| `@types/node` | `^22.0.0` | Node.js type definitions |
| `@types/react` | `^19.0.0` | React type definitions |
| `@types/react-dom` | `^19.0.0` | React DOM types |
| `tailwindcss` | `^3.4.0` | CSS framework |
| `postcss` | `^8.4.0` | CSS processing |
| `autoprefixer` | `^10.4.0` | CSS vendor prefixes |
| `vitest` | `^3.0.0` | Test runner |
| `@testing-library/react` | `^16.0.0` | React component testing |
| `@vitejs/plugin-react` | `^4.3.0` | Vitest React plugin |
| `jsdom` | `^25.0.0` | DOM environment for tests |
| `eslint` | `^9.0.0` | Linting |
| `eslint-config-next` | `^15.1.0` | Next.js ESLint rules |
| `prettier` | `^3.4.0` | Code formatting |

**Total development dependencies:** 14 packages

### Package.json Structure

```json
{
  "name": "selah-me",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write .",
    "test": "vitest",
    "test:run": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@anthropic-ai/sdk": "^0.39.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "vitest": "^3.0.0",
    "@testing-library/react": "^16.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "jsdom": "^25.0.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.1.0",
    "prettier": "^3.4.0"
  }
}
```

---

## Production Patterns

### Environment Variables

**Required variables:**
```bash
# .env.local (development)
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Optional fallback
OPENAI_API_KEY=sk-xxxxx

# Optional: Control AI provider
AI_PROVIDER=anthropic  # or 'openai'
```

**Security requirements:**
1. API keys MUST only be accessed server-side (in Route Handler)
2. Never prefix with `NEXT_PUBLIC_` - these keys must stay private
3. Vercel environment variables for production (not in git)

**Validation pattern:**
```typescript
// app/api/selah/route.ts
function validateEnv() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }
  return apiKey;
}
```

**Environment file structure:**
```
.env.local          # Local development (gitignored)
.env.example        # Template for developers (committed)
```

### Error Handling

**AI API Error Patterns:**

```typescript
// types/errors.ts
type SelahError =
  | { type: 'rate_limit'; retryAfter?: number }
  | { type: 'api_error'; message: string }
  | { type: 'timeout' }
  | { type: 'invalid_response' }
  | { type: 'config_error' };

// Error handling in API route
async function handleAIRequest(userMessage: string): Promise<Response> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 150,  // Keep responses short
      messages: [{ role: 'user', content: userMessage }],
      system: SELAH_SYSTEM_PROMPT,
    });

    return Response.json({ text: response.content[0].text });

  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return Response.json(
        { error: 'rate_limit', message: 'Please wait a moment.' },
        { status: 429 }
      );
    }

    if (error instanceof Anthropic.APIError) {
      console.error('AI API Error:', error.message);
      return Response.json(
        { error: 'api_error', message: 'Something went wrong.' },
        { status: 500 }
      );
    }

    // Fallback for unexpected errors
    console.error('Unexpected error:', error);
    return Response.json(
      { error: 'unknown', message: 'Something went wrong.' },
      { status: 500 }
    );
  }
}
```

**Client-side error display:**
- Errors should be minimal and non-dramatic
- Align with the "almost boring" aesthetic
- Example: "Something went wrong. Close this and try again later."
- Never apologetic or overly helpful

### Security

**API Key Protection:**
1. Server-side only access via Next.js Route Handlers
2. No client-side JavaScript ever sees the API key
3. All AI calls go through `/api/selah` endpoint

**Rate Limiting Approach:**

Since this is a single-user application, heavy rate limiting infrastructure is unnecessary. However, basic protection is prudent:

```typescript
// Simple in-memory rate limiting (sufficient for single user)
const rateLimiter = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10; // 10 requests per minute

  const requests = rateLimiter.get(ip) || [];
  const recentRequests = requests.filter(t => now - t < windowMs);

  if (recentRequests.length >= maxRequests) {
    return false; // Rate limited
  }

  recentRequests.push(now);
  rateLimiter.set(ip, recentRequests);
  return true;
}
```

**Additional security considerations:**
- HTTPS enforced by Vercel
- No CORS issues (same-origin API calls)
- No user data stored (no data breach possible)
- No authentication needed (intentionally public for single user)

**Input validation:**
```typescript
// Validate user message before sending to AI
function validateUserMessage(message: string): string | null {
  if (!message || typeof message !== 'string') {
    return 'Invalid input';
  }
  if (message.length > 500) {
    return 'Message too long';
  }
  return null; // Valid
}
```

---

## Development Workflow

### Local Setup

**Prerequisites:**
- Node.js 20.x or later (LTS recommended)
- npm or pnpm
- Anthropic API key (or OpenAI as fallback)

**Setup steps:**
```bash
# 1. Clone repository
git clone <repo-url> selah-me
cd selah-me

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY

# 4. Start development server
npm run dev

# 5. Open http://localhost:3000
```

**Development commands:**
| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Run production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once (CI) |
| `npm run typecheck` | TypeScript type checking |

### CI/CD: GitHub Actions

**Workflow structure:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Run tests
        run: npm run test:run

      - name: Build
        run: npm run build
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

**Secrets required in GitHub:**
- `ANTHROPIC_API_KEY` - for build-time validation

### Deployment: Vercel

**Configuration:** `vercel.json`

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install"
}
```

**Vercel environment variables:**
- `ANTHROPIC_API_KEY` - API key for Claude
- `AI_PROVIDER` - Optional, defaults to "anthropic"

**Deployment approach:**
1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Push to `main` branch triggers automatic deployment
4. Preview deployments for pull requests

**Production optimizations applied by Vercel:**
- Edge caching for static assets
- Automatic HTTPS
- Global CDN distribution
- Serverless function for API route

---

## Dependency Graph

```
User Browser
    |
    v
Next.js App (Vercel)
    |
    +-- app/page.tsx (Client Component)
    |       |
    |       +-- Renders opening question
    |       +-- Captures user input
    |       +-- Displays reflection
    |       +-- Shows exit sentence
    |       |
    |       v
    +-- app/api/selah/route.ts (Server)
            |
            +-- Validates input
            +-- Rate limiting check
            |
            v
      Anthropic Claude API
            |
            +-- System prompt applied
            +-- Single message exchange
            |
            v
      Response to client
```

**No external dependencies beyond:**
- Anthropic Claude API (or OpenAI fallback)
- Vercel hosting platform

---

## Risk Assessment

### Low Risks

- **Technology choices:** All recommended technologies are stable, well-documented
- **Dependency count:** Minimal dependencies reduce supply chain risk
- **Scope creep:** Vision document explicitly defines what NOT to build

### Medium Risks

- **AI response quality:** Claude may occasionally sound too helpful or wise
  - **Mitigation:** Comprehensive system prompt, manual testing of edge cases

- **API rate limits:** Anthropic has rate limits that could affect usage
  - **Mitigation:** Client-side rate limiting, graceful error messages

### Low Probability / High Impact

- **API key exposure:** Accidental exposure of Anthropic API key
  - **Mitigation:** Server-side only access, environment variable security
  - **Response:** Key rotation via Anthropic dashboard

---

## Testing Strategy

### Unit Tests (Vitest)

**Focus areas:**
1. Input validation functions
2. Error handling logic
3. Rate limiting behavior
4. Response parsing

**Example test structure:**
```typescript
// tests/validation.test.ts
import { describe, it, expect } from 'vitest';
import { validateUserMessage } from '../lib/validation';

describe('validateUserMessage', () => {
  it('rejects empty messages', () => {
    expect(validateUserMessage('')).toBe('Invalid input');
  });

  it('rejects messages over 500 characters', () => {
    const longMessage = 'a'.repeat(501);
    expect(validateUserMessage(longMessage)).toBe('Message too long');
  });

  it('accepts valid messages', () => {
    expect(validateUserMessage('I feel tense.')).toBeNull();
  });
});
```

### Integration Tests

**Approach:** Mock Anthropic API responses to test full request flow

```typescript
// tests/api.test.ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [{ text: 'You are here.' }]
      })
    }
  }
}));
```

### Manual Testing Checklist

- [ ] Opening question appears on load
- [ ] User can type and submit response
- [ ] Reflection is displayed (not too wise, not too warm)
- [ ] Exit sentence is shown
- [ ] No way to retry or go back
- [ ] Tab can be closed easily
- [ ] Works on mobile browsers
- [ ] Error states display appropriately

---

## File Structure Recommendation

```
selah-me/
├── app/
│   ├── api/
│   │   └── selah/
│   │       └── route.ts        # AI proxy endpoint
│   ├── globals.css             # Tailwind imports only
│   ├── layout.tsx              # Minimal root layout
│   └── page.tsx                # Single page UI
├── lib/
│   ├── ai.ts                   # Anthropic client wrapper
│   ├── prompts.ts              # System prompt and question lists
│   ├── validation.ts           # Input validation
│   └── rate-limit.ts           # Simple rate limiting
├── types/
│   └── index.ts                # TypeScript types
├── tests/
│   ├── validation.test.ts
│   └── api.test.ts
├── .env.example
├── .env.local                  # gitignored
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

**Total files:** ~20 files (extremely minimal for a Next.js project)

---

## Recommendations for Master Plan

1. **Single iteration is sufficient**
   - This is a deliberately minimal application
   - Total estimated work: 4-6 hours
   - All features can be built together in one cohesive iteration

2. **Start with API integration first**
   - Validate Claude API connectivity and system prompt behavior
   - Test edge cases before building UI

3. **Keep Tailwind usage minimal**
   - Resist urge to add design flourishes
   - Vision explicitly states: white/off-white, black text, one font, no animation

4. **Test AI responses manually**
   - The success of this tool depends on Claude following the system prompt
   - Automated tests cannot verify "tone" - human judgment required

5. **Deploy early, iterate on production**
   - Vercel deployment is trivial
   - Testing with real API in production context is valuable

---

## Notes & Observations

- The vision document is exceptionally clear about constraints - this simplifies technology decisions
- Anthropic Claude is a better fit than OpenAI for this use case due to tone characteristics
- The "no database, no auth" constraint eliminates significant complexity
- React 19 and Next.js 15 are stable and production-ready
- Vitest is faster than Jest for this project size and integrates well with Vite ecosystem

---

*Exploration completed: 2026-01-14*
*This report informs master planning decisions*
