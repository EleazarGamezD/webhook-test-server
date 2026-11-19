// node --test test.js
process.env.RATE_LIMIT_PER_MINUTE = '12';
const test = require('node:test');
const assert = require('node:assert');
const app = require('./server.js');

const A = 'a'.repeat(24);
const B = 'b'.repeat(24);

test('buzones aislados, TTL y rate limit', async () => {
  const server = app.listen(0);
  const base = `http://localhost:${server.address().port}`;
  const post = (path, body) => fetch(base + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  try {
    // id con formato inválido
    assert.strictEqual((await post('/api/webhook/receive/xyz', {})).status, 404);

    // modo por buzón
    assert.strictEqual((await post(`/api/inbox/${A}/set-response`, { mode: 'nope' })).status, 400);
    assert.strictEqual((await post(`/api/inbox/${A}/set-response`, { mode: 'not-approved' })).status, 200);
    assert.strictEqual((await post(`/api/webhook/receive/${A}`, { hola: 1 })).status, 400);
    assert.strictEqual((await post(`/api/webhook/receive/${B}`, { hola: 2 })).status, 200);

    // cada buzón solo ve lo suyo
    const histA = await (await fetch(`${base}/api/inbox/${A}/history`)).json();
    const histB = await (await fetch(`${base}/api/inbox/${B}/history`)).json();
    assert.deepStrictEqual(histA.map(e => e.payload), [{ hola: 1 }]);
    assert.deepStrictEqual(histB.map(e => e.payload), [{ hola: 2 }]);

    // TTL: pasados 10 min se borra todo
    app.prune(Date.now() + 11 * 60 * 1000);
    assert.strictEqual(app.inboxes.size, 0);

    // rate limit: ya van 7 peticiones; la 13ª da 429
    const codes = [];
    for (let i = 0; i < 6; i++) codes.push((await fetch(`${base}/api/inbox/${A}/history`)).status);
    assert.deepStrictEqual(codes, [200, 200, 200, 200, 200, 429]);
  } finally {
    server.close();
  }
});
