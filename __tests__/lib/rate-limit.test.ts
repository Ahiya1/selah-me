import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    resetRateLimit();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
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

  it('allows requests after window expires', () => {
    // Use up all 10 requests
    for (let i = 0; i < 10; i++) {
      checkRateLimit('test-ip');
    }
    expect(checkRateLimit('test-ip')).toBe(false);

    // Advance time past the window (60 seconds)
    vi.advanceTimersByTime(61 * 1000);

    // Should allow requests again
    expect(checkRateLimit('test-ip')).toBe(true);
  });

  it('handles multiple identifiers independently', () => {
    // First identifier
    for (let i = 0; i < 5; i++) {
      checkRateLimit('ip-1');
    }

    // Second identifier
    for (let i = 0; i < 5; i++) {
      checkRateLimit('ip-2');
    }

    // Both should still have capacity
    expect(checkRateLimit('ip-1')).toBe(true);
    expect(checkRateLimit('ip-2')).toBe(true);
  });

  it('sliding window behavior - oldest requests expire', () => {
    // Make 5 requests at t=0
    for (let i = 0; i < 5; i++) {
      checkRateLimit('test-ip');
    }

    // Advance 30 seconds
    vi.advanceTimersByTime(30 * 1000);

    // Make 5 more requests at t=30s
    for (let i = 0; i < 5; i++) {
      checkRateLimit('test-ip');
    }

    // Should be blocked now (10 requests in window)
    expect(checkRateLimit('test-ip')).toBe(false);

    // Advance 31 more seconds (t=61s) - first 5 requests should expire
    vi.advanceTimersByTime(31 * 1000);

    // Should allow 5 more requests
    expect(checkRateLimit('test-ip')).toBe(true);
  });
});

describe('resetRateLimit', () => {
  beforeEach(() => {
    resetRateLimit();
  });

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

    expect(checkRateLimit('ip-1')).toBe(false);
    expect(checkRateLimit('ip-2')).toBe(false);

    resetRateLimit();

    expect(checkRateLimit('ip-1')).toBe(true);
    expect(checkRateLimit('ip-2')).toBe(true);
  });

  it('does not affect other identifiers when resetting specific one', () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit('ip-1');
      checkRateLimit('ip-2');
    }

    resetRateLimit('ip-1');

    expect(checkRateLimit('ip-1')).toBe(true);
    expect(checkRateLimit('ip-2')).toBe(false);
  });

  it('handles reset of non-existent identifier gracefully', () => {
    expect(() => resetRateLimit('never-used')).not.toThrow();
  });
});
