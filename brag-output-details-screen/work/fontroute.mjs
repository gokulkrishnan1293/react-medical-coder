import fs from 'fs';
export async function routeFonts(ctx, dir) {
  await ctx.route('https://fonts.googleapis.com/**', r => r.fulfill({ contentType: 'text/css', body: fs.readFileSync(dir + '/fonts.css', 'utf8') }));
  await ctx.route('https://fonts.gstatic.com/**', r => {
    const f = dir + '/' + r.request().url().replace('https://fonts.gstatic.com/', '').replace(/\//g, '_');
    return fs.existsSync(f) ? r.fulfill({ contentType: 'font/woff2', body: fs.readFileSync(f), headers: { 'access-control-allow-origin': '*' } }) : r.abort();
  });
}
