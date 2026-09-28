// เฉลยของ "ข้อสอบจริง" ต้องตรงกับเฉลยที่ระบบสอบเปิดให้ดู: node tests/exam.test.mjs
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const rd = (p) => readFileSync(join(SRC, p), 'utf8');
const win = { AP: { store: { ns: () => ({ get: (k, d) => d, set() {} }) }, hooks: {}, esc: (s) => s, toast() {} }, document: {}, matchMedia: () => ({ matches: false }) };
win.window = win; const ctx = vm.createContext(win);
const run = (c, f) => vm.runInContext(c, ctx, { filename: f });
win.AP.gr = { SUMMARY: '<div class="table-scroll"><table class="cmp"></table></div>' };
win.AP.topic = (id) => ({ no: id, short: id });
run(rd('content/topics.js'), 't'); run(rd('content/learn.js'), 'l'); run(rd('content/week7.js'), 'w7'); run(rd('content/week7c.js'), 'w7c');
const A = win.AP; let n = 0; const t = (name, fn) => { fn(); n++; console.log('  ✓ ' + name); };
const R = (k) => A.REALEXAM.find((q) => q.n === k);
t('มี 25 ข้อ ครบเลข 1–25 และ mc ทุกข้อมีเฉลยอยู่ในตัวเลือก', () => {
  assert.equal(A.REALEXAM.length, 25);
  for (let k = 1; k <= 25; k++) { const q = R(k); assert.ok(q, 'ข้อ ' + k); if (!q.type) assert.ok(q.a >= 0 && q.a < q.opts.length, 'ข้อ ' + k); assert.ok(A.topic(q.topic), 'topic ข้อ ' + k); }
});
t('ข้อ 5 Horspool "bacedbcdeeda" = เฉลยระบบสอบ', () => assert.equal(R(5).ans, 'a:10 b:6 c:5 d:1 e:2 *:12'));
t('ข้อ 13 Coin-row = 119', () => assert.equal(R(13).ans, '119'));
t('ข้อ 16 Floyd = เฉลยระบบสอบ', () => assert.equal(R(16).ans, '[[0 3 5 6] [5 0 2 3] [3 6 0 1] [2 5 7 0]]'));
t('ข้อ 18 Huffman เฉลี่ย = 1.73', () => assert.equal(R(18).ans, '1.73'));
const dij = (ce) => { const E = { A: { B: 5, C: 1 }, C: { B: 1, D: 8, E: ce }, B: { D: 3 }, E: { B: 2, D: 2 } }, d = { A: 0 }, done = new Set();
  while (done.size < 5) { const u = Object.keys(d).filter((x) => !done.has(x)).sort((a, b) => d[a] - d[b])[0]; done.add(u); for (const [v, w] of Object.entries(E[u] || {})) if (d[v] === undefined || d[u] + w < d[v]) d[v] = d[u] + w; }
  return [d.B, d.C, d.D, d.E]; };
t('ข้อ 7 Dijkstra: ตามโจทย์ (C→E = 1) ได้ B,C,D,E = 2,1,4,2 และกรณีเฉลยระบบ (C→E = 2) = 2,1,5,3', () => {
  assert.deepEqual(dij(1), [2, 1, 4, 2]); assert.deepEqual(dij(2), [2, 1, 5, 3]);
  assert.ok(R(7).ans.includes('A->C->E:2') && R(7).ans.includes('->D:4') && R(7).alt.some((x) => x.includes('A->C->E:3') && x.includes(':5')));
});
t('ข้อสอบทุกข้อถูกผูกกับบทที่มีอยู่จริง', () => A.REALEXAM.forEach((q) => assert.ok(A.TOPICS.some((x) => x.id === q.topic), q.topic)));
t('Week 7: 7 บท มีหน้าเรียน + ควิซ ≥ 3 ข้อ และอนิเมชันครบ 6 แบบ', () => {
  const ids = ['sti', 'cmp', 'dist', 'hor', 'bm', 'hash', 'bt']; ids.forEach((id) => { assert.ok(A.TOPICS.find((x) => x.id === id), id); assert.equal(typeof A.learn[id], 'function', 'learn ' + id); assert.ok((A.EXTRAQ[id] || []).length + A.REALEXAM.filter((q) => q.topic === id).length >= 3, 'quiz ' + id); });
  assert.deepEqual(Object.keys(A.w7.DEMOS).sort(), ['bm', 'bt', 'cmp', 'dist', 'hash', 'hor']);
});
console.log(`\n${n} กลุ่มการทดสอบผ่าน`);
