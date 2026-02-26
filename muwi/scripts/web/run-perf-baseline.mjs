import { spawn } from 'child_process';
import path from 'path';

const perfOutputRelative =
  process.env.MUWI_PERF_OUTPUT || path.join('test-results', 'perf-baseline.json');

const env = {
  ...process.env,
  MUWI_ENABLE_PERF_BASELINE_CI: 'true',
  MUWI_PERF_OUTPUT: perfOutputRelative,
};

const child = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['playwright', 'test', 'e2e/performance-baseline.spec.ts', '--config=playwright.config.ts', '--project=chromium'],
  {
    stdio: 'inherit',
    env,
  }
);

child.on('exit', (code) => {
  process.exit(code ?? 1);
});
