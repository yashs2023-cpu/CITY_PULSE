/*
 * CITY-PULSE T2 code-metrics collector.
 * No third-party package is required.
 * Run from the repository root: node scripts/t2-code-metrics.js
 *
 * Measures:
 *   - physical LOC (non-blank lines)
 *   - comment lines and comment ratio
 *   - repeated normalized line-blocks as a duplication indicator
 *   - approximate per-function cyclomatic complexity when function syntax is detectable
 *
 * The cyclomatic calculation is intentionally labelled approximate. If the repo's
 * ESLint configuration exposes a complexity rule, use its output as the authoritative
 * per-function complexity evidence.
 */

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'docs', 'evidence');
const EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.html', '.css']);
const EXCLUDE_DIRS = new Set(['.git', 'node_modules', 'docs', 'legacy', 'coverage']);

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDE_DIRS.has(name.name)) continue;
    const full = path.join(dir, name.name);
    if (name.isDirectory()) walk(full, files);
    else if (EXTENSIONS.has(path.extname(name.name).toLowerCase())) files.push(full);
  }
  return files;
}

function stripStrings(line) {
  return line.replace(/(['"`])(?:\\.|(?!\1).)*\1/g, '');
}

function fileMetrics(file) {
  const text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const lines = text.split('\n');
  let loc = 0;
  let comments = 0;
  let inBlockComment = false;
  const codeLines = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (inBlockComment) {
      comments++;
      if (line.includes('*/')) inBlockComment = false;
      continue;
    }
    if (line.startsWith('/*')) {
      comments++;
      if (!line.includes('*/') || line.indexOf('/*') === line.lastIndexOf('/*')) inBlockComment = !line.includes('*/');
      continue;
    }
    if (line.startsWith('//') || line.startsWith('<!--') || line.startsWith('*')) {
      comments++;
      continue;
    }
    loc++;
    codeLines.push(stripStrings(line).replace(/\s+/g, ' '));
  }

  const functions = [];
  const fnRegex = /(?:function\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)|(?:async\s+)?([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{)/g;
  let match;
  while ((match = fnRegex.exec(text))) {
    const name = match[1] || match[2] || match[3] || '<anonymous>';
    const start = text.slice(0, match.index).split('\n').length - 1;
    const body = text.slice(match.index, Math.min(text.length, match.index + 6000));
    const decisions = (body.match(/\b(if|for|while|case|catch)\b|&&|\|\||\?/g) || []).length;
    functions.push({ name, startLine: start + 1, approximateCyclomatic: decisions + 1 });
  }

  return {
    file: path.relative(ROOT, file).replace(/\\/g, '/'),
    loc,
    commentLines: comments,
    commentRatio: loc ? Number((comments / loc).toFixed(4)) : 0,
    functions
  };
}

function duplicationMetric(results) {
  const blocks = new Map();
  let total = 0;
  for (const result of results) {
    const full = path.join(ROOT, result.file);
    const lines = fs.readFileSync(full, 'utf8').replace(/\r\n/g, '\n').split('\n')
      .map(x => x.trim()).filter(Boolean)
      .map(x => x.replace(/\s+/g, ' '));
    total += lines.length;
    for (let i = 0; i <= lines.length - 6; i++) {
      const block = lines.slice(i, i + 6).join('\n');
      if (block.length < 40) continue;
      blocks.set(block, (blocks.get(block) || 0) + 1);
    }
  }
  let duplicatedLines = 0;
  for (const count of blocks.values()) if (count > 1) duplicatedLines += count * 6;
  return { totalNonBlankLinesScanned: total, repeatedSixLineBlocks: [...blocks.values()].filter(c => c > 1).length, duplicatedLineEstimate: duplicatedLines, duplicationRatioEstimate: total ? Number((duplicatedLines / total).toFixed(4)) : 0 };
}

function tryEslint() {
  try {
    const raw = cp.execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['eslint', '.', '-f', 'json'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { available: true, output: JSON.parse(raw) };
  } catch (err) {
    return { available: false, reason: String(err.message || err) };
  }
}

const files = walk(ROOT);
const results = files.map(fileMetrics);
const totals = results.reduce((a, r) => ({ loc: a.loc + r.loc, comments: a.comments + r.commentLines, functions: a.functions + r.functions.length }), { loc: 0, comments: 0, functions: 0 });
const duplication = duplicationMetric(results);
const eslint = tryEslint();

fs.mkdirSync(OUT, { recursive: true });
const output = {
  generatedAt: new Date().toISOString(),
  scope: 'Repository source files excluding .git, node_modules, docs, legacy and coverage',
  files: results,
  totals: { ...totals, commentRatio: totals.loc ? Number((totals.comments / totals.loc).toFixed(4)) : 0 },
  duplication,
  eslint
};
fs.writeFileSync(path.join(OUT, 'code-metrics.json'), JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
