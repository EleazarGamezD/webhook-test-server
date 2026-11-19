// node --test test.js
process.env.RATE_LIMIT_PER_MINUTE = '30';
const test = require('node:test');
const assert = require('node:assert');
const app = require('./server.js');

const A = 'a'.repeat(24);
const B = 'b'.repeat(24);

test('buzones aislados, respuestas, TTL y rate limit', async () => {
  const server = app.listen(0);
  const base = `http://localhost:${server.address().port}`;
  let sent = 0;
  const req = (path, body) => {
    sent++;
    return fetch(base + path, body === undefined ? undefined : {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
  };
  try {
    // id con formato inválido
    assert.strictEqual((await req('/api/webhook/receive/xyz', {})).status, 404);

    // modos fijos, por buzón
    assert.strictEqual((await req(`/api/inbox/${A}/set-response`, { mode: 'nope' })).status, 400);
    assert.strictEqual((await req(`/api/inbox/${A}/set-response`, { mode: 'invalid' })).status, 200);
    assert.strictEqual((await req(`/api/webhook/receive/${A}`, { hola: 1 })).status, 400);
    assert.strictEqual((await req(`/api/webhook/receive/${B}`, { hola: 2 })).status, 200);

    // cada buzón solo ve lo suyo
    const histA = await (await req(`/api/inbox/${A}/history`)).json();
    const histB = await (await req(`/api/inbox/${B}/history`)).json();
    assert.deepStrictEqual(histA.map(e => e.payload), [{ hola: 1 }]);
    assert.deepStrictEqual(histB.map(e => e.payload), [{ hola: 2 }]);

    // respuesta personalizada
    assert.strictEqual((await req(`/api/inbox/${B}/set-response`, { mode: 'custom', status: 299, body: {} })).status, 400);
    assert.strictEqual((await req(`/api/inbox/${B}/set-response`, { mode: 'custom', status: 422 })).status, 400);
    assert.strictEqual((await req(`/api/inbox/${B}/set-response`, { mode: 'custom', status: 422, body: { e: 'x' } })).status, 200);
    const custom = await req(`/api/webhook/receive/${B}`, {});
    assert.strictEqual(custom.status, 422);
    assert.deepStrictEqual(await custom.json(), { e: 'x' });
    assert.strictEqual((await req(`/api/inbox/${B}/set-response`, { mode: 'custom', status: 204 })).status, 200);
    assert.strictEqual((await req(`/api/webhook/receive/${B}`, {})).status, 204);
    const mode = await (await req(`/api/inbox/${B}/get-mode`)).json();
    assert.deepStrictEqual(mode, { mode: 'custom', custom: { status: 204, body: null } });

    // TTL: pasados 10 min se borra todo
    app.prune(Date.now() + 11 * 60 * 1000);
    assert.strictEqual(app.inboxes.size, 0);

    // rate limit: la petición número 31 del minuto da 429
    while (sent < 30) assert.strictEqual((await req(`/api/inbox/${A}/history`)).status, 200);
    assert.strictEqual((await req(`/api/inbox/${A}/history`)).status, 429);
  } finally {
    server.close();
  }
});
