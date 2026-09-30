import type { ExtractionFlag } from '@/types';
import { BLOCKS, CASE, CLAIM, CURRENT_CASE_ID, ME, PAGE_H, PAGE_IMAGES, PAGE_LAYOUT, PAGE_W, PATIENT, WORKLIST, type LayoutLine } from '@/data';
import { KIND_LABEL } from './store';

/*
 * The extraction flags as a report to hand on: a PDF for people and a JSON for tools, each flag with the
 * screenshot the reviewer captured or pasted, if any.
 */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load page image'));
    img.src = src;
  });
}

/** The scan lines a flag is about: those holding its words, or the lines of its paragraph. */
function linesFor(f: ExtractionFlag): { lines: LayoutLine[]; from: number; to: number } {
  const all = (PAGE_LAYOUT[f.page] ?? []).filter((l) => l.block === f.block);
  const t = f.block ? BLOCKS[f.block]?.t ?? '' : '';
  const i = f.text ? t.indexOf(f.text) : -1;
  if (i < 0 || !f.text) return { lines: all, from: -1, to: -1 };
  const to = i + f.text.length;
  return { lines: all.filter((l) => l.start < to && l.start + l.text.length > i), from: i, to };
}

/** The case the report is about, as the header of both files. */
function header() {
  const w = WORKLIST.find((x) => x.id === CURRENT_CASE_ID);
  return {
    caseId: CASE.id,
    documentId: w?.documentId ?? null,
    claimId: CLAIM.id,
    patient: PATIENT.name,
    reviewer: ME.name,
    generatedAt: new Date().toISOString(),
  };
}

const sorted = (flags: ExtractionFlag[]) => [...flags].sort((a, b) => a.page - b.page || (BLOCKS[a.block ?? '']?.idx ?? 0) - (BLOCKS[b.block ?? '']?.idx ?? 0));

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const fileBase = () => `extraction-issues-${CASE.id}`;

/** extraction-issues-<case>.json: the case, and every flag with its paragraph and screenshot (a JPEG data URL). */
export async function downloadJson(flags: ExtractionFlag[]) {
  const items = sorted(flags).map(({ block, ...f }) => ({
    ...f,
    kindLabel: KIND_LABEL[f.kind],
    paragraph: block ? BLOCKS[block]?.t ?? null : null,
  }));
  save(new Blob([JSON.stringify({ schemaVersion: 1, ...header(), flags: items }, null, 2)], { type: 'application/json' }), fileBase() + '.json');
}

/** The PDF's standard font covers Latin-1: swap the few symbols the app uses for plain equivalents. */
const pdfText = (s: string) => s.replace(/→/g, '->').replace(/≠/g, '!=').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/…/g, '...').replace(/[^\x20-\xff\n]/g, '?');

/** extraction-issues-<case>.pdf: a cover with the case and counts, then each flag with its screenshot, if any. */
export async function downloadPdf(flags: ExtractionFlag[]) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 16;
  const h = header();
  let y = M;
  const ensure = (need: number) => { if (y + need > H - M) { doc.addPage(); y = M; } };
  const line = (text: string, size: number, style: 'normal' | 'bold' = 'normal', color = 30) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(color);
    const rows = doc.splitTextToSize(pdfText(text), W - 2 * M) as string[];
    ensure(rows.length * size * 0.42 + 1);
    doc.text(rows, M, y + size * 0.35);
    y += rows.length * size * 0.42 + 1.5;
  };

  line('Extraction issues', 18, 'bold');
  line(`Case ${h.caseId} · Document ${h.documentId ?? '-'} · Claim ${h.claimId}`, 10.5, 'normal', 60);
  line(`Patient ${h.patient} · Flagged by ${h.reviewer} · ${new Date(h.generatedAt).toLocaleString()}`, 10.5, 'normal', 60);
  const count = (k: string) => flags.filter((f) => f.kind === k).length;
  line(`${flags.length} ${flags.length === 1 ? 'issue' : 'issues'}: ${count('formatting')} formatting, ${count('data')} wrong data, ${count('missing')} missed content.`, 10.5);
  y += 4;

  for (const [n, f] of sorted(flags).entries()) {
    ensure(40);
    doc.setDrawColor(210);
    doc.line(M, y, W - M, y);
    y += 5;
    line(`${n + 1}. ${KIND_LABEL[f.kind]} · page ${f.page}`, 12, 'bold', 20);
    if (f.text) line(`Extracted: "${f.text}"`, 10);
    else line(`Missing near: "${f.near ?? ''}..."`, 10);
    if (f.shouldRead) line(`Original shows: ${f.shouldRead}`, 10);
    if (f.comment) line(`Comment: ${f.comment}`, 10, 'normal', 70);
    line(`Flagged ${new Date(f.createdAt).toLocaleString()}`, 8.5, 'normal', 120);
    if (f.screenshot) {
      const shot = await loadImage(f.screenshot);
      const iw = Math.min(W - 2 * M, (shot.width / shot.height) * 90);
      const ih = (shot.height / shot.width) * iw;
      ensure(ih + 4);
      doc.addImage(f.screenshot, 'JPEG', M, y + 1, iw, ih);
      doc.setDrawColor(200);
      doc.rect(M, y + 1, iw, ih);
      y += ih + 6;
    }
  }
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(pdfText(`${h.caseId} · Extraction issues · ${i} of ${pages}`), W - M, H - 8, { align: 'right' });
  }
  doc.save(fileBase() + '.pdf');
}

/** Largest side of a reviewer's screenshot once stored. */
const SHOT_MAX = 1600;

/** A pasted, dropped or chosen image, scaled down and stored as a JPEG data URL. */
export async function imageToDataUrl(file: Blob): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const k = Math.min(1, SHOT_MAX / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * k);
    canvas.height = Math.round(img.naturalHeight * k);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Where a flag sits on its page, in page pixels (top of its first line), to open the capture view there. */
export function flagTop(f: Pick<ExtractionFlag, 'page' | 'block' | 'text' | 'kind' | 'id' | 'createdAt'>): number {
  const { lines } = linesFor(f as ExtractionFlag);
  return lines.length ? Math.max(0, Math.min(...lines.map((l) => l.y - l.size))) : 0;
}

/** Part of a page image, in page pixels, as a JPEG data URL at twice the page's resolution. */
export async function cropPage(page: number, r: { x: number; y: number; w: number; h: number }): Promise<string> {
  const img = await loadImage(PAGE_IMAGES[page]);
  const sx = img.naturalWidth / PAGE_W;
  const sy = img.naturalHeight / PAGE_H;
  const k = Math.min(2, SHOT_MAX / Math.max(r.w, r.h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(r.w * k);
  canvas.height = Math.round(r.h * k);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, r.x * sx, r.y * sy, r.w * sx, r.h * sy, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.9);
}
