'use client';

import { useState, useCallback, FormEvent, KeyboardEvent } from 'react';

interface SelahInputProps {
  onSubmit: (message: string) => void;
  disabled: boolean;
  loading: boolean;
}

export function SelahInput({ onSubmit, disabled, loading }: SelahInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed && !disabled) {
      onSubmit(trimmed);
    }
  }, [value, disabled, onSubmit]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const trimmed = value.trim();
      if (trimmed && !disabled) {
        onSubmit(trimmed);
      }
    }
  }, [value, disabled, onSubmit]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        maxLength={500}
        rows={3}
        className="w-full p-4 border border-gray-300 bg-white text-selah-text resize-none focus:outline-none focus:border-gray-500 disabled:opacity-50"
        autoFocus
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="px-6 py-2 border border-selah-text text-selah-text disabled:opacity-50"
      >
        {loading ? '...' : 'Continue'}
      </button>
    </form>
  );
}
