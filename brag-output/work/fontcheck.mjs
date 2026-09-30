import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ ignoreHTTPSErrors: true });
const p = await ctx.newPage();
p.on('requestfailed', r => console.log('FAIL', r.url().slice(0,80), r.failure()?.errorText));
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
console.log(await p.evaluate(() => [document.fonts.check('16px "Public Sans"'), [...document.fonts].map(f=>f.family+':'+f.status).slice(0,5)]));
await b.close();
