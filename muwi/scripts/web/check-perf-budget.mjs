import fs from 'fs/promises';
import path from 'path';

const cwd = process.cwd();
const baselinePath = path.resolve(cwd, 'perf-baselines', 'web-chromium-gha.json');
const actualPath = process.env.MUWI_PERF_OUTPUT
  ? path.resolve(cwd, process.env.MUWI_PERF_OUTPUT)
  : path.resolve(cwd, 'test-results', 'perf-baseline.json');

function getSwitchDuration(summary, label) {
  const match = Array.isArray(summary.switches)
    ? summary.switches.find((entry) => entry.label === label)
    : null;
  return match?.durationMs;
}

function withinBudget(actual, baseline, threshold) {
  const relativeMax = baseline * threshold.relativeMultiplier;
  const absoluteMax = threshold.absoluteMs;
  const maxAllowed = Math.min(relativeMax, absoluteMax);
  return {
    pass: actual <= maxAllowed,
    maxAllowed,
  };
}

function checkSample(name, actual, baseline, threshold, failures) {
  if (!Number.isFinite(actual)) {
    failures.push(`${name}: actual value missing or invalid`);
    return;
  }
  if (!Number.isFinite(baseline)) {
    failures.push(`${name}: baseline value missing or invalid`);
    return;
  }

  const result = withinBudget(actual, baseline, threshold);
  console.log(
    `- ${name}: actual ${actual}ms, baseline ${baseline}ms, max ${Math.round(result.maxAllowed)}ms`
  );
  if (!result.pass) {
    failures.push(`${name}: ${actual}ms exceeded max ${Math.round(result.maxAllowed)}ms`);
  }
}

async function main() {
  const [baselineRaw, actualRaw] = await Promise.all([
    fs.readFile(baselinePath, 'utf8'),
    fs.readFile(actualPath, 'utf8'),
  ]);
  const baseline = JSON.parse(baselineRaw);
  const actual = JSON.parse(actualRaw);

  const failures = [];
  const thresholds = baseline.thresholds;

  console.log('[perf-budget] Checking performance samples');
  checkSample(
    'startup:shelfVisibleMs',
    actual.startup?.shelfVisibleMs,
    baseline.startup?.shelfVisibleMs,
    thresholds.shelfVisible,
    failures
  );

  const coldLabels = ['cold:scratchpad', 'cold:long-drafts', 'cold:academic'];
  for (const label of coldLabels) {
    checkSample(
      label,
      getSwitchDuration(actual, label),
      baseline.switches?.[label],
      thresholds.coldRoutes,
      failures
    );
  }

  checkSample(
    'cold:blackboard',
    getSwitchDuration(actual, 'cold:blackboard'),
    baseline.switches?.['cold:blackboard'],
    thresholds.coldBlackboard,
    failures
  );
  checkSample(
    'warm:academic',
    getSwitchDuration(actual, 'warm:academic'),
    baseline.switches?.['warm:academic'],
    thresholds.warmAcademic,
    failures
  );

  if (failures.length > 0) {
    console.error('[perf-budget] failures:');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log('[perf-budget] PASS');
}

main().catch((error) => {
  console.error('[perf-budget] fatal error:', error);
  process.exit(1);
});
