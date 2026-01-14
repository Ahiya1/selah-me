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

  it('contains all 8 specific questions', () => {
    expect(OPENING_QUESTIONS).toContain('Where are you right now.');
    expect(OPENING_QUESTIONS).toContain('What is happening right now.');
    expect(OPENING_QUESTIONS).toContain('What is here.');
    expect(OPENING_QUESTIONS).toContain('What are you avoiding noticing.');
    expect(OPENING_QUESTIONS).toContain('What feels most immediate.');
    expect(OPENING_QUESTIONS).toContain('What is loud right now.');
    expect(OPENING_QUESTIONS).toContain('What do you feel in your body.');
    expect(OPENING_QUESTIONS).toContain('Is your body tense or loose.');
  });

  it('questions are all unique', () => {
    const uniqueQuestions = new Set(OPENING_QUESTIONS);
    expect(uniqueQuestions.size).toBe(OPENING_QUESTIONS.length);
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

  it('returns a string', () => {
    const question = getRandomQuestion();
    expect(typeof question).toBe('string');
  });

  it('returns a non-empty string', () => {
    const question = getRandomQuestion();
    expect(question.length).toBeGreaterThan(0);
  });
});
