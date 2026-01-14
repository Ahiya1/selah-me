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

  it('rejects undefined body', () => {
    const result = validateSelahRequest(undefined);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBe('Invalid request.');
    }
  });

  it('rejects non-object body', () => {
    const result = validateSelahRequest('string');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBe('Invalid request.');
    }
  });

  it('rejects missing message', () => {
    const result = validateSelahRequest({ question: 'test' });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBe('Message is required.');
    }
  });

  it('rejects non-string message', () => {
    const result = validateSelahRequest({ message: 123, question: 'test' });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBe('Message is required.');
    }
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
    if (!result.valid) {
      expect(result.error).toBe('Question is required.');
    }
  });

  it('rejects non-string question', () => {
    const result = validateSelahRequest({ message: 'hello', question: 123 });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBe('Question is required.');
    }
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

  it('trims whitespace from question', () => {
    const result = validateSelahRequest({
      message: 'hello',
      question: '  What is here.  ',
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.question).toBe('What is here.');
    }
  });

  it('accepts message at exactly 500 chars', () => {
    const result = validateSelahRequest({
      message: 'a'.repeat(500),
      question: 'test',
    });
    expect(result.valid).toBe(true);
  });

  it('accepts single character message', () => {
    const result = validateSelahRequest({
      message: 'a',
      question: 'test',
    });
    expect(result.valid).toBe(true);
  });
});

describe('validateUserMessage', () => {
  it('returns null for valid message', () => {
    expect(validateUserMessage('Hello')).toBeNull();
  });

  it('returns error for non-string', () => {
    expect(validateUserMessage(123)).toBe('Invalid input.');
    expect(validateUserMessage(null)).toBe('Invalid input.');
    expect(validateUserMessage(undefined)).toBe('Invalid input.');
    expect(validateUserMessage({})).toBe('Invalid input.');
    expect(validateUserMessage([])).toBe('Invalid input.');
  });

  it('returns error for empty string', () => {
    expect(validateUserMessage('')).toBe('Please type a response.');
    expect(validateUserMessage('   ')).toBe('Please type a response.');
  });

  it('returns error for too long message', () => {
    expect(validateUserMessage('a'.repeat(501))).toBe('Response too long.');
  });

  it('accepts message at exactly 500 chars', () => {
    expect(validateUserMessage('a'.repeat(500))).toBeNull();
  });

  it('accepts short valid messages', () => {
    expect(validateUserMessage('x')).toBeNull();
    expect(validateUserMessage('hello world')).toBeNull();
  });
});
