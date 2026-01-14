// app/api/selah/route.ts
import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { validateSelahRequest } from '@/lib/validation';
import { SELAH_SYSTEM_PROMPT } from '@/lib/prompts';
import { getRandomExitSentence } from '@/lib/exits';
import { checkRateLimit } from '@/lib/rate-limit';
import type { SelahResponse, SelahErrorResponse } from '@/types';

export async function POST(request: NextRequest): Promise<Response> {
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
    // Check for Anthropic rate limit error by name (works with both real SDK and mocks)
    if (error instanceof Error && error.name === 'RateLimitError') {
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
