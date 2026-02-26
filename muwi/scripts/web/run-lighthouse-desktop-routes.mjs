import fs from 'fs/promises';
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
    chromePath: process.env.MUWI_CHROME_PATH,
  };

  for (const raw of argv) {
    if (raw === '--assert') args.assert = true;
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

  if (chromePath) {
    args.push(`--chrome-path=${chromePath}`);
  }

  await spawnLogged(command, args, { cwd });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const baseline = JSON.parse(await fs.readFile(baselinePath, 'utf8'));
  const baseUrl = options.baseUrl || baseline.defaultBaseUrl;
  const routes = baseline.routes;

  await fs.mkdir(outputDir, { recursive: true });
  await waitForBaseUrl(baseUrl, options.waitMs);

  const results = [];
  const failures = [];

  for (const routePath of routes) {
    const fileStem = sanitizeRouteForFile(routePath);
    const reportPath = path.join(outputDir, `${fileStem}.json`);

    console.log(`[lighthouse-routes] auditing ${routePath} -> ${reportPath}`);
    await runLighthouse(baseUrl, routePath, reportPath, options.chromePath);

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
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('[lighthouse-routes] fatal error:', error);
  process.exit(1);
});

