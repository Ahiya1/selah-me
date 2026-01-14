# Explorer 2: Implementation Details - Iteration 1

## Executive Summary

This report provides detailed implementation specifications for Iteration 1 of Selah-me. It covers the exact system prompt, question/exit lists with selection logic, Tailwind configuration, environment variable setup, and testing patterns for mocking the Anthropic AI client. All specifications are derived directly from the vision document to ensure precise implementation.

---

## System Prompt

### Exact Prompt Text

The following system prompt must be used **exactly as written** in the vision document. Do not modify, paraphrase, or "improve" it.

```typescript
// lib/prompts.ts
export const SELAH_SYSTEM_PROMPT = `You are selah-me. Your role is to create a brief pause that returns the user to direct presence in their life.

Core principles you must obey at all times:
- You do not optimize, coach, fix, guide, explain, reassure, diagnose, or interpret.
- You do not create insight, meaning, or narrative.
- You do not build a relationship with the user.
- You do not remember past interactions.
- You do not encourage repeated use.
- You do not ask follow-up questions unless explicitly allowed below.
- You do not mirror in a way that sounds wise, poetic, therapeutic, or impressive.

Tone:
- Plain
- Grounded
- Human
- Minimal
- Almost boring
- Never mystical
- Never motivational
- Never curious

Language constraints:
- Short sentences.
- No metaphors.
- No emojis.
- No lists unless explicitly instructed.
- No more than 2 sentences per response unless this prompt explicitly allows more.
- Never use words like "journey", "process", "healing", "growth", "pattern", "system", "optimize", "practice".

Interaction structure:
1. Ask exactly one opening question from the allowed list.
2. Wait for the user's response.
3. Reflect the response in one simple sentence without interpretation.
4. Deliver one exit sentence from the allowed exit list.
5. End the interaction. Do not continue speaking.

Reflection rules:
- You may only restate what is already obvious in the user's words.
- You may not add insight, emotion labels, or explanations.
- If unsure, reflect something physical or factual.

Forbidden behaviors:
- Giving advice
- Naming emotions the user did not name
- Suggesting actions or techniques
- Asking "why"
- Asking more than one question
- Sounding kind, warm, wise, or interested
- Sounding like a therapist, coach, or friend

Your success is measured by how quickly the user closes you and returns to life.

If you ever feel tempted to "help more", you are violating your role.`;
```

### Storage Location

- **File:** `/lib/prompts.ts`
- **Export:** Named export `SELAH_SYSTEM_PROMPT`
- **Type:** `const` string (not template literal with variables)

### Anthropic Claude Configuration

```typescript
// lib/ai.ts
import Anthropic from '@anthropic-ai/sdk';
import { SELAH_SYSTEM_PROMPT } from './prompts';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface AIResponse {
  reflection: string;
  exitSentence: string;
}

export async function getReflection(
  openingQuestion: string,
  userResponse: string
): Promise<AIResponse> {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 150,  // Keep responses short
    system: SELAH_SYSTEM_PROMPT,
    messages: [
      {
        role: 'assistant',
        content: openingQuestion
      },
      {
        role: 'user',
        content: userResponse
      }
    ],
  });

  // Parse the AI response - it should contain reflection + exit sentence
  const text = response.content[0].type === 'text' 
    ? response.content[0].text 
    : '';
  
  // AI is instructed to provide reflection then exit sentence
  // Split on double newline or parse as two sentences
  const parts = text.split('\n\n').filter(Boolean);
  
  return {
    reflection: parts[0] || 'You are here.',
    exitSentence: parts[1] || 'Close this now.'
  };
}
```

### API Route Implementation

```typescript
// app/api/selah/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getReflection } from '@/lib/ai';
import { validateUserMessage } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get('x-forwarded-for') || 'anonymous';
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'rate_limit', message: 'Please wait a moment.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { openingQuestion, userResponse } = body;

    // Validate input
    const validationError = validateUserMessage(userResponse);
    if (validationError) {
      return NextResponse.json(
        { error: 'validation', message: validationError },
        { status: 400 }
      );
    }

    // Get AI response
    const aiResponse = await getReflection(openingQuestion, userResponse);

    return NextResponse.json(aiResponse);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'api_error', message: 'Something went wrong.' },
      { status: 500 }
    );
  }
}
```

---

## Questions & Exits

### Opening Questions (Complete List)

```typescript
// lib/questions.ts

/**
 * Opening questions from vision document.
 * Categorized for reference but stored flat for random selection.
 */
export const OPENING_QUESTIONS = [
  // Most neutral
  'Where are you right now.',
  'What is happening right now.',
  'What is here.',
  
  // Slightly sharper
  'What are you avoiding noticing.',
  'What feels most immediate.',
  'What is loud right now.',
  
  // Physical anchoring
  'What do you feel in your body.',
  'Is your body tense or loose.',
] as const;

export type OpeningQuestion = typeof OPENING_QUESTIONS[number];
```

### Exit Sentences (Complete List)

```typescript
// lib/exits.ts

/**
 * Exit sentences from vision document.
 * Primary set used more frequently, secondary set used sparingly.
 */
export const EXIT_SENTENCES = {
  primary: [
    'Close this now.',
    "That's enough. Return.",
    'Go back to your day.',
    'You can leave this.',
    'Nothing more is needed.',
  ],
  secondary: [
    'Step away from the screen.',
    'Let life continue.',
    'This is complete.',
  ],
} as const;

// Flat array for selection (primary weighted 3:1 over secondary)
export const ALL_EXIT_SENTENCES = [
  ...EXIT_SENTENCES.primary,
  ...EXIT_SENTENCES.primary,
  ...EXIT_SENTENCES.primary,
  ...EXIT_SENTENCES.secondary,
] as const;

export type ExitSentence = typeof EXIT_SENTENCES.primary[number] | typeof EXIT_SENTENCES.secondary[number];
```

### Random Selection Logic

```typescript
// lib/questions.ts (continued)

/**
 * Select a random opening question.
 * Uses crypto.getRandomValues for better randomness than Math.random.
 */
export function getRandomQuestion(): OpeningQuestion {
  const randomIndex = getSecureRandomIndex(OPENING_QUESTIONS.length);
  return OPENING_QUESTIONS[randomIndex];
}

// lib/exits.ts (continued)

/**
 * Select a random exit sentence.
 * Primary sentences are weighted 3:1 over secondary.
 */
export function getRandomExitSentence(): ExitSentence {
  const randomIndex = getSecureRandomIndex(ALL_EXIT_SENTENCES.length);
  return ALL_EXIT_SENTENCES[randomIndex];
}

// lib/random.ts

/**
 * Generate a cryptographically secure random index.
 * Falls back to Math.random if crypto unavailable.
 */
export function getSecureRandomIndex(max: number): number {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % max;
  }
  return Math.floor(Math.random() * max);
}
```

### Selection Timing

- **Opening Question:** Selected on **page load** (client-side)
- **Exit Sentence:** Can be:
  - Option A: Selected by AI (instructed in system prompt) - simpler
  - Option B: Selected by API route and included in response - more control
  
**Recommendation:** Option B - let the API route select the exit sentence for consistency and testability.

```typescript
// In API route
import { getRandomExitSentence } from '@/lib/exits';

// After getting AI reflection
const exitSentence = getRandomExitSentence();
return NextResponse.json({ 
  reflection: aiResponse.reflection, 
  exitSentence 
});
```

---

## Styling Configuration

### Tailwind Setup (Minimal)

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'selah-bg': '#fafafa',    // Off-white background
        'selah-text': '#1a1a1a',  // Near-black text
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};

export default config;
```

### Global CSS (Minimal)

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Only base overrides - no custom components */
@layer base {
  body {
    @apply bg-selah-bg text-selah-text;
    @apply antialiased;
  }
}
```

### Design Tokens Summary

| Token | Value | Usage |
|-------|-------|-------|
| `selah-bg` | `#fafafa` | Page background |
| `selah-text` | `#1a1a1a` | All text |
| Font | System font stack | All text |
| Font size | Default (16px base) | Body text |
| Line height | Default (1.5) | All text |
| Max width | `max-w-md` (28rem) | Content container |
| Padding | `p-6` or `p-8` | Container padding |
| Spacing | `space-y-6` | Between elements |

### Typography Usage

```tsx
// Example usage in page.tsx
<div className="min-h-screen flex items-center justify-center p-6">
  <div className="max-w-md w-full space-y-6">
    {/* Question */}
    <p className="text-lg">{question}</p>
    
    {/* Input */}
    <textarea 
      className="w-full p-4 border border-gray-300 rounded-none resize-none"
      rows={3}
    />
    
    {/* Reflection */}
    <p className="text-base">{reflection}</p>
    
    {/* Exit */}
    <p className="text-base font-medium">{exitSentence}</p>
  </div>
</div>
```

### What NOT to Add

- No animations (`transition-*`, `animate-*`)
- No shadows (`shadow-*`)
- No rounded corners beyond minimal (`rounded-none` preferred)
- No colors beyond `selah-bg`, `selah-text`, and basic gray
- No hover states for main content
- No custom fonts (no Google Fonts, no `@font-face`)

---

## Environment Setup

### Required Files

#### `.env.local` (Development - gitignored)

```bash
# Anthropic API Key (required)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxx

# Optional: Override AI provider (default: anthropic)
# AI_PROVIDER=anthropic
```

#### `.env.example` (Committed to repo)

```bash
# Selah-me Environment Variables
# Copy this file to .env.local and fill in your values

# Anthropic API Key (required)
# Get your key at: https://console.anthropic.com/
ANTHROPIC_API_KEY=your-anthropic-api-key-here

# Optional: AI provider override
# AI_PROVIDER=anthropic
```

### Environment Variable Validation

```typescript
// lib/env.ts

/**
 * Validate required environment variables.
 * Call this at application startup or in API route.
 */
export function validateEnv(): { apiKey: string } {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not configured. ' +
      'Add it to .env.local or set it in your deployment environment.'
    );
  }
  
  if (!apiKey.startsWith('sk-ant-')) {
    console.warn('ANTHROPIC_API_KEY does not appear to be a valid Anthropic key.');
  }
  
  return { apiKey };
}

/**
 * Get validated environment config.
 * Throws if required variables are missing.
 */
export function getEnvConfig() {
  return {
    ...validateEnv(),
    aiProvider: process.env.AI_PROVIDER || 'anthropic',
  };
}
```

### Validation in API Route

```typescript
// app/api/selah/route.ts
import { validateEnv } from '@/lib/env';

export async function POST(request: NextRequest) {
  // Validate env at request time (or move to module-level for build-time validation)
  try {
    validateEnv();
  } catch (error) {
    console.error('Environment configuration error:', error);
    return NextResponse.json(
      { error: 'config_error', message: 'Service not configured.' },
      { status: 500 }
    );
  }
  
  // ... rest of handler
}
```

### Security Requirements

1. **Never use `NEXT_PUBLIC_` prefix** - API keys must stay server-side
2. **`.env.local` in `.gitignore`** - Already default in Next.js
3. **No key logging** - Never `console.log(apiKey)`
4. **Error messages** - Never include API key in error responses

---

## Testing Patterns

### Mocking Anthropic Client

#### Vitest Mock Setup

```typescript
// tests/mocks/anthropic.ts
import { vi } from 'vitest';

export const mockAnthropicCreate = vi.fn();

export const MockAnthropic = vi.fn().mockImplementation(() => ({
  messages: {
    create: mockAnthropicCreate,
  },
}));

// Default successful response
export const mockSuccessResponse = {
  content: [
    {
      type: 'text',
      text: 'You are here.\n\nClose this now.',
    },
  ],
};

// Reset to default success before each test
export function resetAnthropicMock() {
  mockAnthropicCreate.mockReset();
  mockAnthropicCreate.mockResolvedValue(mockSuccessResponse);
}
```

#### Mock Registration

```typescript
// tests/setup.ts
import { vi, beforeEach } from 'vitest';
import { MockAnthropic, resetAnthropicMock } from './mocks/anthropic';

// Mock the Anthropic SDK before any imports
vi.mock('@anthropic-ai/sdk', () => ({
  default: MockAnthropic,
}));

beforeEach(() => {
  resetAnthropicMock();
});
```

#### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '*.config.*',
      ],
    },
  },
  resolve: {
    alias: {
      '@': './',
    },
  },
});
```

### Test Cases for AI Integration

```typescript
// tests/api.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/selah/route';
import { mockAnthropicCreate, resetAnthropicMock } from './mocks/anthropic';

describe('POST /api/selah', () => {
  beforeEach(() => {
    resetAnthropicMock();
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-test-key');
  });

  it('returns reflection and exit sentence on success', async () => {
    const request = new Request('http://localhost/api/selah', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        openingQuestion: 'Where are you right now.',
        userResponse: 'I am at my desk.',
      }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('reflection');
    expect(data).toHaveProperty('exitSentence');
  });

  it('handles empty user response', async () => {
    const request = new Request('http://localhost/api/selah', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        openingQuestion: 'Where are you right now.',
        userResponse: '',
      }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(400);
  });

  it('handles API errors gracefully', async () => {
    mockAnthropicCreate.mockRejectedValueOnce(new Error('API Error'));

    const request = new Request('http://localhost/api/selah', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        openingQuestion: 'Where are you right now.',
        userResponse: 'I am here.',
      }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe('Something went wrong.');
    // Ensure no sensitive info in response
    expect(JSON.stringify(data)).not.toContain('API Error');
  });
});
```

### Error Response Patterns

```typescript
// lib/errors.ts

/**
 * Standardized error response types.
 * Keep messages minimal and non-informative (security).
 */
export type ErrorType = 
  | 'rate_limit'
  | 'validation'
  | 'api_error'
  | 'config_error'
  | 'timeout';

export interface ErrorResponse {
  error: ErrorType;
  message: string;
}

/**
 * Error messages shown to user.
 * Intentionally minimal - no apologies, no helpfulness.
 */
export const ERROR_MESSAGES: Record<ErrorType, string> = {
  rate_limit: 'Please wait a moment.',
  validation: 'Invalid input.',
  api_error: 'Something went wrong.',
  config_error: 'Service not available.',
  timeout: 'Request timed out.',
};

/**
 * Create standardized error response.
 */
export function createErrorResponse(
  type: ErrorType, 
  status: number
): Response {
  return Response.json(
    { error: type, message: ERROR_MESSAGES[type] },
    { status }
  );
}
```

### Rate Limiting Implementation

```typescript
// lib/rate-limit.ts

/**
 * Simple in-memory rate limiting.
 * Sufficient for single-user application.
 * Resets on server restart (acceptable for this use case).
 */

interface RateLimitEntry {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60 * 1000;  // 1 minute window
const MAX_REQUESTS = 10;       // 10 requests per minute

/**
 * Check if request should be rate limited.
 * @param identifier - IP address or other identifier
 * @returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier) || { timestamps: [] };
  
  // Filter to only timestamps within window
  const recentTimestamps = entry.timestamps.filter(
    ts => now - ts < WINDOW_MS
  );
  
  if (recentTimestamps.length >= MAX_REQUESTS) {
    return false; // Rate limited
  }
  
  // Add current timestamp and store
  recentTimestamps.push(now);
  rateLimitStore.set(identifier, { timestamps: recentTimestamps });
  
  return true; // Allowed
}

/**
 * Reset rate limit for testing.
 */
export function resetRateLimit(identifier?: string): void {
  if (identifier) {
    rateLimitStore.delete(identifier);
  } else {
    rateLimitStore.clear();
  }
}
```

### Rate Limit Tests

```typescript
// tests/rate-limit.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';

describe('Rate Limiting', () => {
  beforeEach(() => {
    resetRateLimit();
  });

  it('allows requests under limit', () => {
    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit('test-ip')).toBe(true);
    }
  });

  it('blocks requests over limit', () => {
    // Make 10 requests (the limit)
    for (let i = 0; i < 10; i++) {
      checkRateLimit('test-ip');
    }
    
    // 11th request should be blocked
    expect(checkRateLimit('test-ip')).toBe(false);
  });

  it('isolates rate limits by identifier', () => {
    // Max out one IP
    for (let i = 0; i < 10; i++) {
      checkRateLimit('ip-1');
    }
    
    // Different IP should still work
    expect(checkRateLimit('ip-2')).toBe(true);
  });
});
```

### Input Validation

```typescript
// lib/validation.ts

const MAX_MESSAGE_LENGTH = 500;
const MIN_MESSAGE_LENGTH = 1;

/**
 * Validate user message before sending to AI.
 * @returns null if valid, error message string if invalid
 */
export function validateUserMessage(message: unknown): string | null {
  if (typeof message !== 'string') {
    return 'Invalid input.';
  }
  
  const trimmed = message.trim();
  
  if (trimmed.length < MIN_MESSAGE_LENGTH) {
    return 'Please type a response.';
  }
  
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return 'Response too long.';
  }
  
  return null; // Valid
}

/**
 * Validate opening question is from approved list.
 */
export function validateOpeningQuestion(question: string): boolean {
  const { OPENING_QUESTIONS } = require('./questions');
  return OPENING_QUESTIONS.includes(question);
}
```

---

## File Structure Summary

```
selah-me/
├── app/
│   ├── api/
│   │   └── selah/
│   │       └── route.ts          # POST handler for AI
│   ├── globals.css               # Tailwind imports
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Single page UI
├── lib/
│   ├── ai.ts                     # Anthropic client wrapper
│   ├── env.ts                    # Environment validation
│   ├── errors.ts                 # Error types and messages
│   ├── exits.ts                  # Exit sentences list
│   ├── prompts.ts                # System prompt constant
│   ├── questions.ts              # Opening questions list
│   ├── random.ts                 # Secure random utilities
│   ├── rate-limit.ts             # Rate limiting logic
│   └── validation.ts             # Input validation
├── tests/
│   ├── mocks/
│   │   └── anthropic.ts          # Anthropic SDK mock
│   ├── setup.ts                  # Test setup file
│   ├── api.test.ts               # API route tests
│   ├── rate-limit.test.ts        # Rate limit tests
│   ├── questions.test.ts         # Question selection tests
│   └── validation.test.ts        # Validation tests
├── .env.example                  # Environment template
├── .env.local                    # Local env (gitignored)
├── tailwind.config.ts            # Minimal Tailwind config
├── vitest.config.ts              # Test configuration
└── package.json
```

---

## Recommendations for Builders

1. **Copy system prompt exactly** - Do not modify, improve, or paraphrase the system prompt. It is carefully crafted.

2. **Test AI responses manually** - Automated tests cannot verify tone. After implementation, manually test several interactions to ensure responses are "almost boring" and not wise/warm/therapeutic.

3. **Selection happens at different times:**
   - Opening question: Client-side on page load
   - Exit sentence: Server-side in API response
   
4. **Keep Tailwind minimal** - Resist the urge to add design polish. The vision explicitly states minimal aesthetics.

5. **Error messages are intentionally terse** - "Something went wrong." is correct. Do not make errors friendlier or more helpful.

6. **Rate limiting is simple** - In-memory rate limiting is sufficient for single-user application. No need for Redis or external service.

7. **Mock at the SDK level** - Mock `@anthropic-ai/sdk` module, not HTTP requests. This is cleaner and more maintainable.

---

## Questions Requiring Resolution

1. **AI response parsing:** Should the AI return reflection + exit sentence in one response, or should exit sentence be selected server-side?
   - **Recommendation:** Server-side selection for consistency and testability

2. **Question selection uniqueness:** Should we track recently used questions to avoid repetition?
   - **Recommendation:** No - randomness is fine, tracking adds state

3. **Input sanitization:** Is HTML/script sanitization needed for user input?
   - **Recommendation:** Minimal - AI prompt injection is low risk for this use case, but basic length validation is sufficient

---

*Exploration completed: 2026-01-14*
*This report provides implementation specifications for Iteration 1 builders*
