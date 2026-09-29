import { CASE, CLAIM_LINES, CLAIM_CODES, PAGES, BLOCKS, INITIAL, DICT, MDM_OPTS } from './data.js';

const { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect } = React;

/* ---------- helpers ---------- */
const LV = ['Straightforward', 'Low', 'Moderate', 'High'];
const LVS = ['SF', 'L', 'M', 'H'];
const EM = ['99212', '99213', '99214', '99215'];
const EL = { problems: 'Problems', data: 'Data', risk: 'Risk' };
const ELS = { problems: 'PROB', data: 'DATA', risk: 'RISK' };
const STATUS_LABEL = { ai: 'AI suggested', confirmed: 'Confirmed', added: 'Coder added', rejected: 'Rejected' };
const ROUTE_LABEL = { appeal: 'Appeal evidence', corrected: 'Corrected claim', info: 'Reviewer note', excluded: 'Excluded' };
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const cls = (...a) => a.filter(Boolean).join(' ');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const isLive = (f) => f.status === 'confirmed' || f.status === 'added';

function mdmTag(f) {
  if (!f.mdm) return '';
  return f.mdm.el === 'data' ? `DATA·C${f.mdm.cat}` : `${ELS[f.mdm.el]}·${LVS[f.mdm.level]}`;
}
function tagOf(f) {
  const parts = [];
  if (f.code) parts.push(f.code);
  if (f.mdm) parts.push(mdmTag(f));
  if (f.type === 'time') parts.push('TIME');
  if (f.type === 'note') parts.push('NOTE');
  return parts.join(' · ');
}
function routeOf(f) {
  if (f.status === 'rejected' || f.outsideDos) return 'excluded';
  if (f.type === 'time' || f.type === 'note') return 'info';
  if (f.code && !CLAIM_CODES.has(f.code)) return 'corrected';
  return 'appeal';
}
function titleOf(f) {
  if (f.type === 'note') return f.note || 'Reviewer note';
  if (f.mdm && !f.code) return f.mdm.label;
  return f.desc || '';
}

function summarize(findings, includeAi) {
  const live = findings.filter((f) => !f.outsideDos && f.mdm && (isLive(f) || (includeAi && f.status === 'ai')));
  const mx = (el) => live.filter((f) => f.mdm.el === el).reduce((m, f) => Math.max(m, f.mdm.level || 0), 0);
  const d = live.filter((f) => f.mdm.el === 'data');
  const c1 = d.filter((f) => f.mdm.cat === 1).length;
  const cats = (c1 >= 3 ? 1 : 0) + (d.some((f) => f.mdm.cat === 2) ? 1 : 0) + (d.some((f) => f.mdm.cat === 3) ? 1 : 0);
  const data = cats >= 2 ? 3 : cats >= 1 ? 2 : c1 >= 2 ? 1 : 0;
  const prob = mx('problems');
  const risk = mx('risk');
  const s = [prob, data, risk].sort((a, b) => b - a);
  return { prob, data, risk, c1, overall: s[1], code: EM[s[1]] };
}

function orderKey(f) {
  const b = BLOCKS[f.block];
  const off = b ? Math.max(0, b.t.indexOf(f.text)) : 0;
  return f.page * 1e6 + (b ? b.idx : 0) * 1e3 + off;
}

function segments(text, fs) {
  const ranges = [];
  for (const f of fs) {
    const i = text.indexOf(f.text);
    if (i < 0) continue;
    const r = { s: i, e: i + f.text.length, f };
    if (ranges.some((x) => r.s < x.e && x.s < r.e)) continue;
    ranges.push(r);
  }
  ranges.sort((a, b) => a.s - b.s);
  const out = [];
  let c = 0;
  for (const r of ranges) {
    if (r.s > c) out.push(text.slice(c, r.s));
    out.push(r);
    c = r.e;
  }
  if (c < text.length) out.push(text.slice(c));
  return out;
}

function searchCodes(q, kind) {
  const toks = q.toLowerCase().replace(/[^a-z0-9.\- ]/g, ' ').split(/\s+/).filter((t) => t.length > 2);
  const pool = DICT.filter((d) => d.kind === kind);
  const scored = pool.map((d) => {
    const hay = `${d.code} ${d.desc} ${d.kw}`.toLowerCase();
    let s = 0;
    toks.forEach((t) => { if (hay.includes(t)) s += t.length > 5 ? 2 : 1; });
    if (toks.some((t) => d.code.toLowerCase() === t)) s += 10;
    return { ...d, s };
  });
  const hits = scored.filter((d) => d.s > 0).sort((a, b) => b.s - a.s);
  return (hits.length ? hits : scored).slice(0, 6);
}

function rankMdm(text) {
  const t = text.toLowerCase();
  const scored = MDM_OPTS.map((o, i) => ({ ...o, i, s: o.kw.reduce((n, k) => n + (t.includes(k) ? 1 : 0), 0) }));
  const sorted = [...scored].sort((a, b) => b.s - a.s || a.i - b.i);
  return sorted.map((o, i) => ({ ...o, suggested: i === 0 && o.s > 0 }));
}

function useNarrow() {
  const q = '(max-width: 760px)';
  const [n, setN] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const h = () => setN(m.matches);
    m.addEventListener('change', h);
    return () => m.removeEventListener('change', h);
  }, []);
  return n;
}

function useScrollTick(ref) {
  const [, set] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const h = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => set((t) => t + 1)); };
    el.addEventListener('scroll', h, { passive: true });
    window.addEventListener('resize', h);
    return () => { el.removeEventListener('scroll', h); window.removeEventListener('resize', h); cancelAnimationFrame(raf); };
  }, [ref]);
}

function fly(fromRect, label, targetEl) {
  if (!targetEl || !fromRect) return;
  const to = targetEl.getBoundingClientRect();
  const chip = document.createElement('div');
  chip.className = 'fly';
  chip.textContent = label;
  document.body.appendChild(chip);
  const x0 = fromRect.left;
  const y0 = fromRect.top - 4;
  chip.style.left = x0 + 'px';
  chip.style.top = y0 + 'px';
  const dx = to.left + Math.min(to.width / 2, 60) - x0 - 30;
  const dy = to.top + Math.min(to.height / 2, 70) - y0;
  const a = chip.animate(
    [
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 70}px) scale(1.08)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy}px) scale(.55)`, opacity: 0.15 },
    ],
    { duration: reduced ? 1 : 640, easing: 'cubic-bezier(.45,0,.25,1)' }
  );
  a.onfinish = () => {
    chip.remove();
    targetEl.classList.remove('catch');
    void targetEl.offsetWidth;
    targetEl.classList.add('catch');
    setTimeout(() => targetEl.classList.remove('catch'), 500);
  };
}

/* ---------- icons ---------- */
const Svg = ({ children, size = 16, sw = 1.7 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const Ic = {
  grip: (p) => <Svg {...p}><g fill="currentColor" stroke="none"><circle cx="9" cy="6" r="1.3" /><circle cx="15" cy="6" r="1.3" /><circle cx="9" cy="12" r="1.3" /><circle cx="15" cy="12" r="1.3" /><circle cx="9" cy="18" r="1.3" /><circle cx="15" cy="18" r="1.3" /></g></Svg>,
  pin: (p) => <Svg {...p}><path d="M12 17v5" /><path d="M9 3h6l-1 6 3 3v2H7v-2l3-3z" /></Svg>,
  expand: (p) => <Svg {...p}><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></Svg>,
  dock: (p) => <Svg {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M15 4v16" /></Svg>,
  float: (p) => <Svg {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><rect x="10" y="9" width="8" height="7" rx="1" /></Svg>,
  min: (p) => <Svg {...p}><path d="M5 18h14" /></Svg>,
  close: (p) => <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>,
  check: (p) => <Svg {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>,
  undo: (p) => <Svg {...p}><path d="M9 14L4 9l5-5" /><path d="M4 9h11a5 5 0 010 10h-3" /></Svg>,
  spot: (p) => <Svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></Svg>,
  eye: (p) => <Svg {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></Svg>,
  cal: (p) => <Svg {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></Svg>,
  notes: (p) => <Svg {...p}><path d="M6 3h9l4 4v14H6z" /><path d="M9 11h7M9 15h7M9 7h3" /></Svg>,
  search: (p) => <Svg {...p}><circle cx="11" cy="11" r="6" /><path d="M20 20l-4.5-4.5" /></Svg>,
  left: (p) => <Svg {...p}><path d="M15 6l-6 6 6 6" /></Svg>,
  right: (p) => <Svg {...p}><path d="M9 6l6 6-6 6" /></Svg>,
  copy: (p) => <Svg {...p}><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3" /></Svg>,
  alert: (p) => <Svg {...p}><path d="M12 3l10 18H2z" /><path d="M12 10v5M12 18v.5" /></Svg>,
  play: (p) => <Svg {...p}><path d="M7 5l12 7-12 7z" /></Svg>,
};

/* ---------- small pieces ---------- */
function StatusDot({ s }) { return <span className={cls('dot', 'st-' + s)} aria-hidden="true" />; }
function Kbd({ children }) { return <kbd className="kbd">{children}</kbd>; }

function Score({ s, compact }) {
  const cells = [['prob', 'Problems'], ['data', 'Data'], ['risk', 'Risk']];
  const ok = s.code === CASE.billed;
  return (
    <div className={cls('score', compact && 'compact')}>
      {cells.map(([k, l]) => (
        <div key={k} className={cls('sc', s[k] >= 3 && 'hi')}>
          <span className="sc-k">{l}</span>
          <span className="sc-v">{LV[s[k]]}</span>
        </div>
      ))}
      <div className={cls('sc-total', ok ? 'ok' : 'short')}>
        <span className="sc-k">Supports</span>
        <span className="sc-v"><b>{s.code}</b> <span className="sc-of">of {CASE.billed}</span></span>
      </div>
    </div>
  );
}

/* ---------- record ---------- */
function Block({ b, fs, hotId, activeId, flashId, onEnter, onLeave, onClickEv }) {
  const segs = segments(b.t, fs);
  return (
    <div className={cls('blk', 'k-' + b.k)} data-block={b.id}>
      {segs.map((s, i) =>
        typeof s === 'string' ? (
          <React.Fragment key={i}>{s}</React.Fragment>
        ) : (
          <mark
            key={s.f.id}
            id={'ev-' + s.f.id}
            data-tag={tagOf(s.f)}
            className={cls('ev', 'st-' + s.f.status, s.f.outsideDos && 'odos', hotId === s.f.id && 'hot', activeId === s.f.id && 'active', flashId === s.f.id && 'flash')}
            onMouseEnter={(e) => onEnter(s.f.id, e)}
            onMouseLeave={onLeave}
            onClick={(e) => onClickEv(s.f.id, e)}
          >
            {b.t.slice(s.s, s.e)}
          </mark>
        )
      )}
    </div>
  );
}

function Minimap({ scrollerRef, ordered, onJump, activeId }) {
  const [marks, setMarks] = useState([]);
  const [pgs, setPgs] = useState([]);
  const [vp, setVp] = useState({ top: 0, h: 0.2 });
  const orderedRef = useRef(ordered);
  orderedRef.current = ordered;
  const measure = useCallback(() => {
    const sc = scrollerRef.current;
    if (!sc) return;
    const H = sc.scrollHeight || 1;
    const base = sc.getBoundingClientRect().top - sc.scrollTop;
    setMarks(orderedRef.current.map((f) => {
      const el = document.getElementById('ev-' + f.id);
      if (!el) return null;
      return { id: f.id, status: f.status, t: (el.getBoundingClientRect().top - base) / H, code: tagOf(f) };
    }).filter(Boolean));
    setPgs(PAGES.map((p) => {
      const el = document.getElementById('page-' + p.n);
      const r = el.getBoundingClientRect();
      return { n: p.n, t: (r.top - base) / H, h: r.height / H, off: p.dos !== CASE.dos };
    }));
    setVp({ top: sc.scrollTop / H, h: sc.clientHeight / H });
  }, [scrollerRef]);
  useLayoutEffect(() => { measure(); }, [ordered, measure]);
  useEffect(() => {
    const sc = scrollerRef.current;
    const onS = () => setVp({ top: sc.scrollTop / sc.scrollHeight, h: sc.clientHeight / sc.scrollHeight });
    sc.addEventListener('scroll', onS, { passive: true });
    const ro = new ResizeObserver(() => measure());
    ro.observe(sc);
    if (sc.firstElementChild) ro.observe(sc.firstElementChild);
    document.fonts && document.fonts.ready.then(measure);
    return () => { sc.removeEventListener('scroll', onS); ro.disconnect(); };
  }, [measure, scrollerRef]);
  const onRail = (e) => {
    const sc = scrollerRef.current;
    const r = e.currentTarget.getBoundingClientRect();
    const f = (e.clientY - r.top) / r.height;
    sc.scrollTo({ top: f * sc.scrollHeight - sc.clientHeight / 2, behavior: reduced ? 'auto' : 'smooth' });
  };
  return (
    <div className="mm" onClick={onRail} title="Record overview. Click to jump.">
      {pgs.map((p) => (
        <div key={p.n} className={cls('mm-page', p.off && 'off')} style={{ top: p.t * 100 + '%', height: p.h * 100 + '%' }} />
      ))}
      <div className="mm-vp" style={{ top: vp.top * 100 + '%', height: vp.h * 100 + '%' }} />
      {marks.map((m) => (
        <button
          key={m.id}
          className={cls('mm-tick', 'st-' + m.status, activeId === m.id && 'active')}
          style={{ top: `calc(${m.t * 100}% - 2px)` }}
          title={m.code}
          aria-label={'Jump to ' + m.code}
          onClick={(e) => { e.stopPropagation(); onJump(m.id); }}
        />
      ))}
    </div>
  );
}

/* ---------- floating layers ---------- */
function EvCard({ f, scrollerRef, onAction, onEnter, onLeave, onClose }) {
  useScrollTick(scrollerRef);
  const el = document.getElementById('ev-' + f.id);
  const sc = scrollerRef.current;
  if (!el || !sc) return null;
  const r = el.getBoundingClientRect();
  const sr = sc.getBoundingClientRect();
  if (r.bottom < sr.top + 4 || r.top > sr.bottom - 4) return null;
  const W = Math.min(320, window.innerWidth - 16);
  const left = clamp(r.left, 8, window.innerWidth - W - 8);
  const below = window.innerHeight - r.bottom > 280;
  const style = below ? { left, top: r.bottom + 10, width: W } : { left, bottom: window.innerHeight - r.top + 14, width: W };
  const route = routeOf(f);
  return (
    <div className="card" style={style} onMouseEnter={onEnter} onMouseLeave={onLeave} role="dialog" aria-label="Finding details">
      <div className="card-top">
        <span className={cls('chip', 'st-' + f.status)}><StatusDot s={f.status} />{STATUS_LABEL[f.status]}</span>
        {f.source === 'ai' && f.conf && <span className="conf">{Math.round(f.conf * 100)}% confidence</span>}
        <button className="ib sm" onClick={onClose} aria-label="Close"><Ic.close size={14} /></button>
      </div>
      <div className="card-code">{f.code || mdmTag(f) || (f.type === 'time' ? 'Time' : 'Note')}</div>
      <div className="card-desc">{titleOf(f)}</div>
      {f.mdm && (f.code || f.type === 'mdm') && (
        <div className="card-mdm">
          <span className="mini">MDM</span>
          {EL[f.mdm.el]} · {f.mdm.el === 'data' ? `Category ${f.mdm.cat}` : LV[f.mdm.level]}
          {f.code ? ` · ${f.mdm.label}` : ''}
        </div>
      )}
      {f.outsideDos && (
        <div className="warn"><Ic.alert size={14} />This is from a visit on {PAGES.find((p) => p.n === f.page).dos}. It can't support the {CASE.dos} claim.</div>
      )}
      {f.note && f.type !== 'note' && <div className="card-note">{f.note}</div>}
      <blockquote className="card-q">“{f.text}”</blockquote>
      <div className="card-meta">Page {f.page} · <span className={'route r-' + route}>{ROUTE_LABEL[route]}</span></div>
      <div className="card-actions">
        {f.status === 'ai' && (
          <>
            <button className="btn ok" onClick={() => onAction(f.id, 'confirmed')}><Ic.check size={14} />Accept <Kbd>A</Kbd></button>
            <button className="btn" onClick={() => onAction(f.id, 'rejected')}><Ic.close size={14} />Reject <Kbd>R</Kbd></button>
          </>
        )}
        {(f.status === 'confirmed' || f.status === 'added') && (
          <>
            {f.source === 'ai' && <button className="btn" onClick={() => onAction(f.id, 'ai')}><Ic.undo size={14} />Unaccept</button>}
            <button className="btn" onClick={() => onAction(f.id, 'rejected')}><Ic.close size={14} />Reject <Kbd>R</Kbd></button>
          </>
        )}
        {f.status === 'rejected' && (
          <button className="btn" onClick={() => onAction(f.id, f.source === 'ai' ? 'ai' : 'added')}><Ic.undo size={14} />Restore</button>
        )}
      </div>
    </div>
  );
}

function SelTool({ sel, scrollerRef, onPick }) {
  useScrollTick(scrollerRef);
  const r = sel.range.getBoundingClientRect();
  if (!r.width && !r.height) return null;
  const W = sel.overlap ? 250 : 380;
  const left = clamp(r.left + r.width / 2 - W / 2, 8, window.innerWidth - W - 8);
  const top = r.top > 120 ? r.top - 46 : r.bottom + 8;
  const pd = (e) => e.preventDefault();
  if (sel.overlap) {
    return <div className="seltb note" style={{ left, top, width: W }} onMouseDown={pd}>Part of this is already marked. Hover the box to edit it.</div>;
  }
  const items = [['dx', 'Diagnosis'], ['px', 'Procedure'], ['mdm', 'MDM element'], ['note', 'Note']];
  return (
    <div className="seltb" style={{ left, top }} onMouseDown={pd} role="toolbar" aria-label="Add finding">
      <span className="seltb-lead">Add</span>
      {items.map(([k, l]) => (
        <button key={k} onClick={() => onPick(k)}>+ {l}</button>
      ))}
    </div>
  );
}

function Compose({ sel, type, setType, scrollerRef, onAdd, onCancel }) {
  useScrollTick(scrollerRef);
  const [q, setQ] = useState(sel.text.slice(0, 80));
  const [pick, setPick] = useState(0);
  const [note, setNote] = useState('');
  const boxRef = useRef();
  const results = useMemo(() => (type === 'dx' || type === 'px' ? searchCodes(q, type) : []), [q, type]);
  const mdm = useMemo(() => rankMdm(sel.text), [sel.text]);
  useEffect(() => { setPick(0); }, [type, q]);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const t = el.querySelector(type === 'note' ? 'textarea' : type === 'mdm' ? '.opt-list' : 'input');
    t && t.focus({ preventScroll: true });
  }, [type]);
  const list = type === 'mdm' ? mdm : results;
  const submit = () => {
    if (type === 'note') return onAdd({ type: 'note', note: note.trim() || 'Reviewer note', desc: 'Reviewer note' });
    const o = list[pick];
    if (!o) return;
    if (type === 'mdm') onAdd({ type: 'mdm', desc: o.label, mdm: { el: o.el, level: o.level || 0, cat: o.cat, label: o.label } });
    else onAdd({ type, code: o.code, desc: o.desc });
  };
  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); onCancel(); return; }
    if (type === 'note') { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit(); } return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setPick((p) => Math.min(p + 1, list.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setPick((p) => Math.max(p - 1, 0)); }
    if (e.key === 'Enter') { e.preventDefault(); submit(); }
  };
  const r = sel.range.getBoundingClientRect();
  const W = Math.min(360, window.innerWidth - 16);
  const left = clamp(r.left, 8, window.innerWidth - W - 8);
  const below = window.innerHeight - r.bottom > 400;
  const style = below ? { left, top: r.bottom + 10, width: W } : { left, bottom: Math.max(8, window.innerHeight - r.top + 12), width: W };
  const cur = list[pick];
  return (
    <div className="compose" style={style} ref={boxRef} onKeyDown={onKey} role="dialog" aria-label="Add finding">
      <div className="seg" role="tablist">
        {[['dx', 'Diagnosis'], ['px', 'Procedure'], ['mdm', 'MDM'], ['note', 'Note']].map(([k, l]) => (
          <button key={k} role="tab" aria-selected={type === k} className={cls(type === k && 'on')} onClick={() => setType(k)}>{l}</button>
        ))}
      </div>
      <blockquote className="card-q sm">“{sel.text}”</blockquote>
      {(type === 'dx' || type === 'px') && (
        <>
          <label className="search">
            <Ic.search size={14} />
            <input id="code-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={type === 'dx' ? 'Search ICD-10-CM' : 'Search CPT / HCPCS'} aria-label="Search codes" />
          </label>
          <div className="opt-list" role="listbox">
            {results.map((o, i) => (
              <button key={o.code} role="option" aria-selected={i === pick} className={cls('opt', i === pick && 'on')} onMouseEnter={() => setPick(i)} onClick={() => { setPick(i); onAdd({ type, code: o.code, desc: o.desc }); }}>
                <span className="opt-code">{o.code}</span>
                <span className="opt-desc">{o.desc}</span>
                {CLAIM_CODES.has(o.code) && <span className="opt-flag">on claim</span>}
              </button>
            ))}
          </div>
          {cur && (
            <div className="route-hint">
              {CLAIM_CODES.has(cur.code) ? 'On the claim. Adds evidence to the appeal.' : 'Not on the claim. Goes to the corrected claim list.'}
            </div>
          )}
        </>
      )}
      {type === 'mdm' && (
        <div className="opt-list tall" role="listbox" tabIndex={-1}>
          {mdm.map((o, i) => (
            <button key={o.label} role="option" aria-selected={i === pick} className={cls('opt', i === pick && 'on')} onMouseEnter={() => setPick(i)} onClick={() => { onAdd({ type: 'mdm', desc: o.label, mdm: { el: o.el, level: o.level || 0, cat: o.cat, label: o.label } }); }}>
              <span className={cls('opt-code', 'el-' + o.el)}>{o.el === 'data' ? `DATA·C${o.cat}` : `${ELS[o.el]}·${LVS[o.level]}`}</span>
              <span className="opt-desc">{o.label}</span>
              {o.suggested && <span className="opt-flag sug">Suggested</span>}
            </button>
          ))}
        </div>
      )}
      {type === 'note' && (
        <textarea id="note-text" className="note-in" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note for the appeal file" />
      )}
      <div className="compose-foot">
        <span className="hint">{type === 'note' ? <><Kbd>⌘</Kbd><Kbd>↵</Kbd> to add</> : <><Kbd>↑</Kbd><Kbd>↓</Kbd> choose · <Kbd>↵</Kbd> add</>}</span>
        <button className="btn" onClick={onCancel}>Cancel</button>
        <button className="btn primary" onClick={submit}>Add to notes</button>
      </div>
    </div>
  );
}

/* ---------- notes ---------- */
function Row({ f, active, hot, flash, onEnter, onLeave, onClick, onAction }) {
  const route = routeOf(f);
  const stop = (fn) => (e) => { e.stopPropagation(); fn(); };
  return (
    <div data-row={f.id} className={cls('row', 'st-' + f.status, active && 'active', hot && 'hot', flash && 'flash')} onMouseEnter={onEnter} onMouseLeave={onLeave} onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }}>
      <StatusDot s={f.status} />
      <div className="row-main">
        <div className="row-top">
          <span className="row-code">{f.code || mdmTag(f) || (f.type === 'time' ? 'TIME' : 'NOTE')}</span>
          <span className="row-desc">{titleOf(f)}</span>
        </div>
        <div className="row-q">“{f.text}”</div>
        <div className="row-meta">
          {f.code && f.mdm && <span className="mini">{mdmTag(f)}</span>}
          <span className={'route r-' + route}>{ROUTE_LABEL[route]}</span>
          {f.outsideDos && <span className="route r-warn">Other visit</span>}
          {f.replaces && <span className="mini">replaces {f.replaces}</span>}
        </div>
      </div>
      <div className="row-act">
        {f.status === 'ai' && (
          <>
            <button className="ib sm ok" title="Accept (A)" aria-label="Accept" onClick={stop(() => onAction(f.id, 'confirmed'))}><Ic.check size={14} /></button>
            <button className="ib sm no" title="Reject (R)" aria-label="Reject" onClick={stop(() => onAction(f.id, 'rejected'))}><Ic.close size={14} /></button>
          </>
        )}
        {isLive(f) && <button className="ib sm no" title="Reject (R)" aria-label="Reject" onClick={stop(() => onAction(f.id, 'rejected'))}><Ic.close size={14} /></button>}
        {f.status === 'rejected' && <button className="ib sm" title="Restore" aria-label="Restore" onClick={stop(() => onAction(f.id, f.source === 'ai' ? 'ai' : 'added'))}><Ic.undo size={14} /></button>}
      </div>
    </div>
  );
}

function pageRange(ps) {
  if (!ps.length) return '';
  const a = Math.min(...ps), b = Math.max(...ps);
  return a === b ? `p. ${a}` : `p. ${a}–${b}`;
}

function NotesBody({ ordered, visible, pinned, setPinned, tab, setTab, activeId, hoverId, flashId, setHoverId, onJump, onAction, s, onFull }) {
  const listRef = useRef();
  const pages = pinned || visible;
  const inView = ordered.filter((f) => pages.includes(f.page));
  const list = tab === 'view' ? inView : ordered;
  const groups = [];
  list.forEach((f) => {
    let g = groups[groups.length - 1];
    if (!g || g.page !== f.page) { g = { page: f.page, items: [] }; groups.push(g); }
    g.items.push(f);
  });
  useEffect(() => {
    if (!activeId || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-row="${activeId}"]`);
    el && el.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
  }, [activeId, tab]);
  const pending = ordered.filter((f) => f.status === 'ai').length;
  return (
    <div className="nb">
      <div className="nb-sub">
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'view'} className={cls(tab === 'view' && 'on')} onClick={() => setTab('view')}>In view <span className="n">{inView.length}</span></button>
          <button role="tab" aria-selected={tab === 'all'} className={cls(tab === 'all' && 'on')} onClick={() => setTab('all')}>All <span className="n">{ordered.length}</span></button>
        </div>
        {tab === 'view' ? (
          <button className={cls('follow', pinned && 'pinned')} onClick={() => setPinned(pinned ? null : [...visible])} title={pinned ? 'Unpin to follow the scroll again' : 'Pin these pages'}>
            <Ic.pin size={13} />{pinned ? `Pinned ${pageRange(pinned)}` : `Following ${pageRange(visible)}`}
          </button>
        ) : (
          <span className="follow static">{pending} to review</span>
        )}
      </div>
      <div className="nb-list" ref={listRef}>
        {groups.length === 0 && (
          <div className="empty">
            <b>Nothing marked on {pageRange(pages)}.</b>
            Select words on the record to add a diagnosis, procedure, MDM element or note.
          </div>
        )}
        {groups.map((g) => {
          const pg = PAGES.find((p) => p.n === g.page);
          return (
            <div key={g.page} className="grp">
              <div className="grp-h">Page {g.page} · {pg.label}{pg.dos !== CASE.dos && <span className="grp-warn"> · DOS {pg.dos}</span>}</div>
              {g.items.map((f) => (
                <Row
                  key={f.id} f={f}
                  active={activeId === f.id} hot={hoverId === f.id} flash={flashId === f.id}
                  onEnter={() => setHoverId(f.id)} onLeave={() => setHoverId(null)}
                  onClick={() => onJump(f.id)} onAction={onAction}
                />
              ))}
            </div>
          );
        })}
      </div>
      <div className="nb-foot">
        <Score s={s} compact />
        <button className="btn wide" onClick={onFull}><Ic.expand size={14} />Full notes and appeal draft <Kbd>F</Kbd></button>
      </div>
    </div>
  );
}

function Notepad({ np, setNp, innerRef, ghost, setSnap, narrow, count, children, onDock, onMin, onClose, onFull, setNpHover }) {
  const drag = (e) => {
    if (e.target.closest('button')) return;
    e.preventDefault();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const sx = e.clientX, sy = e.clientY, ox = np.x, oy = np.y;
    let near = false;
    const mv = (ev) => {
      const nx = clamp(ox + ev.clientX - sx, 4, window.innerWidth - np.w - 4);
      const ny = clamp(oy + ev.clientY - sy, 4, window.innerHeight - 60);
      near = !narrow && ev.clientX > window.innerWidth - 70;
      setSnap(near);
      setNp((n) => ({ ...n, x: nx, y: ny }));
    };
    const up = () => {
      el.removeEventListener('pointermove', mv);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      setSnap(false);
      if (near) onDock();
    };
    el.addEventListener('pointermove', mv);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  };
  const resize = (dir) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const sx = e.clientX, sy = e.clientY, o = { x: np.x, y: np.y, w: np.w, h: np.h };
    const MW = 290, MH = 240;
    document.body.classList.add('resizing');
    const mv = (ev) => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      const r = { ...o };
      if (dir.includes('e')) r.w = clamp(o.w + dx, MW, window.innerWidth - o.x - 4);
      if (dir.includes('s')) r.h = clamp(o.h + dy, MH, window.innerHeight - o.y - 4);
      if (dir.includes('w')) { const w = clamp(o.w - dx, MW, o.x + o.w - 4); r.x = o.x + o.w - w; r.w = w; }
      if (dir.includes('n')) { const h = clamp(o.h - dy, MH, o.y + o.h - 4); r.y = o.y + o.h - h; r.h = h; }
      setNp((n) => ({ ...n, ...r }));
    };
    const up = () => {
      document.body.classList.remove('resizing');
      el.removeEventListener('pointermove', mv);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
    el.addEventListener('pointermove', mv);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  };
  const toggleTall = (e) => {
    if (e.target.closest('button')) return;
    setNp((n) => {
      if (n.prev) return { ...n, ...n.prev, prev: null };
      const top = 8, h = window.innerHeight - 16;
      return { ...n, prev: { x: n.x, y: n.y, w: n.w, h: n.h }, y: top, h, w: Math.max(n.w, Math.min(460, window.innerWidth - 16)), x: clamp(n.x, 4, window.innerWidth - Math.max(n.w, Math.min(460, window.innerWidth - 16)) - 4) };
    });
  };
  return (
    <div ref={innerRef} className={cls('np', ghost && 'ghost')} style={{ left: np.x, top: np.y, width: np.w, height: np.h }} onMouseEnter={() => setNpHover(true)} onMouseLeave={() => setNpHover(false)} role="region" aria-label="Notepad">
      <div className="np-head" onPointerDown={drag} onDoubleClick={toggleTall} title="Drag to move · double-click to fit to screen height">
        <span className="grip"><Ic.grip size={14} /></span>
        <span className="np-title">Notepad</span>
        <span className="badge">{count}</span>
        <span className="sp" />
        <button className="ib sm" title="Full notes (F)" aria-label="Full notes" onClick={onFull}><Ic.expand size={14} /></button>
        {!narrow && <button className="ib sm" title="Dock to the right (D)" aria-label="Dock" onClick={onDock}><Ic.dock size={14} /></button>}
        <button className="ib sm" title="Minimize (N)" aria-label="Minimize" onClick={onMin}><Ic.min size={14} /></button>
        <button className="ib sm" title="Close" aria-label="Close notepad" onClick={onClose}><Ic.close size={14} /></button>
      </div>
      {children}
      {['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map((d) => (
        <div key={d} className={'np-rz rz-' + d} onPointerDown={resize(d)} aria-hidden="true" />
      ))}
    </div>
  );
}

/* ---------- full notes ---------- */
function buildLetter(ordered, s) {
  const live = ordered.filter((f) => isLive(f) && !f.outsideDos);
  const ev = (el) => live.filter((f) => f.mdm && f.mdm.el === el);
  const cite = (f) => `${f.mdm.label}: “${f.text}” (p. ${f.page})`;
  const out = [];
  out.push({ k: 'meta', t: `RE: Request for reconsideration\nPatient: ${CASE.patient} · Member claim ${CASE.claim}\nDate of service: ${CASE.dos} · Rendering provider: ${CASE.provider}\nBilled CPT ${CASE.billed}; processed as ${CASE.paid} (${CASE.carc})` });
  out.push({ k: 'p', t: `To the ${CASE.payer} reconsideration unit:` });
  out.push({ k: 'p', t: `We request that CPT ${CASE.billed} be reinstated for this visit. Under the AMA office visit guidelines (2021, revised 2023), level 5 requires high-complexity medical decision making, which means at least two of the three MDM elements at the high level. The enclosed office note documents the following.` });
  [['problems', 'Number and complexity of problems addressed', s.prob], ['risk', 'Risk of complications of patient management', s.risk], ['data', 'Amount and complexity of data reviewed and analyzed', s.data]].forEach(([el, h, lv]) => {
    const items = ev(el);
    out.push({ k: 'h', t: `${h}: ${LV[lv]}` });
    if (!items.length) out.push({ k: 'li', t: 'No confirmed evidence yet.' });
    items.forEach((f) => out.push({ k: 'li', t: cite(f) }));
  });
  const time = ordered.find((f) => f.type === 'time' && f.status !== 'rejected');
  if (time) out.push({ k: 'p', t: 'The note documents 34 minutes of total time. This level is based on medical decision making, not time.' });
  out.push({ k: 'p', t: `The documentation supports CPT ${s.code}. We ask that the claim be reprocessed at CPT ${CASE.billed}. The complete office note for ${CASE.dos} (pages 1–5) is enclosed.` });
  out.push({ k: 'p', t: `Sincerely,\nRevenue Cycle Appeals\n${CASE.practice}\nOn behalf of ${CASE.provider}` });
  return out;
}

function FullNotes({ tab, setTab, ordered, s, onClose, onJump, onAction }) {
  const [filter, setFilter] = useState('all');
  const [copied, setCopied] = useState(false);
  const letterRef = useRef();
  const filters = [['all', 'All'], ['ai', 'AI suggested'], ['confirmed', 'Confirmed'], ['added', 'Coder added'], ['rejected', 'Rejected']];
  const rows = ordered.filter((f) => filter === 'all' || f.status === filter);
  const letter = buildLetter(ordered, s);
  const newItems = ordered.filter((f) => routeOf(f) === 'corrected' || (f.code && !CLAIM_CODES.has(f.code) && f.status === 'ai' && !f.outsideDos));
  const uniqNew = newItems.filter((f, i) => newItems.findIndex((x) => x.id === f.id) === i);
  const lineVerdict = (l) => {
    if (l.code === CASE.billed) {
      return s.code === CASE.billed
        ? { st: 'ok', t: `Record supports ${s.code} on MDM (Problems ${LV[s.prob]}, Risk ${LV[s.risk]}).`, a: 'Appeal: reinstate 99215' }
        : { st: 'warn', t: `Confirmed evidence supports ${s.code}. Level 5 needs two of three MDM elements at High.`, a: 'Hold: find or confirm high-level evidence' };
    }
    const rep = ordered.find((f) => f.replaces === l.code && f.status !== 'rejected');
    if (rep) return isLive(rep) ? { st: 'warn', t: `Record documents ${rep.desc.toLowerCase()} (p. ${rep.page}).`, a: `Correct to ${rep.code}` } : { st: 'pend', t: `AI suggests ${rep.code} instead (p. ${rep.page}). Review pending.`, a: 'Review suggestion' };
    const sup = ordered.filter((f) => f.code === l.code && isLive(f));
    if (sup.length) return { st: 'ok', t: `Supported on p. ${sup.map((f) => f.page).join(', ')}.`, a: 'No change' };
    return { st: 'pend', t: 'No confirmed evidence yet.', a: 'Review' };
  };
  const copy = () => {
    const txt = letter.map((b) => (b.k === 'li' ? '• ' + b.t : b.t)).join('\n\n');
    const done = () => { setCopied(true); setTimeout(() => setCopied(false), 1600); };
    try {
      navigator.clipboard.writeText(txt).then(done, () => selectLetter());
    } catch (e) { selectLetter(); }
  };
  const selectLetter = () => {
    const r = document.createRange();
    r.selectNodeContents(letterRef.current);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
  };
  return (
    <div className="modal-bg" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-label="Full notes">
        <div className="modal-head">
          <div>
            <div className="eyebrow">{CASE.id} · {CASE.level}</div>
            <h2>Full notes</h2>
          </div>
          <div className="tabs big" role="tablist">
            {[['findings', 'Findings'], ['worksheet', 'Claim worksheet'], ['appeal', 'Appeal draft']].map(([k, l]) => (
              <button key={k} role="tab" aria-selected={tab === k} className={cls(tab === k && 'on')} onClick={() => setTab(k)}>{l}</button>
            ))}
          </div>
          <button className="ib" onClick={onClose} aria-label="Close full notes"><Ic.close size={18} /></button>
        </div>
        <div className="modal-body">
          {tab === 'findings' && (
            <>
              <div className="filters">
                {filters.map(([k, l]) => (
                  <button key={k} className={cls('fchip', filter === k && 'on')} onClick={() => setFilter(k)}>
                    {k !== 'all' && <StatusDot s={k} />}{l} <span className="n">{k === 'all' ? ordered.length : ordered.filter((f) => f.status === k).length}</span>
                  </button>
                ))}
              </div>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>Status</th><th>Page</th><th>Code</th><th>Description</th><th>Evidence in record</th><th>Goes to</th><th aria-label="Actions" /></tr></thead>
                  <tbody>
                    {rows.map((f) => {
                      const route = routeOf(f);
                      return (
                        <tr key={f.id} onClick={() => onJump(f.id)} className={'st-' + f.status}>
                          <td><span className={cls('chip', 'st-' + f.status)}><StatusDot s={f.status} />{STATUS_LABEL[f.status]}</span></td>
                          <td className="num">{f.page}</td>
                          <td className="mono">{f.code || mdmTag(f) || f.type.toUpperCase()}{f.code && f.mdm && <div className="sub">{mdmTag(f)}</div>}</td>
                          <td>{titleOf(f)}</td>
                          <td className="q">“{f.text}”</td>
                          <td><span className={'route r-' + route}>{ROUTE_LABEL[route]}</span></td>
                          <td className="acts" onClick={(e) => e.stopPropagation()}>
                            {f.status === 'ai' && <><button className="ib sm ok" aria-label="Accept" onClick={() => onAction(f.id, 'confirmed')}><Ic.check size={14} /></button><button className="ib sm no" aria-label="Reject" onClick={() => onAction(f.id, 'rejected')}><Ic.close size={14} /></button></>}
                            {isLive(f) && <button className="ib sm no" aria-label="Reject" onClick={() => onAction(f.id, 'rejected')}><Ic.close size={14} /></button>}
                            {f.status === 'rejected' && <button className="ib sm" aria-label="Restore" onClick={() => onAction(f.id, f.source === 'ai' ? 'ai' : 'added')}><Ic.undo size={14} /></button>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {tab === 'worksheet' && (
            <div className="ws">
              <Score s={s} />
              <h3>Lines on the claim</h3>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>Billed</th><th>Paid as</th><th>Description</th><th>What the record shows</th><th>Action</th></tr></thead>
                  <tbody>
                    {CLAIM_LINES.map((l) => {
                      const v = lineVerdict(l);
                      return (
                        <tr key={l.code} className="static">
                          <td className="mono">{l.code}</td>
                          <td className={cls('mono', l.paid !== l.code && 'down')}>{l.paid}</td>
                          <td>{l.desc}</td>
                          <td>{v.t}</td>
                          <td><span className={'verdict v-' + v.st}>{v.a}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <h3>Found in the record, not on the claim</h3>
              <p className="muted">These can't be added through an appeal. Send confirmed items to billing as a corrected claim (frequency code 7) within timely filing.</p>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>Code</th><th>Description</th><th>Page</th><th>Status</th></tr></thead>
                  <tbody>
                    {uniqNew.map((f) => (
                      <tr key={f.id} onClick={() => onJump(f.id)}>
                        <td className="mono">{f.code}{f.replaces && <div className="sub">replaces {f.replaces}</div>}</td>
                        <td>{f.desc}</td>
                        <td className="num">{f.page}</td>
                        <td><span className={cls('chip', 'st-' + f.status)}><StatusDot s={f.status} />{f.status === 'ai' ? 'Needs review' : STATUS_LABEL[f.status]}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {tab === 'appeal' && (
            <div className="appeal">
              {s.code !== CASE.billed && (
                <div className="warn big"><Ic.alert size={16} /><div><b>Not ready to send.</b> Confirmed evidence supports {s.code}, not {CASE.billed}. Level 5 needs a second MDM element at High. Check the plan on page 4 for risk evidence the AI may have missed.</div></div>
              )}
              {s.code === CASE.billed && (
                <div className="okbox"><Ic.check size={16} /><div><b>Ready for review.</b> Problems and Risk are both High, so the record supports {CASE.billed}.</div></div>
              )}
              <div className="letter-tools">
                <span className="muted">Built from confirmed and coder-added findings. Page citations update as you review.</span>
                <button className="btn" onClick={copy}><Ic.copy size={14} />{copied ? 'Copied' : 'Copy letter'}</button>
              </div>
              <div className="letter" ref={letterRef}>
                {letter.map((b, i) =>
                  b.k === 'h' ? <h4 key={i}>{b.t}</h4> : b.k === 'li' ? <div key={i} className="lli">{b.t}</div> : <p key={i} className={b.k === 'meta' ? 'lmeta' : ''}>{b.t}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- palette ---------- */
function Palette({ commands, onClose }) {
  const [q, setQ] = useState('');
  const [i, setI] = useState(0);
  const list = commands.filter((c) => q.toLowerCase().split(/\s+/).every((t) => c.label.toLowerCase().includes(t)));
  useEffect(() => setI(0), [q]);
  const run = (c) => { onClose(); setTimeout(c.run, 10); };
  return (
    <div className="modal-bg top" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pal" role="dialog" aria-label="Command palette">
        <label className="search big">
          <Ic.search size={16} />
          <input id="palette-input" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type a command or page…" aria-label="Command"
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setI((x) => Math.min(x + 1, list.length - 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setI((x) => Math.max(x - 1, 0)); }
              if (e.key === 'Enter' && list[i]) { e.preventDefault(); run(list[i]); }
              if (e.key === 'Escape') { e.preventDefault(); onClose(); }
            }} />
        </label>
        <div className="pal-list">
          {list.map((c, k) => (
            <button key={c.label} className={cls('pal-item', k === i && 'on')} onMouseEnter={() => setI(k)} onClick={() => run(c)}>
              <span>{c.label}</span>{c.key && <Kbd>{c.key}</Kbd>}
            </button>
          ))}
          {!list.length && <div className="empty">No matching command.</div>}
        </div>
      </div>
    </div>
  );
}

/* ---------- app ---------- */
function initialNp(narrow) {
  const W = window.innerWidth, H = window.innerHeight;
  if (narrow) return { mode: 'min', x: 8, y: Math.round(H * 0.4), w: W - 16, h: Math.round(H * 0.55), railCollapsed: false };
  const w = 360, h = Math.min(500, H - 210);
  return { mode: 'float', x: W - w - 40, y: 150, w, h, railCollapsed: false };
}

function App() {
  const narrow = useNarrow();
  const [findings, setFindings] = useState(INITIAL);
  const history = useRef([]);
  const [toast, setToast] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [hoverId, setHoverId] = useState(null);
  const [flashId, setFlashId] = useState(null);
  const [card, setCard] = useState(null);
  const [sel, setSel] = useState(null);
  const [compose, setCompose] = useState(null);
  const [view, setView] = useState({ spot: false, clean: false, dos: true });
  const [np, setNp] = useState(() => initialNp(window.matchMedia('(max-width: 760px)').matches));
  const [pinned, setPinned] = useState(null);
  const [visible, setVisible] = useState([1]);
  const [cur, setCur] = useState(1);
  const [scrolling, setScrolling] = useState(false);
  const [npHover, setNpHover] = useState(false);
  const [snap, setSnap] = useState(false);
  const [full, setFull] = useState(null);
  const [palette, setPalette] = useState(false);
  const [seen, setSeen] = useState({ card: false, full: false, dock: false });
  const [tab, setTab] = useState('view');
  const scrollerRef = useRef();
  const npRef = useRef();
  const railRef = useRef();
  const bubbleRef = useRef();
  const npBtnRef = useRef();
  const cardTimer = useRef();
  const scrollTimer = useRef();
  const composeRef = useRef(null);
  composeRef.current = compose;

  const ordered = useMemo(() => [...findings].sort((a, b) => orderKey(a) - orderKey(b)), [findings]);
  const s = useMemo(() => summarize(findings, false), [findings]);
  const byBlock = useMemo(() => {
    const m = {};
    findings.forEach((f) => { (m[f.block] = m[f.block] || []).push(f); });
    return m;
  }, [findings]);

  /* mutations with undo */
  const commit = useCallback((next, msg) => {
    history.current.push(findings);
    if (history.current.length > 40) history.current.shift();
    setFindings(next);
    setToast({ msg, id: Date.now() });
  }, [findings]);
  const undo = useCallback(() => {
    const prev = history.current.pop();
    if (!prev) return;
    setFindings(prev);
    setToast({ msg: 'Undone', id: Date.now(), noUndo: true });
  }, []);
  const setStatus = useCallback((id, status) => {
    const f = findings.find((x) => x.id === id);
    if (!f || f.status === status) return;
    const verb = { confirmed: 'Accepted', rejected: 'Rejected', ai: 'Moved back to suggestions', added: 'Restored' }[status];
    commit(findings.map((x) => (x.id === id ? { ...x, status } : x)), `${verb} ${f.code || mdmTag(f) || 'note'}`);
  }, [findings, commit]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  /* scroll sync */
  useEffect(() => {
    const root = scrollerRef.current;
    const ratios = {};
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { ratios[e.target.dataset.page] = e.intersectionRatio; });
      const vis = Object.entries(ratios).filter(([, r]) => r > 0.04).map(([k]) => +k).sort((a, b) => a - b);
      if (vis.length) setVisible((v) => (v.join() === vis.join() ? v : vis));
      let best = 1, br = -1;
      Object.entries(ratios).forEach(([k, r]) => { if (r > br) { br = r; best = +k; } });
      setCur(best);
    }, { root, threshold: [0, 0.05, 0.15, 0.3, 0.5, 0.7, 0.9, 1] });
    root.querySelectorAll('.page').forEach((p) => io.observe(p));
    return () => io.disconnect();
  }, []);

  const onScroll = () => {
    if (!scrolling) setScrolling(true);
    clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => setScrolling(false), 420);
    if (card && !card.pinned) setCard(null);
  };

  /* phone width: tuck the floating notepad into the bubble */
  useEffect(() => {
    if (narrow) { setNp((n) => (n.mode === 'float' ? { ...initialNp(true), lastMode: 'float' } : n)); }
  }, [narrow]);

  /* keep notepad on screen */
  useEffect(() => {
    const h = () => setNp((n) => ({ ...n, w: Math.min(n.w, window.innerWidth - 8), x: clamp(n.x, 4, Math.max(4, window.innerWidth - Math.min(n.w, window.innerWidth - 8) - 4)), y: clamp(n.y, 4, Math.max(4, window.innerHeight - 80)) }));
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  /* evidence hover card */
  const onEvEnter = (id) => {
    setHoverId(id);
    clearTimeout(cardTimer.current);
    if (card && card.pinned && card.id !== id) return;
    cardTimer.current = setTimeout(() => {
      setCard((c) => (c && c.pinned ? c : { id, pinned: false }));
      setSeen((x) => (x.card ? x : { ...x, card: true }));
    }, 140);
  };
  const onEvLeave = () => {
    setHoverId(null);
    clearTimeout(cardTimer.current);
    cardTimer.current = setTimeout(() => setCard((c) => (c && !c.pinned ? null : c)), 240);
  };
  const onEvClick = (id) => {
    const ws = window.getSelection();
    if (ws && !ws.isCollapsed) return;
    setActiveId(id);
    setCard({ id, pinned: true });
    setSeen((x) => ({ ...x, card: true }));
  };

  const jumpTo = useCallback((id, openCard = true) => {
    const el = document.getElementById('ev-' + id);
    setActiveId(id);
    if (!el) return;
    el.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
    setFlashId(id);
    setTimeout(() => setFlashId((x) => (x === id ? null : x)), 1300);
    if (openCard) setTimeout(() => { setCard({ id, pinned: true }); }, reduced ? 0 : 420);
  }, []);

  /* selection → add */
  const onMouseUp = () => {
    setTimeout(() => {
      const ws = window.getSelection();
      if (!ws || ws.isCollapsed || !ws.rangeCount) return;
      const raw = ws.toString().replace(/\s+/g, ' ').trim();
      if (raw.length < 3) return;
      const range = ws.getRangeAt(0);
      const n = range.startContainer;
      const blkEl = (n.nodeType === 1 ? n : n.parentElement).closest('.blk');
      if (!blkEl || !scrollerRef.current.contains(blkEl)) return;
      const b = BLOCKS[blkEl.dataset.block];
      let text = raw;
      if (b.t.indexOf(text) < 0) {
        const r2 = document.createRange();
        r2.setStart(range.startContainer, range.startOffset);
        r2.setEnd(blkEl, blkEl.childNodes.length);
        text = r2.toString().replace(/\s+/g, ' ').trim();
      }
      const i = b.t.indexOf(text);
      if (i < 0 || !text) return;
      const overlap = (byBlock[b.id] || []).some((f) => {
        const j = b.t.indexOf(f.text);
        return j >= 0 && i < j + f.text.length && j < i + text.length;
      });
      setCard(null);
      setCompose(null);
      setSel({ block: b.id, page: b.page, text, range: range.cloneRange(), overlap });
    }, 0);
  };
  useEffect(() => {
    const h = () => {
      if (composeRef.current) return;
      const ws = window.getSelection();
      if (!ws || ws.isCollapsed) setSel(null);
    };
    document.addEventListener('selectionchange', h);
    return () => document.removeEventListener('selectionchange', h);
  }, []);
  useEffect(() => {
    const h = (e) => {
      const t = e.target;
      if (!t.closest) return;
      if (!t.closest('.compose,.seltb')) { if (composeRef.current) { setCompose(null); setSel(null); } }
      if (!t.closest('.card,.ev,.row,.mm-tick,.tbl')) setCard((c) => (c && c.pinned ? null : c));
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const notesTarget = () => (np.mode === 'float' ? npRef.current : np.mode === 'dock' ? railRef.current : np.mode === 'min' ? bubbleRef.current : npBtnRef.current);

  const addFinding = (spec) => {
    if (!sel) return;
    const pg = PAGES.find((p) => p.n === sel.page);
    const id = 'u' + Date.now().toString(36);
    const f = { id, page: sel.page, block: sel.block, text: sel.text, source: 'coder', status: 'added', outsideDos: pg.dos !== CASE.dos, ...spec };
    const from = sel.range.getBoundingClientRect();
    commit([...findings, f], `Added ${f.code || mdmTag(f) || 'note'} to notes`);
    fly(from, tagOf(f) || 'NOTE', notesTarget());
    window.getSelection() && window.getSelection().removeAllRanges();
    setSel(null);
    setCompose(null);
    setActiveId(id);
    setFlashId(id);
    setTimeout(() => setFlashId((x) => (x === id ? null : x)), 1800);
  };

  /* notepad mode helpers */
  const dock = () => { setNp((n) => ({ ...n, mode: 'dock', railCollapsed: false })); setSeen((x) => ({ ...x, dock: true })); };
  const float = () => setNp((n) => ({ ...n, mode: 'float', ...(narrow ? {} : { x: clamp(n.x, 4, window.innerWidth - n.w - 40) }) }));
  const keepLast = (n) => (n.mode === 'float' || n.mode === 'dock' ? n.mode : n.lastMode);
  const minimize = () => setNp((n) => ({ ...n, mode: 'min', lastMode: keepLast(n) }));
  const closeNp = () => setNp((n) => ({ ...n, mode: 'closed', lastMode: keepLast(n) }));
  const toggleNp = () => setNp((n) => ({ ...n, mode: n.mode === 'float' || n.mode === 'dock' ? 'min' : n.lastMode || 'float', lastMode: n.mode === 'float' || n.mode === 'dock' ? n.mode : n.lastMode }));
  const railResize = (e) => {
    e.preventDefault();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const sx = e.clientX, ow = np.railW || 360;
    document.body.classList.add('resizing', 'ew');
    const mv = (ev) => setNp((n) => ({ ...n, railW: clamp(ow - (ev.clientX - sx), 280, Math.min(720, window.innerWidth - 380)) }));
    const up = () => { document.body.classList.remove('resizing', 'ew'); el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); };
    el.addEventListener('pointermove', mv);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  };
  const openFull = (t = 'findings') => { setFull(t); setSeen((x) => ({ ...x, full: true })); setCard(null); };

  const step = (d) => {
    if (!ordered.length) return;
    let idx = ordered.findIndex((f) => f.id === activeId);
    if (idx < 0) {
      idx = d > 0 ? ordered.findIndex((f) => f.page >= cur) : ordered.findIndex((f) => f.page >= cur) - 1;
      if (idx < 0) idx = d > 0 ? 0 : ordered.length - 1;
      jumpTo(ordered[clamp(idx, 0, ordered.length - 1)].id);
      return;
    }
    jumpTo(ordered[(idx + d + ordered.length) % ordered.length].id);
  };
  const nextAi = () => {
    const idx = ordered.findIndex((f) => f.id === activeId);
    const rot = [...ordered.slice(idx + 1), ...ordered.slice(0, idx + 1)];
    const n = rot.find((f) => f.status === 'ai');
    if (n) jumpTo(n.id);
  };
  const goPage = (n) => document.getElementById('page-' + n).scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });

  /* keyboard */
  useEffect(() => {
    const h = (e) => {
      const tag = e.target.tagName || '';
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable;
      const k = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === 'k') { e.preventDefault(); setPalette((p) => !p); return; }
      if ((e.metaKey || e.ctrlKey) && k === 'z' && !typing) { e.preventDefault(); undo(); return; }
      if (e.key === 'Escape') {
        if (palette) setPalette(false);
        else if (compose) { setCompose(null); setSel(null); }
        else if (full) setFull(null);
        else if (card) setCard(null);
        else if (sel) { setSel(null); window.getSelection().removeAllRanges(); }
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey || palette || compose) return;
      if (full && k !== 'f') return;
      const target = activeId || (card && card.id);
      switch (k) {
        case 'j': e.preventDefault(); step(1); break;
        case 'k': e.preventDefault(); step(-1); break;
        case 'a': if (target) { const f = findings.find((x) => x.id === target); if (f && f.status === 'ai') setStatus(target, 'confirmed'); } break;
        case 'r': if (target) setStatus(target, 'rejected'); break;
        case 'n': toggleNp(); break;
        case 'd': if (!narrow) (np.mode === 'dock' ? float() : dock()); break;
        case 'f': full ? setFull(null) : openFull('findings'); break;
        case 's': setView((v) => ({ ...v, spot: !v.spot, clean: false })); break;
        case 'c': setView((v) => ({ ...v, clean: !v.clean, spot: false })); break;
        default: break;
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  const commands = [
    { label: 'Next finding', key: 'J', run: () => step(1) },
    { label: 'Previous finding', key: 'K', run: () => step(-1) },
    { label: 'Next AI suggestion to review', run: nextAi },
    ...PAGES.map((p) => ({ label: `Go to page ${p.n} · ${p.label}`, run: () => goPage(p.n) })),
    { label: 'Toggle spotlight', key: 'S', run: () => setView((v) => ({ ...v, spot: !v.spot, clean: false })) },
    { label: 'Toggle clean read', key: 'C', run: () => setView((v) => ({ ...v, clean: !v.clean, spot: false })) },
    { label: 'Toggle date-of-service filter', run: () => setView((v) => ({ ...v, dos: !v.dos })) },
    { label: 'Open full notes', key: 'F', run: () => openFull('findings') },
    { label: 'Open claim worksheet', run: () => openFull('worksheet') },
    { label: 'Draft appeal letter', run: () => openFull('appeal') },
    { label: 'Dock notepad to the right', key: 'D', run: dock },
    { label: 'Float notepad', run: float },
    { label: 'Minimize notepad', key: 'N', run: minimize },
    { label: 'Undo last change', key: '⌘Z', run: undo },
  ];

  /* checkpoints */
  const pendS = summarize(findings, true);
  const dosOpen = findings.filter((f) => f.outsideDos && f.status !== 'rejected').length;
  const aiTotal = findings.filter((f) => f.source === 'ai').length;
  const aiPending = findings.filter((f) => f.status === 'ai').length;
  const firstOf = (pred) => { const f = ordered.find(pred); if (f) jumpTo(f.id); };
  const cps = [
    { k: 'prob', label: 'Problems', val: LV[s.prob], met: s.prob >= 3, part: pendS.prob > s.prob, go: () => firstOf((f) => f.mdm && f.mdm.el === 'problems') },
    { k: 'data', label: 'Data', val: LV[s.data], met: s.data >= 2, part: pendS.data > s.data, go: () => firstOf((f) => f.mdm && f.mdm.el === 'data' && (f.status === 'ai' || !ordered.some((x) => x.mdm && x.mdm.el === 'data' && x.status === 'ai'))) },
    { k: 'risk', label: 'Risk', val: LV[s.risk], met: s.risk >= 3, part: pendS.risk > s.risk, go: () => firstOf((f) => f.mdm && f.mdm.el === 'risk' && f.mdm.level === s.risk) },
    { k: 'lvl', label: 'Level', val: `${s.code} of ${CASE.billed}`, met: s.code === CASE.billed, go: () => openFull('worksheet') },
    { k: 'dos', label: 'Date of service', val: dosOpen ? `${dosOpen} from another visit` : 'Clear', met: !dosOpen, go: () => firstOf((f) => f.outsideDos && f.status !== 'rejected') },
    { k: 'ai', label: 'AI review', val: `${aiTotal - aiPending} of ${aiTotal}`, met: !aiPending, part: aiPending < aiTotal, go: nextAi },
  ];
  const metCount = cps.filter((c) => c.met).length;


  const cardF = card && findings.find((f) => f.id === card.id);
  const docked = np.mode === 'dock';
  const notesBody = (
    <NotesBody
      ordered={ordered} visible={visible} pinned={pinned} setPinned={setPinned} tab={tab} setTab={setTab}
      activeId={activeId} hoverId={hoverId} flashId={flashId} setHoverId={setHoverId}
      onJump={(id) => jumpTo(id)} onAction={setStatus} s={s} onFull={() => openFull('findings')}
    />
  );

  return (
    <div className={cls('app', view.spot && 'spot', view.clean && 'clean', narrow && 'narrow')}>
      <header className="bar">
        <div className="case">
          <div className="case-l1">
            <span className="case-id">{CASE.id}</span>
            <span className="case-name">{CASE.patient}</span>
            <span className="case-mrn">MRN {CASE.mrn}</span>
          </div>
          <div className="case-l2">{CASE.payer} · Claim {CASE.claim} · DOS {CASE.dos}</div>
        </div>
        <div className="denial" title={`${CASE.carc}: ${CASE.carcText}`}>
          <span className="den-k">Downcoded</span>
          <span className="den-v"><s>{CASE.billed}</s> → {CASE.paid}</span>
          <span className="den-carc">{CASE.carc} · {CASE.stake} at stake</span>
        </div>
        <div className="due">
          <Ic.cal size={14} />
          <span><b>{CASE.level}</b> due {CASE.due} · {CASE.daysLeft} days</span>
        </div>
        <div className="controls">
          <button className="tg" aria-pressed={view.spot} onClick={() => setView((v) => ({ ...v, spot: !v.spot, clean: false }))} title="Spotlight (S): dim everything except marked evidence"><Ic.spot size={15} /><span>Spotlight</span></button>
          <button className="tg" aria-pressed={view.clean} onClick={() => setView((v) => ({ ...v, clean: !v.clean, spot: false }))} title="Clean read (C): hide all marks"><Ic.eye size={15} /><span>Clean read</span></button>
          <button className="tg" aria-pressed={view.dos} onClick={() => setView((v) => ({ ...v, dos: !v.dos }))} title="Dim pages from other dates of service"><Ic.cal size={15} /><span>DOS only</span></button>
          <button ref={npBtnRef} className="tg" aria-pressed={np.mode === 'float' || np.mode === 'dock'} onClick={toggleNp} title="Notepad (N)"><Ic.notes size={15} /><span>Notepad</span><span className="badge">{findings.length}</span></button>
          <button className="tg cmd" onClick={() => setPalette(true)} title="Command palette"><Ic.search size={15} /><Kbd>⌘K</Kbd></button>
        </div>
      </header>

      <nav className="cps" aria-label="Review checkpoints">
        <span className="cps-lead"><b>{metCount}/{cps.length}</b> · 99215 needs 2 of 3 at High</span>
        {cps.map((c) => (
          <button key={c.k} className={cls('cp', c.met ? 'met' : c.part ? 'part' : 'open')} onClick={c.go}>
            <span className="cp-ic" aria-hidden="true">{c.met ? <Ic.check size={11} sw={3} /> : null}</span>
            <span className="cp-l">{c.label}</span>
            <span className="cp-v">{c.val}</span>
            {!c.met && c.part && ['prob', 'data', 'risk'].includes(c.k) && <span className="cp-sug">AI has more</span>}
          </button>
        ))}
      </nav>

      <div className={cls('work', docked && !narrow && 'docked')}>
        <div className="stage">
          <div className="scroller" ref={scrollerRef} onScroll={onScroll} onMouseUp={onMouseUp} onKeyUp={(e) => { if (e.shiftKey) onMouseUp(); }}>
            <div className="pages">
              {PAGES.map((p) => {
                const off = p.dos !== CASE.dos;
                return (
                  <section key={p.n} id={'page-' + p.n} data-page={p.n} className={cls('page', off && 'offdos', off && view.dos && 'dim')} aria-label={`Page ${p.n}`}>
                    {off && <div className="dos-banner"><Ic.alert size={13} />Different visit · DOS {p.dos}. Findings here don't count for the {CASE.dos} claim.</div>}
                    <div className="page-body">
                      {p.blocks.map((b) => (
                        <Block key={b.id} b={b} fs={byBlock[b.id] || []} hotId={hoverId} activeId={activeId} flashId={flashId} onEnter={onEvEnter} onLeave={onEvLeave} onClickEv={onEvClick} />
                      ))}
                    </div>
                    <div className="page-foot"><span>Printed from EHR 03/19/2026 09:14 · Riverbend IMA</span><span>Page {p.n} of {PAGES.length}</span></div>
                  </section>
                );
              })}
            </div>
          </div>
          <div className="pagepill">Page {cur} of {PAGES.length}</div>
          <Minimap scrollerRef={scrollerRef} ordered={ordered} onJump={(id) => jumpTo(id)} activeId={activeId} />
        </div>
        {docked && (
          <aside ref={railRef} className={cls('rail', np.railCollapsed && 'collapsed')} style={!np.railCollapsed && !narrow ? { width: np.railW || 360 } : undefined} aria-label="Notes">
            {!np.railCollapsed && !narrow && <div className="rail-rz" onPointerDown={railResize} onDoubleClick={() => setNp((n) => ({ ...n, railW: 360 }))} title="Drag to resize · double-click to reset" aria-hidden="true" />}
            {np.railCollapsed ? (
              <button className="rail-tab" onClick={() => setNp((n) => ({ ...n, railCollapsed: false }))} aria-label="Expand notes">
                <Ic.left size={15} />
                <span className="vert">Notes</span>
                <span className="badge">{findings.length}</span>
              </button>
            ) : (
              <>
                <div className="np-head rail-head">
                  <span className="np-title">Notepad</span>
                  <span className="badge">{findings.length}</span>
                  <span className="sp" />
                  <button className="ib sm" title="Full notes (F)" aria-label="Full notes" onClick={() => openFull('findings')}><Ic.expand size={14} /></button>
                  <button className="ib sm" title="Float (D)" aria-label="Float notepad" onClick={float}><Ic.float size={14} /></button>
                  {!narrow && <button className="ib sm" title="Collapse" aria-label="Collapse notes" onClick={() => setNp((n) => ({ ...n, railCollapsed: true }))}><Ic.right size={14} /></button>}
                  {narrow && <button className="ib sm" title="Close" aria-label="Close" onClick={minimize}><Ic.close size={14} /></button>}
                </div>
                {notesBody}
              </>
            )}
          </aside>
        )}
      </div>

      {np.mode === 'float' && (
        <Notepad
          np={np} setNp={setNp} innerRef={npRef} ghost={scrolling && !npHover} setSnap={setSnap} narrow={narrow}
          count={findings.length} onDock={dock} onMin={minimize} onClose={closeNp} onFull={() => openFull('findings')} setNpHover={setNpHover}
        >
          {notesBody}
        </Notepad>
      )}
      {np.mode === 'min' && (
        <button ref={bubbleRef} className="bubble" onClick={() => setNp((n) => ({ ...n, mode: n.lastMode === 'dock' && !narrow ? 'dock' : 'float' }))} aria-label="Open notepad">
          <Ic.notes size={16} /><span>Notes</span><span className="badge">{findings.length}</span>
          {aiPending > 0 && <span className="bubble-sub">{aiPending} to review</span>}
        </button>
      )}
      {snap && <div className="snap-hint"><span>Release to dock</span></div>}

      {cardF && (
        <EvCard
          f={cardF} scrollerRef={scrollerRef}
          onAction={(id, st) => setStatus(id, st)}
          onEnter={() => clearTimeout(cardTimer.current)}
          onLeave={() => { if (!card.pinned) { cardTimer.current = setTimeout(() => setCard((c) => (c && !c.pinned ? null : c)), 240); } }}
          onClose={() => setCard(null)}
        />
      )}
      {sel && !compose && <SelTool sel={sel} scrollerRef={scrollerRef} onPick={(t) => setCompose({ type: t })} />}
      {sel && compose && (
        <Compose
          key={sel.text} sel={sel} type={compose.type} setType={(t) => setCompose({ type: t })} scrollerRef={scrollerRef}
          onAdd={addFinding} onCancel={() => { setCompose(null); setSel(null); window.getSelection().removeAllRanges(); }}
        />
      )}

      {full && <FullNotes tab={full} setTab={setFull} ordered={ordered} s={s} onClose={() => setFull(null)} onJump={(id) => { setFull(null); setTimeout(() => jumpTo(id), 60); }} onAction={setStatus} />}
      {palette && <Palette commands={commands} onClose={() => setPalette(false)} />}

      {toast && (
        <div className="toast" role="status" key={toast.id}>
          <span>{toast.msg}</span>
          {!toast.noUndo && history.current.length > 0 && <button onClick={() => { undo(); }}>Undo</button>}
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
