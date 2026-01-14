// lib/validation.ts
import type { ValidationResult } from '@/types';

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
