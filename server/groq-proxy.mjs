import http from 'http';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const loadEnv = require('./load-env.cjs');
loadEnv(path.resolve(process.cwd(), '.env'));

const port = Number(process.env.GROQ_PROXY_PORT || 22601);
const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const fallbackModel = process.env.GROQ_FALLBACK_MODEL || 'llama-3.3-70b-versatile';
const BUILD = '2';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
  if (res.writableEnded) return;
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function upstreamError(payload) {
  if (typeof payload?.error === 'string' && payload.error.trim()) return payload.error;
  if (typeof payload?.error?.message === 'string' && payload.error.message.trim()) return payload.error.message;
  return 'The analysis service rejected the request';
}

function messageText(message) {
  if (!message || typeof message !== 'object') return '';
  const content = typeof message.content === 'string' ? message.content.trim() : '';
  if (content) return content;
  const reasoning = typeof message.reasoning === 'string' ? message.reasoning.trim() : '';
  return reasoning;
}

async function complete(modelName, messages, temperature, jsonMode) {
  const body = {
    model: modelName,
    temperature,
    messages,
    max_completion_tokens: jsonMode ? 900 : 700
  };
  if (String(modelName).includes('gpt-oss')) body.reasoning_effort = 'low';
  if (jsonMode) body.response_format = { type: 'json_object' };

  const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45000)
  });
  const payload = await upstream.json().catch(() => ({}));
  const retryAfter = Number(upstream.headers.get('retry-after')) || 0;
  return { status: upstream.status, payload, retryAfter };
}

let tail = Promise.resolve();
function enqueue(task) {
  const run = tail.then(task, task);
  tail = run.then(() => undefined, () => undefined);
  return run;
}

async function answer(messages, temperature, jsonMode) {
  const models = [model];
  if (fallbackModel && fallbackModel !== model) models.push(fallbackModel);
  let lastError = 'The analysis service rejected the request';
  let wantJson = jsonMode;

  for (const modelName of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const { status, payload, retryAfter } = await complete(modelName, messages, temperature, wantJson);
        if (status === 429 || status >= 500) {
          lastError = upstreamError(payload);
          await sleep(retryAfter > 0 ? Math.min(retryAfter * 1000, 4000) : 400 * (attempt + 1));
          continue;
        }
        if (status === 400 && wantJson) {
          lastError = upstreamError(payload);
          wantJson = false;
          continue;
        }
        if (status < 200 || status >= 300) {
          lastError = upstreamError(payload);
          break;
        }
        const text = messageText(payload?.choices?.[0]?.message);
        if (!text) {
          lastError = 'The analysis service returned an empty reply';
          await sleep(250);
          continue;
        }
        return text;
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Analysis request failed';
        await sleep(400 * (attempt + 1));
      }
    }
  }

  const failure = new Error(lastError);
  failure.status = 502;
  throw failure;
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = (req.url || '').split('?')[0];

  if (req.method === 'GET' && url === '/api/groq/health') {
    send(res, 200, { ok: Boolean(process.env.GROQ_API_KEY), model, build: BUILD });
    return;
  }

  if (req.method !== 'POST' || url !== '/api/groq/chat') {
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

    const temperature = Number.isFinite(body.temperature) ? body.temperature : 0.4;
    const reply = await enqueue(() => answer(messages, temperature, Boolean(body.json)));
    send(res, 200, { reply });
  } catch (error) {
    const status = Number.isInteger(error?.status) ? error.status : 500;
    send(res, status, { error: error instanceof Error ? error.message : 'Analysis request failed' });
  }
});

server.on('error', error => {
  if (error.code === 'EADDRINUSE') {
    console.log(`Groq proxy already listening on http://127.0.0.1:${port}`);
    process.exit(0);
  }
  console.error(error);
  process.exit(1);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Groq proxy listening on http://127.0.0.1:${port} (${model})`);
});
