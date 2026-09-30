import type { RecordPage } from '@/types';
import { PAGES } from './pages';

/*
 * Stand-ins for the original page images and their OCR line boxes. In production each page is an
 * image rendered from the source PDF/TIFF, and the line boxes come from OCR. Here we lay the record
 * text out as a fax scan, then draw the scan from that same layout, so the two line up.
 */

export const PAGE_W = 850;
export const PAGE_H = 1100;
/** The scan's typeface. The overlay text layer uses it too, so extracted words sit on the scanned ones. */
export const SCAN_FONT = "'Courier New', Courier, monospace";
/** Courier's advance width, in em. */
const CHAR_W = 0.6;

/** One line of text on a page, in page pixels. `x`, `y` is the start of the baseline (the middle when centered). */
export interface LayoutLine {
  block: string;
  /** Where this line starts in the block's text. */
  start: number;
  text: string;
  x: number;
  y: number;
  size: number;
  bold?: boolean;
  center?: boolean;
  /** List bullet drawn before the line; not part of the extracted text. */
  bullet?: { x: number };
}

/** Breaks text into lines of at most `max` characters, keeping each line's position in the text. */
function wrap(text: string, max: number): { start: number; text: string }[] {
  const out: { start: number; text: string }[] = [];
  let start = -1;
  let end = 0;
  for (const m of text.matchAll(/\S+/g)) {
    const i = m.index!;
    if (start >= 0 && i + m[0].length - start > max) {
      out.push({ start, text: text.slice(start, end) });
      start = -1;
    }
    if (start < 0) start = i;
    end = i + m[0].length;
  }
  if (start >= 0) out.push({ start, text: text.slice(start, end) });
  return out;
}

function layout(page: RecordPage): LayoutLine[] {
  const lines: LayoutLine[] = [];
  let y = 92;
  const one = (b: RecordPage['blocks'][number], o: Partial<LayoutLine> & { x: number }) =>
    lines.push({ block: b.id, start: 0, text: b.t, y, size: 13, ...o });

  page.blocks.forEach((b) => {
    switch (b.k) {
      case 'org': one(b, { x: PAGE_W / 2, size: 16, bold: true, center: true }); y += 22; break;
      case 'sub': one(b, { x: PAGE_W / 2, size: 11, center: true }); y += 34; break;
      case 'title': one(b, { x: PAGE_W / 2, size: 14, bold: true, center: true }); y += 34; break;
      case 'h': y += 8; one(b, { x: 64, bold: true }); y += 22; break;
      case 'marHead': one(b, { x: 64, size: 11, bold: true }); y += 20; break;
      case 'mar': one(b, { x: 64, size: 11 }); y += 20; break;
      default: {
        const li = b.k === 'li';
        const x = li ? 84 + 2 * CHAR_W * 13 : 64;
        wrap(b.t, li ? 86 : 91).forEach((l, i) => {
          lines.push({ block: b.id, ...l, x, y, size: 13, ...(li && i === 0 ? { bullet: { x: 84 } } : {}) });
          y += 20;
        });
        y += 6;
      }
    }
  });
  return lines;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function scan(page: RecordPage, lines: LayoutLine[], total: number): string {
  const text = lines.map((l) => {
    const attrs = `font-size="${l.size}"${l.bold ? ' font-weight="700"' : ''}${l.center ? ' text-anchor="middle"' : ''}`;
    // MAR cells print as columns; " | " and three spaces are the same width in Courier
    const bullet = l.bullet ? `<text x="${l.bullet.x}" y="${l.y}" font-size="${l.size}">-</text>` : '';
    return `${bullet}<text x="${l.x}" y="${l.y}" ${attrs} xml:space="preserve">${esc(l.text.replace(/ \| /g, '   '))}</text>`;
  });
  // a little skew, as a real scan has; kept small so the OCR boxes still sit on the words
  const tilt = ((page.n * 37) % 9 - 4) / 20;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE_W}" height="${PAGE_H}" viewBox="0 0 ${PAGE_W} ${PAGE_H}">
<defs><filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${page.n}"/><feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.35  0 0 0 0 0.33  0 0 0 0.09 0"/></filter></defs>
<rect width="100%" height="100%" fill="#f3f1ea"/>
<g transform="rotate(${tilt} ${PAGE_W / 2} ${PAGE_H / 2})" font-family="${SCAN_FONT.replace(/'/g, '&apos;')}" fill="#262626">
<text x="36" y="34" font-size="10" fill="#555">FROM: MERIDIAN RMC HIM   05/09/2026 10:42   FAX (555) 013-2291   P.${String(page.n).padStart(3, '0')}/${String(total).padStart(3, '0')}</text>
${text.join('\n')}
<text x="${PAGE_W - 64}" y="${PAGE_H - 36}" font-size="10" text-anchor="end" fill="#555">Page ${page.n} of ${total}</text>
</g>
<rect width="100%" height="100%" filter="url(#g)"/>
</svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

/** Line boxes for each page, keyed by page number. */
export const PAGE_LAYOUT: Record<number, LayoutLine[]> = Object.fromEntries(PAGES.map((p) => [p.n, layout(p)]));

/** Image source for each record page, keyed by page number. */
export const PAGE_IMAGES: Record<number, string> = Object.fromEntries(PAGES.map((p) => [p.n, scan(p, PAGE_LAYOUT[p.n], PAGES.length)]));
