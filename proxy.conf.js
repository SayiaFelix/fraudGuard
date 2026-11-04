const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const http = require('http');
const path = require('path');

const BUILD = '2';
const port = Number(process.env.GROQ_PROXY_PORT || 22601);
let child = null;
let restarts = 0;

function readHealth() {
  return new Promise(resolve => {
    const req = http.get(`http://127.0.0.1:${port}/api/groq/health`, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
        } catch {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(800, () => {
      req.destroy();
      resolve(null);
    });
  });
}

function proxyPid() {
  try {
    const listing = execFileSync('ss', ['-ltnp'], { encoding: 'utf8' });
    const line = listing.split('\n').find(entry => entry.includes(`:${port}`));
    const match = line && line.match(/pid=(\d+)/);
    if (!match) return 0;
    const command = fs.readFileSync(`/proc/${match[1]}/cmdline`, 'utf8');
    return command.includes('groq-proxy.mjs') ? Number(match[1]) : 0;
  } catch {
    return 0;
  }
}

async function stopStaleProxy() {
  const pid = proxyPid();
  if (!pid) return;
  try { process.kill(pid, 'SIGTERM'); } catch { return; }
  for (let attempt = 0; attempt < 20; attempt++) {
    const health = await readHealth();
    if (!health) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  try { process.kill(pid, 'SIGKILL'); } catch { /* already gone */ }
  await new Promise(resolve => setTimeout(resolve, 200));
}

function spawnProxy() {
  child = spawn(process.execPath, [path.join(__dirname, 'server/groq-proxy.mjs')], {
    cwd: __dirname,
    stdio: 'inherit'
  });
  child.on('exit', code => {
    child = null;
    if (code === 0 || code === null) return;
    restarts += 1;
    if (restarts <= 3) setTimeout(ensureProxy, 400);
  });
}

async function ensureProxy() {
  const current = await readHealth();
  if (current && current.ok && current.build === BUILD) return;
  if (current) await stopStaleProxy();
  if (child) return;
  const afterStop = await readHealth();
  if (afterStop && afterStop.ok && afterStop.build === BUILD) return;
  spawnProxy();
  for (let attempt = 0; attempt < 25; attempt++) {
    const next = await readHealth();
    if (next && next.ok && next.build === BUILD) return;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  console.error('Groq proxy did not become ready on port ' + port);
}

ensureProxy();

module.exports = {
  '/api/groq': {
    target: `http://127.0.0.1:${port}`,
    secure: false,
    changeOrigin: true,
    timeout: 120000,
    proxyTimeout: 120000
  }
};
