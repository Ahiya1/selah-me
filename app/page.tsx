'use client';

import { useState, useCallback, useEffect } from 'react';
import { getRandomQuestion } from '@/lib/questions';
import { SelahInput } from '@/components/SelahInput';
import { SessionComplete } from '@/components/SessionComplete';
import type { SessionPhase, SelahResponse, SelahErrorResponse } from '@/types';

export default function SelahPage() {
  const [phase, setPhase] = useState<SessionPhase>('input');
  const [question, setQuestion] = useState<string>('');
  const [reflection, setReflection] = useState<string>('');
  const [exitSentence, setExitSentence] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Select question on mount (client-side only)
  useEffect(() => {
    setQuestion(getRandomQuestion());
  }, []);

  const handleSubmit = useCallback(async (message: string) => {
    if (phase !== 'input') return;

    setError(null);
    setPhase('loading');

    try {
      const response = await fetch('/api/selah', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, question }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorData = data as SelahErrorResponse;
        setError(errorData.message);
        setPhase('input');
        return;
      }

      const successData = data as SelahResponse;
      setReflection(successData.reflection);
      setExitSentence(successData.exitSentence);
      setPhase('complete');

    } catch {
      setError('Something went wrong.');
      setPhase('input');
    }
  }, [phase, question]);

  // Don't render until question is loaded
  if (!question) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Question - always visible */}
      <p className="text-lg">{question}</p>

      {/* Input phase */}
      {phase !== 'complete' && (
        <SelahInput
          onSubmit={handleSubmit}
          disabled={phase === 'loading'}
          loading={phase === 'loading'}
        />
      )}

      {/* Error display */}
      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}

      {/* Complete phase */}
      {phase === 'complete' && (
        <SessionComplete
          reflection={reflection}
          exitSentence={exitSentence}
        />
      )}
    </div>
  );
}
