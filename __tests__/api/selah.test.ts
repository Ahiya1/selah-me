// __tests__/api/selah.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resetRateLimit } from '@/lib/rate-limit';
import type { SelahErrorResponse, SelahResponse } from '@/types';

// Create a RateLimitError class for testing
class MockRateLimitError extends Error {
  constructor(message?: string) {
    super(message || 'Rate limit exceeded');
    this.name = 'RateLimitError';
  }
}

// Mock Anthropic SDK
const mockCreate = vi.fn();
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: { create: mockCreate },
    })),
  };
});

// Import after mocking
import { POST } from '@/app/api/selah/route';

function createRequest(
  body: unknown,
  headers?: Record<string, string>
): Request {
  return new Request('http://localhost/api/selah', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function createRequestWithInvalidJson(): Request {
  return new Request('http://localhost/api/selah', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: 'not valid json',
  });
}

describe('POST /api/selah', () => {
  beforeEach(() => {
    resetRateLimit();
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-test-key');
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'There is presence here.' }],
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  describe('validation errors', () => {
    it('returns 400 for invalid JSON body', async () => {
      const request = createRequestWithInvalidJson();
      const response = await POST(request as any);

      expect(response.status).toBe(400);
      const data = (await response.json()) as SelahErrorResponse;
      expect(data.error).toBe('validation_error');
      expect(data.message).toBe('Invalid request.');
    });

    it('returns 400 for null body', async () => {
      const request = new Request('http://localhost/api/selah', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'null',
      });
      const response = await POST(request as any);

      expect(response.status).toBe(400);
      const data = (await response.json()) as SelahErrorResponse;
      expect(data.error).toBe('validation_error');
    });

    it('returns 400 for missing message', async () => {
      const request = createRequest({ question: 'What is here.' });
      const response = await POST(request as any);

      expect(response.status).toBe(400);
      const data = (await response.json()) as SelahErrorResponse;
      expect(data.error).toBe('validation_error');
      expect(data.message).toBe('Message is required.');
    });

    it('returns 400 for empty message', async () => {
      const request = createRequest({ message: '   ', question: 'test' });
      const response = await POST(request as any);

      expect(response.status).toBe(400);
      const data = (await response.json()) as SelahErrorResponse;
      expect(data.error).toBe('validation_error');
      expect(data.message).toBe('Please type a response.');
    });

    it('returns 400 for message that is not a string', async () => {
      const request = createRequest({ message: 123, question: 'test' });
      const response = await POST(request as any);

      expect(response.status).toBe(400);
      const data = (await response.json()) as SelahErrorResponse;
      expect(data.error).toBe('validation_error');
    });

    it('returns 400 for message over 500 characters', async () => {
      const request = createRequest({
        message: 'a'.repeat(501),
        question: 'test',
      });
      const response = await POST(request as any);

      expect(response.status).toBe(400);
      const data = (await response.json()) as SelahErrorResponse;
      expect(data.error).toBe('validation_error');
      expect(data.message).toBe('Response too long.');
    });

    it('returns 400 for missing question', async () => {
      const request = createRequest({ message: 'I am here' });
      const response = await POST(request as any);

      expect(response.status).toBe(400);
      const data = (await response.json()) as SelahErrorResponse;
      expect(data.error).toBe('validation_error');
      expect(data.message).toBe('Question is required.');
    });

    it('returns 400 for question that is not a string', async () => {
      const request = createRequest({ message: 'hello', question: 42 });
      const response = await POST(request as any);

      expect(response.status).toBe(400);
      const data = (await response.json()) as SelahErrorResponse;
      expect(data.error).toBe('validation_error');
    });
  });

  describe('successful requests', () => {
    it('returns 200 with reflection and exitSentence on success', async () => {
      const request = createRequest({
        message: 'I feel present',
        question: 'What is here.',
      });
      const response = await POST(request as any);

      expect(response.status).toBe(200);
      const data = (await response.json()) as SelahResponse;
      expect(data).toHaveProperty('reflection');
      expect(data).toHaveProperty('exitSentence');
      expect(typeof data.reflection).toBe('string');
      expect(typeof data.exitSentence).toBe('string');
      expect(data.reflection).toBe('There is presence here.');
    });

    it('trims whitespace from response message', async () => {
      const request = createRequest({
        message: '  I feel calm  ',
        question: 'What is here.',
      });
      const response = await POST(request as any);

      expect(response.status).toBe(200);

      // Verify Anthropic was called with trimmed message
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'user', content: 'I feel calm' }),
          ]),
        })
      );
    });

    it('uses fallback reflection when AI returns empty text', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: '   ' }],
      });

      const request = createRequest({
        message: 'test',
        question: 'What is here.',
      });
      const response = await POST(request as any);

      expect(response.status).toBe(200);
      const data = (await response.json()) as SelahResponse;
      expect(data.reflection).toBe('You are here.');
    });

    it('uses fallback when AI returns non-text content', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [{ type: 'image', source: {} }],
      });

      const request = createRequest({
        message: 'test',
        question: 'What is here.',
      });
      const response = await POST(request as any);

      expect(response.status).toBe(200);
      const data = (await response.json()) as SelahResponse;
      expect(data.reflection).toBe('You are here.');
    });

    it('calls Anthropic with correct parameters', async () => {
      const request = createRequest({
        message: 'I feel present',
        question: 'What is here.',
      });
      await POST(request as any);

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 150,
        system: expect.stringContaining('You are selah-me'),
        messages: [
          { role: 'assistant', content: 'What is here.' },
          { role: 'user', content: 'I feel present' },
        ],
      });
    });
  });

  describe('configuration errors', () => {
    it('returns 500 when API key is missing', async () => {
      vi.stubEnv('ANTHROPIC_API_KEY', '');

      const request = createRequest({
        message: 'test',
        question: 'test',
      });
      const response = await POST(request as any);

      expect(response.status).toBe(500);
      const data = (await response.json()) as SelahErrorResponse;
      expect(data.error).toBe('config_error');
      expect(data.message).toBe('Something went wrong.');
    });

    it('returns 500 when API key is undefined', async () => {
      // Unstub and then delete the env var to simulate undefined
      vi.unstubAllEnvs();
      const originalKey = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      try {
        const request = createRequest({
          message: 'test',
          question: 'test',
        });
        const response = await POST(request as any);

        expect(response.status).toBe(500);
        const data = (await response.json()) as SelahErrorResponse;
        expect(data.error).toBe('config_error');
      } finally {
        // Restore for other tests
        if (originalKey !== undefined) {
          process.env.ANTHROPIC_API_KEY = originalKey;
        }
      }
    });
  });

  describe('rate limiting', () => {
    it('returns 429 when local rate limit exceeded', async () => {
      // Make 10 requests (the limit)
      for (let i = 0; i < 10; i++) {
        const request = createRequest({
          message: 'test',
          question: 'test',
        });
        const response = await POST(request as any);
        expect(response.status).toBe(200);
      }

      // 11th request should be rate limited
      const request = createRequest({
        message: 'test',
        question: 'test',
      });
      const response = await POST(request as any);

      expect(response.status).toBe(429);
      const data = (await response.json()) as SelahErrorResponse;
      expect(data.error).toBe('rate_limit');
      expect(data.message).toBe('Please wait a moment.');
    });

    it('isolates rate limits by IP', async () => {
      // Exhaust rate limit for IP 1
      for (let i = 0; i < 10; i++) {
        const request = createRequest(
          { message: 'test', question: 'test' },
          { 'x-forwarded-for': 'ip-1' }
        );
        await POST(request as any);
      }

      // IP 1 should be limited
      const request1 = createRequest(
        { message: 'test', question: 'test' },
        { 'x-forwarded-for': 'ip-1' }
      );
      const response1 = await POST(request1 as any);
      expect(response1.status).toBe(429);

      // IP 2 should still work
      const request2 = createRequest(
        { message: 'test', question: 'test' },
        { 'x-forwarded-for': 'ip-2' }
      );
      const response2 = await POST(request2 as any);
      expect(response2.status).toBe(200);
    });

    it('returns 429 when Anthropic rate limit is hit', async () => {
      mockCreate.mockRejectedValueOnce(
        new MockRateLimitError('Rate limit exceeded')
      );

      const request = createRequest({
        message: 'test',
        question: 'test',
      });
      const response = await POST(request as any);

      expect(response.status).toBe(429);
      const data = (await response.json()) as SelahErrorResponse;
      expect(data.error).toBe('rate_limit');
      expect(data.message).toBe('Please wait a moment.');
    });
  });

  describe('API errors', () => {
    it('returns 500 when Anthropic API throws generic error', async () => {
      mockCreate.mockRejectedValueOnce(new Error('API connection failed'));

      const request = createRequest({
        message: 'test',
        question: 'test',
      });
      const response = await POST(request as any);

      expect(response.status).toBe(500);
      const data = (await response.json()) as SelahErrorResponse;
      expect(data.error).toBe('api_error');
      expect(data.message).toBe('Something went wrong.');
    });

    it('returns 500 when Anthropic API throws unexpected error type', async () => {
      mockCreate.mockRejectedValueOnce({ weird: 'error object' });

      const request = createRequest({
        message: 'test',
        question: 'test',
      });
      const response = await POST(request as any);

      expect(response.status).toBe(500);
      const data = (await response.json()) as SelahErrorResponse;
      expect(data.error).toBe('api_error');
    });
  });

  describe('security', () => {
    it('does not expose API key in error responses', async () => {
      vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-secret-key-12345');

      const request = createRequest({ message: '', question: '' });
      const response = await POST(request as any);
      const text = await response.text();

      expect(text).not.toContain('sk-ant');
      expect(text).not.toContain('secret');
      expect(text).not.toContain('12345');
    });

    it('does not expose internal error details', async () => {
      mockCreate.mockRejectedValueOnce(
        new Error('Internal API error with sensitive details: sk-ant-key')
      );

      const request = createRequest({
        message: 'test',
        question: 'test',
      });
      const response = await POST(request as any);
      const text = await response.text();

      expect(text).not.toContain('Internal');
      expect(text).not.toContain('sensitive');
      expect(text).not.toContain('sk-ant');
    });

    it('does not expose ANTHROPIC in error messages', async () => {
      vi.stubEnv('ANTHROPIC_API_KEY', '');

      const request = createRequest({
        message: 'test',
        question: 'test',
      });
      const response = await POST(request as any);
      const text = await response.text();

      expect(text).not.toContain('ANTHROPIC');
      expect(text).not.toContain('anthropic');
    });

    it('uses generic error message for config errors', async () => {
      vi.stubEnv('ANTHROPIC_API_KEY', '');

      const request = createRequest({
        message: 'test',
        question: 'test',
      });
      const response = await POST(request as any);
      const data = (await response.json()) as SelahErrorResponse;

      expect(data.message).toBe('Something went wrong.');
    });

    it('uses generic error message for API errors', async () => {
      mockCreate.mockRejectedValueOnce(new Error('Specific failure reason'));

      const request = createRequest({
        message: 'test',
        question: 'test',
      });
      const response = await POST(request as any);
      const data = (await response.json()) as SelahErrorResponse;

      expect(data.message).toBe('Something went wrong.');
      expect(data.message).not.toContain('Specific');
    });
  });

  describe('response format', () => {
    it('returns correct content type header', async () => {
      const request = createRequest({
        message: 'test',
        question: 'test',
      });
      const response = await POST(request as any);

      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('returns valid JSON for success response', async () => {
      const request = createRequest({
        message: 'test',
        question: 'test',
      });
      const response = await POST(request as any);
      const data = await response.json();

      expect(data).toBeDefined();
      expect(typeof data).toBe('object');
    });

    it('returns valid JSON for error response', async () => {
      const request = createRequest({ message: '' });
      const response = await POST(request as any);
      const data = await response.json();

      expect(data).toBeDefined();
      expect(typeof data).toBe('object');
    });
  });
});
