# Code Patterns & Conventions

## File Structure

```
/home/ahiya/Ahiya/selah-me/
├── app/
│   ├── api/
│   │   └── selah/
│   │       └── route.ts          # AI proxy endpoint
│   ├── globals.css               # Tailwind imports + base styles
│   ├── layout.tsx                # Root layout (Server Component)
│   └── page.tsx                  # Main page (Client Component)
├── components/
│   ├── SelahInput.tsx            # Text input with submit
│   └── SessionComplete.tsx       # End state display
├── lib/
│   ├── ai.ts                     # Anthropic client wrapper
│   ├── exits.ts                  # Exit sentence list + selection
│   ├── prompts.ts                # System prompt constant
│   ├── questions.ts              # Question list + selection
│   ├── rate-limit.ts             # Rate limiting logic
│   └── validation.ts             # Input validation functions
├── types/
│   └── index.ts                  # TypeScript type definitions
├── __tests__/
│   ├── lib/
│   │   ├── validation.test.ts
│   │   ├── questions.test.ts
│   │   └── exits.test.ts
│   └── api/
│       └── selah.test.ts
├── .env.example                  # Environment template
├── .env.local                    # Local env (gitignored)
├── .gitignore
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── vitest.config.ts
```

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `SelahInput.tsx`, `SessionComplete.tsx` |
| Lib modules | camelCase | `validation.ts`, `rateLimit.ts` |
| Types/Interfaces | PascalCase | `SessionState`, `SelahRequest` |
| Functions | camelCase | `getRandomQuestion()`, `validateUserMessage()` |
| Constants | SCREAMING_SNAKE_CASE | `OPENING_QUESTIONS`, `SELAH_SYSTEM_PROMPT` |
| Test files | `{module}.test.ts` | `validation.test.ts` |

## Import Order Convention

```typescript
// 1. React/Next.js imports
import { useState, useCallback } from 'react';
import { NextRequest } from 'next/server';

// 2. External libraries
import Anthropic from '@anthropic-ai/sdk';

// 3. Internal lib modules (alphabetical)
import { getRandomExitSentence } from '@/lib/exits';
import { SELAH_SYSTEM_PROMPT } from '@/lib/prompts';
import { validateUserMessage } from '@/lib/validation';

// 4. Internal components (alphabetical)
import { SelahInput } from '@/components/SelahInput';

// 5. Types
import type { SelahRequest, SelahResponse } from '@/types';
```

---

## Type Definitions

### Core Types (`types/index.ts`)

```typescript
// types/index.ts

/**
 * Session phases - forward-only flow
 */
export type SessionPhase = 'input' | 'loading' | 'complete';

/**
 * Full session state for page component
 */
export interface SessionState {
  phase: SessionPhase;
  question: string;
  userResponse: string;
  reflection: string;
  exitSentence: string;
  error: string | null;
}

/**
 * API request body
 */
export interface SelahRequest {
  message: string;
  question: string;
}

/**
 * API success response
 */
export interface SelahResponse {
  reflection: string;
  exitSentence: string;
}

/**
 * API error types
 */
export type ErrorType =
  | 'validation_error'
  | 'rate_limit'
  | 'api_error'
  | 'config_error';

/**
 * API error response
 */
export interface SelahErrorResponse {
  error: ErrorType;
  message: string;
}

/**
 * Validation result discriminated union
 */
export type ValidationResult =
  | { valid: true; data: SelahRequest }
  | { valid: false; error: string };
```

---

## API Route Patterns

### Standard POST Handler

```typescript
// app/api/selah/route.ts
import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { validateSelahRequest } from '@/lib/validation';
import { SELAH_SYSTEM_PROMPT } from '@/lib/prompts';
import { getRandomExitSentence } from '@/lib/exits';
import { checkRateLimit } from '@/lib/rate-limit';
import type { SelahResponse, SelahErrorResponse } from '@/types';

export async function POST(request: NextRequest) {
  // 1. Rate limiting
  const ip = request.headers.get('x-forwarded-for') || 'anonymous';
  if (!checkRateLimit(ip)) {
    return Response.json(
      { error: 'rate_limit', message: 'Please wait a moment.' } satisfies SelahErrorResponse,
      { status: 429 }
    );
  }

  // 2. Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: 'validation_error', message: 'Invalid request.' } satisfies SelahErrorResponse,
      { status: 400 }
    );
  }

  // 3. Validate input
  const validation = validateSelahRequest(body);
  if (!validation.valid) {
    return Response.json(
      { error: 'validation_error', message: validation.error } satisfies SelahErrorResponse,
      { status: 400 }
    );
  }

  // 4. Check API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not configured');
    return Response.json(
      { error: 'config_error', message: 'Something went wrong.' } satisfies SelahErrorResponse,
      { status: 500 }
    );
  }

  // 5. Call AI
  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 150,
      system: SELAH_SYSTEM_PROMPT,
      messages: [
        { role: 'assistant', content: validation.data.question },
        { role: 'user', content: validation.data.message }
      ],
    });

    // 6. Parse AI response
    const text = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    const reflection = text.trim() || 'You are here.';
    const exitSentence = getRandomExitSentence();

    return Response.json({ reflection, exitSentence } satisfies SelahResponse);

  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return Response.json(
        { error: 'rate_limit', message: 'Please wait a moment.' } satisfies SelahErrorResponse,
        { status: 429 }
      );
    }

    console.error('AI API error:', error);
    return Response.json(
      { error: 'api_error', message: 'Something went wrong.' } satisfies SelahErrorResponse,
      { status: 500 }
    );
  }
}
```

### Error Response Helper

```typescript
// lib/errors.ts
import type { ErrorType, SelahErrorResponse } from '@/types';

const ERROR_MESSAGES: Record<ErrorType, string> = {
  validation_error: 'Invalid input.',
  rate_limit: 'Please wait a moment.',
  api_error: 'Something went wrong.',
  config_error: 'Something went wrong.',
};

export function createErrorResponse(
  type: ErrorType,
  status: number,
  customMessage?: string
): Response {
  const response: SelahErrorResponse = {
    error: type,
    message: customMessage || ERROR_MESSAGES[type],
  };
  return Response.json(response, { status });
}
```

---

## Component Patterns

### Client Component Structure

```typescript
// app/page.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { getRandomQuestion } from '@/lib/questions';
import { SelahInput } from '@/components/SelahInput';
import { SessionComplete } from '@/components/SessionComplete';
import type { SessionPhase, SelahResponse, SelahErrorResponse } from '@/types';

export default function SelahPage() {
  const [phase, setPhase] = useState<SessionPhase>('input');
  const [question, setQuestion] = useState<string>('');
  const [userResponse, setUserResponse] = useState<string>('');
  const [reflection, setReflection] = useState<string>('');
  const [exitSentence, setExitSentence] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Select question on mount (client-side only)
  useEffect(() => {
    setQuestion(getRandomQuestion());
  }, []);

  const handleSubmit = useCallback(async (message: string) => {
    if (phase !== 'input') return;

    setError(null);
    setUserResponse(message);
    setPhase('loading');

    try {
      const response = await fetch('/api/selah', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, question }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorData = data as SelahErrorResponse;
        setError(errorData.message);
        setPhase('input');
        return;
      }

      const successData = data as SelahResponse;
      setReflection(successData.reflection);
      setExitSentence(successData.exitSentence);
      setPhase('complete');

    } catch {
      setError('Something went wrong.');
      setPhase('input');
    }
  }, [phase, question]);

  // Don't render until question is loaded
  if (!question) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Question - always visible */}
      <p className="text-lg">{question}</p>

      {/* Input phase */}
      {phase !== 'complete' && (
        <SelahInput
          onSubmit={handleSubmit}
          disabled={phase === 'loading'}
          loading={phase === 'loading'}
        />
      )}

      {/* Error display */}
      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}

      {/* Complete phase */}
      {phase === 'complete' && (
        <SessionComplete
          reflection={reflection}
          exitSentence={exitSentence}
        />
      )}
    </div>
  );
}
```

### Input Component Pattern

```typescript
// components/SelahInput.tsx
'use client';

import { useState, useCallback, FormEvent, KeyboardEvent } from 'react';

interface SelahInputProps {
  onSubmit: (message: string) => void;
  disabled: boolean;
  loading: boolean;
}

export function SelahInput({ onSubmit, disabled, loading }: SelahInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed && !disabled) {
      onSubmit(trimmed);
    }
  }, [value, disabled, onSubmit]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const trimmed = value.trim();
      if (trimmed && !disabled) {
        onSubmit(trimmed);
      }
    }
  }, [value, disabled, onSubmit]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        maxLength={500}
        rows={3}
        className="w-full p-4 border border-gray-300 bg-white text-selah-text resize-none focus:outline-none focus:border-gray-500 disabled:opacity-50"
        autoFocus
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="px-6 py-2 border border-selah-text text-selah-text disabled:opacity-50"
      >
        {loading ? '...' : 'Continue'}
      </button>
    </form>
  );
}
```

### Session Complete Component Pattern

```typescript
// components/SessionComplete.tsx
interface SessionCompleteProps {
  reflection: string;
  exitSentence: string;
}

export function SessionComplete({ reflection, exitSentence }: SessionCompleteProps) {
  return (
    <div className="space-y-6">
      <p className="text-base">{reflection}</p>
      <p className="text-base font-medium">{exitSentence}</p>
      <p className="text-sm text-gray-500 mt-8">You can close this tab now.</p>
    </div>
  );
}
```

---

## Library Module Patterns

### Questions Module

```typescript
// lib/questions.ts

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

export function getRandomQuestion(): OpeningQuestion {
  const index = Math.floor(Math.random() * OPENING_QUESTIONS.length);
  return OPENING_QUESTIONS[index];
}
```

### Exits Module

```typescript
// lib/exits.ts

const PRIMARY_EXITS = [
  'Close this now.',
  "That's enough. Return.",
  'Go back to your day.',
  'You can leave this.',
  'Nothing more is needed.',
] as const;

const SECONDARY_EXITS = [
  'Step away from the screen.',
  'Let life continue.',
  'This is complete.',
] as const;

// Weighted selection: primary 3x more likely than secondary
export const EXIT_SENTENCES = [
  ...PRIMARY_EXITS,
  ...PRIMARY_EXITS,
  ...PRIMARY_EXITS,
  ...SECONDARY_EXITS,
] as const;

export type ExitSentence = typeof PRIMARY_EXITS[number] | typeof SECONDARY_EXITS[number];

export function getRandomExitSentence(): ExitSentence {
  const index = Math.floor(Math.random() * EXIT_SENTENCES.length);
  return EXIT_SENTENCES[index] as ExitSentence;
}
```

### Prompts Module

```typescript
// lib/prompts.ts

/**
 * System prompt - USE EXACTLY AS WRITTEN
 * Do not modify, improve, or paraphrase.
 */
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

### Validation Module

```typescript
// lib/validation.ts
import type { SelahRequest, ValidationResult } from '@/types';

const MIN_LENGTH = 1;
const MAX_LENGTH = 500;

export function validateSelahRequest(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request.' };
  }

  const { message, question } = body as Record<string, unknown>;

  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'Message is required.' };
  }

  const trimmed = message.trim();

  if (trimmed.length < MIN_LENGTH) {
    return { valid: false, error: 'Please type a response.' };
  }

  if (trimmed.length > MAX_LENGTH) {
    return { valid: false, error: 'Response too long.' };
  }

  if (!question || typeof question !== 'string') {
    return { valid: false, error: 'Question is required.' };
  }

  return {
    valid: true,
    data: { message: trimmed, question: question.trim() },
  };
}

export function validateUserMessage(message: unknown): string | null {
  if (typeof message !== 'string') {
    return 'Invalid input.';
  }

  const trimmed = message.trim();

  if (trimmed.length < MIN_LENGTH) {
    return 'Please type a response.';
  }

  if (trimmed.length > MAX_LENGTH) {
    return 'Response too long.';
  }

  return null;
}
```

### Rate Limiting Module

```typescript
// lib/rate-limit.ts

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60 * 1000;  // 1 minute
const MAX_REQUESTS = 10;

export function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = store.get(identifier) || { timestamps: [] };

  const recent = entry.timestamps.filter(ts => now - ts < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS) {
    return false;
  }

  recent.push(now);
  store.set(identifier, { timestamps: recent });

  return true;
}

// For testing
export function resetRateLimit(identifier?: string): void {
  if (identifier) {
    store.delete(identifier);
  } else {
    store.clear();
  }
}
```

---

## Testing Patterns

### Test File Naming Conventions

| Test Type | Location | Naming |
|-----------|----------|--------|
| Unit tests | `__tests__/lib/` | `{module}.test.ts` |
| API tests | `__tests__/api/` | `{route}.test.ts` |

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./__tests__/setup.ts'],
    include: ['__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/**/*.ts', 'app/api/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.d.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

### Test Setup File

```typescript
// __tests__/setup.ts
import { vi, beforeEach, afterEach } from 'vitest';

// Mock environment variables
beforeEach(() => {
  vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-test-key-for-testing');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
```

### Unit Test Pattern (Validation)

```typescript
// __tests__/lib/validation.test.ts
import { describe, it, expect } from 'vitest';
import { validateSelahRequest, validateUserMessage } from '@/lib/validation';

describe('validateSelahRequest', () => {
  it('rejects null body', () => {
    const result = validateSelahRequest(null);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBe('Invalid request.');
    }
  });

  it('rejects missing message', () => {
    const result = validateSelahRequest({ question: 'test' });
    expect(result.valid).toBe(false);
  });

  it('rejects empty message', () => {
    const result = validateSelahRequest({ message: '   ', question: 'test' });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBe('Please type a response.');
    }
  });

  it('rejects message over 500 chars', () => {
    const result = validateSelahRequest({
      message: 'a'.repeat(501),
      question: 'test',
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBe('Response too long.');
    }
  });

  it('rejects missing question', () => {
    const result = validateSelahRequest({ message: 'hello' });
    expect(result.valid).toBe(false);
  });

  it('accepts valid request', () => {
    const result = validateSelahRequest({
      message: 'I feel present',
      question: 'What is here.',
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.message).toBe('I feel present');
      expect(result.data.question).toBe('What is here.');
    }
  });

  it('trims whitespace from message', () => {
    const result = validateSelahRequest({
      message: '  hello world  ',
      question: 'test',
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.message).toBe('hello world');
    }
  });
});

describe('validateUserMessage', () => {
  it('returns null for valid message', () => {
    expect(validateUserMessage('Hello')).toBeNull();
  });

  it('returns error for non-string', () => {
    expect(validateUserMessage(123)).toBe('Invalid input.');
    expect(validateUserMessage(null)).toBe('Invalid input.');
  });

  it('returns error for empty string', () => {
    expect(validateUserMessage('')).toBe('Please type a response.');
    expect(validateUserMessage('   ')).toBe('Please type a response.');
  });

  it('returns error for too long message', () => {
    expect(validateUserMessage('a'.repeat(501))).toBe('Response too long.');
  });
});
```

### Unit Test Pattern (Questions)

```typescript
// __tests__/lib/questions.test.ts
import { describe, it, expect } from 'vitest';
import { OPENING_QUESTIONS, getRandomQuestion } from '@/lib/questions';

describe('OPENING_QUESTIONS', () => {
  it('has exactly 8 questions', () => {
    expect(OPENING_QUESTIONS).toHaveLength(8);
  });

  it('all questions end with period (not question mark)', () => {
    OPENING_QUESTIONS.forEach((q) => {
      expect(q.endsWith('.')).toBe(true);
      expect(q.endsWith('?')).toBe(false);
    });
  });

  it('all questions are short (under 50 chars)', () => {
    OPENING_QUESTIONS.forEach((q) => {
      expect(q.length).toBeLessThan(50);
    });
  });

  it('contains expected questions from vision', () => {
    expect(OPENING_QUESTIONS).toContain('Where are you right now.');
    expect(OPENING_QUESTIONS).toContain('What is here.');
    expect(OPENING_QUESTIONS).toContain('What do you feel in your body.');
  });
});

describe('getRandomQuestion', () => {
  it('returns a question from the list', () => {
    const question = getRandomQuestion();
    expect(OPENING_QUESTIONS).toContain(question);
  });

  it('returns different questions over multiple calls (statistical)', () => {
    const results = new Set<string>();
    for (let i = 0; i < 50; i++) {
      results.add(getRandomQuestion());
    }
    // Should get at least 3 different questions in 50 tries
    expect(results.size).toBeGreaterThanOrEqual(3);
  });
});
```

### Unit Test Pattern (Exits)

```typescript
// __tests__/lib/exits.test.ts
import { describe, it, expect } from 'vitest';
import { EXIT_SENTENCES, getRandomExitSentence } from '@/lib/exits';

describe('EXIT_SENTENCES', () => {
  it('weighted array has correct length', () => {
    // 5 primary * 3 + 3 secondary = 18
    expect(EXIT_SENTENCES).toHaveLength(18);
  });

  it('contains expected exits from vision', () => {
    expect(EXIT_SENTENCES).toContain('Close this now.');
    expect(EXIT_SENTENCES).toContain('Go back to your day.');
    expect(EXIT_SENTENCES).toContain('Step away from the screen.');
  });
});

describe('getRandomExitSentence', () => {
  it('returns an exit from the list', () => {
    const exit = getRandomExitSentence();
    expect(EXIT_SENTENCES).toContain(exit);
  });

  it('returns different exits over multiple calls', () => {
    const results = new Set<string>();
    for (let i = 0; i < 50; i++) {
      results.add(getRandomExitSentence());
    }
    expect(results.size).toBeGreaterThanOrEqual(3);
  });
});
```

### API Route Test Pattern (with Mocked Anthropic)

```typescript
// __tests__/api/selah.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/selah/route';
import { resetRateLimit } from '@/lib/rate-limit';

// Mock Anthropic SDK
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

function createRequest(body: unknown): Request {
  return new Request('http://localhost/api/selah', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/selah', () => {
  beforeEach(() => {
    resetRateLimit();
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-test-key');
  });

  it('returns 400 for missing message', async () => {
    const request = createRequest({ question: 'What is here.' });
    const response = await POST(request as any);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('validation_error');
  });

  it('returns 400 for empty message', async () => {
    const request = createRequest({ message: '   ', question: 'test' });
    const response = await POST(request as any);

    expect(response.status).toBe(400);
  });

  it('returns 400 for missing question', async () => {
    const request = createRequest({ message: 'I am here' });
    const response = await POST(request as any);

    expect(response.status).toBe(400);
  });

  it('returns 200 with reflection and exit on success', async () => {
    const request = createRequest({
      message: 'I feel present',
      question: 'What is here.',
    });
    const response = await POST(request as any);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('reflection');
    expect(data).toHaveProperty('exitSentence');
    expect(typeof data.reflection).toBe('string');
    expect(typeof data.exitSentence).toBe('string');
  });

  it('returns 500 when API key missing', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');

    const request = createRequest({
      message: 'test',
      question: 'test',
    });
    const response = await POST(request as any);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('config_error');
    // Should not expose internal details
    expect(data.message).toBe('Something went wrong.');
  });

  it('does not expose sensitive info in error responses', async () => {
    const request = createRequest({ message: '', question: '' });
    const response = await POST(request as any);
    const text = await response.text();

    expect(text).not.toContain('ANTHROPIC');
    expect(text).not.toContain('sk-ant');
    expect(text).not.toContain('apiKey');
  });
});
```

### Rate Limit Test Pattern

```typescript
// __tests__/lib/rate-limit.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    resetRateLimit();
  });

  it('allows requests under limit', () => {
    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit('test-ip')).toBe(true);
    }
  });

  it('blocks 11th request within window', () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit('test-ip');
    }
    expect(checkRateLimit('test-ip')).toBe(false);
  });

  it('isolates rate limits by identifier', () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit('ip-1');
    }
    expect(checkRateLimit('ip-1')).toBe(false);
    expect(checkRateLimit('ip-2')).toBe(true);
  });
});

describe('resetRateLimit', () => {
  it('resets specific identifier', () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit('test-ip');
    }
    expect(checkRateLimit('test-ip')).toBe(false);

    resetRateLimit('test-ip');
    expect(checkRateLimit('test-ip')).toBe(true);
  });

  it('resets all when no identifier provided', () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit('ip-1');
      checkRateLimit('ip-2');
    }
    resetRateLimit();
    expect(checkRateLimit('ip-1')).toBe(true);
    expect(checkRateLimit('ip-2')).toBe(true);
  });
});
```

---

## Security Patterns

### API Key Handling

```typescript
// CORRECT: Server-side only
// In app/api/selah/route.ts
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('ANTHROPIC_API_KEY not configured');
  return Response.json(
    { error: 'config_error', message: 'Something went wrong.' },
    { status: 500 }
  );
}

// WRONG: Never do this
// const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;  // EXPOSED TO CLIENT!
```

### Input Validation at API Boundary

```typescript
// Always validate before using input
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: 'validation_error', message: 'Invalid request.' },
      { status: 400 }
    );
  }

  const validation = validateSelahRequest(body);
  if (!validation.valid) {
    return Response.json(
      { error: 'validation_error', message: validation.error },
      { status: 400 }
    );
  }

  // Now safe to use validation.data
  const { message, question } = validation.data;
}
```

### Error Message Sanitization

```typescript
// CORRECT: Generic error message
catch (error) {
  console.error('AI API error:', error);  // Log for debugging
  return Response.json(
    { error: 'api_error', message: 'Something went wrong.' },  // User sees this
    { status: 500 }
  );
}

// WRONG: Exposing internal details
catch (error) {
  return Response.json(
    { error: 'api_error', message: error.message },  // LEAKS DETAILS!
    { status: 500 }
  );
}
```

### Environment Variable Validation

```typescript
// lib/env.ts (optional but recommended)
export function validateEnv(): void {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured.');
  }

  // Warning for malformed key (not error - might be valid new format)
  if (!apiKey.startsWith('sk-ant-')) {
    console.warn('ANTHROPIC_API_KEY format looks unusual.');
  }
}
```

---

## Error Handling Patterns

### API Error Response Structure

```typescript
// Always use consistent error response format
interface SelahErrorResponse {
  error: ErrorType;
  message: string;
}

// Error types
type ErrorType =
  | 'validation_error'  // 400
  | 'rate_limit'        // 429
  | 'api_error'         // 500
  | 'config_error';     // 500
```

### Client-Side Error Handling

```typescript
// In page component
try {
  const response = await fetch('/api/selah', { ... });
  const data = await response.json();

  if (!response.ok) {
    // API returned error response
    const errorData = data as SelahErrorResponse;
    setError(errorData.message);
    setPhase('input');  // Allow retry
    return;
  }

  // Success
  const successData = data as SelahResponse;
  setReflection(successData.reflection);
  setExitSentence(successData.exitSentence);
  setPhase('complete');

} catch {
  // Network error or JSON parse failure
  setError('Something went wrong.');
  setPhase('input');
}
```

### Error Display in UI

```typescript
// Minimal, non-alarming error display
{error && (
  <p className="text-red-600 text-sm">{error}</p>
)}
```

---

## Styling Patterns

### Layout Structure

```typescript
// app/layout.tsx
import './globals.css';

export const metadata = {
  title: 'selah',
  description: 'A brief pause.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-selah-bg text-selah-text min-h-screen antialiased">
        <main className="max-w-md mx-auto px-6 py-16">
          {children}
        </main>
      </body>
    </html>
  );
}
```

### Global CSS

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-selah-bg text-selah-text;
  }
}
```

### Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'selah-bg': '#fafafa',
        'selah-text': '#1a1a1a',
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## Code Quality Standards

| Standard | Requirement |
|----------|-------------|
| No `any` types | Use proper typing or `unknown` |
| No unused variables | ESLint enforces this |
| No console.log in production code | Use console.error for errors only |
| All exports explicitly typed | Return types on functions |
| Tests for all lib functions | Coverage target 70% |

---

*Patterns documented: 2026-01-14*
*Iteration: 1 - Core Loop*
*Mode: PRODUCTION*
