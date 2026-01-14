# Explorer 1: Architecture Report - Iteration 1

**Focus Area:** Architecture & Structure Analysis  
**Iteration:** 1 - Core Loop  
**Date:** 2026-01-14  

---

## Executive Summary

Iteration 1 builds the complete working flow from opening question to exit sentence. The architecture is deliberately minimal: a single page component managing linear state transitions, one API route proxying AI calls, and pure utility functions for question/exit selection. No database, no auth, no client-side state management library. The linear, forward-only flow eliminates navigation complexity.

---

## Component Structure

### Overview

The Core Loop requires exactly 4 React components/files and 5 library modules:

```
Components (4):
├── app/page.tsx           # Main page (orchestrates flow)
├── app/layout.tsx         # Root layout (minimal)
├── components/SelahInput.tsx    # Text input with submit
└── components/SessionComplete.tsx  # End state display

Library Modules (5):
├── lib/prompts.ts         # System prompt + question/exit lists
├── lib/questions.ts       # Question selection logic
├── lib/exits.ts           # Exit selection logic  
├── lib/validation.ts      # Input validation
└── lib/ai.ts              # Anthropic client wrapper

API Route (1):
└── app/api/selah/route.ts # AI proxy endpoint
```

### Component Descriptions

#### 1. `app/page.tsx` - Main Page Component

**Responsibility:** Orchestrates the entire session flow. Manages state transitions. Renders appropriate UI for each phase.

**Type:** Client Component (`'use client'`)

**State:**
```typescript
type SessionPhase = 'question' | 'input' | 'loading' | 'reflection' | 'complete';

interface SessionState {
  phase: SessionPhase;
  question: string;        // Opening question to display
  userResponse: string;    // What user typed
  reflection: string;      // AI reflection line
  exitSentence: string;    // AI exit sentence
  error: string | null;    // Error message if any
}
```

**Key behaviors:**
- On mount: Select random question, set phase to 'question' briefly, then 'input'
- On submit: Set phase to 'loading', call API, parse response
- On API success: Set reflection + exit, set phase to 'reflection', then 'complete'
- On API error: Display error message, keep at 'input' phase
- **No back button, no retry** - once submitted, flow is one-way

**Renders:**
- Question display (always visible after load)
- Input component (when phase is 'input' or 'loading')
- Loading indicator (when phase is 'loading')
- Reflection text (when phase is 'reflection' or 'complete')
- Exit sentence (when phase is 'complete')
- Session complete message (when phase is 'complete')

#### 2. `app/layout.tsx` - Root Layout

**Responsibility:** Minimal HTML structure. Sets meta tags, applies base styles.

**Type:** Server Component

**Styling:**
- Background: off-white (`#fafafa`)
- Text: near-black (`#1a1a1a`)  
- Font: system font stack
- Centered content container

```tsx
// Minimal structure
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#fafafa] text-[#1a1a1a] min-h-screen antialiased">
        <main className="max-w-md mx-auto px-6 py-16">
          {children}
        </main>
      </body>
    </html>
  );
}
```

#### 3. `components/SelahInput.tsx` - Input Component

**Responsibility:** Captures user response. Handles submit.

**Type:** Client Component

**Props:**
```typescript
interface SelahInputProps {
  onSubmit: (message: string) => void;
  disabled: boolean;
  loading: boolean;
}
```

**Key behaviors:**
- Single `<textarea>` for user input
- Submit button (or Enter key)
- Disabled state during loading
- No placeholder text (keeps it minimal)
- Max length enforcement (500 chars)

**Styling:**
- Minimal border
- Full width
- Comfortable padding
- Focus ring subtle

#### 4. `components/SessionComplete.tsx` - Session Complete

**Responsibility:** Display when session ends. Nudge user to close tab.

**Type:** Client Component (or could be Server Component)

**Props:**
```typescript
interface SessionCompleteProps {
  reflection: string;
  exitSentence: string;
}
```

**Renders:**
- Reflection text
- Exit sentence (emphasized)
- Subtle "close this tab" nudge text
- No buttons, no actions - session is over

---

## Data Flow

### Complete Session Flow

```
1. PAGE LOAD
   ├── page.tsx mounts
   ├── getRandomQuestion() called → returns question string
   ├── State: { phase: 'input', question: '...', ... }
   └── Render: Question + Input form

2. USER TYPES & SUBMITS
   ├── SelahInput captures text
   ├── onSubmit(userMessage) called
   ├── validateUserMessage(text) → null (valid) or error string
   ├── If invalid: show error, stay at 'input'
   ├── If valid: State: { phase: 'loading', userResponse: text, ... }
   └── Render: Question + Input (disabled) + Loading indicator

3. API CALL
   ├── fetch('/api/selah', { method: 'POST', body: { message, question } })
   ├── Server: validate input
   ├── Server: call Anthropic API with system prompt
   ├── Server: parse AI response into reflection + exit
   └── Server: return JSON { reflection, exitSentence } or { error }

4. RESPONSE HANDLING
   ├── If error: State: { phase: 'input', error: 'Something went wrong' }
   ├── If success: State: { phase: 'complete', reflection, exitSentence }
   └── Render: Question + Reflection + Exit + "Session Complete"

5. SESSION END
   ├── No further interactions possible
   ├── User closes tab
   └── No data persisted anywhere
```

### API Data Flow

```
Client Request:
POST /api/selah
{
  "message": "I feel tight in my chest",
  "question": "What is here."
}

Server Processing:
1. Validate request body
2. Check rate limit (optional)
3. Build conversation for AI:
   - System prompt (from lib/prompts.ts)
   - User context: "Question asked: {question}\nUser response: {message}"
4. Call Anthropic API
5. Parse response (extract reflection + exit)
6. Return response

Client Response (Success):
{
  "reflection": "There is tightness in your chest.",
  "exitSentence": "Close this now."
}

Client Response (Error):
{
  "error": "rate_limit" | "api_error" | "validation_error",
  "message": "Brief description"
}
```

---

## API Design

### Endpoint: `POST /api/selah`

**Location:** `/home/ahiya/Ahiya/selah-me/app/api/selah/route.ts`

#### Request Format

```typescript
interface SelahRequest {
  message: string;    // User's response (1-500 chars)
  question: string;   // The opening question that was shown
}
```

**Headers:**
```
Content-Type: application/json
```

**Example request:**
```json
{
  "message": "I feel scattered and can't focus",
  "question": "What is happening right now."
}
```

#### Response Format (Success)

**Status:** 200 OK

```typescript
interface SelahResponse {
  reflection: string;   // AI's reflection line
  exitSentence: string; // AI's exit sentence
}
```

**Example response:**
```json
{
  "reflection": "There is scattering and difficulty focusing.",
  "exitSentence": "Go back to your day."
}
```

#### Response Format (Error)

**Status:** 400, 429, or 500

```typescript
interface SelahErrorResponse {
  error: 'validation_error' | 'rate_limit' | 'api_error' | 'config_error';
  message: string;  // User-safe message (never exposes internals)
}
```

**Examples:**
```json
// 400 - Validation Error
{
  "error": "validation_error",
  "message": "Message is required"
}

// 429 - Rate Limit
{
  "error": "rate_limit", 
  "message": "Please wait a moment"
}

// 500 - API Error
{
  "error": "api_error",
  "message": "Something went wrong"
}
```

#### Input Validation Requirements

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `message` | string | Yes | 1-500 characters, non-empty after trim |
| `question` | string | Yes | Must be from approved question list |

**Validation logic (`lib/validation.ts`):**
```typescript
export function validateSelahRequest(body: unknown): 
  { valid: true; data: SelahRequest } | 
  { valid: false; error: string } {
  
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }
  
  const { message, question } = body as Record<string, unknown>;
  
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'Message is required' };
  }
  
  const trimmed = message.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  
  if (trimmed.length > 500) {
    return { valid: false, error: 'Message too long' };
  }
  
  if (!question || typeof question !== 'string') {
    return { valid: false, error: 'Question is required' };
  }
  
  // Optional: validate question is from approved list
  // For now, accept any question to allow flexibility
  
  return { valid: true, data: { message: trimmed, question } };
}
```

#### Error Handling Approach

**Principle:** Errors should be minimal, non-alarming, and aligned with the "almost boring" aesthetic.

**Error handling in route:**
```typescript
// app/api/selah/route.ts
import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  // 1. Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: 'validation_error', message: 'Invalid JSON' },
      { status: 400 }
    );
  }

  // 2. Validate input
  const validation = validateSelahRequest(body);
  if (!validation.valid) {
    return Response.json(
      { error: 'validation_error', message: validation.error },
      { status: 400 }
    );
  }

  // 3. Check API key exists
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not configured');
    return Response.json(
      { error: 'config_error', message: 'Something went wrong' },
      { status: 500 }
    );
  }

  // 4. Call AI
  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 150,
      system: SELAH_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Question shown: ${validation.data.question}\n\nUser's response: ${validation.data.message}`
      }]
    });

    // 5. Parse response
    const text = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';
    
    const { reflection, exitSentence } = parseAIResponse(text);
    
    return Response.json({ reflection, exitSentence });

  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return Response.json(
        { error: 'rate_limit', message: 'Please wait a moment' },
        { status: 429 }
      );
    }
    
    console.error('AI API error:', error);
    return Response.json(
      { error: 'api_error', message: 'Something went wrong' },
      { status: 500 }
    );
  }
}
```

#### AI Response Parsing

The AI should return exactly:
1. One reflection sentence
2. One exit sentence

**Parsing strategy:**
```typescript
function parseAIResponse(text: string): { reflection: string; exitSentence: string } {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  if (lines.length >= 2) {
    return {
      reflection: lines[0].trim(),
      exitSentence: lines[1].trim()
    };
  }
  
  if (lines.length === 1) {
    // AI only gave one line - use default exit
    return {
      reflection: lines[0].trim(),
      exitSentence: 'Close this now.'
    };
  }
  
  // Fallback if AI returns nothing
  return {
    reflection: 'You are here.',
    exitSentence: 'Close this now.'
  };
}
```

---

## State Management

### Session States

The session follows a **linear, forward-only flow** through 5 states:

```
┌──────────────┐
│   question   │  Display opening question
└──────┬───────┘
       │ (immediate transition on mount)
       ▼
┌──────────────┐
│    input     │  Show input field, user can type
└──────┬───────┘
       │ (user submits)
       ▼
┌──────────────┐
│   loading    │  API call in progress
└──────┬───────┘
       │ (API returns)
       ▼
┌──────────────┐
│  reflection  │  Show AI response (brief pause)
└──────┬───────┘
       │ (auto-transition after ~1s or immediate)
       ▼
┌──────────────┐
│   complete   │  Show exit sentence, session over
└──────────────┘
```

**Note:** The 'question' and 'reflection' states are optional brief pauses. Implementation can simplify to just 3 core states:
- `input` - waiting for user
- `loading` - API in progress  
- `complete` - session ended

### State Transitions

```typescript
type SessionPhase = 'input' | 'loading' | 'complete';

// Transition rules (forward-only):
// input -> loading (on submit)
// loading -> complete (on API success)
// loading -> input (on API error, with error message)
// complete -> (terminal, no transition)
```

### Preventing Going Back

**Requirements:**
- No browser back button within session (single page, no routing)
- No "retry" or "ask another question" button in UI
- No way to reset state without page refresh
- If user refreshes, they get a new random question (expected behavior)

**Implementation:**
1. Single page architecture = no route history to go back to
2. No buttons or controls that reset state
3. Once at 'complete', the session is over
4. Error state returns to 'input' (not back - forward to retry)

**Code pattern:**
```typescript
// State can only move forward
function handleSubmit(message: string) {
  if (phase !== 'input') return; // Guard against double-submit
  setPhase('loading');
  // ... API call
}

function handleAPISuccess(result: SelahResponse) {
  // Always move to complete, never back
  setReflection(result.reflection);
  setExitSentence(result.exitSentence);
  setPhase('complete');
}

function handleAPIError(error: string) {
  // Error allows retry, but from current state
  setError(error);
  setPhase('input'); // Back to input to retry
}
```

### Loading States

**During API call (`phase === 'loading'`):**
- Input field disabled
- Submit button disabled or hidden
- Simple loading indicator (no spinner animation per vision)
- Possible: subtle "..." or "waiting" text

**Loading indicator options (aligned with minimal aesthetic):**
```tsx
// Option 1: Disabled input, no indicator
<SelahInput disabled={true} loading={true} />

// Option 2: Simple text
{phase === 'loading' && (
  <p className="text-gray-500 text-sm mt-2">...</p>
)}

// Option 3: Subtle opacity change on button
<button disabled className="opacity-50">Submit</button>
```

**Recommendation:** Option 1 or 2. No animated spinners (violates "no animation" principle).

### Error State Handling

```typescript
// Error state is part of main state
interface SessionState {
  // ...
  error: string | null;
}

// On error:
setError('Something went wrong');
setPhase('input'); // Stay at input to allow retry

// Clear error on new attempt:
function handleSubmit(message: string) {
  setError(null);
  setPhase('loading');
  // ...
}
```

**Error display in UI:**
```tsx
{error && (
  <p className="text-red-600 text-sm mt-2">{error}</p>
)}
```

---

## Testing Requirements

### Components That Need Unit Tests

| Component/Module | Test Priority | What to Test |
|------------------|---------------|--------------|
| `lib/validation.ts` | HIGH | All validation rules |
| `lib/questions.ts` | HIGH | Random selection, list completeness |
| `lib/exits.ts` | HIGH | Random selection, list completeness |
| `lib/prompts.ts` | MEDIUM | Prompt string exists, is non-empty |
| `app/api/selah/route.ts` | HIGH | Full request/response cycle |

### Unit Tests for Library Functions

**`tests/lib/validation.test.ts`:**
```typescript
import { describe, it, expect } from 'vitest';
import { validateSelahRequest } from '@/lib/validation';

describe('validateSelahRequest', () => {
  it('rejects null body', () => {
    const result = validateSelahRequest(null);
    expect(result.valid).toBe(false);
  });

  it('rejects missing message', () => {
    const result = validateSelahRequest({ question: 'test' });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Message');
  });

  it('rejects empty message', () => {
    const result = validateSelahRequest({ message: '   ', question: 'test' });
    expect(result.valid).toBe(false);
  });

  it('rejects message over 500 chars', () => {
    const result = validateSelahRequest({ 
      message: 'a'.repeat(501), 
      question: 'test' 
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('long');
  });

  it('accepts valid request', () => {
    const result = validateSelahRequest({ 
      message: 'I feel present', 
      question: 'What is here.' 
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.message).toBe('I feel present');
    }
  });

  it('trims whitespace from message', () => {
    const result = validateSelahRequest({ 
      message: '  hello  ', 
      question: 'test' 
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.message).toBe('hello');
    }
  });
});
```

**`tests/lib/questions.test.ts`:**
```typescript
import { describe, it, expect } from 'vitest';
import { getRandomQuestion, OPENING_QUESTIONS } from '@/lib/questions';

describe('questions', () => {
  it('has at least 8 opening questions', () => {
    expect(OPENING_QUESTIONS.length).toBeGreaterThanOrEqual(8);
  });

  it('all questions end with period (no question marks)', () => {
    // Vision specifies questions like "What is here." not "What is here?"
    OPENING_QUESTIONS.forEach(q => {
      expect(q.endsWith('.')).toBe(true);
    });
  });

  it('getRandomQuestion returns a question from the list', () => {
    const question = getRandomQuestion();
    expect(OPENING_QUESTIONS).toContain(question);
  });

  it('questions are short (under 50 chars)', () => {
    OPENING_QUESTIONS.forEach(q => {
      expect(q.length).toBeLessThan(50);
    });
  });
});
```

**`tests/lib/exits.test.ts`:**
```typescript
import { describe, it, expect } from 'vitest';
import { getRandomExit, EXIT_SENTENCES } from '@/lib/exits';

describe('exits', () => {
  it('has at least 8 exit sentences', () => {
    expect(EXIT_SENTENCES.length).toBeGreaterThanOrEqual(8);
  });

  it('getRandomExit returns an exit from the list', () => {
    const exit = getRandomExit();
    expect(EXIT_SENTENCES).toContain(exit);
  });

  it('exit sentences are short (under 40 chars)', () => {
    EXIT_SENTENCES.forEach(e => {
      expect(e.length).toBeLessThan(40);
    });
  });
});
```

### API Route Testing Strategy

**Approach:** Mock the Anthropic SDK to test the route handler logic without making real API calls.

**`tests/api/selah.test.ts`:**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'You are here.\nClose this now.' }]
        })
      }
    }))
  };
});

// Must import after mock
import { POST } from '@/app/api/selah/route';

describe('POST /api/selah', () => {
  beforeEach(() => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
  });

  it('returns 400 for missing message', async () => {
    const request = new Request('http://localhost/api/selah', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'test' })
    });

    const response = await POST(request as any);
    expect(response.status).toBe(400);
    
    const data = await response.json();
    expect(data.error).toBe('validation_error');
  });

  it('returns reflection and exit on success', async () => {
    const request = new Request('http://localhost/api/selah', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: 'I feel present',
        question: 'What is here.'
      })
    });

    const response = await POST(request as any);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.reflection).toBeDefined();
    expect(data.exitSentence).toBeDefined();
  });

  it('returns 500 when API key missing', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    
    const request = new Request('http://localhost/api/selah', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: 'test',
        question: 'test'
      })
    });

    const response = await POST(request as any);
    expect(response.status).toBe(500);
    
    const data = await response.json();
    expect(data.error).toBe('config_error');
  });
});
```

### Security Considerations

#### API Key Handling

| Requirement | Implementation |
|-------------|----------------|
| Keys server-side only | Use `process.env.ANTHROPIC_API_KEY` in route handler only |
| No NEXT_PUBLIC prefix | Never prefix AI keys with `NEXT_PUBLIC_` |
| Gitignore .env.local | Add `.env.local` to `.gitignore` |
| Provide template | Create `.env.example` with placeholder |
| Validate on startup | Check key exists before attempting API call |
| Never log keys | No `console.log(apiKey)` |
| Sanitize errors | Never include key in error messages |

**`.env.example` content:**
```bash
# Anthropic API Key (required)
# Get yours at: https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Optional: OpenAI fallback
# OPENAI_API_KEY=sk-your-key-here
```

#### Input Validation Security

- Validate all inputs server-side (never trust client)
- Limit message length (500 chars) to prevent abuse
- Trim whitespace to normalize input
- No SQL/NoSQL (no injection risk)
- No file uploads
- No HTML rendering of user input

#### Rate Limiting (Optional for Single User)

Simple in-memory rate limit for basic protection:
```typescript
// lib/rate-limit.ts
const requests = new Map<string, number[]>();

export function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const windowMs = 60_000; // 1 minute
  const maxRequests = 10;

  const history = requests.get(identifier) || [];
  const recent = history.filter(t => now - t < windowMs);

  if (recent.length >= maxRequests) {
    return false;
  }

  recent.push(now);
  requests.set(identifier, recent);
  return true;
}
```

---

## File Structure

### Complete File List for Iteration 1

```
/home/ahiya/Ahiya/selah-me/
├── app/
│   ├── api/
│   │   └── selah/
│   │       └── route.ts          # AI proxy endpoint
│   ├── globals.css               # Tailwind imports + base styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main page component
├── components/
│   ├── SelahInput.tsx            # Text input with submit
│   └── SessionComplete.tsx       # End state display
├── lib/
│   ├── ai.ts                     # Anthropic client helper
│   ├── exits.ts                  # Exit sentence list + selection
│   ├── prompts.ts                # System prompt constant
│   ├── questions.ts              # Question list + selection
│   └── validation.ts             # Input validation functions
├── types/
│   └── index.ts                  # TypeScript type definitions
├── tests/
│   ├── lib/
│   │   ├── validation.test.ts
│   │   ├── questions.test.ts
│   │   └── exits.test.ts
│   └── api/
│       └── selah.test.ts
├── .env.example                  # Environment template
├── .env.local                    # Local env (gitignored)
├── .gitignore                    # Git ignore rules
├── eslint.config.mjs             # ESLint config
├── next.config.ts                # Next.js config
├── package.json                  # Dependencies and scripts
├── postcss.config.mjs            # PostCSS config
├── tailwind.config.ts            # Tailwind config
├── tsconfig.json                 # TypeScript config
├── vitest.config.ts              # Vitest config
└── README.md                     # Setup instructions
```

### File Purposes

| File | Purpose | LOC Estimate |
|------|---------|--------------|
| `app/page.tsx` | Main UI, state management | ~100 |
| `app/layout.tsx` | HTML shell, base styles | ~25 |
| `app/globals.css` | Tailwind imports | ~10 |
| `app/api/selah/route.ts` | AI proxy, validation | ~80 |
| `components/SelahInput.tsx` | Input form | ~40 |
| `components/SessionComplete.tsx` | End display | ~30 |
| `lib/prompts.ts` | System prompt text | ~50 |
| `lib/questions.ts` | Question list | ~20 |
| `lib/exits.ts` | Exit list | ~20 |
| `lib/validation.ts` | Validation logic | ~40 |
| `lib/ai.ts` | AI client wrapper | ~30 |
| `types/index.ts` | Type definitions | ~30 |
| Tests (4 files) | Test coverage | ~150 |
| Config files (7) | Project setup | ~100 |

**Total estimated LOC:** ~725 lines (excluding node_modules)

---

## Recommendations for Builder

### Build Order

1. **Project scaffold** - Initialize Next.js with dependencies
2. **Types and lib modules** - Pure functions first (testable)
3. **API route** - Connect to Anthropic, test with curl
4. **Page component** - Wire up state and API
5. **Input component** - Form handling
6. **Session complete component** - End state
7. **Tests** - Write tests for all lib functions
8. **Styling polish** - Minimal visual adjustments

### Critical Implementation Notes

1. **System prompt must be exact** - Use the vision document's prompt verbatim
2. **Questions end with period, not question mark** - "What is here." not "What is here?"
3. **No animations** - Vision explicitly prohibits them
4. **Minimal styling** - Resist urge to add design flourishes
5. **Forward-only flow** - No back buttons, no retries, no resets
6. **Error handling aligned with tone** - Errors should be minimal and boring

### Potential Issues

| Issue | Mitigation |
|-------|------------|
| AI response format varies | Robust parsing with fallbacks |
| Rate limiting edge cases | Simple approach, test manually |
| TypeScript strict mode errors | Fix all `any` types properly |
| Tailwind purge issues | Verify production build |

---

## Questions for Planner

1. Should the loading state show any indicator, or just disable the input?
2. Is there a preferred fallback behavior if AI returns unexpected format?
3. Should rate limiting be implemented in Iteration 1 or deferred to Iteration 2?
4. Any preference on test coverage tool (c8, istanbul)?

---

*Report completed: 2026-01-14*
*Explorer 1: Architecture & Structure Analysis*
