import { spawn } from 'child_process';
import path from 'path';

const root = process.cwd();
const node = process.execPath;
const proxy = spawn(node, [path.join(root, 'server/groq-proxy.mjs')], { stdio: 'inherit', cwd: root });
const ng = spawn(node, [
  path.join(root, 'node_modules/@angular/cli/bin/ng'),
  'serve',
  '--port',
  '22600',
  '--proxy-config',
  'proxy.conf.json'
], { stdio: 'inherit', cwd: root });

function stop(code = 0) {
  proxy.kill();
  ng.kill();
  process.exit(code);
}

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
proxy.on('exit', code => {
  if (code) stop(code);
});
ng.on('exit', code => stop(code ?? 0));
