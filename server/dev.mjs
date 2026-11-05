import { spawn } from 'child_process';
import path from 'path';

const root = process.cwd();
const ng = spawn(process.execPath, [
  path.join(root, 'node_modules/@angular/cli/bin/ng'),
  'serve',
  '--port',
  '4200',
  '--proxy-config',
  'proxy.conf.js'
], { stdio: 'inherit', cwd: root });

function stop(code = 0) {
  ng.kill();
  process.exit(code);
}

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
ng.on('exit', code => stop(code ?? 0));
