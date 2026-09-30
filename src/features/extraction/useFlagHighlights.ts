import { useEffect, type RefObject } from 'react';
import { useExtractionStore } from './store';

const NAME = 'extraction-flag';

/** Text nodes of a paragraph's elements, in order, skipping decoration the record adds (bullets, tags). */
function textNodes(els: Element[]) {
  const out: Text[] = [];
  for (const el of els) {
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentElement?.closest('[aria-hidden="true"], [aria-hidden=""]') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    for (let n = w.nextNode(); n; n = w.nextNode()) out.push(n as Text);
  }
  return out;
}

/** A range over `text` inside a paragraph, even when evidence boxes split its words across elements. */
function rangeFor(root: HTMLElement, block: string, text: string): Range | null {
  const nodes = textNodes([...root.querySelectorAll(`[data-block="${CSS.escape(block)}"]`)]);
  const all = nodes.map((n) => n.data).join('');
  const i = all.indexOf(text);
  if (i < 0) return null;
  const at = (pos: number): [Text, number] => {
    let acc = 0;
    for (const n of nodes) {
      if (pos <= acc + n.data.length) return [n, pos - acc];
      acc += n.data.length;
    }
    const last = nodes[nodes.length - 1];
    return [last, last.data.length];
  };
  const r = document.createRange();
  r.setStart(...at(i));
  r.setEnd(...at(i + text.length));
  return r;
}

/**
 * Underlines flagged words in the record with the CSS Custom Highlight API, so flags never change the
 * record's markup or clash with evidence boxes. Redrawn whenever the record's content changes.
 */
export function useFlagHighlights(root: RefObject<HTMLElement | null>) {
  const flags = useExtractionStore((s) => s.flags);
  useEffect(() => {
    const el = root.current;
    if (!el || typeof CSS === 'undefined' || !('highlights' in CSS)) return;
    let raf = 0;
    const draw = () => {
      const ranges = flags.flatMap((f) => (f.text && f.block ? [rangeFor(el, f.block, f.text)].filter((r): r is Range => !!r) : []));
      CSS.highlights.set(NAME, new Highlight(...ranges));
    };
    draw();
    const mo = new MutationObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); });
    mo.observe(el, { childList: true, subtree: true, characterData: true });
    return () => { mo.disconnect(); cancelAnimationFrame(raf); CSS.highlights.delete(NAME); };
  }, [flags, root]);
}
