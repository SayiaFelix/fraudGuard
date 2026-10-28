import http from 'http';
import fs from 'fs';
import path from 'path';

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv(path.resolve(process.cwd(), '.env'));

const port = Number(process.env.GROQ_PROXY_PORT || 22601);
const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > 200_000) {
        reject(new Error('Request is too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function send(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function upstreamError(payload) {
  if (typeof payload?.error === 'string' && payload.error.trim()) return payload.error;
  if (typeof payload?.error?.message === 'string' && payload.error.message.trim()) return payload.error.message;
  return 'The analysis service rejected the request';
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/api/groq/health') {
    send(res, 200, { ok: Boolean(process.env.GROQ_API_KEY), model });
    return;
  }

  if (req.method !== 'POST' || req.url !== '/api/groq/chat') {
    send(res, 404, { error: 'Not found' });
    return;
  }

  if (!process.env.GROQ_API_KEY) {
    send(res, 500, { error: 'GROQ_API_KEY is missing from .env. Create one at https://console.groq.com/keys' });
    return;
  }

  try {
    const body = JSON.parse(await readBody(req) || '{}');
    const messages = [];
    if (body.system) messages.push({ role: 'system', content: String(body.system) });
    for (const message of body.messages || []) {
      if (!message || !message.content) continue;
      const role = message.role === 'assistant' ? 'assistant' : 'user';
      messages.push({ role, content: String(message.content).slice(0, 12000) });
    }
    if (!messages.some(message => message.role === 'user')) {
      send(res, 400, { error: 'A user message is required' });
      return;
    }

    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model,
        temperature: Number.isFinite(body.temperature) ? body.temperature : 0.4,
        messages
      })
    });

    const payload = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      send(res, upstream.status, { error: upstreamError(payload) });
      return;
    }

    const reply = payload?.choices?.[0]?.message?.content || '';
    send(res, 200, { reply });
  } catch (error) {
    send(res, 500, { error: error instanceof Error ? error.message : 'Analysis request failed' });
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Groq proxy listening on http://127.0.0.1:${port} (${model})`);
});
