import type { ReactNode } from 'react';
import type { Outcome } from '@/lib/types';
import { StatusBadge } from './StatusBadge';

interface ResultCardProps<T> {
  title: string;
  outcome?: Outcome<T> | undefined;
  render: (data: T) => ReactNode;
}

export function ResultCard<T>({ title, outcome, render }: ResultCardProps<T>) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[var(--color-panel-border)] bg-[var(--color-panel)] p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm uppercase tracking-wider text-[var(--color-text-muted)]">
          {title}
        </h3>
        {outcome?.status === 'unavailable' && <StatusBadge label="unavailable" tone="danger" />}
        {outcome?.status === 'ok' && <StatusBadge label="ok" tone="ok" />}
      </div>

      {!outcome && <p className="text-sm text-[var(--color-text-muted)]">Waiting for input.</p>}
      {outcome?.status === 'unavailable' && (
        <p className="text-sm text-[var(--color-text-muted)]">
          Specialist did not respond in time.{' '}
          <span className="font-display text-xs text-[var(--color-danger)]">{outcome.reason}</span>
        </p>
      )}
      {outcome?.status === 'ok' && render(outcome.data)}
    </div>
  );
}
