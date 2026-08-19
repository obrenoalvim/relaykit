interface StatusBadgeProps {
  label: string;
  tone: 'ok' | 'warning' | 'danger' | 'muted';
}

const TONE_STYLES: Record<StatusBadgeProps['tone'], string> = {
  ok: 'text-[var(--color-signal)] border-[var(--color-signal-dim)]',
  warning: 'text-[var(--color-warning)] border-[var(--color-warning)]',
  danger: 'text-[var(--color-danger)] border-[var(--color-danger)]',
  muted: 'text-[var(--color-text-muted)] border-[var(--color-panel-border)]',
};

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-display text-xs uppercase tracking-wider ${TONE_STYLES[tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
