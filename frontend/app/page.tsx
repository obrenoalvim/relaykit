'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnalyzeForm } from '@/components/AnalyzeForm';
import { PipelineDiagram, type PipelineNode } from '@/components/PipelineDiagram';
import { ResultCard } from '@/components/ResultCard';
import { StatusBadge } from '@/components/StatusBadge';
import { analyzeText, fetchHealth } from '@/lib/api';
import { confidenceLabel, fleschLabel, formatReadingTime, languageDisplayName } from '@/lib/format';
import type { AnalyzeResponse, HealthResponse } from '@/lib/types';

const NODE_LABELS: Record<PipelineNode['key'], string> = {
  stats: 'stats-service',
  language: 'lang-service',
  keywords: 'keyword-service',
};

const HEALTH_POLL_MS = 5000;

export default function Home() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollHealth = useCallback(() => {
    fetchHealth()
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  useEffect(() => {
    pollHealth();
    const id = setInterval(pollHealth, HEALTH_POLL_MS);
    return () => clearInterval(id);
  }, [pollHealth]);

  async function handleSubmit(text: string) {
    setPending(true);
    setError(null);
    try {
      const response = await analyzeText(text);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The gateway could not be reached.');
    } finally {
      setPending(false);
      pollHealth();
    }
  }

  const nodes: PipelineNode[] = (['stats', 'language', 'keywords'] as const).map((key) => ({
    key,
    label: NODE_LABELS[key],
    status: health?.specialists[key]?.status ?? 'unknown',
  }));

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-2">
        <p className="font-display text-xs uppercase tracking-[0.3em] text-[var(--color-signal)]">
          microservices control room
        </p>
        <h1 className="font-display text-4xl font-bold text-[var(--color-text)]">RelayKit</h1>
        <p className="max-w-xl text-sm text-[var(--color-text-muted)]">
          One gateway, three specialists. Submit text below and watch it get relayed, analyzed and
          aggregated in real time, with graceful degradation when a specialist goes down.
        </p>
      </header>

      <section className="rounded-xl border border-[var(--color-panel-border)] bg-[var(--color-panel)]/40 p-6">
        <PipelineDiagram nodes={nodes} pending={pending} />
        <div className="mt-4 flex flex-wrap gap-3">
          {nodes.map((node) => (
            <StatusBadge
              key={node.key}
              label={`${node.label}: ${node.status}`}
              tone={node.status === 'up' ? 'ok' : node.status === 'down' ? 'danger' : 'muted'}
            />
          ))}
          {result && (
            <StatusBadge
              label={`pipeline: ${result.status}`}
              tone={result.status === 'complete' ? 'ok' : 'warning'}
            />
          )}
        </div>
      </section>

      <AnalyzeForm onSubmit={handleSubmit} pending={pending} />

      {error && (
        <p className="rounded-md border border-[var(--color-danger)] px-4 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ResultCard
          title="Text stats"
          outcome={result?.results.stats}
          render={(data) => (
            <dl className="flex flex-col gap-1 text-sm">
              <Row label="Words" value={data.words} />
              <Row label="Sentences" value={data.sentences} />
              <Row label="Reading time" value={formatReadingTime(data.readingTimeSeconds)} />
              <Row
                label="Readability"
                value={data.fleschReadingEase === null ? '—' : fleschLabel(data.fleschReadingEase)}
              />
            </dl>
          )}
        />

        <ResultCard
          title="Language"
          outcome={result?.results.language}
          render={(data) => (
            <dl className="flex flex-col gap-1 text-sm">
              <Row label="Detected" value={languageDisplayName(data.language)} />
              <Row label="Confidence" value={confidenceLabel(data.confidence)} />
            </dl>
          )}
        />

        <ResultCard
          title="Keywords"
          outcome={result?.results.keywords}
          render={(data) => (
            <ul className="flex flex-wrap gap-2">
              {data.keywords.length === 0 && (
                <li className="text-sm text-[var(--color-text-muted)]">No standout terms.</li>
              )}
              {data.keywords.map((keyword) => (
                <li
                  key={keyword.term}
                  className="rounded-full border border-[var(--color-panel-border)] px-2.5 py-0.5 font-display text-xs text-[var(--color-text)]"
                >
                  {keyword.term} · {keyword.count}
                </li>
              ))}
            </ul>
          )}
        />
      </section>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-[var(--color-text-muted)]">{label}</dt>
      <dd className="font-display text-[var(--color-text)]">{value}</dd>
    </div>
  );
}
