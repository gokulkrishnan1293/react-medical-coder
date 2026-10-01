export interface Turn { role: 'user' | 'assistant'; content: string }

/** The assistant service is not set up here: no credentials, no dev server, or a static build. */
export class Unavailable extends Error {}

/** Ask the assistant (server/assistantApi.ts). The answer arrives in pieces through onText; errors reject with a message to show. */
export async function askClaire(caseId: string, messages: Turn[], onText: (chunk: string) => void, signal: AbortSignal) {
  let res: Response;
  try {
    res = await fetch('/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId, messages }),
      signal,
    });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new Unavailable('Could not reach the assistant.');
  }
  // errors, and an answer the assistant would not give, come back as { error }
  // a static build answers with the app's page instead
  if (res.status === 503 || res.status === 404 || res.status === 405 || res.headers.get('Content-Type')?.includes('text/html')) throw new Unavailable(`The assistant is not set up (${res.status}).`);
  if (!res.ok || res.headers.get('Content-Type')?.includes('application/json')) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `The assistant is unavailable (${res.status}).`);
  }
  const reader = res.body?.getReader();
  if (!reader) throw new Error('No answer came back. Try again.');
  const dec = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = dec.decode(value, { stream: true });
    if (text) onText(text);
  }
}
