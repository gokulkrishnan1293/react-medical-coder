import type { RecordPage } from '@/types';
import { PAGES } from './pages';

/*
 * Stand-ins for the original page images. In production each page is an image rendered
 * from the source PDF/TIFF; here we draw the same text as a slightly crooked fax scan.
 */

export const PAGE_W = 850;
export const PAGE_H = 1100;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function wrap(text: string, max: number): string[] {
  const out: string[] = [];
  let line = '';
  text.split(' ').forEach((w) => {
    if (line && line.length + 1 + w.length > max) { out.push(line); line = w; }
    else line = line ? line + ' ' + w : w;
  });
  if (line) out.push(line);
  return out;
}

function scan(page: RecordPage, total: number): string {
  const lines: string[] = [];
  let y = 92;
  const text = (s: string, x: number, o: { bold?: boolean; size?: number; anchor?: 'middle' } = {}) =>
    `<text x="${x}" y="${y}" font-size="${o.size ?? 13}"${o.bold ? ' font-weight="700"' : ''}${o.anchor ? ' text-anchor="middle"' : ''}>${esc(s)}</text>`;

  page.blocks.forEach((b) => {
    const t = b.t.replace(/ \| /g, '   ');
    switch (b.k) {
      case 'org': lines.push(text(t, PAGE_W / 2, { bold: true, size: 16, anchor: 'middle' })); y += 22; break;
      case 'sub': lines.push(text(t, PAGE_W / 2, { size: 11, anchor: 'middle' })); y += 34; break;
      case 'title': lines.push(text(t, PAGE_W / 2, { bold: true, size: 14, anchor: 'middle' })); y += 34; break;
      case 'h': y += 8; lines.push(text(t, 64, { bold: true })); y += 22; break;
      case 'marHead': lines.push(text(t, 64, { bold: true, size: 11 })); y += 20; break;
      case 'mar': lines.push(text(t, 64, { size: 11 })); y += 20; break;
      default: {
        const indent = b.k === 'li' ? 84 : 64;
        wrap(b.k === 'li' ? '- ' + t : t, b.k === 'li' ? 88 : 91).forEach((l) => { lines.push(text(l, indent)); y += 20; });
        y += 6;
      }
    }
  });

  const tilt = ((page.n * 37) % 9 - 4) / 10;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE_W}" height="${PAGE_H}" viewBox="0 0 ${PAGE_W} ${PAGE_H}">
<defs><filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${page.n}"/><feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.35  0 0 0 0 0.33  0 0 0 0.09 0"/></filter></defs>
<rect width="100%" height="100%" fill="#f3f1ea"/>
<g transform="rotate(${tilt} ${PAGE_W / 2} ${PAGE_H / 2})" font-family="'Courier New', Courier, monospace" fill="#262626">
<text x="36" y="34" font-size="10" fill="#555">FROM: MERIDIAN RMC HIM   05/09/2026 10:42   FAX (555) 013-2291   P.${String(page.n).padStart(3, '0')}/${String(total).padStart(3, '0')}</text>
${lines.join('\n')}
<text x="${PAGE_W - 64}" y="${PAGE_H - 36}" font-size="10" text-anchor="end" fill="#555">Page ${page.n} of ${total}</text>
</g>
<rect width="100%" height="100%" filter="url(#g)"/>
</svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

/** Image source for each record page, keyed by page number. */
export const PAGE_IMAGES: Record<number, string> = Object.fromEntries(PAGES.map((p) => [p.n, scan(p, PAGES.length)]));
