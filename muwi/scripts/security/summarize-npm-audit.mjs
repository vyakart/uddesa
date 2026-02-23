#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const SEVERITY_ORDER = ['critical', 'high', 'moderate', 'low', 'info'];

function usage() {
  console.error('Usage: node scripts/security/summarize-npm-audit.mjs <audit-json-path> [output-md-path]');
}

function parseAuditPayload(rawText, inputPath) {
  try {
    return JSON.parse(rawText);
  } catch {
    // `npm run` wrappers can prepend script banner lines before JSON output.
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error(`No JSON object found in ${inputPath}`);
    }

    const candidate = rawText.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to parse extracted JSON payload from ${inputPath}: ${message}`);
    }
  }
}

function normalizeSeverity(value) {
  if (typeof value !== 'string') {
    return 'unknown';
  }

  const normalized = value.toLowerCase();
  if (SEVERITY_ORDER.includes(normalized)) {
    return normalized;
  }

  return 'unknown';
}

function severityRank(value) {
  const normalized = normalizeSeverity(value);
  const index = SEVERITY_ORDER.indexOf(normalized);
  return index === -1 ? SEVERITY_ORDER.length : index;
}

function markdownCell(value) {
  const text = String(value ?? '');
  return text.replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function summarizeVia(via) {
  if (!Array.isArray(via) || via.length === 0) {
    return 'n/a';
  }

  const formatted = via.map((item) => {
    if (typeof item === 'string') {
      return item;
    }

    if (!item || typeof item !== 'object') {
      return 'unknown-source';
    }

    const advisoryId = item.url || item.source || item.name || item.title || 'advisory';
    const severity = normalizeSeverity(item.severity || 'unknown');
    return `${advisoryId} (${severity})`;
  });

  if (formatted.length <= 2) {
    return formatted.join('; ');
  }

  const head = formatted.slice(0, 2).join('; ');
  return `${head}; +${formatted.length - 2} more`;
}

function summarizeFixAvailable(fixAvailable) {
  if (typeof fixAvailable === 'boolean') {
    return fixAvailable ? 'yes' : 'no';
  }

  if (fixAvailable && typeof fixAvailable === 'object') {
    const name = typeof fixAvailable.name === 'string' ? fixAvailable.name : 'package';
    const version = typeof fixAvailable.version === 'string' ? fixAvailable.version : 'latest';
    const semverMajor = fixAvailable.isSemVerMajor ? ' (semver-major)' : '';
    return `yes (${name}@${version}${semverMajor})`;
  }

  return 'unknown';
}

function getCountBySeverity(vulnerabilities, metadataCounts) {
  const counts = {
    critical: 0,
    high: 0,
    moderate: 0,
    low: 0,
    info: 0,
    unknown: 0,
  };

  if (metadataCounts && typeof metadataCounts === 'object') {
    for (const level of SEVERITY_ORDER) {
      const count = Number(metadataCounts[level]);
      counts[level] = Number.isFinite(count) ? count : 0;
    }

    return counts;
  }

  for (const vulnerability of vulnerabilities) {
    const level = normalizeSeverity(vulnerability.severity);
    counts[level] += 1;
  }

  return counts;
}

function mapRecommendation(severity, fixAvailableText) {
  const hasFix = fixAvailableText.startsWith('yes');
  if (severity === 'critical' || severity === 'high') {
    return hasFix ? 'fix-now' : 'mitigate-and-track';
  }

  if (severity === 'moderate') {
    return hasFix ? 'patch-this-sprint' : 'triage-owner-decision';
  }

  if (severity === 'low' || severity === 'info') {
    return hasFix ? 'patch-when-touching' : 'monitor';
  }

  return 'manual-triage';
}

function isAuditPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const vulnerabilities = payload.vulnerabilities;
  return (
    Number.isFinite(payload.auditReportVersion) &&
    payload.auditReportVersion >= 2 &&
    vulnerabilities &&
    typeof vulnerabilities === 'object' &&
    !Array.isArray(vulnerabilities)
  );
}

function buildMarkdown({ inputPath, vulnerabilities, metadata }) {
  const generatedAt = new Date().toISOString();
  const counts = getCountBySeverity(vulnerabilities, metadata?.vulnerabilities);

  const sortedVulnerabilities = [...vulnerabilities].sort((a, b) => {
    const rankDiff = severityRank(a.severity) - severityRank(b.severity);
    if (rankDiff !== 0) {
      return rankDiff;
    }

    return a.name.localeCompare(b.name);
  });

  const lines = [];
  lines.push('# Dependency Audit Summary (npm audit)');
  lines.push('');
  lines.push(`- Generated: ${generatedAt}`);
  lines.push(`- Source: \`${inputPath}\``);
  lines.push(`- Total vulnerable packages: ${sortedVulnerabilities.length}`);
  lines.push('');
  lines.push('## Severity Totals');
  lines.push('');
  lines.push('| Severity | Count |');
  lines.push('| --- | ---: |');
  lines.push(`| Critical | ${counts.critical} |`);
  lines.push(`| High | ${counts.high} |`);
  lines.push(`| Moderate | ${counts.moderate} |`);
  lines.push(`| Low | ${counts.low} |`);
  lines.push(`| Info | ${counts.info} |`);
  lines.push(`| Unknown | ${counts.unknown} |`);
  lines.push('');

  if (sortedVulnerabilities.length === 0) {
    lines.push('No vulnerabilities were listed in the audit payload.');
    return lines.join('\n');
  }

  lines.push('## Package Findings');
  lines.push('');
  lines.push('| Package | Severity | Direct | Fix available | Recommended action | Via | Range |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- |');

  for (const vulnerability of sortedVulnerabilities) {
    const severity = normalizeSeverity(vulnerability.severity);
    const fixAvailable = summarizeFixAvailable(vulnerability.fixAvailable);
    const recommendation = mapRecommendation(severity, fixAvailable);
    lines.push(
      `| ${markdownCell(vulnerability.name)} | ${markdownCell(severity)} | ${vulnerability.isDirect ? 'yes' : 'no'} | ${markdownCell(fixAvailable)} | ${markdownCell(recommendation)} | ${markdownCell(summarizeVia(vulnerability.via))} | ${markdownCell(vulnerability.range || 'n/a')} |`,
    );
  }

  lines.push('');
  lines.push('## Next Steps');
  lines.push('');
  lines.push('1. Copy findings into `security/CVE_TRIAGE_TEMPLATE.md`.');
  lines.push('2. Assign owner + target date for every critical/high finding.');
  lines.push('3. Re-run `npm audit --json` after upgrades and attach both reports to the same triage entry.');

  return lines.join('\n');
}

function main() {
  const [inputPathArg, outputPathArg] = process.argv.slice(2);

  if (!inputPathArg) {
    usage();
    process.exitCode = 1;
    return;
  }

  const inputPath = path.resolve(inputPathArg);
  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exitCode = 1;
    return;
  }

  let payload;
  try {
    const rawText = fs.readFileSync(inputPath, 'utf8');
    payload = parseAuditPayload(rawText, inputPath);
  } catch (error) {
    console.error(`Failed to parse JSON: ${inputPath}`);
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
    return;
  }

  if (!isAuditPayload(payload)) {
    const message = typeof payload?.message === 'string' ? payload.message : 'missing auditReportVersion/vulnerabilities payload';
    console.error(`Invalid npm audit payload: ${message}`);
    process.exitCode = 1;
    return;
  }

  const vulnerabilities = Object.entries(payload?.vulnerabilities ?? {}).map(([name, value]) => ({
    name,
    severity: value?.severity,
    isDirect: Boolean(value?.isDirect),
    via: value?.via,
    range: value?.range,
    fixAvailable: value?.fixAvailable,
  }));

  const markdown = buildMarkdown({
    inputPath,
    vulnerabilities,
    metadata: payload?.metadata,
  });

  const outputPath = outputPathArg
    ? path.resolve(outputPathArg)
    : path.join(path.dirname(inputPath), `${path.basename(inputPath, '.json')}.summary.md`);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, markdown);

  console.log(`Wrote dependency audit summary: ${outputPath}`);
}

main();
