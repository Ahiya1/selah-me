interface SessionCompleteProps {
  reflection: string;
  exitSentence: string;
}

export function SessionComplete({ reflection, exitSentence }: SessionCompleteProps) {
  return (
    <div className="space-y-6">
      <p className="text-base">{reflection}</p>
      <p className="text-base font-medium">{exitSentence}</p>
      <p className="text-sm text-gray-500 mt-8">You can close this tab now.</p>
    </div>
  );
}
