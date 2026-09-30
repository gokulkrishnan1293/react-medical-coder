// In-memory stand-in for the dev server's review/extraction API: every run starts fresh, edits carry across pages, nothing is written to disk.
export function memApi(ctx) {
  const store = {}; let rev = 0;
  return ctx.route('**/api/cases/**', async (r) => {
    const key = new URL(r.request().url()).pathname, m = r.request().method();
    if (m === 'GET') return store[key] ? r.fulfill({ status: 200, contentType: 'application/json', body: store[key] }) : r.fulfill({ status: 204, body: '' });
    if (m === 'PUT') { store[key] = r.request().postData(); return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ revision: ++rev, savedAt: new Date().toISOString() }) }); }
    if (m === 'DELETE') { delete store[key]; return r.fulfill({ status: 204, body: '' }); }
    return r.continue();
  });
}
