// lib/exits.ts

const PRIMARY_EXITS = [
  'Close this now.',
  "That's enough. Return.",
  'Go back to your day.',
  'You can leave this.',
  'Nothing more is needed.',
] as const;

const SECONDARY_EXITS = [
  'Step away from the screen.',
  'Let life continue.',
  'This is complete.',
] as const;

// Weighted selection: primary 3x more likely than secondary
export const EXIT_SENTENCES = [
  ...PRIMARY_EXITS,
  ...PRIMARY_EXITS,
  ...PRIMARY_EXITS,
  ...SECONDARY_EXITS,
] as const;

export type ExitSentence = typeof PRIMARY_EXITS[number] | typeof SECONDARY_EXITS[number];

export function getRandomExitSentence(): ExitSentence {
  const index = Math.floor(Math.random() * EXIT_SENTENCES.length);
  return EXIT_SENTENCES[index] as ExitSentence;
}
