import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import Anthropic from '@anthropic-ai/sdk';
import { body, send } from './reviewApi';

/*
 * Dev-server endpoint for "Ask CLAIRE", the reviewer's assistant. It answers questions about how to use the
 * review screen and about the open case, with the case's own files as its source.
 *
 *   POST /api/assistant   { caseId, messages: [{ role, content }] }
 *                          200 text/plain, the answer streamed as it is written
 *                          503 { error } no Anthropic credentials · 400 bad body · 404 no such case
 *
 * Credentials come from the environment the dev server runs in (ANTHROPIC_API_KEY, or an `ant auth login` profile).
 */

const MODEL = 'claude-opus-5-5';

/** How the review screen works, so the assistant can answer "how do I…" questions the way the tour would. */
const GUIDE = `
CLAIRE Review is where a coder reviews E/M and ER downcode reconsiderations and appeals. The reviewer reads the
medical record, checks CLAIRE's AI findings against the claim, and decides whether the downcode is upheld or overturned.
The screen is built to keep the reviewer in the record: the document fills the screen and everything else comes to it.

Screen parts
- Header: case ID, review stage, received date; billed → paid level is the downcode under review. Spotlight (S) dims
  everything except marked evidence; Clean read (C) hides every mark. Notepad toggle (N). Tour (?). Command palette (⌘K / Ctrl+K).
- Patient strip: claim fields checked against the record. Green tick verified, amber ≠ mismatch, red ! invalid. Click a field to go to its page.
- Review progress: findings nobody has reviewed yet, counted per code. Click to go to the next one.
- The record: the scanned record as text in one scroll. Each finding is boxed where its evidence is, coloured by status:
  AI suggestion (not reviewed), Accepted, Added by the coder, Rejected.
- Evidence card: hover a box to see its finding, click to pin. Shows whether the code is on the claim, confidence, reasoning,
  the MDM element it supports, and every place the record documents the code. Accept (A) or reject (R) the code once and it
  covers every place; a single wrong place can be dropped, or another place tagged.
- Add what CLAIRE missed: select words in the record and pick Diagnosis, Service, MAR, Doc or Note from the toolbar or the
  right-click menu. A MAR row is always taken whole.
- Extraction flags: select words and choose ⚑ Flag to report formatting, wrong data or missed content in the extraction.
  For missing content, right-click the spot and choose "Flag missing content here". Capture from original attaches a
  screenshot of the scan. Flags are kept apart from the review (extraction.json) and never count toward the claim.
- Minimap: the strip on the right edge maps the whole record; click to jump.
- Original scan: Zoom (+ − 0). Three views (O cycles): reading (pages wait in the margin), side by side (scan scrolls
  with the record; right-click to jump across or unlink scrolling), overlay (scan over the text with a slider; ← → move it,
  hold Space to see the whole scan).
- Notepad: Findings (pages in view, or all), Claim (each claim line checked against the record), Interventions,
  Extraction. Drag it anywhere, drop on the right edge to dock (D), minimize to the Notes bubble (N).
- Full notes (F): every finding in one table with filters and comments; the claim against the record with the MDM score
  card; interventions and the path from findings through the rules to the result; extraction flags (PDF / JSON download).
- Complete review: closing comment; warns about unreviewed AI suggestions and unverified claim fields. Completed reviews
  are read-only until reopened. The back arrow returns to the worklist.
- Keyboard: J / K next / previous finding, A accept, R reject, ⌘Z / Ctrl+Z undo, Esc closes whatever is open.
- Ask CLAIRE (this assistant): open with the Ask button in the header or Q; select words in the record and choose Ask to
  ask about them.
`.trim();

const INSTRUCTIONS = `
You are CLAIRE, the assistant inside CLAIRE Review, helping a professional medical coder review one case.
Answer two kinds of question: how to use the review screen (use the guide), and questions about this case, its record,
the claim, CLAIRE's findings, and E/M / ED level coding (MDM: problems, data, risk). Base case answers on the case files
and the current review state below; when the record does not say something, say so rather than guessing.
Refer to record evidence by page as "page N" so the reviewer can jump to it. Quote the record's words exactly when you cite them.
The reviewer makes the decisions; you can say what the documentation supports and why, but do not claim to have changed anything.
Be brief and direct: a few sentences or a short list. Use plain Markdown (bold, lists, \`code\` for codes); no headings or tables.
All patient data in this app is synthetic.
`.trim();

interface Turn { role: 'user' | 'assistant'; content: string }

const read = (file: string) => fs.readFile(file, 'utf8').catch(() => '');

/** The case's files, as the assistant's reference. Stable for a case, so the prompt prefix caches across questions. */
async function caseContext(root: string, caseId: string) {
  const dir = path.join(root, 'src/data/cases', caseId);
  const ref = path.join(root, 'src/data/reference');
  const [kase, claim, findings, record, codes, mdm, interventions] = await Promise.all([
    read(path.join(dir, 'case.json')),
    read(path.join(dir, 'claim.json')),
    read(path.join(dir, 'findings.json')),
    read(path.join(dir, 'record.md')),
    read(path.join(ref, 'codes.json')),
    read(path.join(ref, 'mdm.json')),
    read(path.join(ref, 'interventions.json')),
  ]);
  return [
    `<case id="${caseId}">\n${kase}\n</case>`,
    `<claim>\n${claim}\n</claim>`,
    `<claire_findings note="CLAIRE's original findings; the current review state arrives with each question">\n${findings}\n</claire_findings>`,
    `<record note="pages start at <!-- Page: N --> markers; text before the first marker is page 1">\n${record}\n</record>`,
    `<reference_codes>\n${codes}\n</reference_codes>`,
    `<reference_mdm>\n${mdm}\n</reference_mdm>`,
    `<reference_intervention_rules>\n${interventions}\n</reference_intervention_rules>`,
  ].join('\n\n');
}

function valid(x: unknown): x is { caseId: string; messages: Turn[] } {
  const b = x as { caseId?: unknown; messages?: unknown };
  return (
    !!b && typeof b.caseId === 'string' && /^[A-Za-z0-9._-]+$/.test(b.caseId) && !b.caseId.startsWith('.') &&
    Array.isArray(b.messages) && b.messages.length > 0 && b.messages.length <= 80 &&
    b.messages.every((m: Turn) => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string' && m.content.length > 0) &&
    b.messages[0].role === 'user' && b.messages[b.messages.length - 1].role === 'user'
  );
}

export function assistantApi(): Plugin {
  let client: Anthropic | null = null;
  return {
    name: 'claire-assistant-api',
    configureServer(server) {
      const root = server.config.root;
      server.middlewares.use('/api/assistant', async (req, res, next) => {
        if ((req.url ?? '').split('?')[0].replace(/\/$/, '') !== '') return next();
        if (req.method !== 'POST') return send(res, 405);
        let input: unknown;
        try { input = JSON.parse(await body(req)); } catch { return send(res, 400, { error: 'body must be JSON' }); }
        if (!valid(input)) return send(res, 400, { error: 'expected { caseId, messages } starting and ending with a user turn' });
        try { await fs.access(path.join(root, 'src/data/cases', input.caseId, 'case.json')); } catch { return send(res, 404, { error: 'no such case' }); }

        try {
          client ??= new Anthropic();
        } catch {
          return send(res, 503, { error: 'Ask CLAIRE needs Anthropic credentials. Set ANTHROPIC_API_KEY and restart the dev server.' });
        }

        const abort = new AbortController();
        res.on('close', () => { if (!res.writableEnded) abort.abort(); });
        let started = false;
        try {
          const stream = client.beta.messages.stream(
            {
              model: MODEL,
              max_tokens: 16000,
              output_config: { effort: 'medium' },
              betas: ['server-side-fallback-2026-07-01'],
              fallbacks: 'default',
              system: [
                { type: 'text', text: `${INSTRUCTIONS}\n\n<guide>\n${GUIDE}\n</guide>` },
                { type: 'text', text: await caseContext(root, input.caseId), cache_control: { type: 'ephemeral' } },
              ],
              messages: input.messages,
            },
            { signal: abort.signal },
          );
          for await (const event of stream) {
            if (event.type !== 'content_block_delta' || event.delta.type !== 'text_delta') continue;
            if (!started) {
              started = true;
              res.statusCode = 200;
              res.setHeader('Content-Type', 'text/plain; charset=utf-8');
              res.setHeader('Cache-Control', 'no-cache');
            }
            res.write(event.delta.text);
          }
          const final = await stream.finalMessage();
          if (final.stop_reason === 'refusal' && !started) return send(res, 200, { error: 'CLAIRE could not answer that one. Try asking it another way.' });
          if (!started) return send(res, 502, { error: 'No answer came back. Try again.' });
          res.end();
        } catch (e) {
          if (abort.signal.aborted) return;
          const msg =
            e instanceof Anthropic.AuthenticationError || (e instanceof Error && /auth|api key|credential/i.test(e.message))
              ? 'Ask CLAIRE needs Anthropic credentials. Set ANTHROPIC_API_KEY and restart the dev server.'
              : e instanceof Anthropic.RateLimitError
                ? 'CLAIRE is busy right now. Try again in a moment.'
                : e instanceof Anthropic.APIError
                  ? `The assistant service returned an error (${e.status ?? 'network'}). Try again.`
                  : 'Could not reach the assistant service. Try again.';
          if (!started) return send(res, e instanceof Anthropic.AuthenticationError || msg.includes('credentials') ? 503 : 502, { error: msg });
          res.end(`\n\n_${msg}_`);
        }
      });
    },
  };
}
