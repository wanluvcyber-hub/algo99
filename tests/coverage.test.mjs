// ตรวจว่าเนื้อหาจากทุกเว็บเดิมมาครบใน AlgoPrep: node tests/coverage.test.mjs
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const rd = (p) => readFileSync(join(SRC, p), 'utf8');
let pass = 0;
const t = (name, fn) => { fn(); pass++; console.log('  ✓ ' + name); };

const win = { AP: { store: { ns: () => ({ get: (k, d) => d, set() {} }) }, hooks: {}, esc: (s) => s }, matchMedia: () => ({ matches: false }) };
win.window = win; win.globalThis = win;
const ctx = vm.createContext(win);
const run = (code, file) => vm.runInContext(code, ctx, { filename: file });

// dp-week8
run(rd('legacy/dp8/engines.js'), 'engines.js');
run(rd('legacy/dp8/content.js'), 'content.js');
const CH = win.CHAPTERS;
// dp-lab
const lab = vm.runInContext('(function(){' + ['lib', 'p1', 'p2', 'p3', 'p4'].map((f) => rd(`legacy/lab/${f}.js`).replace(/^'use strict';?/m, '')).join('\n') + ';return {PROBLEMS,GROUPS}})()', ctx);
// greedy: FIXED (นับจากซอร์ส) + logic (ฟังก์ชันล้วน)
run('(function(){' + rd('legacy/greedy/logic.js') + ';window.GR={PRESETS,mk,primSteps,kruskalSteps,dijkstraSteps,huffSteps,coinDP};})()', 'logic.js');
const uiSrc = rd('legacy/greedy/ui.js');
const fixedBlock = uiSrc.slice(uiSrc.indexOf('const FIXED=['), uiSrc.indexOf('function numOpts'));
const FIXED = vm.runInContext(fixedBlock.replace('const FIXED=', '(') .replace(/\];\s*$/, '])'), ctx);
run(rd('content/greedy-problems.data.js'), 'data.js');

console.log('เนื้อหาเดิมครบ');
t('dp-week8: 9 บท + Fibonacci = 9 บท, ควิซรวม 46 ข้อ', () => {
  assert.equal(CH.length, 9);
  assert.equal(CH.reduce((s, c) => s + c.quiz.length, 0), 46);
  CH.forEach((c) => { ['intro', 'idea', 'formula', 'complexity', 'pitfalls', 'cheat', 'modes'].forEach((k) => assert.ok(c[k], `${c.id} ไม่มี ${k}`)); });
});
t('dp-lab: 20 ข้อ, ควิซ 60, reflect 60, ทุกข้อมีโค้ด/สมการ/ไอเดีย', () => {
  assert.equal(lab.PROBLEMS.length, 20);
  assert.equal(lab.PROBLEMS.reduce((s, p) => s + p.quiz.length, 0), 60);
  assert.equal(lab.PROBLEMS.reduce((s, p) => s + p.reflect.length, 0), 60);
  lab.PROBLEMS.forEach((p) => { assert.ok(p.code && p.rec && p.idea.length && p.story, 'ข้อ ' + p.n); assert.ok(p.run().variants.length, 'run ข้อ ' + p.n); });
  assert.equal(lab.GROUPS.length, 4);
});
t('greedy-tutor: ควิซ FIXED 20 ข้อ และ preset กราฟ 4 ชุด', () => {
  assert.equal(FIXED.length, 20);
  assert.equal(Object.keys(win.GR.PRESETS).length, 4);
});
t('labgreedy: 12 โจทย์ ครบเฉลย (details) และไม่เหลือ ** / $ ดิบ', () => {
  const L = win.AP.LABGREEDY; assert.equal(L.length, 12);
  L.forEach((p, i) => { assert.equal(p.n, i + 1); assert.ok(p.html.includes('<details'), 'เฉลยข้อ ' + p.n); assert.ok(!/\*\*|\$\\/.test(p.html.replace(/<pre>[\s\S]*?<\/pre>/g, '')), 'ข้อ ' + p.n); });
});

console.log('ความถูกต้องของอัลกอริทึม (เทียบสไลด์)');
t('Prim/Kruskal บน G1 = 15, G3 = 22', () => {
  const { primSteps, kruskalSteps, mk, PRESETS } = win.GR;
  assert.equal(primSteps(mk(PRESETS.G1), 'a').result.total, 15);
  assert.equal(kruskalSteps(mk(PRESETS.G1)).result.total, 15);
  assert.equal(primSteps(mk(PRESETS.G3), 'A').result.total, 22);
});
t('Dijkstra G4 จาก a: d(e) = 9', () => assert.equal(win.GR.dijkstraSteps(win.GR.mk(win.GR.PRESETS.G4), 'a').result.d.e, 9));
t('coinDP {1,3,4} ยอด 6 = 2 เหรียญ', () => assert.equal(win.GR.coinDP([1, 3, 4], 6).count, 2));

console.log('เนื้อหาใหม่/โครงสร้างเว็บ');
// โหลดชั้นเนื้อหาใหม่ (ไม่ต้องใช้ DOM)
win.AP.dp8 = { CH, byId: (id) => CH.find((c) => c.id === id) };
win.AP.lab = { byId: (n) => lab.PROBLEMS.find((p) => p.n === n) };
run(rd('content/topics.js'), 'topics.js');
const A = win.AP;
t('topics: id ไม่ซ้ำ ทุก dp8/lab/gp ที่อ้างมีจริง', () => {
  const ids = A.TOPICS.map((x) => x.id); assert.equal(new Set(ids).size, ids.length);
  A.TOPICS.forEach((x) => { if (x.dp8) assert.ok(CH.find((c) => c.id === x.dp8), x.id); x.lab.forEach((n) => assert.ok(A.lab.byId(n), x.id + ' lab ' + n)); x.gp.forEach((n) => assert.ok(win.AP.LABGREEDY.find((p) => p.n === n), x.id + ' gp ' + n)); });
});
t('ครบ: DP 9 บทของ dp8 ถูกใช้ครบ, DP Lab 20 ข้อถูกจัดเข้าบท, Greedy 12 ข้อครบ', () => {
  assert.deepEqual(CH.map((c) => c.id).sort(), A.TOPICS.filter((x) => x.dp8).map((x) => x.dp8).sort());
  const labs = A.TOPICS.flatMap((x) => x.lab); for (let n = 1; n <= 20; n++) assert.ok(labs.includes(n), 'DP Lab ข้อ ' + n + ' ไม่อยู่ในบทใด');
  const gps = A.TOPICS.flatMap((x) => x.gp); for (let n = 1; n <= 12; n++) assert.ok(gps.includes(n), 'Greedy ข้อ ' + n);
});
t('ทุกบทมีหน้าเรียน: dp8 หรือ extra (learn/tm) และ lab ที่ไม่มี dp8 มี extra', () => {
  const src = rd('content/learn.js') + rd('content/tm.js') + rd('content/week7c.js');
  A.TOPICS.forEach((x) => { if (!x.dp8) assert.ok(x.extra && new RegExp(`L\\.${x.extra}\\s*=`).test(src), 'ไม่มีหน้าเรียน ' + x.id); });
});
t('ทุกบทมีควิซ ≥ 5 ข้อ (นับจากแหล่งที่โหลดได้)', () => {
  const eq = rd('content/extraq.js') + rd('content/tm.js') + rd('content/week7c.js');
  const count = (id) => { const m = eq.match(new RegExp(`(?:AP\\.EXTRAQ|\\bE)\\.${id}\\s*=\\s*\\[([\\s\\S]*?)\\n  \\];`)); const real = (eq.match(new RegExp(`\\b(?:mc|R)\\(\\d+, '${id}'`, 'g')) || []).length;
    return real + (m ? (m[1].match(/\bQ\(|\bN\(|type: 'num'/g) || []).length : 0); };
  A.TOPICS.forEach((x) => {
    let n = count(x.id) + (x.dp8 ? CH.find((c) => c.id === x.dp8).quiz.length : 0) + x.lab.length * 3 + x.gp.length * 2;
    if (x.tags.length) n += FIXED.filter((q) => x.tags.includes(q.tag)).length;
    assert.ok(n >= 5, `${x.id} มี ${n} ข้อ`);
  });
});
t('บท Part 3 มีอนิเมชัน (AP.tm.anim) และเนื้อหาเสริมกำกับ "เนื้อหาเพิ่ม"', () => {
  const s = rd('content/tm.js'); ['dtm', 'pnp'].forEach((k) => assert.ok(new RegExp(`A\\.${k}\\s*=`).test(s), k)); assert.ok(s.includes('U.extra('));
});
t('ไม่มีร่องรอยของหน้า AI/พิมพ์ตอบ ในเมนู', () => {
  assert.ok(!A.TOOLS.some((x) => x.id === 'reflect')); assert.ok(!/\['answer'/.test(rd('legacy/lab/ui.js')));
});
console.log(`\n${pass} กลุ่มการทดสอบผ่าน`);
