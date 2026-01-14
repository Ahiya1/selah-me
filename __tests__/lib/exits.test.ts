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

  it('contains all 8 unique exit sentences', () => {
    const uniqueExits = new Set(EXIT_SENTENCES);
    // 5 primary + 3 secondary = 8 unique
    expect(uniqueExits.size).toBe(8);
  });

  it('primary exits appear 3 times (weighted)', () => {
    const countMap = new Map<string, number>();
    EXIT_SENTENCES.forEach((exit) => {
      countMap.set(exit, (countMap.get(exit) || 0) + 1);
    });

    // Primary exits should appear 3 times
    expect(countMap.get('Close this now.')).toBe(3);
    expect(countMap.get("That's enough. Return.")).toBe(3);
    expect(countMap.get('Go back to your day.')).toBe(3);
    expect(countMap.get('You can leave this.')).toBe(3);
    expect(countMap.get('Nothing more is needed.')).toBe(3);
  });

  it('secondary exits appear 1 time', () => {
    const countMap = new Map<string, number>();
    EXIT_SENTENCES.forEach((exit) => {
      countMap.set(exit, (countMap.get(exit) || 0) + 1);
    });

    // Secondary exits should appear 1 time
    expect(countMap.get('Step away from the screen.')).toBe(1);
    expect(countMap.get('Let life continue.')).toBe(1);
    expect(countMap.get('This is complete.')).toBe(1);
  });

  it('all exits end with period', () => {
    const uniqueExits = new Set(EXIT_SENTENCES);
    uniqueExits.forEach((exit) => {
      expect(exit.endsWith('.')).toBe(true);
    });
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

  it('returns a string', () => {
    const exit = getRandomExitSentence();
    expect(typeof exit).toBe('string');
  });

  it('returns a non-empty string', () => {
    const exit = getRandomExitSentence();
    expect(exit.length).toBeGreaterThan(0);
  });

  it('favors primary exits over secondary (statistical)', () => {
    const counts = {
      primary: 0,
      secondary: 0,
    };

    const primaryExits = [
      'Close this now.',
      "That's enough. Return.",
      'Go back to your day.',
      'You can leave this.',
      'Nothing more is needed.',
    ];

    // Run 1000 times
    for (let i = 0; i < 1000; i++) {
      const exit = getRandomExitSentence();
      if (primaryExits.includes(exit)) {
        counts.primary++;
      } else {
        counts.secondary++;
      }
    }

    // Primary should be approximately 3x more likely (15/18 vs 3/18)
    // With 1000 samples, primary should be > secondary by a significant margin
    expect(counts.primary).toBeGreaterThan(counts.secondary * 2);
  });
});
