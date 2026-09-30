// Captures every screen of the v2 video in one continuous session (edits carry forward; the API is in memory, nothing is saved).
import { chromium } from 'playwright';
import fs from 'fs';
import { routeFonts } from './fontroute.mjs';
import { memApi } from './memapi.mjs';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 2, ignoreHTTPSErrors: true });
await routeFonts(ctx, process.cwd() + '/fonts'); await memApi(ctx);
await ctx.addInitScript(() => { try { localStorage.setItem('claire-review.tour-seen', '1'); } catch {} });
const p = await ctx.newPage();
p.on('pageerror', e => console.log('PAGEERR', e.message));
const PARK = [760, 22];
const park = () => p.mouse.move(...PARK);
const meta = { steps: {}, pos: {} };
const hide = () => p.evaluate(() => { const s = document.createElement('style'); s.id = 'hide'; s.textContent = '.fixed.inset-0.z-100{visibility:hidden!important}'; document.head.append(s); });
const show = () => p.evaluate(() => document.getElementById('hide')?.remove());
const shot = async (name, wait = 450) => { await p.waitForTimeout(wait); await hide(); await p.screenshot({ path: `bg-${name}.png` }); await show(); console.log('shot', name); };
const box = async (loc) => { const r = await loc.boundingBox(); return r && { x: r.x, y: r.y, w: r.width, h: r.height }; };
const ctr = (r) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
const words = (block, phrase, scroll = true) => p.evaluate(([block, phrase, scroll]) => {
  const el = [...document.querySelectorAll('[data-block]')].find(e => e.textContent.includes(block)); if (!el) return null;
  if (scroll) el.scrollIntoView({ block: 'center' });
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let nd;
  while ((nd = w.nextNode())) { const i = nd.data.indexOf(phrase); if (i >= 0) { const r = document.createRange(); r.setStart(nd, i); r.setEnd(nd, i + phrase.length); return [...r.getClientRects()].map(q => ({ x: q.x, y: q.y, w: q.width, h: q.height })); } }
  return null;
}, [block, phrase, scroll]);
const union = (rs) => { const x0 = Math.min(...rs.map(r => r.x)), y0 = Math.min(...rs.map(r => r.y)); return { x: x0, y: y0, w: Math.max(...rs.map(r => r.x + r.w)) - x0, h: Math.max(...rs.map(r => r.y + r.h)) - y0 }; };
const drag = async (rs) => { const a = rs[0], z = rs[rs.length - 1]; await p.mouse.move(a.x + 1, a.y + a.h / 2); await p.mouse.down(); await p.mouse.move(z.x + z.w - 1, z.y + z.h / 2, { steps: 10 }); await p.mouse.up(); };
const tourMeta = () => p.evaluate(() => {
  const ov = document.querySelector('.fixed.inset-0.z-100');
  const boxes = [...ov.querySelectorAll('svg path[stroke-width="2"]')].map(pth => { const r = pth.getBBox(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  const card = ov.querySelector('[role=dialog]').getBoundingClientRect();
  const btns = [...ov.querySelectorAll('[role=dialog] button')].map(bt => { const r = bt.getBoundingClientRect(); return { t: bt.textContent.trim(), x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  return { boxes, card: { x: card.x, y: card.y, w: card.width, h: card.height }, btns, title: document.getElementById('tour-title').textContent };
});
async function tourStep(i) {
  const m = await tourMeta(); meta.steps[i] = m;
  await shot(String(i), 200);
  await p.waitForTimeout(80); await p.locator('.fixed.inset-0.z-100 [role=dialog]').screenshot({ path: `card-${i}.png` });
  console.log('step', i, m.title);
}
async function goTour(targets, handlers) {
  await p.goto('http://localhost:5173/cases/RC-2026-1192?tour', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(2500); await park();
  const last = Math.max(...targets);
  for (let i = 0; i <= last; i++) {
    if (i) { await p.keyboard.press('Enter'); await p.waitForTimeout(targets.includes(i) ? 1900 : 1100); }
    if (!targets.includes(i)) continue;
    await tourStep(i);
    if (handlers[i]) await handlers[i]();
  }
}

// ---------- pass 1: the tour, first half ----------
await goTour([0, 2, 4, 5, 6, 7], {
  6: async () => {
    const btn = p.getByRole('button', { name: /Accept all/ }).first();
    meta.pos.accept6 = ctr(await box(btn));
    await btn.click(); await park(); await shot('6b', 900);
  },
  7: async () => {
    meta.pos.sel7 = await p.evaluate(() => { const s = getSelection(); const r = s.getRangeAt(0).getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
    meta.pos.bar7 = await box(p.locator('[aria-label="Add finding"]'));
    await hide(); await p.evaluate(() => getSelection().removeAllRanges()); await p.waitForTimeout(400); await p.screenshot({ path: 'bg-7a.png' }); await show();
    const w = meta.pos.sel7;
    await p.mouse.move(w.x + 1, w.y + w.h / 2); await p.mouse.down(); await p.mouse.move(w.x + w.w - 1, w.y + w.h / 2, { steps: 8 }); await p.mouse.up(); await park();
  },
});
await p.keyboard.press('Escape'); await p.waitForTimeout(300); await p.keyboard.press('Escape');
await p.evaluate(() => getSelection().removeAllRanges()); await p.waitForTimeout(500);

// ---------- edit a finding, then accept it ----------
await park();
await p.keyboard.press('f'); await shot('e0', 700);
const chip = p.getByRole('button', { name: /^Service/ }); meta.pos.chipSvc = ctr(await box(chip));
await chip.click(); await park(); await shot('e1');
meta.pos.dialog = await box(p.locator('[role="dialog"][aria-label="Full notes"]'));
const row = p.locator('tr', { hasText: 'Placed on continuous pulse oximetry' }).first();
meta.pos.evCell = await box(row.locator('td').nth(4));
await row.locator('td').nth(4).hover();
const ch = row.getByRole('button', { name: 'Change evidence' }); meta.pos.change = ctr(await box(ch));
await shot('e2');
await ch.click(); await p.mouse.move(700, 790); await p.waitForTimeout(1300); await park(); await shot('e3');
meta.pos.banner = await box(p.getByText('Select the new evidence').locator('..'));
const newW = await words('Placed on continuous pulse', 'cardiac monitoring', false);
meta.pos.oldEv = union(await words('Placed on continuous pulse', 'Placed on continuous pulse oximetry and cardiac monitoring', false));
meta.pos.selE = union(newW);
await drag(newW); await p.mouse.move(700, 250, { steps: 3 }); await park();
const use = p.getByRole('button', { name: /Use as evidence/ }); meta.pos.useBar = await box(use.locator('..')); meta.pos.use = ctr(await box(use));
await shot('e4');
await use.click(); await park(); await shot('e5', 900);
const nb = union(await words('Placed on continuous pulse', 'cardiac monitoring', false)); meta.pos.newEv = nb;
await p.mouse.click(nb.x + 24, nb.y + nb.h / 2); await park(); await shot('e6', 700);
const ta = p.getByRole('textbox', { name: /Comment on/ }).last(); meta.pos.comment = ctr(await box(ta));
meta.pos.card6 = await box(p.locator('[aria-label="Finding details"]').last());
await ta.click(); await park();
const note = 'Evidence narrowed to the monitoring itself.';
meta.typedE = [];
for (const k of [8, 17, 27, note.length]) { await ta.fill(note.slice(0, k)); await shot('e7-' + k, 150); meta.typedE.push(k); }
const acc = p.getByRole('button', { name: /^Accept/ }).last(); meta.pos.acceptE = ctr(await box(acc));
await acc.click(); await park(); await shot('e8', 800);
await p.keyboard.press('Escape'); await p.waitForTimeout(400);

// ---------- flag an extraction problem, with a capture from the original ----------
let v = await words('ESI 2', 'Peak flow 38% predicted'); await p.waitForTimeout(600); v = await words('ESI 2', 'Peak flow 38% predicted', false);
await park(); await shot('x0', 500);
meta.pos.selX = union(v);
await drag(v); await park();
const flag = p.getByRole('button', { name: /^.?\s*Flag$/ }).last(); meta.pos.barX = await box(flag.locator('..')); meta.pos.flag = ctr(await box(flag));
await shot('x1');
await flag.click(); await park(); await shot('x2', 600);
meta.pos.composer = await box(p.locator('[role="dialog"][aria-label="Flag an extraction problem"]'));
const fmt = p.getByRole('radio', { name: 'Formatting' }).or(p.getByRole('button', { name: 'Formatting' })).first(); meta.pos.fmt = ctr(await box(fmt));
await fmt.click(); await park(); await shot('x3');
const cap = p.getByRole('button', { name: /Capture from original/ }); meta.pos.capture = ctr(await box(cap));
await cap.click(); await park(); await shot('x4', 900);
// drag a box around the triage line on the scan
const scan = await p.evaluate(() => { const el = [...document.querySelectorAll('[aria-label="Capture from the original"] *')].find(e => e.children.length === 0 && /Peak flow 38%/.test(e.textContent)); const r = el?.getBoundingClientRect(); return r && { x: r.x, y: r.y, w: r.width, h: r.height }; });
console.log('scan text', JSON.stringify(scan));
const A0 = { x: 258, y: 186 }, A1 = { x: 1146, y: 242 };
meta.pos.capBox = { x: A0.x, y: A0.y, w: A1.x - A0.x, h: A1.y - A0.y };
await p.mouse.move(A0.x, A0.y); await p.mouse.down(); await p.mouse.move(A1.x, A1.y, { steps: 12 }); await p.mouse.up();
await p.mouse.move(A1.x + 40, A1.y + 120); await shot('x5');
const useCap = p.getByRole('button', { name: /Use capture/ }); meta.pos.useCap = ctr(await box(useCap));
await useCap.click(); await park(); await shot('x6', 900);
meta.pos.composer2 = await box(p.locator('[role="dialog"][aria-label="Flag an extraction problem"]'));
const fit = p.getByRole('button', { name: 'Flag it' }); meta.pos.flagIt = ctr(await box(fit));
await fit.click(); await park(); await shot('x7', 1000);

// ---------- pass 2: the tour, second half ----------
await goTour([10, 14, 15, 16, 18, 19, 20, 21, 22], {
  18: async () => {
    const mar = p.getByRole('button', { name: /^MAR/ }); meta.pos.chipMar = ctr(await box(mar));
    await mar.click(); await park(); await shot('18m');
    const r = p.locator('tr', { hasText: 'Magnesium sulfate' }).first();
    const ok = r.getByRole('button', { name: 'Accept' }); meta.pos.rowAccept = ctr(await box(ok)); meta.pos.rowMag = await box(r);
    await ok.click(); await park(); await shot('18a', 700);
    await p.locator('.fixed.inset-0.z-100 [role=dialog]').focus();
  },
  21: async () => {
    const inp = p.locator('[role=dialog][aria-label="Command palette"] input');
    await inp.click(); await park(); meta.typedP = [];
    const word = 'overlay';
    for (let k = 1; k <= word.length; k++) { await p.keyboard.type(word[k - 1]); await shot('21-' + k, 220); meta.typedP.push(k); }
    for (let k = 0; k < 9; k++) await p.keyboard.press('Backspace');
    await p.locator('.fixed.inset-0.z-100 [role=dialog]').focus();
  },
});
fs.writeFileSync('meta.json', JSON.stringify(meta, null, 1));
await b.close();
