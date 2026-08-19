'use client';

import { useState, type FormEvent } from 'react';

interface AnalyzeFormProps {
  onSubmit: (text: string) => void;
  pending: boolean;
}

const PLACEHOLDER =
  'Paste a paragraph here. The gateway will relay it to the stats, language and keyword specialists.';

export function AnalyzeForm({ onSubmit, pending }: AnalyzeFormProps) {
  const [text, setText] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (text.trim().length === 0) return;
    onSubmit(text);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={PLACEHOLDER}
        rows={5}
        className="w-full resize-none rounded-lg border border-[var(--color-panel-border)] bg-[var(--color-panel)] p-4 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-signal-dim)] focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending || text.trim().length === 0}
        className="self-start rounded-md border border-[var(--color-signal-dim)] bg-transparent px-5 py-2 font-display text-sm uppercase tracking-wider text-[var(--color-signal)] transition-colors hover:bg-[var(--color-signal)] hover:text-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[var(--color-signal)]"
      >
        {pending ? 'Relaying…' : 'Analyze'}
      </button>
    </form>
  );
}
