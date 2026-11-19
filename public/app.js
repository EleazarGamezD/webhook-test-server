// Lógica del cliente para el webhook test server.
// Todo el contenido recibido se pinta con textContent: los payloads vienen de terceros.

const $ = (id) => document.getElementById(id);
const SIGNATURE_RE = /sign|hmac|svix|webhook-id|webhook-timestamp|x-hub|digest|^authorization$/i;

// ---------- i18n ----------
const I18N = {
    es: {
        title: 'Buzón de webhooks', language: 'Idioma', connecting: 'Conectando…',
        address: 'Dirección de entrega', clickToCopy: 'Clic para copiar', copyUrl: 'Copiar URL',
        hint1: 'Envía un', hint2: 'con cuerpo JSON. Esta dirección es solo tuya: cada entrega aparece abajo y se borra a los {ttl} minutos.',
        modesLegend: 'Qué responde el endpoint',
        'mode.valid': 'Éxito', 'mode.404': 'No encontrado', 'mode.not-user': 'No es usuario de WhatsApp',
        'mode.not-approved': 'Plantilla no aprobada', 'mode.not-opted': 'Teléfono sin opt-in',
        deliveries: 'Entregas', forceInvalid: 'Simular entrega inválida', clear: 'Vaciar',
        emptyTitle: 'Todavía no ha llegado nada',
        emptyBody: 'Configura tu sistema con la dirección de arriba o usa la prueba rápida.', tryIt: 'Prueba rápida',
        copy: 'Copiar', copied: 'Copiado', copyAll: 'Copiar todos', copyX: 'Copiar {x}',
        copyFail: 'No se pudo copiar. Selecciona el texto y usa Ctrl+C.',
        listening: 'Escuchando · ', count1: '1 entrega', countN: '{n} entregas',
        offline: 'Sin conexión con el servidor',
        modeNow: 'Ahora responde: {x}', modeFail: 'No se pudo cambiar la respuesta',
        cleared: 'Historial vaciado', clearFail: 'No se pudo vaciar el historial',
        invalidFail: 'No se pudo registrar la entrega inválida',
        invalidSimulated: 'Entrega inválida simulada', invalidTag: 'INVÁLIDO', invalidShort: 'INVÁL.',
        noBody: '(sin cuerpo)', noResponse: '(no se envió respuesta)', responseSent: 'Respuesta enviada',
        signature: 'Firma: {x}', noSignature: 'Sin firma detectada',
        pmLabel: 'Recibido {d} {t}', pmStatus: ', respondió {s}', pmInvalid: ', inválido',
        curlData: 'hola',
    },
    en: {
        title: 'Webhook inbox', language: 'Language', connecting: 'Connecting…',
        address: 'Delivery address', clickToCopy: 'Click to copy', copyUrl: 'Copy URL',
        hint1: 'Send a', hint2: 'with a JSON body. This address is yours alone: each delivery shows up below and is deleted after {ttl} minutes.',
        modesLegend: 'What the endpoint responds',
        'mode.valid': 'Success', 'mode.404': 'Not Found', 'mode.not-user': 'Not a WhatsApp user',
        'mode.not-approved': 'Template not approved', 'mode.not-opted': 'Phone not opted in',
        deliveries: 'Deliveries', forceInvalid: 'Simulate invalid delivery', clear: 'Clear',
        emptyTitle: 'Nothing has arrived yet',
        emptyBody: 'Point your system at the address above or use the quick test.', tryIt: 'Quick test',
        copy: 'Copy', copied: 'Copied', copyAll: 'Copy all', copyX: 'Copy {x}',
        copyFail: 'Could not copy. Select the text and press Ctrl+C.',
        listening: 'Listening · ', count1: '1 delivery', countN: '{n} deliveries',
        offline: 'No connection to the server',
        modeNow: 'Now responding: {x}', modeFail: 'Could not change the response',
        cleared: 'History cleared', clearFail: 'Could not clear the history',
        invalidFail: 'Could not record the invalid delivery',
        invalidSimulated: 'Simulated invalid delivery', invalidTag: 'INVALID', invalidShort: 'INVAL.',
        noBody: '(empty body)', noResponse: '(no response sent)', responseSent: 'Response sent',
        signature: 'Signature: {x}', noSignature: 'No signature detected',
        pmLabel: 'Received {d} {t}', pmStatus: ', responded {s}', pmInvalid: ', invalid',
        curlData: 'hello',
    },
};
const LANG_KEY = 'webhook-inbox-lang';
let lang = (() => {
    try { const saved = localStorage.getItem(LANG_KEY); if (I18N[saved]) return saved; } catch { }
    return (navigator.language || '').toLowerCase().startsWith('es') ? 'es' : 'en';
})();

function t(key, vars = {}) {
    const str = I18N[lang][key] ?? I18N.es[key] ?? key;
    const all = { ttl: ttlMinutes, ...vars };
    return str.replace(/\{(\w+)\}/g, (_, k) => all[k] ?? '');
}

function applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(n => { n.textContent = t(n.dataset.i18n); });
    document.querySelectorAll('[data-i18n-title]').forEach(n => { n.title = t(n.dataset.i18nTitle); });
    document.querySelectorAll('[data-i18n-aria]').forEach(n => n.setAttribute('aria-label', t(n.dataset.i18nAria)));
    document.querySelectorAll('[data-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
}

function setLang(next) {
    if (!I18N[next] || next === lang) return;
    lang = next;
    try { localStorage.setItem(LANG_KEY, lang); } catch { }
    applyLang();
    setWebhookUrl(webhookUrl);
    if (lastList) {
        setStatus(true, lastList.length);
        renderedKey = null;
        render(lastList, false);
    }
}

// Buzón privado: id aleatorio guardado en este navegador
const INBOX = (() => {
    const KEY = 'webhook-inbox-id';
    try { const saved = localStorage.getItem(KEY); if (/^[a-f0-9]{16,64}$/.test(saved)) return saved; } catch { }
    const id = [...crypto.getRandomValues(new Uint8Array(12))].map(b => b.toString(16).padStart(2, '0')).join('');
    try { localStorage.setItem(KEY, id); } catch { }
    return id;
})();
const API = `/api/inbox/${INBOX}`;
let ttlMinutes = 10;
let webhookUrl = `${location.origin}/api/webhook/receive/${INBOX}`;
let renderedKey = null;
let knownIds = null;
let lastList = null;
const openIds = new Set();
const openHeaderIds = new Set();

document.addEventListener('DOMContentLoaded', () => {
    applyLang();
    document.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
    setWebhookUrl(webhookUrl);
    fetch('/api/config').then(r => r.json()).then(({ publicUrl, ttlMinutes: ttl }) => {
        if (ttl) { ttlMinutes = ttl; applyLang(); }
        if (publicUrl) setWebhookUrl(`${publicUrl}/api/webhook/receive/${INBOX}`);
    }).catch(() => { });

    $('copy-url').addEventListener('click', () => copyUrl());
    $('webhook-url').addEventListener('click', () => copyUrl());
    $('copy-curl').addEventListener('click', (e) => copyText($('curl-example').textContent, e.currentTarget));
    $('clear-log').addEventListener('click', clearHistory);
    $('force-invalid').addEventListener('click', forceInvalid);
    $('mode-form').addEventListener('change', (e) => setMode(e.target.value));

    fetchMode();
    fetchHistory();
    setInterval(fetchHistory, 2000);
});

function setWebhookUrl(url) {
    webhookUrl = url;
    $('webhook-url').value = url;
    $('curl-example').textContent =
        `curl -X POST "${url}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"event":"test","data":"${t('curlData')}"}'`;
}

function copyUrl() {
    $('webhook-url').select();
    copyText(webhookUrl, $('copy-url'));
}

// navigator.clipboard solo existe en https/localhost; si no, cae a execCommand
async function copyText(text, button) {
    try {
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(text);
        } else {
            const ta = Object.assign(document.createElement('textarea'), { value: text });
            document.body.appendChild(ta);
            ta.select();
            const ok = document.execCommand('copy');
            ta.remove();
            if (!ok) throw new Error('copy failed');
        }
        flashDone(button);
    } catch (err) {
        console.error('No se pudo copiar:', err);
        toast(t('copyFail'));
    }
}

function flashDone(button) {
    if (!button) return;
    const label = button.querySelector('span');
    const original = label ? label.textContent : null;
    button.classList.add('is-done');
    if (label) label.textContent = t('copied');
    setTimeout(() => {
        button.classList.remove('is-done');
        if (label) label.textContent = original;
    }, 1500);
}

let toastTimer;
function toast(message) {
    const el = $('toast');
    el.textContent = message;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-on'), 2600);
}

function setStatus(ok, count) {
    $('status').classList.toggle('is-down', !ok);
    $('status-text').innerHTML = '';
    if (!ok) {
        $('status-text').textContent = t('offline');
        return;
    }
    const strong = document.createElement('strong');
    strong.textContent = count === 1 ? t('count1') : t('countN', { n: count });
    $('status-text').append(t('listening'), strong);
}

async function fetchMode() {
    try {
        const r = await fetch(`${API}/get-mode`);
        const { mode } = await r.json();
        const input = document.querySelector(`input[name="mode"][value="${CSS.escape(mode)}"]`);
        if (input) input.checked = true;
    } catch (err) {
        console.error('No se pudo leer el modo:', err);
    }
}

async function setMode(mode) {
    try {
        const r = await fetch(`${API}/set-response`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode }),
        });
        if (!r.ok) throw new Error(r.status);
        toast(t('modeNow', { x: `${t(`mode.${mode}`)} (${mode === 'valid' ? 200 : 400})` }));
    } catch (err) {
        toast(t('modeFail'));
        fetchMode();
    }
}

async function fetchHistory() {
    try {
        const r = await fetch(`${API}/history`);
        if (r.status === 429) return; // límite de peticiones: se reintenta en el siguiente ciclo
        if (!r.ok) throw new Error(r.status);
        const list = await r.json();
        lastList = list;
        setStatus(true, list.length);
        render(list);
    } catch (err) {
        setStatus(false);
    }
}

async function clearHistory() {
    try {
        await fetch(`${API}/clear`, { method: 'POST' });
        openIds.clear();
        openHeaderIds.clear();
        await fetchHistory();
        toast(t('cleared'));
    } catch (err) {
        toast(t('clearFail'));
    }
}

async function forceInvalid() {
    try {
        await fetch(`${API}/force-invalid`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Invalid payload format', received: 'partial data', timestamp: new Date().toISOString() }),
        });
        fetchHistory();
    } catch (err) {
        toast(t('invalidFail'));
    }
}

// ---------- Render ----------

function render(list, animate = true) {
    // Solo repinta cuando cambia la lista, para no cerrar lo que el usuario tiene abierto
    const key = list.map(e => e.id).join(',');
    if (key === renderedKey) return;
    renderedKey = key;

    const prev = animate ? knownIds : null;
    knownIds = new Set(list.map(e => e.id));

    $('log-count').textContent = list.length;
    $('empty-state').hidden = list.length > 0;
    const ul = $('log-entries');
    ul.replaceChildren(...list.map(entry => renderEntry(entry, prev && !prev.has(entry.id))));
}

function el(tag, props = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k.startsWith('data-') || k.startsWith('aria-')) node.setAttribute(k, v);
        else node[k] = v;
    }
    node.append(...children.filter(Boolean));
    return node;
}

function icon(name) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'icon');
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `#i-${name}`);
    svg.append(use);
    return svg;
}

function copyButton(getText, label = t('copy')) {
    const b = el('button', { type: 'button', class: 'btn btn-quiet' }, icon('copy'), el('span', { text: label }));
    b.addEventListener('click', (e) => {
        e.preventDefault();
        copyText(getText(), b);
    });
    return b;
}

function pretty(value) {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') {
        try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; }
    }
    return JSON.stringify(value, null, 2);
}

function renderEntry(entry, isNew) {
    const ok = entry.isValid && (!entry.responseStatus || entry.responseStatus < 400);
    const status = entry.responseStatus || null;
    const message = entry.responseBody
        ? (entry.responseBody.message || entry.responseBody.error?.message || '')
        : t('invalidSimulated');
    const payloadText = pretty(entry.payload);
    const compact = (() => { try { return JSON.stringify(entry.payload); } catch { return String(entry.payload); } })();
    const bytes = new Blob([compact || '']).size;
    const headers = Object.entries(entry.headers || {});
    const signatures = headers.filter(([k]) => SIGNATURE_RE.test(k));

    const details = el('details', { class: `entry${isNew ? ' is-new' : ''}`, open: openIds.has(entry.id) });
    if (ok) details.dataset.ok = '';
    details.addEventListener('toggle', () => details.open ? openIds.add(entry.id) : openIds.delete(entry.id));

    const summary = el('summary', {},
        postmark(entry, status),
        el('div', { class: 'meta' },
            el('div', { class: 'line1' },
                el('span', { class: 'tag', text: status ? String(status) : t('invalidTag') }),
                el('span', { class: 'msg', text: message || (ok ? 'OK' : 'Error') }),
            ),
            el('div', { class: 'preview', text: compact || t('noBody') }),
        ),
        el('div', { class: 'side' },
            el('span', { class: 'size', text: formatBytes(bytes) }),
            el('time', { class: 'time', dateTime: entry.timestamp, text: new Date(entry.timestamp).toLocaleTimeString(lang, { hour12: false }) }),
            icon('chev'),
        ),
    );
    summary.querySelector('.side .icon').classList.add('chev');

    const payloadBlock = el('div', { class: 'block' },
        el('h3', {}, el('span', { text: 'Payload' }), copyButton(() => payloadText)),
        el('pre', { text: payloadText || t('noBody') }),
    );

    const responseText = entry.responseBody ? pretty(entry.responseBody) : t('noResponse');
    const responseBlock = el('div', { class: 'block' },
        el('h3', {}, el('span', { text: status ? `${t('responseSent')} · ${status}` : t('responseSent') }), copyButton(() => responseText)),
        el('pre', { text: responseText }),
    );

    const detail = el('div', { class: 'detail' }, payloadBlock, responseBlock);
    if (headers.length) detail.append(renderHeaders(entry.id, headers, signatures));

    details.append(summary, detail);
    return el('li', {}, details);
}

function renderHeaders(id, headers, signatures) {
    // Firmas primero: es lo que normalmente se necesita copiar para validar
    const sorted = [...signatures, ...headers.filter(h => !signatures.includes(h))];
    const asText = sorted.map(([k, v]) => `${k}: ${v}`).join('\n');

    const box = el('details', { class: 'headers', open: openHeaderIds.has(id) });
    box.addEventListener('toggle', () => box.open ? openHeaderIds.add(id) : openHeaderIds.delete(id));

    const summary = el('summary', {},
        icon('chev'),
        el('span', { class: 'h-title', text: `Headers (${headers.length})` }),
        signatures.length
            ? el('span', { class: 'sig-hint', text: t('signature', { x: signatures.map(([k]) => k).join(', ') }) })
            : el('span', { class: 'h-sub', text: t('noSignature') }),
    );

    const table = el('dl', { class: 'h-list' });
    for (const [k, v] of sorted) {
        const value = Array.isArray(v) ? v.join(', ') : String(v);
        const row = el('div', { class: `h-row${signatures.some(([s]) => s === k) ? ' is-sig' : ''}` },
            el('dt', { text: k }),
            el('dd', { text: value }),
            copyButton(() => value),
        );
        row.querySelector('button').setAttribute('aria-label', t('copyX', { x: k }));
        table.append(row);
    }

    const tools = el('div', { class: 'h-tools' }, copyButton(() => asText, t('copyAll')));
    box.append(summary, el('div', { class: 'h-body' }, tools, table));
    return box;
}

function formatBytes(n) {
    return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`;
}

function postmark(entry, status) {
    const d = new Date(entry.timestamp);
    // Formato fijo DD MMM AAAA en ambos idiomas para que quepa en el anillo
    const month = d.toLocaleDateString(lang, { month: 'short' }).replace(/\./g, '').slice(0, 3).toUpperCase();
    const date = `${String(d.getDate()).padStart(2, '0')} ${month} ${d.getFullYear()}`;
    const time = d.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const rot = ((entry.id % 17) - 10); // giro estable por entrega, como un sello a mano
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'postmark');
    svg.setAttribute('viewBox', '0 0 112 74');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', t('pmLabel', { d: date, t: time }) + (status ? t('pmStatus', { s: status }) : t('pmInvalid')));
    const top = `pm-t-${entry.id}`;
    const bot = `pm-b-${entry.id}`;
    // Solo valores generados aquí (fecha, hora, número), nunca datos del remitente
    svg.innerHTML = `
      <g transform="rotate(${rot} 37 37)" fill="none" stroke="currentColor">
        <circle cx="37" cy="37" r="33" stroke-width="2.4"/>
        <circle cx="37" cy="37" r="21" stroke-width="1.1"/>
        <path id="${top}" d="M 9.5 37 A 27.5 27.5 0 0 1 64.5 37" stroke="none"/>
        <path id="${bot}" d="M 8 41 A 29 29 0 0 0 66 41" stroke="none"/>
        <text font-size="8.2" font-weight="700" letter-spacing="1" text-anchor="middle"><textPath href="#${top}" startOffset="50%">${date}</textPath></text>
        <text font-size="8.2" font-weight="700" letter-spacing="1" text-anchor="middle"><textPath href="#${bot}" startOffset="50%">${time}</textPath></text>
        <text x="37" y="42.5" font-size="${status ? 15 : 9}" font-weight="800" text-anchor="middle" stroke="none">${status || t('invalidShort')}</text>
      </g>
      <g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".85">
        <path d="M74 25 q4.5 -4 9 0 t9 0 t9 0 t9 0"/>
        <path d="M74 37 q4.5 -4 9 0 t9 0 t9 0 t9 0"/>
        <path d="M74 49 q4.5 -4 9 0 t9 0 t9 0 t9 0"/>
      </g>`;
    return svg;
}
