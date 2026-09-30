import { chromium } from 'playwright';
import { routeFonts } from './fontroute.mjs';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 1, ignoreHTTPSErrors: true });
await routeFonts(ctx, process.cwd() + '/fonts');
const p = await ctx.newPage();
p.on('pageerror', e => console.log('PAGEERR', e.message));
await p.goto('http://localhost:5173/cases/RC-2026-1192?tour', { waitUntil: 'networkidle' });
await p.waitForTimeout(2500);
await p.mouse.move(1439, 809);
for (let i = 0; i < 23; i++) {
  if (i) { await p.keyboard.press('Enter'); await p.waitForTimeout(1500); }
  const t = await p.evaluate(() => document.getElementById('tour-title')?.textContent);
  await p.screenshot({ path: `probe/s${String(i).padStart(2,'0')}.jpg`, quality: 70, type: 'jpeg' });
  console.log(i, t);
}
await b.close();
