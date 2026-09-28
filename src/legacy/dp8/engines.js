/* engines.js — อัลกอริทึม DP ทุกตัว คืนค่าเป็น "รายการสเต็ป" (ไม่ผูกกับ DOM)
 *
 * step = {
 *   tables: [{name, corner, cols[], rows[], cells[[{t,c}]], kind, colCls[], rowCls[]}],
 *   svg:    {type:'tree'|'graph', ...} | undefined,
 *   note:   HTML อธิบายสเต็ป,
 *   line:   เลขบรรทัด pseudocode ที่กำลังทำงาน (int | int[] | -1),
 *   ask:    {q, answer, hide:[[tableIdx,r,c]], hideNodes:[id], hints:[], hint, choices?, noType?, fmt?}
 * }
 * class ของช่อง: cur (กำลังคำนวณ) · dep (ถูกอ้างอิง) · pick (คำตอบ) · piv (แถว/คอลัมน์หลัก)
 *               hit (ดึงจาก memo) · empty (ยังว่าง) · coin (มีเหรียญ)
 */
(function (root) {
  'use strict';
  const INF = Infinity;
  const r6 = (x) => Math.round(x * 1e6) / 1e6;
  const fmt = (x) => (x === INF ? '∞' : String(r6(x)));
  const LET = 'abcdefghij';

  /* ---------- helpers ---------- */
  class Hl {
    constructor() { this.m = {}; }
    add(r, c, cls) { const k = r + ',' + c; this.m[k] = this.m[k] ? this.m[k] + ' ' + cls : cls; return this; }
    get(r, c) { return this.m[r + ',' + c] || ''; }
  }
  function tbl(name, cols, rows, fn, o) {
    const cells = rows.map((_, r) => cols.map((_, c) => {
      const v = fn(r, c) || {};
      return { t: v.t == null ? '' : String(v.t), c: v.c || '' };
    }));
    return Object.assign({ name, cols, rows, cells, kind: 'row' }, o || {});
  }
  const range = (a, b) => { const o = []; for (let i = a; i <= b; i++) o.push(i); return o; };
  const M = (a) => a.map((r) => r.slice());
  const ask = (q, answer, hide, hints, hint, extra) => Object.assign({ q, answer, hide, hints: hints || [], hint }, extra || {});
  const list = (a) => a.join(', ');

  /* ---------- pseudocode (ตามสไลด์) ---------- */
  const CODE = {
    fibNaive: ['Fib(n):', '  if n ≤ 1: return n', '  return Fib(n−1) + Fib(n−2)'],
    fibMemo: ['Fib(n):', '  if n ≤ 1: return n', '  if memo[n] มีค่าแล้ว: return memo[n]', '  memo[n] ← Fib(n−1) + Fib(n−2)', '  return memo[n]'],
    fibTable: ['F[0] ← 0;  F[1] ← 1', 'for i ← 2 to n do', '    F[i] ← F[i−1] + F[i−2]', 'return F[n]'],
    coinrow: ['F[0] ← 0;  F[1] ← C[1]', 'for i ← 2 to n do', '    F[i] ← max(C[i] + F[i−2], F[i−1])', 'return F[n]'],
    change: ['F[0] ← 0', 'for i ← 1 to n do', '    temp ← ∞;  j ← 1', '    while j ≤ m and i ≥ D[j] do', '        temp ← min(F[i − D[j]], temp)', '        j ← j + 1', '    F[i] ← temp + 1', 'return F[n]'],
    collect: ['F[1,1] ← C[1,1]', 'for j ← 2 to m do  F[1,j] ← F[1,j−1] + C[1,j]', 'for i ← 2 to n do', '    F[i,1] ← F[i−1,1] + C[i,1]', '    for j ← 2 to m do', '        F[i,j] ← max(F[i−1,j], F[i,j−1]) + C[i,j]', 'return F[n,m]'],
    olympic: ['z[0] ← จริง', 'for i ← 1 to n do', '    z[i] ← มี d ใน D ที่ i ≥ d และ z[i − d] เป็นจริง', 'แสดงทุก i ที่ z[i] เป็นจริง'],
    knap: ['F[0,j] ← 0;  F[i,0] ← 0', 'for i ← 1 to n do', '    for j ← 1 to W do', '        if j < w[i]:  F[i,j] ← F[i−1,j]', '        else:  F[i,j] ← max(F[i−1,j], v[i] + F[i−1,j−w[i]])', 'return F[n,W]'],
    mfk: ['MFKnapsack(i, j):', '  if F[i,j] < 0:                 // ยังไม่เคยคำนวณ', '    if j < w[i]:', '      value ← MFKnapsack(i−1, j)', '    else:', '      value ← max(MFKnapsack(i−1, j), v[i] + MFKnapsack(i−1, j−w[i]))', '    F[i,j] ← value', '  return F[i,j]'],
    obst: ['for i ← 1 to n do', '    C[i,i−1] ← 0;  C[i,i] ← P[i];  R[i,i] ← i', 'C[n+1,n] ← 0', 'for d ← 1 to n−1 do            // ไล่ทีละเส้นทแยง', '    for i ← 1 to n−d do', '        j ← i + d;  minval ← ∞', '        for k ← i to j do', '            if C[i,k−1] + C[k+1,j] < minval:', '                minval ← C[i,k−1] + C[k+1,j];  kmin ← k', '        R[i,j] ← kmin', '        C[i,j] ← minval + (P[i] + … + P[j])', 'return C[1,n], R'],
    warshall: ['R(0) ← A', 'for k ← 1 to n do', '    for i ← 1 to n do', '        for j ← 1 to n do', '            R[i,j] ← R[i,j]  or  (R[i,k]  and  R[k,j])', 'return R(n)'],
    floyd: ['D ← W', 'for k ← 1 to n do', '    for i ← 1 to n do', '        for j ← 1 to n do', '            D[i,j] ← min(D[i,j], D[i,k] + D[k,j])', 'return D'],
  };

  /* ---------- 0. Fibonacci ---------- */
  function fibTable(n) {
    const F = [], steps = [], cols = range(0, n);
    const snap = (hl, note, line, a) => steps.push({
      tables: [tbl('ตาราง F(n)', cols, ['F'], (r, c) => (F[c] === undefined ? { t: '', c: 'empty ' + hl.get(0, c) } : { t: F[c], c: hl.get(0, c) }), { corner: 'n' })],
      note, line, ask: a,
    });
    snap(new Hl(), `ต้องการ <b>F(${n})</b> — สร้างตารางว่างขนาด ${n + 1} ช่อง แล้วเติมจากซ้ายไปขวา`, -1);
    F[0] = 0; F[1] = 1;
    snap(new Hl().add(0, 0, 'cur').add(0, 1, 'cur'), 'ค่าเริ่มต้น (base case): <b>F(0) = 0</b> และ <b>F(1) = 1</b>', 0);
    for (let i = 2; i <= n; i++) {
      F[i] = F[i - 1] + F[i - 2];
      snap(new Hl().add(0, i, 'cur').add(0, i - 1, 'dep').add(0, i - 2, 'dep'),
        `F(${i}) = F(${i - 1}) + F(${i - 2}) = ${F[i - 1]} + ${F[i - 2]} = <b>${F[i]}</b> · ใช้ค่าที่จดไว้แล้ว ไม่ต้องคำนวณซ้ำ`, [1, 2],
        ask(`F(${i}) = ?`, F[i], [[0, 0, i]], [F[i - 1], F[i - 2], F[i - 1] * 2], `F(${i}) = F(${i - 1}) + F(${i - 2}) — ดูสองช่องสีเหลือง`));
    }
    const h = new Hl(); cols.forEach((c) => h.add(0, c, 'pick'));
    snap(h, `ได้ <b>F(${n}) = ${F[n]}</b> · ใช้การบวกเพียง ${n - 1} ครั้ง (เวลา Θ(n)) เทียบกับการเรียกซ้ำตรง ๆ ที่ต้องเรียก ${naiveCalls(n)} ครั้ง`, 3);
    return { steps, result: { value: F[n] } };
  }
  function naiveCalls(n) { return n < 2 ? 1 : 1 + naiveCalls(n - 1) + naiveCalls(n - 2); }

  function fibTree(n, memo) {
    let id = 0;
    const nodes = [], events = [], memoT = {};
    function rec(k, depth) {
      const nd = { id: id++, k, depth, ch: [], val: null };
      nodes.push(nd);
      if (k < 2) { nd.val = k; events.push({ t: 'leaf', nd }); return nd; }
      if (memo && k in memoT) { nd.val = memoT[k]; events.push({ t: 'hit', nd }); return nd; }
      events.push({ t: 'call', nd });
      nd.ch.push(rec(k - 1, depth + 1));
      nd.ch.push(rec(k - 2, depth + 1));
      nd.val = nd.ch[0].val + nd.ch[1].val;
      if (memo) memoT[k] = nd.val;
      events.push({ t: 'ret', nd });
      return nd;
    }
    const root = rec(n, 0);
    let leaf = 0, maxD = 0;
    (function lay(nd) {
      maxD = Math.max(maxD, nd.depth);
      if (!nd.ch.length) nd.x = leaf++;
      else { nd.ch.forEach(lay); nd.x = (nd.ch[0].x + nd.ch[nd.ch.length - 1].x) / 2; }
    })(root);
    const DX = 56, DY = 66, PAD = 36;
    const W = Math.max(220, (leaf - 1) * DX + PAD * 2), H = maxD * DY + PAD * 2 + 10;
    const edges = [];
    nodes.forEach((nd) => nd.ch.forEach((c) => edges.push([nd.id, c.id])));

    const state = nodes.map(() => 'hidden');
    const seen = {};
    const steps = [];
    const snap = (note, line, a) => {
      const shown = nodes.filter((nd) => state[nd.id] !== 'hidden');
      const cnt = {}; shown.forEach((nd) => { cnt[nd.k] = (cnt[nd.k] || 0) + 1; });
      steps.push({
        tables: [],
        svg: {
          type: 'tree', w: W, h: H,
          nodes: nodes.map((nd) => {
            const s = state[nd.id];
            let cls = s;
            if (!memo && s === 'done' && cnt[nd.k] > 1 && nd.k > 1) cls = 'dupe';
            if (!memo && s !== 'hidden' && s !== 'call' && cnt[nd.k] > 1 && nd.k <= 1) cls = 'dupe';
            return { id: nd.id, x: PAD + nd.x * DX, y: PAD + nd.depth * DY, label: `F(${nd.k})`, sub: s === 'done' || s === 'hit' ? String(nd.val) : (s === 'call' ? '…' : ''), cls };
          }),
          edges: edges.filter(([a, b]) => state[b] !== 'hidden').map(([a, b]) => ({ a, b })),
        },
        note, line, ask: a,
      });
    };
    snap(`ต้องการ <b>F(${n})</b> — ${memo ? 'เรียกแบบเรียกซ้ำ แต่คอยจดผลลัพธ์ (memo) ไว้' : 'เรียกซ้ำตามสูตรตรง ๆ ดูว่าเกิดอะไรขึ้น'}`, 0);
    let calls = 0;
    events.forEach((e) => {
      const nd = e.nd, k = nd.k;
      calls++;
      if (e.t === 'call') { state[nd.id] = 'call'; snap(`เรียก <b>F(${k})</b> → ยังไม่รู้ค่า ต้องเรียก F(${k - 1}) และ F(${k - 2}) ก่อน`, memo ? [2, 3] : 2); }
      else if (e.t === 'leaf') { state[nd.id] = 'done'; snap(`F(${k}) = ${k} (base case คืนค่าทันที)`, 1); }
      else if (e.t === 'hit') { state[nd.id] = 'hit'; snap(`<b>F(${k}) เคยคำนวณไว้แล้ว</b> → ดึงจาก memo = ${nd.val} ทันที ไม่ต้องเรียกลึกต่อ`, [2]); }
      else {
        state[nd.id] = 'done';
        const a = nd.ch[0].val, b = nd.ch[1].val;
        snap(`F(${k}) = F(${k - 1}) + F(${k - 2}) = ${a} + ${b} = <b>${nd.val}</b> แล้วส่งค่ากลับขึ้นไป`, memo ? [3, 4] : 2,
          Object.assign(ask(`F(${k}) = ?`, nd.val, [], [a, b, a * 2], `F(${k}) = F(${k - 1}) + F(${k - 2}) — บวกค่าของสองกิ่งลูกที่อยู่ด้านล่าง`), { hideNodes: [nd.id] }));
      }
    });
    // สรุป
    const cnt = {}; nodes.forEach((nd) => { cnt[nd.k] = (cnt[nd.k] || 0) + 1; });
    const total = nodes.length;
    let summary;
    if (!memo) {
      const rep = Object.keys(cnt).filter((k) => cnt[k] > 1).map((k) => `F(${k}) ถูกคำนวณ ${cnt[k]} ครั้ง`);
      summary = `เรียกทั้งหมด <b>${total} ครั้ง</b> แต่มีค่าต่างกันเพียง ${n + 1} ค่า · ${rep.length ? 'ซ้ำ: ' + rep.join(' · ') : ''}<br>โหนดสีเหลืองคือ<b>ปัญหาย่อยที่ซ้อนทับ</b> — จุดที่ DP เข้ามาช่วย`;
    } else {
      summary = `เรียกทั้งหมด <b>${total} ครั้ง</b> (ถ้าไม่จำค่าต้องเรียก ${naiveCalls(n)} ครั้ง) · โหนดสีเขียวคือครั้งที่ดึงจาก memo แทนการคำนวณใหม่ — เหลือคำนวณจริงเพียง ${n + 1} ค่า`;
    }
    snap(`ได้ <b>F(${n}) = ${root.val}</b><br>${summary}`, -1);
    return { steps, result: { value: root.val, calls: total } };
  }

  /* ---------- 1. Coin-row ---------- */
  function coinRow(C) {
    const n = C.length, F = [], steps = [], cols = range(0, n);
    const snap = (hl, note, line, a) => steps.push({
      tables: [tbl('ตาราง', cols, ['C (ค่าเหรียญ)', 'F'], (r, c) => {
        const cls = hl.get(r, c);
        if (r === 0) return c === 0 ? { t: '', c: 'empty ' + cls } : { t: C[c - 1], c: cls };
        return F[c] === undefined ? { t: '', c: 'empty ' + cls } : { t: F[c], c: cls };
      }, { corner: 'index' })],
      note, line, ask: a,
    });
    snap(new Hl(), `แถวเหรียญ C = [${list(C)}] · F[i] = "ค่ามากสุดที่หยิบได้จากเหรียญ 1..i โดยไม่หยิบติดกัน"`, -1);
    F[0] = 0; F[1] = C[0];
    snap(new Hl().add(1, 0, 'cur').add(1, 1, 'cur').add(0, 1, 'dep'), `ค่าเริ่มต้น: F[0] = 0 (ไม่มีเหรียญ) และ F[1] = C[1] = ${C[0]} (มีเหรียญเดียว หยิบเลย)`, 0);
    for (let i = 2; i <= n; i++) {
      const take = C[i - 1] + F[i - 2], skip = F[i - 1];
      F[i] = Math.max(take, skip);
      snap(new Hl().add(1, i, 'cur').add(0, i, 'dep').add(1, i - 2, 'dep').add(1, i - 1, 'dep'),
        `F[${i}] = max{ C[${i}] + F[${i - 2}], F[${i - 1}] } = max{ ${C[i - 1]} + ${F[i - 2]}, ${F[i - 1]} } = max{ ${take}, ${skip} } = <b>${F[i]}</b><br>${take >= skip ? `→ <b>หยิบ</b>เหรียญที่ ${i} (ได้ ${take})` : `→ <b>ข้าม</b>เหรียญที่ ${i} (ได้ ${skip} ดีกว่า)`}`, [1, 2],
        ask(`F[${i}] = ?`, F[i], [[0, 1, i]], [take, skip, C[i - 1] + F[i - 1]], `F[${i}] = max{ C[${i}] + F[${i - 2}], F[${i - 1}] } — ตัวเลือก "หยิบ" ต้องข้ามเหรียญ ${i - 1}`));
    }
    const picks = []; const h = new Hl();
    for (let i = n; i >= 1;) {
      if (i === 1 || C[i - 1] + F[i - 2] >= F[i - 1]) { picks.push(i); h.add(0, i, 'pick'); i -= 2; } else i -= 1;
    }
    picks.reverse();
    h.add(1, n, 'pick');
    snap(h, `คำตอบ: <b>F[${n}] = ${F[n]}</b><br>ย้อนรอยจากท้าย: หยิบเหรียญที่ ${list(picks)} (ค่า ${list(picks.map((p) => C[p - 1]))}) รวม ${F[n]}`, 3);
    return { steps, result: { value: F[n], picks } };
  }

  /* ---------- 2. Change-making ---------- */
  function changeMaking(D, n) {
    const F = [], used = [], steps = [], cols = range(0, n);
    const snap = (hl, note, line, a) => steps.push({
      tables: [tbl('ตาราง', cols, ['F (จำนวนเหรียญ)', 'เหรียญที่ใช้ล่าสุด'], (r, c) => {
        const cls = hl.get(r, c);
        const v = r === 0 ? F[c] : used[c];
        return v === undefined ? { t: '', c: 'empty ' + cls } : { t: v === null ? '–' : fmt(v), c: cls };
      }, { corner: 'ยอดเงิน i' })],
      note, line, ask: a,
    });
    snap(new Hl(), `เหรียญที่มี D = {${list(D)}} · ต้องการยอด n = ${n} · F[i] = "จำนวนเหรียญน้อยสุดที่รวมได้ i"`, -1);
    F[0] = 0; used[0] = null;
    snap(new Hl().add(0, 0, 'cur').add(1, 0, 'cur'), 'F[0] = 0 — ยอด 0 ไม่ต้องใช้เหรียญเลย', 0);
    for (let i = 1; i <= n; i++) {
      const cands = D.filter((d) => d <= i).map((d) => ({ d, v: F[i - d] + 1 }));
      let best = INF, bd = null;
      cands.forEach((c) => { if (c.v < best) { best = c.v; bd = c.d; } });
      F[i] = best; used[i] = bd;
      const hl = new Hl().add(0, i, 'cur').add(1, i, 'cur');
      cands.forEach((c) => hl.add(0, i - c.d, 'dep'));
      const expr = cands.length ? cands.map((c) => `F[${i - c.d}]+1`).join(', ') : '(ไม่มีเหรียญที่ใช้ได้)';
      const vals = cands.length ? cands.map((c) => fmt(c.v)).join(', ') : '∞';
      snap(hl, `F[${i}] = min{ ${expr} } = min{ ${vals} } = <b>${fmt(F[i])}</b>${bd ? `<br>→ ใช้เหรียญ <b>${bd}</b> เป็นเหรียญสุดท้าย` : ''}`, [1, 2, 3, 4, 5, 6],
        ask(`F[${i}] = ?`, F[i], [[0, 0, i], [0, 1, i]], cands.map((c) => c.v).concat(cands.map((c) => F[i - c.d])),
          `ลองเหรียญทีละชนิด: F[${i}] = min ของ F[${i} − d] + 1 (อย่าลืมบวก 1 สำหรับเหรียญที่เพิ่งใช้)`));
    }
    const h = new Hl(); const coins = [];
    if (F[n] < INF) for (let i = n; i > 0; i -= used[i]) { coins.push(used[i]); h.add(0, i, 'pick'); h.add(1, i, 'pick'); }
    h.add(0, 0, 'pick');
    let greedy = null;
    if (F[n] < INF) { let r = n, g = 0; [...D].reverse().forEach((d) => { g += Math.floor(r / d); r %= d; }); if (r === 0) greedy = g; }
    const gnote = greedy !== null && greedy > F[n] ? `<br>เทียบ: Greedy (หยิบเหรียญใหญ่สุดก่อน) ได้ ${greedy} เหรียญ — <b>แย่กว่า DP</b>` : '';
    snap(h, F[n] < INF ? `คำตอบ: <b>F[${n}] = ${F[n]}</b> เหรียญ · ย้อนรอย: ${coins.join(' + ')} = ${n}${gnote}` : `แลก ${n} ด้วยเหรียญชุดนี้<b>ไม่ได้</b> (F[${n}] = ∞) — ต้องมีเหรียญ 1 บาทจึงจะแลกได้ทุกยอด`, 7);
    return { steps, result: { value: F[n], coins, greedy } };
  }

  /* ---------- 3. Coin-collection ---------- */
  function coinCollect(C) {
    const n = C.length, m = C[0].length, F = range(0, n - 1).map(() => new Array(m).fill(null)), steps = [];
    const snap = (hl, note, line, a) => steps.push({
      tables: [tbl('กระดาน (● = มีเหรียญ, ตัวเลข = F[i,j])', range(1, m), range(1, n), (r, c) => ({
        t: F[r][c] === null ? '' : F[r][c], c: (F[r][c] === null ? 'empty ' : '') + (C[r][c] ? 'coin ' : '') + hl.get(r, c),
      }), { corner: 'i \\ j', kind: 'grid' })],
      note, line, ask: a,
    });
    snap(new Hl(), `หุ่นยนต์เริ่มที่มุมซ้ายบน (1,1) เดินได้แค่ <b>ขวา</b> หรือ <b>ลง</b> ไปมุมขวาล่าง (${n},${m}) · F[i,j] = "เหรียญมากสุดที่เก็บได้เมื่อมาถึงช่อง (i,j)"`, -1);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        const c = C[i][j], hl = new Hl().add(i, j, 'cur');
        let note, line, hints, hint;
        if (i === 0 && j === 0) { F[0][0] = c; note = `F[1,1] = C[1,1] = <b>${c}</b> (จุดเริ่มต้น)`; line = 0; }
        else if (i === 0) {
          F[i][j] = F[i][j - 1] + c; hl.add(i, j - 1, 'dep'); line = 1;
          note = `แถวแรก มาได้ทางเดียวคือจาก<b>ซ้าย</b>: F[1,${j + 1}] = F[1,${j}] + C = ${F[i][j - 1]} + ${c} = <b>${F[i][j]}</b>`;
          hints = [F[i][j - 1], F[i][j - 1] + 1]; hint = 'แถวแรกมาจากช่องซ้ายเท่านั้น แล้วบวกเหรียญของช่องนี้ (0 หรือ 1)';
        } else if (j === 0) {
          F[i][j] = F[i - 1][j] + c; hl.add(i - 1, j, 'dep'); line = 3;
          note = `คอลัมน์แรก มาได้ทางเดียวคือจาก<b>บน</b>: F[${i + 1},1] = F[${i},1] + C = ${F[i - 1][j]} + ${c} = <b>${F[i][j]}</b>`;
          hints = [F[i - 1][j], F[i - 1][j] + 1]; hint = 'คอลัมน์แรกมาจากช่องบนเท่านั้น แล้วบวกเหรียญของช่องนี้ (0 หรือ 1)';
        } else {
          const up = F[i - 1][j], left = F[i][j - 1];
          F[i][j] = Math.max(up, left) + c; hl.add(i - 1, j, 'dep').add(i, j - 1, 'dep'); line = [2, 4, 5];
          note = `F[${i + 1},${j + 1}] = max{ บน ${up}, ซ้าย ${left} } + C = ${Math.max(up, left)} + ${c} = <b>${F[i][j]}</b>`;
          hints = [up, left, Math.max(up, left), up + left + c]; hint = 'เลือกทางที่ได้เหรียญสะสมมากกว่า (บน/ซ้าย) แล้วค่อยบวกเหรียญของช่องนี้';
        }
        snap(hl, note, line, i === 0 && j === 0 ? undefined : ask(`F[${i + 1},${j + 1}] = ?`, F[i][j], [[0, i, j]], hints, hint));
      }
    }
    const h = new Hl(); const path = [];
    for (let i = n - 1, j = m - 1; ;) {
      path.push([i, j]); h.add(i, j, 'pick');
      if (i === 0 && j === 0) break;
      if (i === 0) j--; else if (j === 0) i--; else if (F[i - 1][j] >= F[i][j - 1]) i--; else j--;
    }
    path.reverse();
    snap(h, `คำตอบ: <b>F[${n},${m}] = ${F[n - 1][m - 1]}</b> เหรียญ · ช่องสีเขียวคือเส้นทางที่ได้ (ย้อนจากมุมขวาล่าง โดยเลือกช่อง บน/ซ้าย ที่มีค่ามากกว่า)`, 6);
    return { steps, result: { value: F[n - 1][m - 1], path } };
  }

  /* ---------- 4. โจทย์ 6, 9, 20 ---------- */
  function olympic(D, n) {
    const z = [], steps = [], cols = range(0, n), dmin = Math.min(...D);
    const snap = (hl, note, line, a) => steps.push({
      tables: [tbl('สร้างได้หรือไม่', cols, ['z[i]'], (r, c) => (z[c] === undefined ? { t: '', c: 'empty ' + hl.get(0, c) } : { t: z[c] ? '✓' : '–', c: (z[c] ? 'yes ' : 'no ') + hl.get(0, c) }), { corner: 'i' })],
      note, line, ask: a,
    });
    snap(new Hl(), `ตัวเลขที่ต้องการ: ผลรวมของ {${list(D)}} จำนวนกี่ตัวก็ได้ · z[i] = "สร้างเลข i ได้หรือไม่"`, -1);
    z[0] = true;
    snap(new Hl().add(0, 0, 'cur'), 'z[0] = ✓ (ไม่ใช้ตัวเลขใดเลย ได้ผลรวม 0)', 0);
    for (let i = 1; i <= n; i++) {
      const tests = D.filter((d) => d <= i).map((d) => ({ d, ok: z[i - d] }));
      z[i] = tests.some((t) => t.ok);
      const hl = new Hl().add(0, i, 'cur');
      tests.forEach((t) => hl.add(0, i - t.d, 'dep'));
      const why = tests.length ? tests.map((t) => `${i}−${t.d}=${i - t.d} (${t.ok ? '✓' : '✗'})`).join(', ') : 'เล็กกว่าทุกเลขในชุด';
      snap(hl, `เลข <b>${i}</b>: ${why} → <b>${z[i] ? 'สร้างได้' : 'สร้างไม่ได้'}</b>`, [1, 2],
        i >= dmin ? ask(`เลข ${i} สร้างได้หรือไม่?`, z[i] ? 1 : 0, [[0, 0, i]], [], `ดูว่ามี d ในชุดที่ z[${i} − d] เป็น ✓ หรือไม่ (ช่องสีเหลือง)`, { choices: [{ label: 'สร้างได้', value: 1 }, { label: 'สร้างไม่ได้', value: 0 }], noType: true }) : undefined);
    }
    const ok = cols.filter((i) => i > 0 && z[i]);
    const h = new Hl(); ok.forEach((i) => h.add(0, i, 'pick'));
    snap(h, ok.length ? `ตัวเลขที่สร้างได้ (≤ ${n}): <b>${list(ok)}</b>` : `ไม่มีเลขใด ≤ ${n} ที่สร้างได้`, 3);
    return { steps, result: { list: ok, z } };
  }

  /* ---------- 5. Knapsack ---------- */
  function knapsack(w, v, W) {
    const n = w.length, F = range(0, n).map(() => new Array(W + 1).fill(null)), steps = [];
    const rows = ['i = 0'].concat(range(1, n).map((i) => `i = ${i}  (w=${w[i - 1]}, v=${v[i - 1]})`));
    const snap = (hl, note, line, a) => steps.push({
      tables: [tbl('F(i, j) — มูลค่ามากสุดเมื่อพิจารณาของ i ชิ้นแรก ความจุ j', range(0, W), rows, (r, c) => ({ t: F[r][c] === null ? '' : F[r][c], c: (F[r][c] === null ? 'empty ' : '') + hl.get(r, c) }), { corner: 'j (ความจุ)', kind: 'grid' })],
      note, line, ask: a,
    });
    snap(new Hl(), `ของ ${n} ชิ้น น้ำหนัก w = [${list(w)}] มูลค่า v = [${list(v)}] · ความจุกระเป๋า W = ${W}`, -1);
    for (let j = 0; j <= W; j++) F[0][j] = 0;
    for (let i = 0; i <= n; i++) F[i][0] = 0;
    snap(new Hl(), 'แถว i = 0 (ยังไม่มีของให้เลือก) และคอลัมน์ j = 0 (ความจุ 0 ใส่อะไรไม่ได้) → เป็น 0 ทั้งหมด', 0);
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= W; j++) {
        const wi = w[i - 1], vi = v[i - 1], hl = new Hl().add(i, j, 'cur').add(i - 1, j, 'dep');
        if (j < wi) {
          F[i][j] = F[i - 1][j];
          snap(hl, `ช่อง (${i},${j}): น้ำหนักชิ้น ${i} = ${wi} > ความจุ ${j} → ใส่ไม่ได้ ใช้ค่าเดิมจากช่องบน = <b>${F[i][j]}</b>`, [1, 2, 3]);
        } else {
          hl.add(i - 1, j - wi, 'dep');
          const skip = F[i - 1][j], take = vi + F[i - 1][j - wi];
          F[i][j] = Math.max(skip, take);
          snap(hl, `F(${i},${j}) = max{ F(${i - 1},${j}), v${i} + F(${i - 1},${j - wi}) } = max{ ${skip}, ${vi} + ${F[i - 1][j - wi]} } = max{ ${skip}, ${take} } = <b>${F[i][j]}</b><br>${take > skip ? `→ <b>ใส่</b>ชิ้นที่ ${i}` : `→ <b>ไม่ใส่</b>ชิ้นที่ ${i}`}`, [1, 2, 4],
            ask(`F(${i},${j}) = ?`, F[i][j], [[0, i, j]], [skip, take, vi + F[i - 1][j]], `ไม่ใส่ชิ้น ${i} → F(${i - 1},${j}) · ใส่ชิ้น ${i} → v${i} + F(${i - 1},${j} − w${i}) แล้วเลือกค่ามากกว่า`));
        }
      }
    }
    const h = new Hl(), items = [];
    for (let i = n, j = W; i > 0; i--) {
      h.add(i, j, 'pick');
      if (F[i][j] !== F[i - 1][j]) { items.push(i); j -= w[i - 1]; }
    }
    items.reverse();
    const tw = items.reduce((s, i) => s + w[i - 1], 0);
    snap(h, `คำตอบ: <b>F(${n},${W}) = ${F[n][W]}</b> · ย้อนรอย: ใส่ชิ้นที่ ${items.length ? list(items) : '(ไม่มี)'} · น้ำหนักรวม ${tw} ≤ ${W}`, 5);
    return { steps, result: { value: F[n][W], items } };
  }

  function knapsackMF(w, v, W) {
    const n = w.length, F = range(0, n).map((i) => new Array(W + 1).fill(-1)), steps = [];
    for (let j = 0; j <= W; j++) F[0][j] = 0;
    for (let i = 0; i <= n; i++) F[i][0] = 0;
    const rows = ['i = 0'].concat(range(1, n).map((i) => `i = ${i}  (w=${w[i - 1]}, v=${v[i - 1]})`));
    const snap = (hl, note, line, a) => steps.push({
      tables: [tbl('F(i, j) — ช่องว่างคือช่องที่ไม่เคยถูกคำนวณ', range(0, W), rows, (r, c) => ({ t: F[r][c] < 0 ? '' : F[r][c], c: (F[r][c] < 0 ? 'empty ' : '') + hl.get(r, c) }), { corner: 'j (ความจุ)', kind: 'grid' })],
      note, line, ask: a,
    });
    snap(new Hl(), `Memory function: เริ่มถามจาก <b>F(${n},${W})</b> (top-down) แล้วเรียกลงไปเฉพาะช่องที่ต้องใช้จริง · ช่องที่คำนวณแล้วจะถูกจำไว้ (แถว/คอลัมน์ 0 ตั้งเป็น 0 ไว้ก่อน)`, 0);
    let computed = 0, hits = 0;
    function mfk(i, j) {
      if (F[i][j] >= 0) {
        if (i > 0 && j > 0) { hits++; snap(new Hl().add(i, j, 'hit'), `เรียก F(${i},${j}) อีกครั้ง — <b>เคยคำนวณไว้แล้ว = ${F[i][j]}</b> ใช้ค่าที่จำไว้ทันที ไม่ต้องคำนวณซ้ำ`, [1, 7]); }
        return F[i][j];
      }
      const wi = w[i - 1], vi = v[i - 1];
      let val;
      const hl = new Hl().add(i, j, 'cur');
      if (j < wi) {
        const a = mfk(i - 1, j);
        val = a; hl.add(i - 1, j, 'dep');
        F[i][j] = val; computed++;
        snap(hl, `F(${i},${j}): j < w${i} (${j} < ${wi}) ใส่ไม่ได้ → F(${i - 1},${j}) = <b>${val}</b>`, [1, 2, 3, 6, 7]);
      } else {
        const a = mfk(i - 1, j), b = mfk(i - 1, j - wi);
        val = Math.max(a, vi + b); hl.add(i - 1, j, 'dep').add(i - 1, j - wi, 'dep');
        F[i][j] = val; computed++;
        snap(hl, `F(${i},${j}) = max{ ${a}, ${vi} + ${b} } = max{ ${a}, ${vi + b} } = <b>${val}</b>`, [1, 4, 5, 6, 7],
          ask(`F(${i},${j}) = ?`, val, [[0, i, j]], [a, vi + b, vi + a], `F(${i},${j}) = max{ F(${i - 1},${j}), v${i} + F(${i - 1},${j} − w${i}) } — ค่าทั้งสองถูกคำนวณไว้แล้วในสเต็ปก่อนหน้า`));
      }
      return val;
    }
    const res = mfk(n, W);
    const total = n * W;
    const h = new Hl(); range(1, n).forEach((i) => range(1, W).forEach((j) => { if (F[i][j] >= 0) h.add(i, j, 'pick'); }));
    snap(h, `ได้ <b>F(${n},${W}) = ${res}</b> · คำนวณจริง <b>${computed}</b> ช่อง จากทั้งหมด ${total} ช่อง (ที่ bottom-up ต้องทำครบ) · ดึงจาก memo ${hits} ครั้ง`, 7);
    return { steps, result: { value: res, computed, total } };
  }

  /* ---------- 6. Optimal BST ---------- */
  function obst(P, labels) {
    const n = P.length, C = range(0, n + 1).map(() => new Array(n + 1).fill(null)), R = range(0, n + 1).map(() => new Array(n + 1).fill(null)), steps = [];
    const rowsL = range(1, n + 1), colsL = range(0, n);
    const tables = (hl, hideR) => [
      tbl('main table  C[i, j]', colsL, rowsL, (r, c) => { const i = r + 1; return { t: C[i][c] === null ? '' : fmt(C[i][c]), c: (C[i][c] === null ? 'empty ' : '') + hl.get(r, c) }; }, { corner: 'i \\ j', kind: 'mat' }),
      tbl('root table  R[i, j]', colsL, rowsL, (r, c) => { const i = r + 1; return { t: R[i][c] === null ? '' : R[i][c], c: (R[i][c] === null ? 'empty ' : '') + (hideR ? '' : '') + hl.get(r, c) }; }, { corner: 'i \\ j', kind: 'mat' }),
    ];
    const snap = (hl, note, line, a, svg) => steps.push({ tables: tables(hl), svg, note, line, ask: a });
    snap(new Hl(), `key: ${labels.map((l, i) => `${l} (p=${fmt(P[i])})`).join(' · ')}<br>C[i,j] = ค่าเฉลี่ยจำนวนครั้งเปรียบเทียบของ BST ที่ดีที่สุดสำหรับ key ที่ i..j · R[i,j] = key ที่เป็นราก`, -1);
    for (let i = 1; i <= n; i++) { C[i][i - 1] = 0; C[i][i] = P[i - 1]; R[i][i] = i; }
    C[n + 1][n] = 0;
    const hb = new Hl(); for (let i = 1; i <= n; i++) { hb.add(i - 1, i, 'cur'); }
    snap(hb, 'ค่าเริ่มต้น: C[i,i−1] = 0 (ต้นไม้ว่าง), C[i,i] = p<sub>i</sub> (ต้นไม้ 1 โหนด, ราก = i)', [0, 1, 2]);
    for (let d = 1; d <= n - 1; d++) {
      for (let i = 1; i <= n - d; i++) {
        const j = i + d;
        let sum = 0; for (let s = i; s <= j; s++) sum += P[s - 1];
        sum = r6(sum);
        const cand = []; let best = INF, kmin = i;
        for (let k = i; k <= j; k++) {
          const l = C[i][k - 1], r = C[k + 1][j], tot = r6(l + r);
          cand.push({ k, l, r, tot });
          if (tot < best) { best = tot; kmin = k; }
        }
        C[i][j] = r6(best + sum); R[i][j] = kmin;
        const hl = new Hl().add(i - 1, j, 'cur');
        cand.forEach((c) => { hl.add(i - 1, c.k - 1, 'dep'); hl.add(c.k, j, 'dep'); });
        const lines = cand.map((c) => `k=${c.k}: C[${i},${c.k - 1}] + C[${c.k + 1},${j}] = ${fmt(c.l)} + ${fmt(c.r)} = ${fmt(c.tot)}${c.k === kmin ? ' ← ต่ำสุด' : ''}`).join('<br>');
        snap(hl, `คำนวณ <b>C[${i},${j}]</b> (key ${labels.slice(i - 1, j).join(',')}) ลองทุกราก k:<br>${lines}<br>Σp = ${fmt(sum)} → C[${i},${j}] = ${fmt(best)} + ${fmt(sum)} = <b>${fmt(C[i][j])}</b>, ราก R = <b>${kmin}</b> (${labels[kmin - 1]})`, [3, 4, 5, 6, 7, 8, 9, 10],
          ask(`C[${i},${j}] = ?`, C[i][j], [[0, i - 1, j], [1, i - 1, j]], cand.map((c) => r6(c.tot + sum)).concat([best, sum]),
            `C[${i},${j}] = min{ C[${i},k−1] + C[k+1,${j}] } + Σp  โดย Σp = ${fmt(sum)} (ช่องสีเหลืองคือค่าที่ต้องใช้ในแต่ละ k)`));
      }
    }
    // ต้นไม้
    const nodes = [], edges = []; let idc = 0, leafx = 0, maxD = 0;
    const hp = new Hl();
    (function build(i, j, depth) {
      if (i > j) return null;
      const k = R[i][j]; hp.add(i - 1, j, 'pick');
      const nd = { id: idc++, k, depth, l: null, r: null };
      nodes.push(nd);
      nd.l = build(i, k - 1, depth + 1); nd.r = build(k + 1, j, depth + 1);
      maxD = Math.max(maxD, depth);
      return nd;
    })(1, n, 0);
    (function inorder(nd) { if (!nd) return; inorder(nd.l); nd.x = leafx++; inorder(nd.r); })(nodes[0]);
    nodes.forEach((nd) => { if (nd.l) edges.push({ a: nd.id, b: nd.l.id }); if (nd.r) edges.push({ a: nd.id, b: nd.r.id }); });
    const DX = 62, DY = 70, PAD = 40;
    const svg = { type: 'tree', w: Math.max(240, (leafx - 1) * DX + PAD * 2), h: maxD * DY + PAD * 2 + 10,
      nodes: nodes.map((nd) => ({ id: nd.id, x: PAD + nd.x * DX, y: PAD + nd.depth * DY, label: labels[nd.k - 1], sub: `p=${fmt(P[nd.k - 1])}`, cls: nd.depth === 0 ? 'root' : 'done' })), edges };
    const order = nodes.slice().sort((a, b) => a.x - b.x).map((nd) => labels[nd.k - 1]);
    snap(hp, `คำตอบ: <b>C[1,${n}] = ${fmt(C[1][n])}</b> = ค่าเฉลี่ยการเปรียบเทียบต่ำสุด · อ่าน R[1,${n}] = ${R[1][n]} → รากคือ <b>${labels[R[1][n] - 1]}</b> แล้วไล่ลงตาม R ของต้นไม้ย่อยซ้าย/ขวา (in-order: ${order.join(' ')})`, 11, undefined, svg);
    return { steps, result: { value: C[1][n], root: R[1][n], C, R } };
  }

  /* ---------- 7/8. กราฟ ---------- */
  function circlePos(n, cx, cy, r) {
    return range(0, n - 1).map((i) => { const a = (-135 + (360 / n) * i) * Math.PI / 180; return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }; });
  }
  function graphSvg(n, nodeCls, edges) {
    const pos = circlePos(n, 160, 125, n <= 3 ? 80 : 92);
    return { type: 'graph', w: 320, h: 250, nodes: pos.map((p, i) => ({ x: p.x, y: p.y, label: LET[i], cls: nodeCls[i] || '' })), edges };
  }

  function warshall(A) {
    const n = A.length, steps = [], labs = range(0, n - 1).map((i) => LET[i]);
    let R = M(A);
    const orig = (i, j) => A[i][j] === 1 && i !== j;
    const edgesOf = (Rm, newSet, showNew) => {
      const e = [];
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        if (i === j || !Rm[i][j]) continue;
        const isNew = newSet && newSet.has(i + ',' + j);
        e.push({ a: i, b: j, cls: orig(i, j) ? 'base' : (isNew && showNew ? 'new' : 'derived') });
      }
      return e;
    };
    const tab = (name, Rm, hl, o) => tbl(name, labs, labs, (r, c) => ({ t: Rm[r][c], c: hl.get(r, c) }), Object.assign({ corner: '', kind: 'mat' }, o));
    steps.push({ tables: [tab('R<sup>(0)</sup> = A (adjacency matrix)', R, new Hl())], svg: graphSvg(n, [], edgesOf(R)), note: `เมทริกซ์ A: 1 ในแถว i คอลัมน์ j หมายถึงมีเส้นตรงจากโหนด i ไปโหนด j · เป้าหมายคือหา <b>transitive closure</b> — คู่ (i,j) ที่ "เดินทางถึงกันได้" ไม่ว่าจะผ่านกี่เส้น`, line: 0 });
    for (let k = 0; k < n; k++) {
      const hl = new Hl(), colCls = [], rowCls = [];
      for (let t = 0; t < n; t++) { hl.add(k, t, 'piv'); hl.add(t, k, 'piv'); }
      colCls[k] = 'k'; rowCls[k] = 'k';
      const nodeCls = []; nodeCls[k] = 'piv';
      steps.push({ tables: [tab(`R<sup>(${k})</sup> — เลือก ${labs[k]} เป็นจุดพัก`, R, hl, { colCls, rowCls })], svg: graphSvg(n, nodeCls, edgesOf(R)),
        note: `รอบ k = <b>${labs[k]}</b> · ถามว่า "ถ้าอนุญาตให้แวะพักที่ ${labs[k]} มีคู่ใดที่ไปถึงกันได้เพิ่มไหม?"<br>ดู<b>แถว ${labs[k]}</b> (${labs[k]} ไปไหนได้) และ<b>คอลัมน์ ${labs[k]}</b> (ใครมาถึง ${labs[k]} ได้)`, line: [1] });
      const nxt = M(R), added = [], newSet = new Set();
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        if (!R[i][j] && R[i][k] && R[k][j]) { nxt[i][j] = 1; added.push([i, j]); newSet.add(i + ',' + j); }
      }
      const hl2 = new Hl(), colCls2 = [], rowCls2 = [];
      colCls2[k] = 'k'; rowCls2[k] = 'k';
      added.forEach(([i, j]) => hl2.add(i, j, 'cur'));
      for (let t = 0; t < n; t++) { if (!nxt[k][t] || !added.some(([i, j]) => i === k && j === t)) { hl2.add(k, t, 'piv'); } if (!added.some(([i, j]) => i === t && j === k)) hl2.add(t, k, 'piv'); }
      const why = added.length ? added.map(([i, j]) => `R[${labs[i]},${labs[j]}] : 0 → <b>1</b> (${labs[i]} → ${labs[k]} → ${labs[j]})`).join('<br>') : 'ไม่มีช่องใหม่ที่เปลี่ยนเป็น 1';
      const nodeCls2 = []; nodeCls2[k] = 'piv';
      steps.push({ tables: [tab(`R<sup>(${k + 1})</sup>`, nxt, hl2, { colCls: colCls2, rowCls: rowCls2 })], svg: graphSvg(n, nodeCls2, edgesOf(nxt, newSet, true)),
        note: `ผลรอบ k = ${labs[k]}: ช่องที่เป็น 1 ใหม่ = <b>${added.length}</b> ช่อง (ช่อง i,j จะเป็น 1 เมื่อ R[i,${labs[k]}] = 1 และ R[${labs[k]},j] = 1)<br>${why}`, line: [2, 3, 4],
        ask: ask(`รอบ k = ${labs[k]}: มีช่องที่เปลี่ยนจาก 0 เป็น 1 กี่ช่อง?`, added.length, added.map(([i, j]) => [0, i, j]), [added.length + 1, Math.max(0, added.length - 1), added.length + 2],
          `หาแถว i ที่ R[i,${labs[k]}] = 1 และคอลัมน์ j ที่ R[${labs[k]},j] = 1 แล้วนับคู่ (i,j) ที่ตอนนี้ยังเป็น 0`) });
      R = nxt;
    }
    let total = 0; R.forEach((r) => r.forEach((x) => { total += x; }));
    steps.push({ tables: [tab(`R<sup>(${n})</sup> = T (transitive closure)`, R, new Hl(), {})], svg: graphSvg(n, [], edgesOf(R)), note: `เสร็จ! ได้ transitive closure มี <b>${total}</b> ช่องที่เป็น 1 · เส้นประคือเส้นทางที่ "อนุมาน" ได้จากการแวะพัก`, line: 5 });
    return { steps, result: { matrix: R, ones: total } };
  }

  function floyd(W) {
    const n = W.length, steps = [], labs = range(0, n - 1).map((i) => LET[i]);
    let D = M(W);
    const wEdges = [];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j && W[i][j] < INF) wEdges.push({ a: i, b: j, label: fmt(W[i][j]), cls: 'base' });
    const gs = (nodeCls, extra) => graphSvg(n, nodeCls, wEdges.concat(extra || []));
    const tab = (name, Dm, hl, o) => tbl(name, labs, labs, (r, c) => ({ t: fmt(Dm[r][c]), c: hl.get(r, c) }), Object.assign({ corner: '', kind: 'mat' }, o));
    steps.push({ tables: [tab('D<sup>(0)</sup> = W (weight matrix)', D, new Hl())], svg: gs([]), note: `เมทริกซ์ W: ระยะทางของเส้นตรง i→j (ไม่มีเส้น = ∞, เส้นทแยง = 0) · เป้าหมาย: <b>ระยะสั้นสุดของทุกคู่</b> i→j`, line: 0 });
    for (let k = 0; k < n; k++) {
      const hl = new Hl(), colCls = [], rowCls = [];
      for (let t = 0; t < n; t++) { hl.add(k, t, 'piv'); hl.add(t, k, 'piv'); }
      colCls[k] = 'k'; rowCls[k] = 'k';
      const nc = []; nc[k] = 'piv';
      steps.push({ tables: [tab(`D<sup>(${k})</sup> — เลือก ${labs[k]} เป็นจุดพัก`, D, hl, { colCls, rowCls })], svg: gs(nc),
        note: `รอบ k = <b>${labs[k]}</b> · ลองแวะที่ ${labs[k]}: ระยะ i→j ผ่าน ${labs[k]} = D[i,${labs[k]}] + D[${labs[k]},j] สั้นกว่าเดิมไหม?`, line: 1 });
      const nxt = M(D), imp = [];
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        if (i === k || j === k || i === j) continue;
        const via = D[i][k] + D[k][j];
        if (via < D[i][j]) { imp.push({ i, j, old: D[i][j], via }); nxt[i][j] = via; }
      }
      const hl2 = new Hl(), colCls2 = [], rowCls2 = []; colCls2[k] = 'k'; rowCls2[k] = 'k';
      imp.forEach(({ i, j }) => { hl2.add(i, j, 'cur'); hl2.add(i, k, 'dep'); hl2.add(k, j, 'dep'); });
      const why = imp.length ? imp.map((o) => `D[${labs[o.i]},${labs[o.j]}] = min{ ${fmt(o.old)}, D[${labs[o.i]},${labs[k]}] + D[${labs[k]},${labs[o.j]}] } = min{ ${fmt(o.old)}, ${fmt(D[o.i][k])} + ${fmt(D[k][o.j])} } = <b>${fmt(o.via)}</b>`).join('<br>') : 'ไม่มีคู่ใดที่ผ่าน ' + labs[k] + ' แล้วสั้นลง';
      const nc2 = []; nc2[k] = 'piv';
      const shortcuts = imp.map((o) => ({ a: o.i, b: o.j, label: fmt(o.via), cls: 'new', off: 44 }));
      const first = imp[0];
      steps.push({ tables: [tab(`D<sup>(${k + 1})</sup>`, nxt, hl2, { colCls: colCls2, rowCls: rowCls2 })], svg: gs(nc2, shortcuts),
        note: `ผลรอบ k = ${labs[k]}: ปรับให้สั้นลง <b>${imp.length}</b> ช่อง<br>${why}`, line: [2, 3, 4],
        ask: first ? ask(`D[${labs[first.i]},${labs[first.j]}] หลังรอบ k = ${labs[k]} เป็นเท่าไร?`, first.via, imp.map((o) => [0, o.i, o.j]), [first.old, D[first.i][k], D[k][first.j], first.via + 1],
          `เทียบ D[${labs[first.i]},${labs[first.j]}] เดิม = ${fmt(first.old)} กับ D[${labs[first.i]},${labs[k]}] + D[${labs[k]},${labs[first.j]}] = ${fmt(D[first.i][k])} + ${fmt(D[k][first.j])}`) : undefined });
      D = nxt;
    }
    steps.push({ tables: [tab(`D<sup>(${n})</sup> = D (distance matrix)`, D, new Hl())], svg: gs([]), note: 'เสร็จ! D[i,j] คือระยะทางสั้นสุดจาก i ไป j (∞ = ไปไม่ถึง)', line: 5 });
    return { steps, result: { matrix: D } };
  }

  /* ---------- solver แบบไม่สร้างสเต็ป (ใช้สร้างโจทย์สุ่ม/ทดสอบ) ---------- */
  const solve = {
    fib: (n) => { let a = 0, b = 1; for (let i = 0; i < n; i++) [a, b] = [b, a + b]; return a; },
    coinRow: (C) => coinRow(C).result.value,
    change: (D, n) => changeMaking(D, n).result.value,
    collect: (G) => coinCollect(G).result.value,
    olympic: (D, n) => olympic(D, n).result,
    knap: (w, v, W) => knapsack(w, v, W).result.value,
    obst: (P) => obst(P, P.map((_, i) => String.fromCharCode(65 + i))).result.value,
    warshall: (A) => warshall(A).result.ones,
    floyd: (W) => floyd(W).result.matrix,
  };

  const E = { CODE, fmt, INF, LET, fibTable, fibTree, coinRow, changeMaking, coinCollect, olympic, knapsack, knapsackMF, obst, warshall, floyd, solve, naiveCalls };
  if (typeof module !== 'undefined' && module.exports) module.exports = E;
  else root.Engines = E;
})(typeof window !== 'undefined' ? window : globalThis);
