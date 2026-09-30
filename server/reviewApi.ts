import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

/*
 * Dev-server stand-in for the review API (docs/DATA-SPEC.md §4.3). Saves the reviewer's work next to the
 * case's own files, as src/data/cases/<id>/review.json. CLAIRE's files are never written.
 *
 *   GET    /api/cases/:id/review   200 the saved review · 204 none yet · 404 no such case
 *   PUT    /api/cases/:id/review   200 { revision, savedAt } · 400 bad body
 *   DELETE /api/cases/:id/review   204 (reset: back to CLAIRE's findings)
 */

const MAX_BODY = 5 * 1024 * 1024;

function body(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY) { reject(new Error('too large')); req.destroy(); } else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const send = (res: ServerResponse, status: number, json?: unknown) => {
  res.statusCode = status;
  if (json === undefined) return res.end();
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(json));
};

export function reviewApi(): Plugin {
  return {
    name: 'claire-review-api',
    configureServer(server) {
      const root = path.resolve(server.config.root, 'src/data/cases');
      server.middlewares.use('/api/cases', async (req, res, next) => {
        const m = /^\/([A-Za-z0-9._-]+)\/review\/?$/.exec((req.url ?? '').split('?')[0]);
        if (!m || m[1].startsWith('.')) return next();
        const dir = path.join(root, m[1]);
        try { await fs.access(path.join(dir, 'case.json')); } catch { return send(res, 404, { error: 'no such case' }); }
        const file = path.join(dir, 'review.json');
        try {
          if (req.method === 'GET') {
            const text = await fs.readFile(file, 'utf8').catch(() => null);
            return text ? send(res, 200, JSON.parse(text)) : send(res, 204);
          }
          if (req.method === 'PUT') {
            let next: Record<string, unknown>;
            try { next = JSON.parse(await body(req)); } catch { return send(res, 400, { error: 'body must be JSON' }); }
            if (!next || typeof next !== 'object' || next.caseId !== m[1]) return send(res, 400, { error: 'caseId must match the case' });
            const prev = JSON.parse((await fs.readFile(file, 'utf8').catch(() => null)) ?? '{}');
            const saved = { ...next, revision: (Number(prev.revision) || 0) + 1, savedAt: new Date().toISOString() };
            await fs.writeFile(file + '.tmp', JSON.stringify(saved, null, 2) + '\n');
            await fs.rename(file + '.tmp', file);
            return send(res, 200, { revision: saved.revision, savedAt: saved.savedAt });
          }
          if (req.method === 'DELETE') {
            await fs.rm(file, { force: true });
            return send(res, 204);
          }
          return send(res, 405);
        } catch (e) {
          return send(res, 500, { error: String(e) });
        }
      });
    },
  };
}
