import { chromium } from 'playwright';
import fs from 'fs';
import { spawn } from 'child_process';
import { routeFonts } from './fontroute.mjs';
const FF = '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2';
const mode = process.argv[2];
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } });
await routeFonts(ctx, process.cwd() + '/fonts');
const p = await ctx.newPage();
await p.addInitScript(`window.META=${fs.readFileSync('meta.json', 'utf8')}`);
await p.goto('file://' + process.cwd() + '/comp.html');
await p.evaluate(() => window.ready());
if (mode === 'stills') {
  fs.mkdirSync('stills', { recursive: true });
  for (const t of process.argv.slice(3).map(Number)) {
    await p.evaluate(t => window.render(t), t);
    await p.screenshot({ path: `stills/t${t.toFixed(2)}.jpg`, quality: 85, type: 'jpeg' });
  }
} else {
  const END = await p.evaluate(() => window.END), FPS = 30, N = Math.round(END * FPS);
  fs.writeFileSync('clicks.json', JSON.stringify(await p.evaluate(() => window.CLICK_TIMES)));
  const ff = spawn(FF, ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', 'video.mp4'], { stdio: ['pipe', 'ignore', 'inherit'] });
  for (let f = 0; f < N; f++) {
    await p.evaluate(t => window.render(t), f / FPS);
    const buf = await p.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 60 === 0) console.log('frame', f, '/', N);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
}
await b.close();
