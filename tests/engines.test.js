// ตรวจ engine ทุกตัวกับคำตอบที่ปรากฏในสไลด์ Week 8
const E = require('../src/legacy/dp8/engines.js');
const assert = require('assert');
const INF = Infinity;
let pass = 0;
const t = (name, fn) => { try { fn(); pass++; console.log('  ✓', name); } catch (e) { console.error('  ✗', name, '\n   ', e.message); process.exitCode = 1; } };
const eq = (a, b) => assert.deepStrictEqual(a, b);
const nearly = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

t('Fibonacci: F(3)=2, F(10)=55, ตารางกับ tree ตรงกัน', () => {
  eq(E.fibTable(3).result.value, 2);
  eq(E.fibTable(10).result.value, 55);
  eq(E.fibTree(6, false).result.value, 8);
  eq(E.fibTree(6, true).result.value, 8);
  eq(E.fibTree(5, false).result.calls, E.naiveCalls(5));
  assert.ok(E.fibTree(6, true).result.calls < E.fibTree(6, false).result.calls);
});
t('Coin-row 5,1,2,10,6,2 = 17 (สไลด์ 13–16)', () => {
  const r = E.coinRow([5, 1, 2, 10, 6, 2]);
  eq(r.result.value, 17);
  eq(r.result.picks.reduce((s, i) => s + [5, 1, 2, 10, 6, 2][i - 1], 0), 17);
  // ตาราง F ต้องเป็น 0 5 5 7 15 15 17
  const last = r.steps[r.steps.length - 2].tables[0].cells[1].map((c) => c.t);
  eq(last, ['0', '5', '5', '7', '15', '15', '17']);
  // โจทย์ในแอปสไลด์ 17–18
  eq(E.solve.coinRow([88, 16, 91, 36, 11, 29, 50]), 240);
  eq(E.solve.coinRow([57, 33, 88, 15, 2, 21, 52]), 199);
  eq(E.solve.coinRow([99, 47, 42, 20, 39, 78, 60]), 240);
  eq(E.solve.coinRow([45, 28, 28, 73, 46, 33, 78]), 197);
});
t('Change-making: 6 ด้วย {1,3,4} = 2 (3+3), 20 ด้วย {1,2,5,10} = 2', () => {
  const a = E.changeMaking([1, 3, 4], 6);
  eq(a.result.value, 2); eq(a.result.coins.slice().sort(), [3, 3]); eq(a.result.greedy, 3);
  eq(E.changeMaking([1, 2, 5, 10], 20).result.value, 2);
  eq(E.changeMaking([2, 5], 3).result.value, INF);
});
t('Coin-collection กระดานสไลด์ 5×6 = 5 และตาราง F ตรงกับสไลด์ (b)', () => {
  const G = [[0, 0, 0, 0, 1, 0], [0, 1, 0, 1, 0, 0], [0, 0, 0, 1, 0, 1], [0, 0, 1, 0, 0, 1], [1, 0, 0, 0, 1, 0]];
  const r = E.coinCollect(G);
  eq(r.result.value, 5);
  const fin = r.steps[r.steps.length - 2].tables[0].cells.map((row) => row.map((c) => Number(c.t)));
  eq(fin, [[0, 0, 0, 0, 1, 1], [0, 1, 1, 2, 2, 2], [0, 1, 1, 3, 3, 4], [0, 1, 2, 3, 3, 5], [1, 1, 2, 3, 4, 5]]);
});
t('6,9,20: n=25 → 6,9,12,15,18,20,21,24; 5 → ไม่มี; ใหญ่สุดที่สร้างไม่ได้ = 43', () => {
  eq(E.olympic([6, 9, 20], 25).result.list, [6, 9, 12, 15, 18, 20, 21, 24]);
  eq(E.olympic([6, 9, 20], 5).result.list, []);
  const z = E.olympic([6, 9, 20], 80).result.z;
  let last = 0; for (let i = 0; i <= 80; i++) if (!z[i]) last = i;
  eq(last, 43);
});
t('Knapsack สไลด์ 37–47 = 37 และตารางตรงกัน, MF คำนวณ 11 ช่อง', () => {
  const w = [2, 1, 3, 2], v = [12, 10, 20, 15];
  const r = E.knapsack(w, v, 5);
  eq(r.result.value, 37); eq(r.result.items, [1, 2, 4]);
  const fin = r.steps[r.steps.length - 2].tables[0].cells.map((row) => row.map((c) => Number(c.t)));
  eq(fin, [[0, 0, 0, 0, 0, 0], [0, 0, 12, 12, 12, 12], [0, 10, 12, 22, 22, 22], [0, 10, 12, 22, 30, 32], [0, 10, 15, 25, 30, 37]]);
  const mf = E.knapsackMF(w, v, 5);
  eq(mf.result.value, 37); eq(mf.result.computed, 11); eq(mf.result.total, 20);
  // ช่องที่คำนวณต้องตรงสไลด์ ต.ย.2 (ช่องที่เหลือว่าง)
  const g = mf.steps[mf.steps.length - 1].tables[0].cells.map((row) => row.map((c) => c.t));
  eq(g[2], ['0', '', '12', '22', '', '22']); eq(g[3], ['0', '', '', '22', '', '32']); eq(g[4], ['0', '', '', '', '', '37']);
});
t('Optimal BST: A–D = .1 .2 .4 .3 → 1.7, ราก 3 ; ตารางตรงสไลด์', () => {
  const r = E.obst([0.1, 0.2, 0.4, 0.3], ['A', 'B', 'C', 'D']);
  nearly(r.result.value, 1.7); eq(r.result.root, 3);
  const C = r.result.C, R = r.result.R;
  nearly(C[1][2], 0.4); nearly(C[1][3], 1.1); nearly(C[2][3], 0.8); nearly(C[2][4], 1.4); nearly(C[3][4], 1.0);
  eq([R[1][2], R[1][3], R[1][4], R[2][3], R[2][4], R[3][4]], [2, 3, 3, 3, 3, 3]);
  // สไลด์ 61
  const r2 = E.obst([0.1, 0.4, 0.2, 0.3], ['A', 'B', 'C', 'D']);
  nearly(r2.result.C[1][2], 0.6); nearly(r2.result.C[1][3], 1.0); nearly(r2.result.C[1][4], 1.8); eq(r2.result.R[1][4], 2);
  // สไลด์ 62
  const r3 = E.obst([0.18, 0.25, 0.09, 0.21, 0.27], 'ABCDE'.split(''));
  nearly(r3.result.C[1][5], 2.06); nearly(r3.result.C[1][2], 0.61); nearly(r3.result.C[2][5], 1.52); eq(r3.result.R[1][5], 4);
  // สไลด์ 49–52: ความถี่ 3,4,5 → ต้นทุนต่ำสุด 20 (B เป็นราก)
  const r4 = E.obst([3, 4, 5], ['A', 'B', 'C']);
  eq(r4.result.value, 20); eq(r4.result.root, 2);
});
t('Warshall สไลด์ 66–71: closure ตรง', () => {
  const A = [[0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 0, 0], [1, 0, 1, 0]];
  eq(E.warshall(A).result.matrix, [[1, 1, 1, 1], [1, 1, 1, 1], [0, 0, 0, 0], [1, 1, 1, 1]]);
  // สไลด์ 72 (5 node)
  eq(E.warshall([[0, 1, 0, 0, 1], [0, 0, 0, 1, 0], [0, 0, 0, 1, 0], [0, 1, 0, 0, 0], [1, 0, 0, 1, 0]]).result.matrix,
    [[1, 1, 0, 1, 1], [0, 1, 0, 1, 0], [0, 1, 0, 1, 0], [0, 1, 0, 1, 0], [1, 1, 0, 1, 1]]);
  // สไลด์ 73 (6 node)
  eq(E.warshall([[0, 1, 0, 0, 0, 1], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 1, 0, 0], [1, 0, 0, 0, 0, 0]]).result.matrix,
    [[1, 1, 0, 0, 0, 1], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 1, 0, 0], [1, 1, 0, 0, 0, 1]]);
});
t('Floyd สไลด์ 75–79: D(4) ตรง และ D(1..3) ตรง', () => {
  const W = [[0, INF, 3, INF], [2, 0, INF, INF], [INF, 7, 0, 1], [6, INF, INF, 0]];
  const r = E.floyd(W);
  eq(r.result.matrix, [[0, 10, 3, 4], [2, 0, 5, 6], [7, 7, 0, 1], [6, 16, 9, 0]]);
  const mats = r.steps.filter((s) => /^D<sup>\(\d\)<\/sup>$/.test(s.tables[0].name)).map((s) => s.tables[0].cells.map((row) => row.map((c) => (c.t === '∞' ? INF : Number(c.t)))));
  eq(mats[0], [[0, INF, 3, INF], [2, 0, 5, INF], [INF, 7, 0, 1], [6, INF, 9, 0]]);  // D(1)
  eq(mats[1], [[0, INF, 3, INF], [2, 0, 5, INF], [9, 7, 0, 1], [6, INF, 9, 0]]);   // D(2)
  eq(mats[2], [[0, 10, 3, 4], [2, 0, 5, 6], [9, 7, 0, 1], [6, 16, 9, 0]]);          // D(3)
});
t('ทุก step มี tables/note และ ask.answer สอดคล้องกับค่าในช่องที่ซ่อน', () => {
  const runs = [E.fibTable(8), E.fibTree(5, false), E.fibTree(5, true), E.coinRow([5, 1, 2, 10, 6, 2]), E.changeMaking([1, 3, 4], 6),
    E.coinCollect([[0, 1], [1, 0]]), E.olympic([6, 9, 20], 25), E.knapsack([2, 1, 3, 2], [12, 10, 20, 15], 5), E.knapsackMF([2, 1, 3, 2], [12, 10, 20, 15], 5),
    E.obst([0.1, 0.2, 0.4], ['A', 'B', 'C']), E.warshall([[0, 1, 0], [0, 0, 1], [0, 0, 0]]), E.floyd([[0, 1, INF], [INF, 0, 1], [1, INF, 0]])];
  runs.forEach((r) => r.steps.forEach((s, i) => {
    assert.ok(Array.isArray(s.tables) && typeof s.note === 'string' && s.line !== undefined, 'step ' + i);
    if (s.ask) {
      assert.ok(s.ask.answer !== undefined && s.ask.q);
      (s.ask.hide || []).forEach(([ti, rr, cc]) => assert.ok(s.tables[ti].cells[rr][cc], 'hide ตำแหน่งต้องมีจริง'));
      const first = (s.ask.hide || [])[0];
      if (first && s.tables[first[0]].name.indexOf('root') < 0 && s.tables[0].kind !== 'mat' || (first && s.tables[first[0]].name.startsWith('main'))) {
        const shown = s.tables[first[0]].cells[first[1]][first[2]].t;
        const ans = s.ask.answer;
        const cell = shown === '✓' ? 1 : shown === '–' ? 0 : shown === '∞' ? INF : Number(shown);
        if (!Number.isNaN(cell) && s.ask.hide.length === 1) assert.ok(Math.abs(cell - ans) < 1e-9, `step ${i}: ${shown} vs ${ans}`);
      }
    }
  }));
});
console.log(`\n${pass} กลุ่มการทดสอบผ่าน`);
