const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3005;
// URL pública (ngrok, dominio propio...). En Vercel se toma sola del dominio de producción.
// Si no hay ninguna, el front usa el origen desde el que se abre la página.
const PUBLIC_URL = (process.env.PUBLIC_URL
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
  || '').replace(/\/+$/, '');

const TTL_MS = (Number(process.env.WEBHOOK_TTL_MINUTES) || 10) * 60 * 1000;
const RATE_LIMIT = Number(process.env.RATE_LIMIT_PER_MINUTE) || 120; // peticiones /api por IP y minuto
const MAX_ENTRIES = 20;   // entregas guardadas por buzón
const MAX_INBOXES = 1000; // tope de memoria
const INBOX_RE = /^[a-f0-9]{16,64}$/;

const RESPONSES = {
  'valid': { status: 200, body: { success: true, message: 'Webhook recibido' } },
  'invalid': { status: 400, body: { error: { message: 'Invalid payload' } } },
};
const CUSTOM_STATUSES = [200, 201, 202, 204, 400, 401, 403, 404, 409, 422, 429, 500, 502, 503];
const MAX_CUSTOM_BODY = 10_000; // caracteres del JSON personalizado

// Buzones en memoria: id -> { mode, history, touched }
const inboxes = new Map();

function prune(now = Date.now()) {
  for (const [id, box] of inboxes) {
    box.history = box.history.filter(e => now - e.receivedAt < TTL_MS);
    if (now - box.touched >= TTL_MS && box.history.length === 0) inboxes.delete(id);
  }
}

function getInbox(id) {
  let box = inboxes.get(id);
  if (!box) {
    if (inboxes.size >= MAX_INBOXES) {
      // Desaloja el buzón con menos actividad reciente
      const [oldest] = [...inboxes].sort((a, b) => a[1].touched - b[1].touched)[0];
      inboxes.delete(oldest);
    }
    box = { mode: 'valid', custom: { status: 200, body: { ok: true } }, history: [], touched: Date.now() };
    inboxes.set(id, box);
  }
  box.touched = Date.now();
  return box;
}

function addEntry(box, entry) {
  box.history.unshift(entry);
  box.history.length = Math.min(box.history.length, MAX_ENTRIES);
}

// shortcut: límite en memoria, en Vercel es por instancia; para protección real añade una regla de rate limit en el Firewall de Vercel
const hits = new Map();
function rateLimit(req, res, next) {
  const now = Date.now();
  const key = req.ip;
  let h = hits.get(key);
  if (!h || now >= h.reset) {
    h = { count: 0, reset: now + 60_000 };
    hits.set(key, h);
  }
  if (++h.count > RATE_LIMIT) {
    res.set('Retry-After', String(Math.ceil((h.reset - now) / 1000)));
    return res.status(429).json({ error: { message: 'Too many requests' } });
  }
  next();
}

setInterval(() => {
  prune();
  const now = Date.now();
  for (const [k, h] of hits) if (now >= h.reset) hits.delete(k);
}, 60_000).unref();

// Detrás de Vercel/ngrok la IP real viene en X-Forwarded-For (un salto)
app.set('trust proxy', 1);
app.use('/api', rateLimit);
app.use(express.json({ limit: '100kb' }));

// Frontend (en Vercel, public/ lo sirve directamente la CDN)
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/config', (req, res) => {
  res.json({ publicUrl: PUBLIC_URL || null, ttlMinutes: TTL_MS / 60000 });
});

// Valida el id de buzón en todas las rutas que lo usan
app.param('inbox', (req, res, next, id) => {
  if (!INBOX_RE.test(id)) return res.status(404).json({ error: { message: 'Not Found' } });
  next();
});

// 1. Recibir webhooks
app.post('/api/webhook/receive/:inbox', (req, res) => {
  const box = getInbox(req.params.inbox);
  const { status, body } = box.mode === 'custom' ? box.custom : RESPONSES[box.mode];
  addEntry(box, {
    id: Date.now() + Math.random(),
    receivedAt: Date.now(),
    timestamp: new Date().toISOString(),
    payload: req.body,
    headers: req.headers,
    isValid: status < 400,
    responseStatus: status,
    responseBody: status === 204 ? null : body,
  });
  console.log(`Webhook en ${req.params.inbox.slice(0, 6)}… -> ${status}`);
  if (status === 204) return res.status(204).end();
  res.status(status).json(body);
});

// 2. Validar JSON
app.post('/api/webhook/validate', (req, res) => {
  const payload = req.body;
  if (!payload || Object.keys(payload).length === 0) {
    return res.status(400).json({ valid: false, message: 'Payload inválido: vacío o ausente' });
  }
  res.status(200).json({ valid: true, message: 'Payload válido' });
});

// 3. Historial del buzón (solo entregas dentro del TTL)
app.get('/api/inbox/:inbox/history', (req, res) => {
  const box = inboxes.get(req.params.inbox);
  if (!box) return res.json([]);
  box.touched = Date.now();
  const now = Date.now();
  box.history = box.history.filter(e => now - e.receivedAt < TTL_MS);
  res.json(box.history);
});

// 4. Vaciar historial
app.post('/api/inbox/:inbox/clear', (req, res) => {
  getInbox(req.params.inbox).history = [];
  res.json({ success: true, message: 'Historial borrado' });
});

// 5. Cambiar qué responde el buzón: 'valid', 'invalid' o 'custom' con { status, body }
app.post('/api/inbox/:inbox/set-response', (req, res) => {
  const { mode, status, body } = req.body || {};
  if (mode !== 'custom' && !RESPONSES[mode]) return res.status(400).json({ error: { message: 'Invalid mode' } });
  if (mode === 'custom') {
    if (!CUSTOM_STATUSES.includes(status)) return res.status(400).json({ error: { message: 'Invalid status' } });
    if (status !== 204 && body === undefined) return res.status(400).json({ error: { message: 'Missing body' } });
    if (JSON.stringify(body ?? null).length > MAX_CUSTOM_BODY) return res.status(400).json({ error: { message: 'Body too large' } });
  }
  const box = getInbox(req.params.inbox);
  box.mode = mode;
  if (mode === 'custom') box.custom = { status, body: body ?? null };
  res.json({ success: true, mode });
});

// 6. Modo actual (y la respuesta personalizada guardada)
app.get('/api/inbox/:inbox/get-mode', (req, res) => {
  const box = inboxes.get(req.params.inbox);
  res.json(box ? { mode: box.mode, custom: box.custom } : { mode: 'valid', custom: { status: 200, body: { ok: true } } });
});

// Iniciar el servidor solo si se ejecuta directamente (en Vercel se exporta la app)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor webhook escuchando en el puerto ${PORT}`);
    console.log(`Abre ${PUBLIC_URL || `http://localhost:${PORT}`} para obtener tu dirección de webhook`);
  });
}

module.exports = app;
module.exports.prune = prune;
module.exports.inboxes = inboxes;
