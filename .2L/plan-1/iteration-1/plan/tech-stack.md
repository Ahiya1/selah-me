# Technology Stack

## Core Framework

**Decision:** Next.js 15 with App Router

**Rationale:**
- App Router provides clean file-based routing with React Server Components
- Single page application simplifies architecture (no complex routing needed)
- API routes built-in for server-side AI proxy
- TypeScript support out of the box
- Vercel deployment is seamless for Iteration 2

**Alternatives Considered:**
- Plain React + Vite: Would need separate backend for API keys security
- Remix: Overkill for single-page application
- Astro: Good for static, but we need dynamic API interaction

## Language

**Decision:** TypeScript (strict mode)

**Rationale:**
- Type safety catches errors at compile time
- Better IDE support and autocomplete
- Required by master plan specification
- Strict mode enforces best practices

**tsconfig.json Key Settings:**
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
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

## Styling

**Decision:** Tailwind CSS (minimal configuration)

**Rationale:**
- Utility-first approach prevents over-engineering
- No custom CSS needed for minimal design
- Easy to constrain to minimal palette
- Tree-shaking removes unused styles

**Design System:**
| Token | Value | Usage |
|-------|-------|-------|
| `selah-bg` | `#fafafa` | Page background |
| `selah-text` | `#1a1a1a` | All text |
| Font | System font stack | All text |
| Max width | `28rem` (max-w-md) | Content container |

**What NOT to Use:**
- No custom fonts (Google Fonts, @font-face)
- No animations (`transition-*`, `animate-*`)
- No shadows (`shadow-*`)
- No rounded corners (`rounded-none` preferred)
- No hover states for main content
- No colors beyond `selah-bg`, `selah-text`, and basic gray

## AI Provider

**Decision:** Anthropic Claude (claude-3-5-sonnet-20241022)

**Rationale:**
- High-quality language understanding
- Follows system prompt constraints reliably
- API key likely already available in user's environment
- Better at maintaining minimal, non-therapeutic tone

**Configuration:**
```typescript
{
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 150,  // Keep responses short
  system: SELAH_SYSTEM_PROMPT  // Exact prompt from vision
}
```

**SDK:** `@anthropic-ai/sdk` (latest version)

## Testing

**Decision:** Vitest + @testing-library/react

**Rationale:**
- Vitest is faster than Jest (native ESM support)
- Compatible with Vite ecosystem
- Same API as Jest (easy migration)
- Built-in coverage with v8
- Better TypeScript support out of the box

**Coverage Target:** >= 70%

**Test Types for Iteration 1:**
- Unit tests for lib functions (validation, questions, exits, prompts)
- Integration tests for API route with mocked Anthropic client
- Component tests deferred to Iteration 2

## Database

**Decision:** None

**Rationale:**
- Vision explicitly prohibits persistence
- No user accounts, no session storage
- No conversation history
- Simplifies architecture significantly

## Authentication

**Decision:** None

**Rationale:**
- Single user application
- No user accounts per vision requirements
- API key protection via server-side route only

## API Layer

**Decision:** Next.js API Route (`/api/selah`)

**Approach:**
- Single POST endpoint for AI interaction
- Server-side only - API key never exposed to client
- Request validation before AI call
- Standardized error responses

**Request/Response Format:**
```typescript
// Request
interface SelahRequest {
  message: string;    // User's response (1-500 chars)
  question: string;   // The opening question shown
}

// Response (Success)
interface SelahResponse {
  reflection: string;   // AI's reflection line
  exitSentence: string; // Exit sentence (server-selected)
}

// Response (Error)
interface SelahErrorResponse {
  error: 'validation_error' | 'rate_limit' | 'api_error' | 'config_error';
  message: string;
}
```

## External Integrations

### Anthropic Claude API

**Purpose:** Generate reflection responses following strict system prompt

**Library:** `@anthropic-ai/sdk`

**Implementation:**
```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const response = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 150,
  system: SELAH_SYSTEM_PROMPT,
  messages: [
    { role: 'assistant', content: openingQuestion },
    { role: 'user', content: userResponse }
  ],
});
```

## Development Tools

### Code Quality

**Linter:** ESLint (Next.js default config)
```javascript
// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

export default [...compat.extends("next/core-web-vitals", "next/typescript")];
```

**Formatter:** Prettier (default settings)

**Type Checking:** TypeScript strict mode (`tsc --noEmit`)

### Build & Deploy

**Build tool:** Next.js built-in (`next build`)

**Development:** `next dev` (default port 3000)

**Deployment target:** Vercel (Iteration 2)

**CI/CD:** GitHub Actions (Iteration 2)

## Environment Variables

All required environment variables:

| Variable | Purpose | Server/Client | Required |
|----------|---------|---------------|----------|
| `ANTHROPIC_API_KEY` | Anthropic Claude API access | Server only | Yes |

**Security Rules:**
- Never use `NEXT_PUBLIC_` prefix for API keys
- `.env.local` must be in `.gitignore`
- `.env.example` committed with placeholder values
- Validate key exists before API call

**.env.example content:**
```bash
# Selah-me Environment Variables
# Copy this file to .env.local and fill in your values

# Anthropic API Key (required)
# Get your key at: https://console.anthropic.com/
ANTHROPIC_API_KEY=your-anthropic-api-key-here
```

## Dependencies Overview

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 15.x | Framework |
| `react` | 19.x | UI library |
| `react-dom` | 19.x | React DOM renderer |
| `@anthropic-ai/sdk` | latest | Anthropic Claude client |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | 5.x | Type checking |
| `@types/node` | latest | Node.js types |
| `@types/react` | latest | React types |
| `@types/react-dom` | latest | React DOM types |
| `tailwindcss` | 3.x | CSS framework |
| `postcss` | latest | CSS processing |
| `vitest` | latest | Test runner |
| `@vitejs/plugin-react` | latest | React plugin for Vitest |
| `@testing-library/react` | latest | Component testing |
| `jsdom` | latest | DOM environment for tests |
| `eslint` | 9.x | Linting |
| `eslint-config-next` | 15.x | Next.js ESLint config |

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| First Contentful Paint | < 1.5s | Single page, minimal assets |
| Bundle size | < 100KB | No heavy dependencies |
| API response time | < 3s | Depends on Anthropic API |
| Time to Interactive | < 2s | Minimal JavaScript |

## Security Considerations

| Consideration | Implementation |
|---------------|----------------|
| API key protection | Server-side only, never in client bundle |
| Input validation | Server-side validation before AI call |
| Rate limiting | Simple in-memory (10 req/min per IP) |
| Error sanitization | Never expose internal errors to client |
| XSS prevention | React escapes by default; no dangerouslySetInnerHTML |
| CSRF | Not applicable (no state-changing user auth) |

---

*Tech stack defined: 2026-01-14*
*Iteration: 1 - Core Loop*
