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
