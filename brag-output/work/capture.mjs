import { chromium } from 'playwright';
import fs from 'fs';
import { routeFonts } from './fontroute.mjs';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 2, ignoreHTTPSErrors: true });
await routeFonts(ctx, process.cwd() + '/fonts');
const p = await ctx.newPage();
await p.goto('http://localhost:5173/?tour', { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
console.log('font', await p.evaluate(() => [...document.fonts].filter(f=>f.status==='loaded').length));
await p.waitForTimeout(2500);
await p.mouse.move(1439, 809);
const meta = [];
for (let i = 0; i < 11; i++) {
  if (i) { await p.keyboard.press('ArrowRight'); await p.waitForTimeout(1400); }
  const m = await p.evaluate(() => {
    const ov = document.querySelector('.fixed.inset-0.z-100');
    const boxes = [...ov.querySelectorAll('svg path[stroke-width="2"]')].map(pth => { const r = pth.getBBox(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
    const card = ov.querySelector('[role=dialog]').getBoundingClientRect();
    const btns = [...ov.querySelectorAll('[role=dialog] button')].map(bt => { const r = bt.getBoundingClientRect(); return { t: bt.textContent.trim(), x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    return { boxes, card: { x: card.x, y: card.y, w: card.width, h: card.height }, btns, scrollY: window.scrollY, title: document.getElementById('tour-title').textContent };
  });
  await p.addStyleTag({ content: '.fixed.inset-0.z-100{visibility:hidden!important}', }).then(h => p.evaluate(el => el.id = 'hide', h));
  await p.screenshot({ path: `bg-${i}.png` });
  await p.evaluate(() => document.getElementById('hide').remove());
  await p.waitForTimeout(100);
  await p.locator('[role=dialog]').screenshot({ path: `card-${i}.png` });
  meta.push(m);
  console.log(i, m.title, JSON.stringify(m.boxes), m.scrollY);
}
fs.writeFileSync('meta.json', JSON.stringify(meta, null, 1));
await b.close();
