import { describe, it, expect } from 'vitest';
import { SELAH_SYSTEM_PROMPT } from '@/lib/prompts';

describe('SELAH_SYSTEM_PROMPT', () => {
  it('is a non-empty string', () => {
    expect(typeof SELAH_SYSTEM_PROMPT).toBe('string');
    expect(SELAH_SYSTEM_PROMPT.length).toBeGreaterThan(0);
  });

  it('contains core principles section', () => {
    expect(SELAH_SYSTEM_PROMPT).toContain('Core principles you must obey at all times');
  });

  it('contains tone section', () => {
    expect(SELAH_SYSTEM_PROMPT).toContain('Tone:');
    expect(SELAH_SYSTEM_PROMPT).toContain('Plain');
    expect(SELAH_SYSTEM_PROMPT).toContain('Grounded');
    expect(SELAH_SYSTEM_PROMPT).toContain('Almost boring');
  });

  it('contains language constraints', () => {
    expect(SELAH_SYSTEM_PROMPT).toContain('Language constraints');
    expect(SELAH_SYSTEM_PROMPT).toContain('Short sentences');
    expect(SELAH_SYSTEM_PROMPT).toContain('No metaphors');
    expect(SELAH_SYSTEM_PROMPT).toContain('No emojis');
  });

  it('contains interaction structure', () => {
    expect(SELAH_SYSTEM_PROMPT).toContain('Interaction structure');
  });

  it('contains reflection rules', () => {
    expect(SELAH_SYSTEM_PROMPT).toContain('Reflection rules');
  });

  it('contains forbidden behaviors', () => {
    expect(SELAH_SYSTEM_PROMPT).toContain('Forbidden behaviors');
    expect(SELAH_SYSTEM_PROMPT).toContain('Giving advice');
  });

  it('starts with role description', () => {
    expect(SELAH_SYSTEM_PROMPT).toMatch(/^You are selah-me/);
  });

  it('ends with the temptation warning', () => {
    expect(SELAH_SYSTEM_PROMPT).toContain('If you ever feel tempted to "help more", you are violating your role.');
  });

  it('contains all forbidden words', () => {
    // These words should NOT be used by the AI in responses
    expect(SELAH_SYSTEM_PROMPT).toContain('journey');
    expect(SELAH_SYSTEM_PROMPT).toContain('process');
    expect(SELAH_SYSTEM_PROMPT).toContain('healing');
    expect(SELAH_SYSTEM_PROMPT).toContain('growth');
    expect(SELAH_SYSTEM_PROMPT).toContain('pattern');
    expect(SELAH_SYSTEM_PROMPT).toContain('optimize');
  });
});
