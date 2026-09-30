import { chromium } from 'playwright';
import { routeFonts } from './fontroute.mjs';
import { memApi } from './memapi.mjs';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 810 }, ignoreHTTPSErrors: true });
await routeFonts(ctx, process.cwd() + '/fonts'); await memApi(ctx);
await ctx.addInitScript(() => { try { localStorage.setItem('claire-review.tour-seen', '1'); } catch {} });
const p = await ctx.newPage();
p.on('pageerror', e => console.log('ERR', e.message));
let n = 10; const shot = async (name) => { await p.waitForTimeout(600); await p.screenshot({ path: `probe/${String(n++)}-${name}.jpg`, type: 'jpeg', quality: 70 }); };
const words = (block, phrase) => p.evaluate(([block, phrase]) => {
  const el = [...document.querySelectorAll('[data-block]')].find(e => e.textContent.includes(block)); if (!el) return null;
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let nd;
  while ((nd = w.nextNode())) { const i = nd.data.indexOf(phrase); if (i >= 0) { const r = document.createRange(); r.setStart(nd, i); r.setEnd(nd, i + phrase.length); const rs = [...r.getClientRects()]; return rs.map(q => ({ x: q.x, y: q.y, w: q.width, h: q.height })); } }
  return null;
}, [block, phrase]);
const drag = async (rs) => { const a = rs[0], z = rs[rs.length - 1]; await p.mouse.move(a.x + 1, a.y + a.h / 2); await p.mouse.down(); await p.mouse.move(z.x + z.w - 1, z.y + z.h / 2, { steps: 10 }); await p.mouse.up(); };
const btns = () => p.evaluate(() => [...document.querySelectorAll('button')].filter(b => b.offsetParent && b.getBoundingClientRect().width).map(b => (b.getAttribute('aria-label') || b.textContent.trim()).slice(0, 30)).filter(Boolean).slice(-25));
await p.goto('http://localhost:5173/cases/RC-2026-1192', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
await p.keyboard.press('f'); await p.waitForTimeout(500);
await p.getByRole('button', { name: /^Service/ }).click();
const row = p.locator('tr', { hasText: 'Placed on continuous pulse oximetry' }).first();
await row.locator('td').nth(4).hover(); await p.waitForTimeout(300);
await row.getByRole('button', { name: 'Change evidence' }).click(); await p.waitForTimeout(1200);
const rs = await words('Placed on continuous pulse', 'continuous pulse oximetry and cardiac monitoring'); console.log('rects', JSON.stringify(rs));
await drag(rs); await shot('rebind-sel'); console.log(await btns());
