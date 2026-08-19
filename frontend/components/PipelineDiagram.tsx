export interface PipelineNode {
  key: 'stats' | 'language' | 'keywords';
  label: string;
  status: 'up' | 'down' | 'unknown';
}

interface PipelineDiagramProps {
  nodes: PipelineNode[];
  pending: boolean;
}

const NODE_POSITIONS: Record<PipelineNode['key'], { x: number; y: number }> = {
  stats: { x: 520, y: 60 },
  language: { x: 520, y: 160 },
  keywords: { x: 520, y: 260 },
};

const GATEWAY_POSITION = { x: 120, y: 160 };

function statusColor(status: PipelineNode['status']): string {
  if (status === 'up') return 'var(--color-signal)';
  if (status === 'down') return 'var(--color-danger)';
  return 'var(--color-text-muted)';
}

export function PipelineDiagram({ nodes, pending }: PipelineDiagramProps) {
  return (
    <svg viewBox="0 0 640 320" role="img" aria-label="Request pipeline diagram" className="w-full">
      {nodes.map((node) => {
        const pos = NODE_POSITIONS[node.key];
        const midX = (GATEWAY_POSITION.x + pos.x) / 2;
        return (
          <path
            key={node.key}
            d={`M ${GATEWAY_POSITION.x} ${GATEWAY_POSITION.y} C ${midX} ${GATEWAY_POSITION.y}, ${midX} ${pos.y}, ${pos.x} ${pos.y}`}
            fill="none"
            stroke="var(--color-panel-border)"
            strokeWidth={2}
            className={pending ? 'pipeline-flow' : undefined}
            style={pending ? { stroke: statusColor(node.status) } : undefined}
          />
        );
      })}

      <g className={pending ? 'node-active' : undefined} style={{ color: 'var(--color-signal)' }}>
        <circle cx={GATEWAY_POSITION.x} cy={GATEWAY_POSITION.y} r={26} fill="var(--color-panel)" stroke="currentColor" strokeWidth={2} />
      </g>
      <text
        x={GATEWAY_POSITION.x}
        y={GATEWAY_POSITION.y + 45}
        textAnchor="middle"
        className="fill-[var(--color-text)] font-display text-[13px]"
      >
        gateway
      </text>

      {nodes.map((node) => {
        const pos = NODE_POSITIONS[node.key];
        const color = statusColor(node.status);
        return (
          <g key={node.key}>
            <circle
              cx={pos.x}
              cy={pos.y}
              r={20}
              fill="var(--color-panel)"
              stroke={color}
              strokeWidth={2}
              style={{ color }}
              className={pending ? 'node-active' : undefined}
            />
            <text
              x={pos.x + 34}
              y={pos.y + 4}
              textAnchor="start"
              className="fill-[var(--color-text)] font-display text-[13px]"
            >
              {node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
