// build.mjs — รวม src/* เป็น dist/index.html ไฟล์เดียว
// ใช้: node build.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const rd = (p) => readFileSync(join(ROOT, 'src', p), 'utf8');

/* ---------- CSS scoper: ครอบ CSS ของเว็บเดิมด้วย class ของโมดูล ---------- */
function splitTop(css) {
  // คืน [{pre, body}] ของบล็อกระดับบนสุด (ข้าม comment)
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = []; let i = 0;
  while (i < css.length) {
    const open = css.indexOf('{', i); if (open < 0) break;
    const pre = css.slice(i, open).trim();
    let d = 1, j = open + 1;
    while (j < css.length && d) { if (css[j] === '{') d++; else if (css[j] === '}') d--; j++; }
    out.push({ pre, body: css.slice(open + 1, j - 1) });
    i = j;
  }
  return out;
}
function splitSel(s) {
  const r = []; let d = 0, cur = '';
  for (const ch of s) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && !d) { r.push(cur.trim()); cur = ''; } else cur += ch; }
  if (cur.trim()) r.push(cur.trim()); return r;
}
function scopeSel(sel, S) {
  if (/^html\b/.test(sel)) return null;
  const m = sel.match(/^:root((?:\[[^\]]*\]|:not\((?:[^()]|\([^)]*\))*\))*)\s*(.*)$/);
  if (m) return (m[1] ? `:root${m[1]} ` : '') + S + (m[2] ? ' ' + m[2] : '');
  if (/^body\b/.test(sel)) return S + sel.slice(4);
  return `${S} ${sel}`;
}
function scopeCss(css, S, prefix) {
  const kf = [];
  const walk = (blocks) => blocks.map(({ pre, body }) => {
    if (/^@(media|supports)/.test(pre)) return `${pre}{${walk(splitTop(body))}}`;
    if (/^@(-webkit-)?keyframes/.test(pre)) { const n = pre.split(/\s+/)[1]; kf.push(n); return `@keyframes ${prefix}-${n}{${body}}`; }
    if (pre.startsWith('@')) return `${pre}{${body}}`;
    const sels = splitSel(pre).map((s) => scopeSel(s, S)).filter(Boolean);
    return sels.length ? `${sels.join(',')}{${body}}` : '';
  }).join('\n');
  let out = walk(splitTop(css));
  kf.forEach((n) => { out = out.replace(new RegExp(`(animation(?:-name)?\\s*:[^;}]*?)\\b${n}\\b`, 'g'), `$1${prefix}-${n}`); });
  return out;
}
// ชื่อตัวแปรเดิม → token กลาง (ทำให้ทุกโมดูลใช้สี/ฟอนต์ชุดเดียวกัน)
const alias = (S, map) => `${S}${S.repeat(3)}{${Object.entries(map).map(([k, v]) => `--${k}:var(--ap-${v})`).join(';')};padding:0;background:transparent}`;
const BASE = { bg: 'bg', surface: 'surface', surface2: 'surface2', ink: 'ink', line: 'line', accent: 'accent', 'accent-soft': 'accent-soft', 'accent-ink': 'accent-ink', shadow: 'shadow', mono: 'mono' };

const css = [
  rd('style/tokens.css'),
  rd('style/app.css'),
  scopeCss(rd('legacy/dp8/style.css'), '.m-dp8', 'dp8'),
  alias('.m-dp8', { ...BASE, muted: 'ink2', good: 'ok', 'good-soft': 'ok-soft', bad: 'bad', 'bad-soft': 'bad-soft', 'code-bg': 'surface2', sans: 'sans' }),
  scopeCss(rd('legacy/lab/style.css'), '.m-lab', 'lab'),
  alias('.m-lab', { ...BASE, ink2: 'ink2', ink3: 'ink3', font: 'sans' }),
  scopeCss(rd('legacy/greedy/style.css'), '.m-gr', 'gr'),
  alias('.m-gr', { ...BASE, ink2: 'ink2', ok: 'ok', 'ok-soft': 'ok-soft', bad: 'bad', 'bad-soft': 'bad-soft', cand: 'cand', 'cand-soft': 'cand-soft', sans: 'sans' }),
  rd('style/modules.css'),
].join('\n');

/* ---------- JS ---------- */
const iife = (...parts) => `;(function(){'use strict';\n${parts.join('\n')}\n})();`;
const js = [
  rd('core/base.js'),
  rd('legacy/dp8/engines.js'),
  rd('legacy/dp8/content.js'),
  rd('legacy/dp8/ui.js'),
  iife(rd('legacy/lab/lib.js').replace(/^'use strict';?/m, ''), rd('legacy/lab/p1.js'), rd('legacy/lab/p2.js'), rd('legacy/lab/p3.js'), rd('legacy/lab/p4.js'), rd('legacy/lab/ui.js')),
  iife(rd('legacy/greedy/logic.js'), rd('legacy/greedy/ui.js')),
  rd('content/greedy-problems.data.js'),
  rd('content/greedy-problems.js'),
  rd('content/topics.js'),
  rd('content/learn.js'),
  rd('content/extraq.js'),
  rd('content/week7.js'),
  rd('content/week7c.js'),
  rd('content/tm.js'),
  rd('core/quiz.js'),
  rd('content/pages.js'),
  rd('games/games.js'),
  rd('core/shell.js'),
].join('\n');
if (js.includes('</script')) throw new Error('JS มีคำว่า </script อยู่ข้างใน');

const html = `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>AlgoPrep 254383</title>
<meta name="description" content="ติวเตรียมสอบ 254383 Algorithm Design and Analysis: Dynamic Programming, Greedy, DTM/NTM พร้อมอนิเมชัน เกม และควิซ">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%231d5cab'/%3E%3Ctext x='16' y='21' font-size='13' font-family='monospace' font-weight='700' fill='white' text-anchor='middle'%3EO(n)%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=IBM+Plex+Sans+Thai:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap">
<style>
${css}
</style>
</head>
<body>
${rd('core/shell.html')}
<script>
${js}
</script>
</body>
</html>
`;
mkdirSync(join(ROOT, 'dist'), { recursive: true });
writeFileSync(join(ROOT, 'dist/index.html'), html);
// GitHub Pages เสิร์ฟจาก /docs
mkdirSync(join(ROOT, 'docs'), { recursive: true });
writeFileSync(join(ROOT, 'docs/index.html'), html);
console.log(`built dist/index.html (${(html.length / 1024).toFixed(0)} KB)`);
