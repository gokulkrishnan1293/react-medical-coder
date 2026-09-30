import { chromium } from 'playwright';
import fs from 'fs';
import { routeFonts } from './fontroute.mjs';
const KEEP = [0, 2, 4, 5, 6, 7, 9, 14, 15, 16, 19, 20, 21, 22];
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 2, ignoreHTTPSErrors: true });
await routeFonts(ctx, process.cwd() + '/fonts');
const p = await ctx.newPage();
await p.goto('http://localhost:5173/cases/RC-2026-1192?tour', { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(2500);
await p.mouse.move(700, 790);
const hide = () => p.evaluate(() => { const s = document.createElement('style'); s.id = 'hide'; s.textContent = '.fixed.inset-0.z-100{visibility:hidden!important}'; document.head.append(s); });
const show = () => p.evaluate(() => document.getElementById('hide')?.remove());
const meta = {};
async function measure() {
  return p.evaluate(() => {
    const ov = document.querySelector('.fixed.inset-0.z-100');
    const boxes = [...ov.querySelectorAll('svg path[stroke-width="2"]')].map(pth => { const r = pth.getBBox(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
    const card = ov.querySelector('[role=dialog]').getBoundingClientRect();
    const btns = [...ov.querySelectorAll('[role=dialog] button')].map(bt => { const r = bt.getBoundingClientRect(); return { t: bt.textContent.trim(), x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    return { boxes, card: { x: card.x, y: card.y, w: card.width, h: card.height }, btns, title: document.getElementById('tour-title').textContent };
  });
}
const rect = async (sel) => p.evaluate((sel) => { const r = document.querySelector(sel)?.getBoundingClientRect(); return r && { x: r.x, y: r.y, w: r.width, h: r.height }; }, sel);
for (let i = 0; i <= 22; i++) {
  if (i) { await p.keyboard.press('Enter'); await p.waitForTimeout(1800); }
  if (!KEEP.includes(i)) continue;
  const m = await measure(); m.extra = {};
  await hide(); await p.screenshot({ path: `bg-${i}.png` }); await show();
  await p.waitForTimeout(80);
  await p.locator('.fixed.inset-0.z-100 [role=dialog]').screenshot({ path: `card-${i}.png` });
  if (i === 6) {
    // accept the finding for real: before/after
    const btn = p.getByRole('button', { name: /Accept all/ }).first();
    const bb = await btn.boundingBox(); m.extra.accept = { x: bb.x + bb.width / 2, y: bb.y + bb.height / 2 };
    await btn.click(); await p.waitForTimeout(700); await p.mouse.move(700, 790); await p.waitForTimeout(300);
    await hide(); await p.screenshot({ path: `bg-6b.png` }); await show();
  }
  if (i === 7) {
    // the selection: its line box, then the screen without it
    m.extra.sel = await p.evaluate(() => { const s = getSelection(); if (!s.rangeCount) return null; const r = s.getRangeAt(0).getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
    m.extra.toolbar = await rect('[aria-label="Add finding"]');
    await hide();
    await p.evaluate(() => getSelection().removeAllRanges()); await p.waitForTimeout(400);
    await p.screenshot({ path: `bg-7a.png` }); await show();
    const w = m.extra.sel;
    // re-select by dragging, as a person would
    await p.mouse.move(w.x + 1, w.y + w.h / 2); await p.mouse.down(); await p.mouse.move(w.x + w.w - 1, w.y + w.h / 2, { steps: 8 }); await p.mouse.up();
    await p.waitForTimeout(500); await p.mouse.move(700, 790);
  }
  if (i === 21) {
    const inp = p.locator('[role=dialog][aria-label="Command palette"] input');
    const ib = await inp.boundingBox(); m.extra.input = { x: ib.x + 20, y: ib.y + ib.height / 2 };
    await inp.click(); await p.mouse.move(700, 790);
    const word = 'overlay'; m.extra.typed = [];
    for (let k = 1; k <= word.length; k++) {
      await p.keyboard.type(word[k - 1]); await p.waitForTimeout(250);
      await hide(); await p.screenshot({ path: `bg-21-${k}.png` }); await show(); m.extra.typed.push(k);
    }
    await p.keyboard.press('Backspace'); for (let k = 0; k < 8; k++) await p.keyboard.press('Backspace');
    await p.locator('.fixed.inset-0.z-100 [role=dialog]').focus();
  }
  meta[i] = m;
  console.log(i, m.title, JSON.stringify(m.boxes.map(b => [b.x, b.y, b.w, b.h].map(Math.round))));
}
fs.writeFileSync('meta.json', JSON.stringify(meta, null, 1));
await b.close();
