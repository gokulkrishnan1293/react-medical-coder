import { useMemo } from 'react';
import { Background, Controls, Handle, Position, ReactFlow, type Edge, type Node, type NodeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useThemeStore } from '@/lib/theme';
import type { Finding } from '@/types';
import { CASE } from '@/data';
import { cn } from '@/lib/utils';
import { STATUS_LABEL, codeLabel, isLive, titleOf } from '@/features/findings';
import type { DerivedIntervention } from '../derive';
import { STATE } from './InterventionBadge';

type Tone = 'ok' | 'ai' | 'rej' | 'accent' | 'muted' | 'plain';

interface StepData extends Record<string, unknown> {
  eyebrow: string;
  title: string;
  sub?: string;
  tone: Tone;
  findingId?: string;
  in?: boolean;
  out?: boolean;
}

const TONE: Record<Tone, string> = {
  ok: 'border-ok bg-ok-fill',
  ai: 'border-ai bg-ai-fill',
  rej: 'border-rej bg-rej-fill',
  accent: 'border-accent bg-accent-soft',
  muted: 'border-dashed border-line bg-chrome text-ink-3',
  plain: 'border-line bg-paper',
};

/** One box in the path: a finding, a claim line, a rule condition, the intervention, or the level. */
function Step({ data }: NodeProps<Node<StepData>>) {
  return (
    <div className={cn('w-[236px] rounded-lg border-[1.5px] px-2.5 py-2 text-left shadow-page', TONE[data.tone], data.findingId && 'cursor-pointer hover:brightness-[0.97]')}>
      {data.in && <Handle type="target" position={Position.Left} className="!size-1.5 !border-0 !bg-ink-3" />}
      <div className="text-[9.5px] font-semibold tracking-[0.08em] text-ink-3 uppercase">{data.eyebrow}</div>
      <div className={cn('mt-0.5 text-[12.5px] leading-snug font-semibold', data.tone === 'muted' ? 'text-ink-3' : 'text-ink')}>{data.title}</div>
      {data.sub && <div className="mt-0.5 truncate text-[11px] text-ink-2" title={data.sub}>{data.sub}</div>}
      {data.out && <Handle type="source" position={Position.Right} className="!size-1.5 !border-0 !bg-ink-3" />}
    </div>
  );
}

/** Column heading drawn above each column. */
function Heading({ data }: NodeProps<Node<{ label: string }>>) {
  return <div className="w-[236px] text-[10.5px] font-semibold tracking-[0.08em] text-ink-3 uppercase">{data.label}</div>;
}

const nodeTypes = { step: Step, heading: Heading };

const X = [0, 300, 600, 900];
const ROW = 74;
const GAP = 22;

const toneOf = (f: Finding): Tone => (isLive(f) ? 'ok' : 'ai');
const stroke = (t: Tone) => ({ ok: 'var(--ok)', ai: 'var(--ai)', rej: 'var(--rej)', accent: 'var(--accent)', muted: 'var(--line)', plain: 'var(--ink-3)' })[t];

/** Lays out the path for one intervention, left to right: what was found → rule conditions → intervention → ED level. */
function buildPath(d: DerivedIntervention): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const step = (id: string, x: number, y: number, data: StepData) => nodes.push({ id, type: 'step', position: { x, y }, data, draggable: false });
  const edge = (source: string, target: string, t: Tone, o: Partial<Edge> = {}) =>
    edges.push({ id: `${source}>${target}`, source, target, style: { stroke: stroke(t), strokeWidth: t === 'muted' ? 1 : 1.75 }, ...o });
  const findingStep = (id: string, x: number, y: number, f: Finding, eyebrow: string) =>
    step(id, x, y, { eyebrow: `${eyebrow} · p. ${f.page} · ${STATUS_LABEL[f.status]}`, title: codeLabel(f), sub: titleOf(f), tone: toneOf(f), findingId: f.id, out: true });

  const conditionYs: number[] = [];
  let y = 40;

  d.conditions.forEach((c, i) => {
    const cid = `c${i}`;
    const items = c.findings.length + c.lines.length;
    const cy = items ? y + ((items - 1) * ROW) / 2 : y;
    let row = y;
    c.findings.forEach((f) => {
      const id = `${cid}-f-${f.id}`;
      findingStep(id, X[0], row, f, f.type === 'mar' ? 'MAR' : 'Service');
      edge(id, cid, toneOf(f));
      row += ROW;
    });
    c.lines.forEach((l) => {
      const id = `${cid}-l-${l.line}`;
      step(id, X[0], row, { eyebrow: `Claim line ${l.line} · rev ${l.rev}`, title: l.code, sub: l.desc, tone: 'plain', out: true });
      edge(id, cid, 'plain', { style: { stroke: 'var(--ink-3)', strokeDasharray: '4 3' }, label: 'billed' });
      row += ROW;
    });
    const tone: Tone = c.findings.some(isLive) ? 'ok' : c.findings.length ? 'ai' : c.lines.length ? 'plain' : 'muted';
    const kind = { code: 'Code match', text: 'Words in the record', route: 'MAR route' }[c.cond.kind];
    step(cid, X[1], cy, { eyebrow: kind, title: c.cond.label, sub: items ? undefined : 'Nothing found', tone, in: items > 0, out: true });
    edge(cid, 'int', tone, tone === 'muted' ? { style: { stroke: 'var(--line)', strokeDasharray: '3 4' } } : {});
    conditionYs.push(cy);
    y += Math.max(items, 1) * ROW + GAP;
  });

  if (d.rule.because) {
    const items = d.reasons.length;
    const by = items ? y + ((items - 1) * ROW) / 2 : y;
    d.reasons.forEach((f, k) => {
      const id = `r-${f.id}`;
      findingStep(id, X[0], y + k * ROW, f, 'Diagnosis');
      edge(id, 'why', toneOf(f));
    });
    const tone: Tone = d.reasons.some(isLive) ? 'ok' : items ? 'ai' : 'muted';
    step('why', X[1], by, { eyebrow: 'Why it was needed', title: d.rule.because.label, sub: items ? undefined : 'No matching diagnosis found', tone, in: items > 0, out: true });
    edge('why', 'int', tone, { style: { stroke: stroke(tone), strokeDasharray: '5 4' }, label: 'reason' });
    conditionYs.push(by);
  }

  const iy = conditionYs.length ? (Math.min(...conditionYs) + Math.max(...conditionYs)) / 2 : 40;
  const itone: Tone = { met: 'ok', pending: 'ai', billedOnly: 'rej', none: 'muted' }[d.state] as Tone;
  step('int', X[2], iy, { eyebrow: `Intervention · ${STATE[d.state].label}`, title: d.rule.label, sub: 'Any one condition is enough', tone: itone, in: true, out: true });
  const counts = d.state === 'met' || d.state === 'pending';
  step('level', X[3], iy, {
    eyebrow: 'ED facility level',
    title: counts ? 'Counts toward the level' : 'Does not count yet',
    sub: `Claim bills ${CASE.billed}`,
    tone: counts ? 'accent' : 'muted',
    in: true,
  });
  edge('int', 'level', counts ? 'accent' : 'muted', counts ? {} : { style: { stroke: 'var(--line)', strokeDasharray: '3 4' } });

  ['Found in record · on claim', 'Rule conditions (any one)', 'Intervention', 'Level'].forEach((label, i) =>
    nodes.push({ id: `h${i}`, type: 'heading', position: { x: X[i], y: 0 }, data: { label }, draggable: false, selectable: false }),
  );
  return { nodes, edges };
}

/** Flowchart of how one intervention was derived. Click a finding to see it in the record. */
export function InterventionFlow({ d, onJump }: { d: DerivedIntervention; onJump: (id: string) => void }) {
  const { nodes, edges } = useMemo(() => buildPath(d), [d]);
  const theme = useThemeStore((t) => t.theme);
  return (
    <ReactFlow
      colorMode={theme}
      key={d.rule.id}
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.15, maxZoom: 1 }}
      minZoom={0.3}
      maxZoom={1.6}
      nodesConnectable={false}
      nodesDraggable={false}
      edgesFocusable={false}
      proOptions={{ hideAttribution: true }}
      onNodeClick={(_, n) => { const id = (n.data as StepData).findingId; if (id) onJump(id); }}
      className="rounded-xl border border-line bg-chrome"
      style={{ ['--xy-edge-label-background-color' as string]: 'var(--chrome)', ['--xy-edge-label-color' as string]: 'var(--ink-3)' }}
    >
      <Background gap={18} size={1} color="var(--line)" />
      <Controls showInteractive={false} position="bottom-right" />
    </ReactFlow>
  );
}
