import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';

const LIGHTHOUSE_VERSION = '9.6.8';
const cwd = process.cwd();
const baselinePath = path.resolve(cwd, 'perf-baselines', 'lighthouse-desktop-routes.json');
const outputDir =
  process.env.MUWI_LIGHTHOUSE_OUTPUT_DIR ||
  path.resolve(cwd, 'test-results', 'lighthouse', 'desktop-routes');

function parseArgs(argv) {
  const args = {
    assert: false,
    baseUrl: process.env.MUWI_LIGHTHOUSE_BASE_URL,
    waitMs: Number(process.env.MUWI_LIGHTHOUSE_WAIT_MS || 30000),
    chromePath: process.env.MUWI_CHROME_PATH || process.env.CHROME_PATH,
    startServer: process.env.MUWI_LIGHTHOUSE_START_SERVER !== 'false',
  };

  for (const raw of argv) {
    if (raw === '--assert') args.assert = true;
    else if (raw === '--start-server') args.startServer = true;
    else if (raw === '--no-start-server') args.startServer = false;
    else if (raw.startsWith('--base-url=')) args.baseUrl = raw.slice('--base-url='.length);
    else if (raw.startsWith('--wait-ms=')) args.waitMs = Number(raw.slice('--wait-ms='.length));
    else if (raw.startsWith('--chrome-path=')) args.chromePath = raw.slice('--chrome-path='.length);
  }

  return args;
}

function sanitizeRouteForFile(routePath) {
  if (routePath === '/') return 'root';
  return routePath.replace(/^\/+/, '').replace(/[^a-z0-9/_-]+/gi, '-').replace(/\//g, '__');
}

function getCategoryScore(report, id) {
  const value = report.categories?.[id]?.score;
  return Number.isFinite(value) ? Math.round(value * 100) : null;
}

function getAuditScore(report, id) {
  return report.audits?.[id]?.score;
}

function getMetricValue(report, id) {
  return report.audits?.[id]?.displayValue ?? null;
}

function getNumericMetric(report, id) {
  const value = report.audits?.[id]?.numericValue;
  return Number.isFinite(value) ? value : null;
}

function spawnLogged(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      ...options,
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code ?? 'unknown'}`));
      }
    });
  });
}

async function waitForBaseUrl(baseUrl, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl, { redirect: 'manual' });
      if (response.status >= 200 && response.status < 500) {
        return;
      }
      lastError = new Error(`Unexpected status ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for ${baseUrl}: ${String(lastError)}`);
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function isLoopbackHost(hostname) {
  return hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '::1';
}

function canAutoStartPreview(baseUrl) {
  try {
    const parsed = new URL(baseUrl);
    return parsed.protocol === 'http:' && isLoopbackHost(parsed.hostname);
  } catch {
    return false;
  }
}

function resolvePreviewLaunch(baseUrl) {
  const parsed = new URL(baseUrl);
  return {
    host: parsed.hostname,
    port: parsed.port || '4173',
  };
}

function startPreviewServer(baseUrl) {
  const { host, port } = resolvePreviewLaunch(baseUrl);
  const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const args = ['run', 'preview', '--', '--host', host, '--port', port];

  console.log(`[lighthouse-routes] starting preview server on ${host}:${port}`);
  const child = spawn(command, args, {
    cwd,
    stdio: 'inherit',
  });

  return child;
}

async function stopPreviewServer(child) {
  if (!child || child.killed || child.exitCode !== null) {
    return;
  }

  await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
    }, 5000);

    child.once('exit', () => {
      clearTimeout(timeout);
      resolve();
    });

    child.kill('SIGTERM');
  });
}

async function findPlaywrightChromiumFromModule() {
  try {
    const playwright = await import('@playwright/test');
    const candidate = playwright?.chromium?.executablePath?.();
    if (candidate && (await pathExists(candidate))) {
      return candidate;
    }
  } catch {
    // Playwright is optional for this script; ignore import resolution errors.
  }

  return null;
}

function compareChromiumDirName(a, b) {
  const aVersion = Number(a.replace(/^chromium-/, '')) || 0;
  const bVersion = Number(b.replace(/^chromium-/, '')) || 0;
  return bVersion - aVersion;
}

function getPlaywrightCacheRoots() {
  const home = os.homedir();

  if (process.platform === 'darwin') {
    return [path.join(home, 'Library', 'Caches', 'ms-playwright')];
  }

  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
    return [path.join(localAppData, 'ms-playwright')];
  }

  return [path.join(home, '.cache', 'ms-playwright')];
}

function getChromiumExecutableCandidates(chromiumDir) {
  if (process.platform === 'darwin') {
    const bundle = ['Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing'];
    return [
      path.join(chromiumDir, 'chrome-mac', ...bundle),
      path.join(chromiumDir, 'chrome-mac-arm64', ...bundle),
    ];
  }

  if (process.platform === 'win32') {
    return [path.join(chromiumDir, 'chrome-win', 'chrome.exe')];
  }

  return [path.join(chromiumDir, 'chrome-linux', 'chrome')];
}

async function findPlaywrightChromiumFromCache() {
  const roots = getPlaywrightCacheRoots();

  for (const root of roots) {
    let entries;
    try {
      entries = await fs.readdir(root, { withFileTypes: true });
    } catch {
      continue;
    }

    const chromiumDirs = entries
      .filter((entry) => entry.isDirectory() && /^chromium-\d+$/.test(entry.name))
      .map((entry) => entry.name)
      .sort(compareChromiumDirName);

    for (const chromiumDirName of chromiumDirs) {
      const chromiumDir = path.join(root, chromiumDirName);
      const candidates = getChromiumExecutableCandidates(chromiumDir);

      for (const candidate of candidates) {
        if (await pathExists(candidate)) {
          return candidate;
        }
      }
    }
  }

  return null;
}

function getCommonSystemChromeCandidates() {
  if (process.platform === 'darwin') {
    return [
      '/Applications/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ];
  }

  if (process.platform === 'win32') {
    return [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    ];
  }

  return ['/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium'];
}

async function resolveChromePath(explicitChromePath) {
  if (explicitChromePath) {
    if (await pathExists(explicitChromePath)) {
      return explicitChromePath;
    }

    throw new Error(
      `Configured Chrome path does not exist: ${explicitChromePath}. ` +
        'Update MUWI_CHROME_PATH/CHROME_PATH or pass --chrome-path=<valid binary>.'
    );
  }

  const fromPlaywrightModule = await findPlaywrightChromiumFromModule();
  if (fromPlaywrightModule) {
    return fromPlaywrightModule;
  }

  const fromPlaywrightCache = await findPlaywrightChromiumFromCache();
  if (fromPlaywrightCache) {
    return fromPlaywrightCache;
  }

  const systemCandidates = getCommonSystemChromeCandidates();
  for (const candidate of systemCandidates) {
    if (await pathExists(candidate)) {
      return candidate;
    }
  }

  return null;
}

async function runLighthouse(baseUrl, routePath, reportPath, chromePath) {
  const targetUrl = new URL(routePath, baseUrl).toString();
  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const args = [
    '--yes',
    `lighthouse@${LIGHTHOUSE_VERSION}`,
    targetUrl,
    '--preset=desktop',
    '--quiet',
    '--output=json',
    `--output-path=${reportPath}`,
    '--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage',
  ];
  const env = {
    ...process.env,
  };

  if (chromePath) {
    args.push('--chrome-path', chromePath);
    env.CHROME_PATH = chromePath;
  }

  await spawnLogged(command, args, { cwd, env });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const baseline = JSON.parse(await fs.readFile(baselinePath, 'utf8'));
  const baseUrl = options.baseUrl || baseline.defaultBaseUrl;
  const routes = baseline.routes;
  const chromePath = await resolveChromePath(options.chromePath);
  let previewServer = null;
  let launchedPreviewServer = false;

  if (chromePath) {
    console.log(`[lighthouse-routes] using chrome binary: ${chromePath}`);
  } else {
    console.warn(
      '[lighthouse-routes] no Chrome binary detected via env vars, Playwright, or common system paths; ' +
        'Lighthouse will rely on its own auto-discovery.'
    );
  }

  try {
    await fs.mkdir(outputDir, { recursive: true });

    try {
      await waitForBaseUrl(baseUrl, Math.min(options.waitMs, 5000));
    } catch (initialError) {
      if (!options.startServer || !canAutoStartPreview(baseUrl)) {
        throw initialError;
      }

      previewServer = startPreviewServer(baseUrl);
      launchedPreviewServer = true;

      const exitError = new Promise((_, reject) => {
        previewServer.once('exit', (code) => {
          reject(
            new Error(
              `Preview server exited before becoming available (code ${code ?? 'unknown'}). ` +
                'Run `npm run build` first, or disable auto-start with --no-start-server.'
            )
          );
        });
      });

      await Promise.race([waitForBaseUrl(baseUrl, options.waitMs), exitError]);
    }

    const results = [];
    const failures = [];

    for (const routePath of routes) {
      const fileStem = sanitizeRouteForFile(routePath);
      const reportPath = path.join(outputDir, `${fileStem}.json`);

      console.log(`[lighthouse-routes] auditing ${routePath} -> ${reportPath}`);
      await runLighthouse(baseUrl, routePath, reportPath, chromePath);

      const report = JSON.parse(await fs.readFile(reportPath, 'utf8'));
      const performance = getCategoryScore(report, 'performance');
      const bestPractices = getCategoryScore(report, 'best-practices');
      const pwa = getCategoryScore(report, 'pwa');

      const summary = {
        route: routePath,
        finalUrl: report.finalUrl,
        lighthouseVersion: report.lighthouseVersion,
        scores: {
          performance,
          bestPractices,
          pwa,
        },
        metrics: {
          fcp: getMetricValue(report, 'first-contentful-paint'),
          lcp: getMetricValue(report, 'largest-contentful-paint'),
          tbt: getMetricValue(report, 'total-blocking-time'),
          cls: getNumericMetric(report, 'cumulative-layout-shift'),
        },
      };

      results.push(summary);

      if (options.assert) {
        if (performance !== null && performance < baseline.thresholds.performanceMin) {
          failures.push(
            `${routePath}: performance ${performance} < ${baseline.thresholds.performanceMin}`
          );
        }
        if (bestPractices !== null && bestPractices < baseline.thresholds.bestPracticesMin) {
          failures.push(
            `${routePath}: best-practices ${bestPractices} < ${baseline.thresholds.bestPracticesMin}`
          );
        }
      }

      if (routePath === baseline.pwaChecks.route && options.assert) {
        const pwaScoreRaw = report.categories?.pwa?.score;
        if (Number.isFinite(pwaScoreRaw) && pwaScoreRaw < baseline.pwaChecks.categoryScoreMin) {
          failures.push(
            `${routePath}: pwa score ${(pwaScoreRaw * 100).toFixed(0)} < ${Math.round(
              baseline.pwaChecks.categoryScoreMin * 100
            )}`
          );
        }

        for (const [auditId, expectedScore] of Object.entries(baseline.pwaChecks.requiredAudits)) {
          const actual = getAuditScore(report, auditId);
          if (actual !== expectedScore) {
            failures.push(`${routePath}: audit ${auditId} score ${actual} !== ${expectedScore}`);
          }
        }
      }
    }

    const summaryPath = path.join(outputDir, 'summary.json');
    const summaryPayload = {
      generatedAt: new Date().toISOString(),
      baseUrl,
      lighthouseVersion: LIGHTHOUSE_VERSION,
      thresholds: baseline.thresholds,
      pwaChecks: baseline.pwaChecks,
      routes: results,
    };
    await fs.writeFile(summaryPath, `${JSON.stringify(summaryPayload, null, 2)}\n`, 'utf8');

    console.table(
      results.map((entry) => ({
        route: entry.route,
        perf: entry.scores.performance,
        bestPractices: entry.scores.bestPractices,
        pwa: entry.scores.pwa,
        FCP: entry.metrics.fcp,
        LCP: entry.metrics.lcp,
        TBT: entry.metrics.tbt,
        CLS: entry.metrics.cls,
      }))
    );
    console.log(`[lighthouse-routes] summary written to ${summaryPath}`);

    if (failures.length > 0) {
      console.error('[lighthouse-routes] failures:');
      for (const failure of failures) {
        console.error(`- ${failure}`);
      }
      const assertionError = new Error('Lighthouse route assertions failed.');
      assertionError.name = 'LighthouseAssertionError';
      throw assertionError;
    }
  } finally {
    if (launchedPreviewServer) {
      await stopPreviewServer(previewServer);
    }
  }
}

main().catch((error) => {
  console.error('[lighthouse-routes] fatal error:', error);
  process.exit(1);
});
