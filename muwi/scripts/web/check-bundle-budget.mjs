import fs from 'fs/promises';
import path from 'path';

const cwd = process.cwd();
const distDir = path.resolve(cwd, 'dist');
const assetsDir = path.join(distDir, 'assets');
const budgetsPath = path.resolve(cwd, 'perf-baselines', 'bundle-budgets.json');

function readNumber(value, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function parseAssetRefs(indexHtml) {
  const regex = /<(script|link)\b[^>]+(?:src|href)="\/assets\/([^"]+)"/g;
  const refs = [];
  let match;
  while ((match = regex.exec(indexHtml)) !== null) {
    refs.push(match[2]);
  }
  return refs;
}

function parseModulePreloads(indexHtml) {
  const regex = /<link\s+rel="modulepreload"[^>]+href="\/assets\/([^"]+)"/g;
  const refs = [];
  let match;
  while ((match = regex.exec(indexHtml)) !== null) {
    refs.push(match[1]);
  }
  return refs;
}

function findAssetByPrefix(assetNames, prefix) {
  return assetNames.find((name) => name.startsWith(prefix));
}

function formatBytes(bytes) {
  return `${Math.round(bytes).toLocaleString()} B`;
}

async function main() {
  const [indexHtmlRaw, budgetsRaw, assetNames] = await Promise.all([
    fs.readFile(path.join(distDir, 'index.html'), 'utf8'),
    fs.readFile(budgetsPath, 'utf8'),
    fs.readdir(assetsDir),
  ]);

  const budgets = JSON.parse(budgetsRaw);
  const refs = parseAssetRefs(indexHtmlRaw);
  const modulePreloads = parseModulePreloads(indexHtmlRaw);

  const uniqueRefs = [...new Set(refs)];
  const refStats = await Promise.all(
    uniqueRefs.map(async (name) => ({
      name,
      bytes: (await fs.stat(path.join(assetsDir, name))).size,
    }))
  );

  const initialJsCssBytes = refStats.reduce((sum, item) => sum + item.bytes, 0);
  const failures = [];
  const warnings = [];

  for (const forbiddenPrefix of budgets.forbiddenIndexPreloadPrefixes ?? []) {
    const matched = modulePreloads.filter((name) => name.startsWith(forbiddenPrefix));
    if (matched.length > 0) {
      failures.push(
        `Forbidden modulepreload prefix "${forbiddenPrefix}" found in index.html: ${matched.join(', ')}`
      );
    }
  }

  const coreBudget = budgets.coreEntry ?? {};
  const coreMax = readNumber(coreBudget.initialJsCssBytesMax, Infinity);
  if (initialJsCssBytes > coreMax) {
    failures.push(
      `Initial JS/CSS payload ${formatBytes(initialJsCssBytes)} exceeds max ${formatBytes(coreMax)}`
    );
  }

  for (const chunkBudget of budgets.chunkBudgets ?? []) {
    const prefix = chunkBudget.prefix;
    const file = findAssetByPrefix(assetNames, prefix);
    if (!file) {
      warnings.push(`No asset found for prefix "${prefix}"`);
      continue;
    }

    const actualBytes = (await fs.stat(path.join(assetsDir, file))).size;
    const baselineBytes = readNumber(budgets.baselineChunkBytes?.[prefix], 0);
    const regressionPct =
      baselineBytes > 0 ? ((actualBytes - baselineBytes) / baselineBytes) * 100 : 0;
    const regressionLimitPct = readNumber(chunkBudget.regressionPercentMax, Infinity);

    const msg = `${prefix} -> ${file}: ${formatBytes(actualBytes)} (baseline ${formatBytes(
      baselineBytes
    )}, delta ${regressionPct.toFixed(2)}%)`;
    if (baselineBytes > 0 && regressionPct > regressionLimitPct) {
      if (chunkBudget.warnOnly) {
        warnings.push(msg);
      } else {
        failures.push(msg);
      }
    }
  }

  console.log('[bundle-budget] initial assets referenced by index.html');
  for (const item of refStats) {
    console.log(`- ${item.name}: ${formatBytes(item.bytes)}`);
  }
  console.log(`[bundle-budget] total initial JS/CSS bytes: ${formatBytes(initialJsCssBytes)}`);

  if (warnings.length > 0) {
    console.warn('[bundle-budget] warnings:');
    for (const warning of warnings) console.warn(`- ${warning}`);
  }

  if (failures.length > 0) {
    console.error('[bundle-budget] failures:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log('[bundle-budget] PASS');
}

main().catch((error) => {
  console.error('[bundle-budget] fatal error:', error);
  process.exit(1);
});
