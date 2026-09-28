/* ================= กลุ่มที่ 4: Warshall's & Floyd's Algorithms (ข้อ 16-20) ================= */
const GP4 = [[70, 50], [250, 50], [250, 190], [70, 190]];
const GP3 = [[160, 40], [280, 190], [40, 190]];
const uniqEdges = list => { const m = new Map(); list.forEach(e => { if (e[0] !== e[1]) m.set(e[0] + '>' + e[1], e); }); return [...m.values()]; };
const origEdges = (W, weighted) => { const e = []; W.forEach((row, i) => row.forEach((v, j) => { if (i !== j && v !== INF && (weighted || v)) e.push([i, j, weighted ? String(v) : '', 'orig']); })); return e; };

/* Floyd core with trace; returns final D,P */
function floydTrace(W, r, o = {}) {
  const n = W.length, D = cl(W), P = Array.from({ length: n }, () => Array(n).fill(-1)), pos = o.pos || GP4, orig = origEdges(W, true);
  const pn = (cur, src, k, extra, ok) => {
    const a = [graphP('กราฟถ่วงน้ำหนัก (ทึบ = เส้นเดิม · ประ = ทางอ้อมที่ผ่าน k)', { pos, n, edges: uniqEdges([...orig, ...(extra || [])]) }, { nodes: k != null ? { [k]: 'mid' } : {} }),
      tbl('D[i][j] — ระยะทางสั้นสุดที่รู้ตอนนี้', D, { cl: range(0, n), rl: range(0, n), cur, src: src || [], rowK: k, colK: k, ok: ok || [] })];
    if (o.withP) a.push(tbl('P[i][j] — ปมกลางทาง (−1 = ตรงถึงกัน)', P, { cl: range(0, n), rl: range(0, n), cur, rowK: null, colK: null, ok: [] }));
    return a;
  };
  r.add(o.initLine || 'copy', 'D เริ่มต้นเท่ากับ Matrix น้ำหนักตรงๆ (∞ = ไม่มีเส้นเชื่อมตรง)' + (o.withP ? ' · P เริ่มที่ −1' : ''), pn());
  const changes = [];
  for (let k = 0; k < n; k++) {
    r.add(o.kLine || 'loopk', `<b>k = ${k}</b>: ลองให้ปม ${k} เป็นจุดผ่านกลาง — ตรวจทุกคู่ (i, j) ว่า i→${k}→j สั้นกว่าเดิมไหม`, pn(null, [], k));
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const via = D[i][k] + D[k][j];
      if (via < D[i][j]) {
        const old = D[i][j]; D[i][j] = via; if (o.withP) P[i][j] = k; changes.push({ k, i, j, old, via });
        r.add(o.updLine || 'upd', `k=${k}: D[${i}][${k}] + D[${k}][${j}] = ${inf(D[i][k])} + ${inf(D[k][j])} = <b>${via}</b> &lt; D[${i}][${j}] = ${inf(old)} → <b>อัปเดต D[${i}][${j}] = ${via}</b>${o.withP ? ` (P[${i}][${j}] = ${k})` : ''}`,
          pn([i, j], [[i, k], [k, j]], k, [[i, k, String(D[i][k]), 'hl'], [k, j, String(D[k][j]), 'hl'], [i, j, String(via), 'new']]));
      }
    }
  }
  return { D, P, changes, pn };
}
const fmtCells = (ch, W = null) => ch.map(c => `D[${c.i}][${c.j}] (${inf(c.old)} → ${c.via})`).join(', ');
const W17 = [[0, 3, INF, 7], [8, 0, 2, INF], [5, INF, 0, 1], [2, INF, INF, 0]];
const F17 = (() => { const r = Rec(); return floydTrace(W17, r, { withP: true }); })();
const at = (arr, k) => arr.filter(c => c.k === k);

/* ---------- ข้อ 16 Warshall ---------- */
P({
  n: 16, group: 4, title: "Warshall's Algorithm", th: 'เส้นทางเชื่อมต่อ (Transitive Closure)',
  story: `กราฟมีทิศทางหนึ่งมี Adjacency Matrix ด้านล่าง จงหา <b>Transitive Closure Matrix</b> เพื่อดูว่ามีโหนดใดเดินทางถึงกันได้บ้าง<br><code>adj = [[0,1,0,0],[0,0,0,1],[0,0,0,0],[1,0,1,0]]</code>`,
  pdfFix: 'เมทริกซ์ในโจทย์ของ PDF ถูกตัดหายไปบางส่วน เว็บนี้ใช้ค่าจากโค้ดตัวอย่าง (<code>adj</code>)',
  q: `อธิบายกลไกของลูปชั้นนอกสุด <code>for k in range(n)</code> ในอัลกอริทึมของ Warshall ว่าทำหน้าที่อะไรในการนิยามจุดผ่านกลางของกราฟ`,
  rec: `R<sup>(k)</sup>[i][j] = R<sup>(k−1)</sup>[i][j] &nbsp; หรือ &nbsp; ( R<sup>(k−1)</sup>[i][k] และ R<sup>(k−1)</sup>[k][j] )`,
  idea: ['R[i][j] = 1 หมายถึงเดินจาก i ถึง j ได้', 'รอบที่ k: อนุญาตให้ใช้ปม 0..k เป็น “จุดพัก” ระหว่างทาง', 'ถ้า i ไปถึง k ได้ และ k ไปถึง j ได้ → i ไปถึง j ได้ (ผ่าน k)'],
  cx: 'เวลา O(V³) · พื้นที่ O(V²)',
  code: `
def warshall(graph):
    n = len(graph)                                    #@n
    R = [row[:] for row in graph]                     #@copy
    for k in range(n):                                #@loopk
        for i in range(n):                            #@loopi
            for j in range(n):                        #@loopj
                R[i][j] = R[i][j] or (R[i][k] and R[k][j])   #@upd
    return R                                          #@ret

adj = [[0,1,0,0], [0,0,0,1], [0,0,0,0], [1,0,1,0]]
print("Transitive Closure:")
for r in warshall(adj): print(r)`,
  ex: {
    n: 'n = จำนวนโหนด',
    copy: 'คัดลอก Adjacency Matrix ไว้ใช้เป็นตารางเริ่มต้น (ไม่แก้ตัวเดิม)',
    loopk: '<b>ลูป k คือหัวใจ:</b> k = “โหนดที่อนุญาตให้ใช้เป็นจุดผ่านกลาง” ในรอบที่ k เราเพิ่มโหนด k เข้ามาเป็นตัวกลางได้ (โหนด 0..k ทั้งหมด) และต้องอยู่ชั้นนอกสุด เพื่อให้ค่าจากรอบก่อนหน้าครบก่อนจะเพิ่มตัวกลางใหม่',
    loopi: 'i = โหนดต้นทาง',
    loopj: 'j = โหนดปลายทาง',
    upd: 'R[i][j] เป็น 1 อยู่แล้ว <b>หรือ</b> (i ไปถึง k ได้ <b>และ</b> k ไปถึง j ได้) → i ไปถึง j ได้ผ่านตัวกลาง k',
    ret: 'R คือ Transitive Closure: 1 = ถึงกันได้',
  },
  out: 'Transitive Closure:\n[1, 1, 1, 1]\n[1, 1, 1, 1]\n[0, 0, 0, 0]\n[1, 1, 1, 1]',
  run() {
    const A = [[0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 0, 0], [1, 0, 1, 0]], n = 4, R = cl(A), r = Rec(), orig = origEdges(A, false);
    const pn = (cur, src, k, extra) => [graphP('กราฟ (ทึบ = เส้นเดิม · ประ = เส้นทางที่เพิ่งพบ)', { pos: GP4, n, edges: uniqEdges([...orig, ...(extra || [])]) }, { nodes: k != null ? { [k]: 'mid' } : {} }), tbl('R[i][j] = 1 ถ้าเดินจาก i ไป j ได้', R, { cl: range(0, n), rl: range(0, n), cur, src: src || [], rowK: k, colK: k })];
    r.add('copy', 'R เริ่มต้น = Adjacency Matrix (มีเส้นตรงเท่านั้น)', pn());
    for (let k = 0; k < n; k++) {
      const into = range(0, n).filter(i => R[i][k]), out = range(0, n).filter(j => R[k][j]);
      r.add('loopk', `<b>k = ${k}</b>: ลองให้โหนด ${k} เป็นจุดผ่านกลาง · ชี้เข้า ${k}: {${into.join(', ') || '-'}} · ${k} ชี้ออก: {${out.join(', ') || '-'}} → ทุกคู่ (จากชุดแรก, ไปชุดหลัง) จะถึงกันได้`, pn(null, [], k));
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (!R[i][j] && R[i][k] && R[k][j]) {
        R[i][j] = 1; r.add('upd', `k=${k}: R[${i}][${k}] = 1 และ R[${k}][${j}] = 1 → <b>R[${i}][${j}] = 1</b> (${i} → ${k} → ${j})`, pn([i, j], [[i, k], [k, j]], k, [[i, k, '', 'hl'], [k, j, '', 'hl'], [i, j, '', 'new']]));
      }
    }
    r.add('ret', 'เสร็จ: ทุกช่องเป็น 1 ยกเว้นแถวที่ 2 (โหนด 2 ไม่มีลูกศรชี้ออกไปไหนเลย จึงเดินไปที่ใดไม่ได้)', pn());
    return V1(r.steps);
  },
  quiz: [
    { t: 'mc', q: 'ในรอบ k ของ Warshall “k” หมายถึงอะไร?', o: ['โหนดที่ถูกอนุญาตให้เป็นจุดผ่านกลาง (ตัวเชื่อม) ระหว่างต้นทางกับปลายทาง', 'จำนวนเส้นเชื่อมทั้งหมด', 'โหนดปลายทาง', 'ระยะทางสั้นสุด'], a: 0, why: 'หลังรอบ k เดินผ่านโหนด 0..k เป็นตัวกลางได้ ถ้ารอบสุดท้าย (k = n−1) เสร็จ ทุกเส้นทางที่มีอยู่จริงถูกจับครบ' },
    { t: 'mc', q: 'แถวใดของ Transitive Closure ในข้อนี้เป็น 0 ทั้งแถว?', o: ['แถวที่ 2 (โหนด 2 ไม่มีทางออก)', 'แถวที่ 0', 'แถวที่ 1', 'ไม่มีแถวใดเลย'], a: 0, why: 'ไม่มีเส้นออกจากโหนด 2 จึงเดินไปที่ใดไม่ได้ (ถึงแม้โหนดอื่นเดินมาหามันได้)' },
    { t: 'num', q: 'Transitive Closure สุดท้ายมีช่องที่เป็น 1 ทั้งหมดกี่ช่อง?', a: '12', why: '3 แถว (0, 1, 3) × 4 คอลัมน์ = 12 ส่วนแถว 2 เป็น 0 ทั้งหมด' },
  ],
  ans: `<p><b>Transitive Closure:</b> ทุกช่องเป็น 1 ยกเว้นแถวที่ 2 ซึ่งเป็น 0 ทั้งแถว (ไม่มีทางออกจากโหนด 2)</p>
  <p><b>ลูป k:</b> ในนิยามของ Warshall ค่าของ R<sup>(k)</sup>[i][j] หมายถึง “มีเส้นทางจาก i ไป j โดยที่โหนดกลางทาง (intermediate) ใช้ได้เฉพาะโหนด 0..k” ลูปชั้นนอกสุด k จึงเป็นตัวนิยามว่า “ตอนนี้เพิ่มโหนดใดเข้ามาเป็นตัวกลางได้บ้าง” ในแต่ละรอบเราตรวจว่าทุกคู่ (i, j) สามารถเชื่อมกันผ่าน k ได้หรือไม่ (R[i][k] และ R[k][j]) พอจบรอบ k = n−1 ทุกโหนดถูกอนุญาตให้เป็นตัวกลางแล้ว จึงได้เส้นทางครบ ที่ต้องเป็นลูปนอกสุดเพราะ DP ต้องการให้ปัญหาย่อย “ใช้ตัวกลาง 0..k−1” เสร็จครบทั้งตารางก่อน</p>`,
  reflect: [
    'ถ้าฉันเพิ่มเส้นเชื่อมจากโหนด 2 ไปโหนด 0 ตาราง R ของฉันจะเปลี่ยนอย่างไร และแถวที่ 2 จะเป็นอย่างไร',
    'ท้าทายให้ฉันพิสูจน์ว่า Warshall มี Overlap Subproblems โดยชี้ว่า R[i][k] และ R[k][j] ถูกใช้ซ้ำในหลายคู่ (i, j) อย่างไร',
    'ถ้าฉันเปลี่ยนไปใช้ DFS/BFS จากทุกโหนดแทน DP ผลและความซับซ้อนต่างกันอย่างไร และถ้าสลับลูป k ไปเป็นลูปในสุดจะพังตรงไหน',
  ],
});

/* ---------- ข้อ 17 Floyd ---------- */
P({
  n: 17, group: 4, title: "Floyd's Algorithm", th: 'ระยะทางสั้นที่สุดทุกคู่ (All-Pairs Shortest Path)',
  story: `กราฟถ่วงน้ำหนักตาม Matrix ด้านล่าง (∞ = ไม่มีเส้นเชื่อมตรง) จงหาตารางระยะทางที่สั้นที่สุดระหว่าง <b>ทุกคู่ปม</b><br><code>[[0,3,∞,7],[8,0,2,∞],[5,∞,0,1],[2,∞,∞,0]]</code>`,
  q: `ในขั้นที่ k = 2 (ให้ปมที่ 2 เป็นจุดผ่านกลาง) จงระบุตำแหน่งระยะทางคู่ปมที่มีการอัปเดตให้มีค่าน้อยลงกว่าเดิม`,
  rec: `D<sup>(k)</sup>[i][j] = min( D<sup>(k−1)</sup>[i][j] , D<sup>(k−1)</sup>[i][k] + D<sup>(k−1)</sup>[k][j] )`,
  idea: ['D[i][j] = ระยะสั้นสุดที่รู้ตอนนี้จาก i ไป j', 'รอบ k: ทางอ้อม i → k → j สั้นกว่าทางเดิมไหม? ถ้าใช่อัปเดต', 'จบรอบสุดท้ายจะได้ระยะสั้นสุดของทุกคู่'],
  cx: 'เวลา O(V³) · พื้นที่ O(V²)',
  code: `
def floyd(graph):
    n = len(graph)                                    #@n
    D = [row[:] for row in graph]                     #@copy
    for k in range(n):                                #@loopk
        for i in range(n):                            #@loopi
            for j in range(n):                        #@loopj
                D[i][j] = min(D[i][j], D[i][k] + D[k][j])   #@upd
    return D                                          #@ret

inf = float('inf')
weight_matrix = [[0, 3, inf, 7], [8, 0, 2, inf], [5, inf, 0, 1], [2, inf, inf, 0]]
print("Shortest Distance Matrix:")
for row in floyd(weight_matrix): print(row)`,
  ex: {
    n: 'n = จำนวนปม',
    copy: 'D เริ่มต้นเท่ากับ Matrix น้ำหนักตรง (คัดลอกเพื่อไม่ทับข้อมูลเดิม)',
    loopk: 'k = ปมที่ให้เป็น “จุดผ่านกลาง” รอบนี้ — ต้องอยู่นอกสุดเหมือน Warshall',
    loopi: 'i = ต้นทาง',
    loopj: 'j = ปลายทาง',
    upd: 'เทียบ “ทางเดิม” D[i][j] กับ “ทางอ้อมผ่าน k” D[i][k] + D[k][j] เลือกอันสั้นกว่า (ถ้าเป็น ∞ อยู่แล้ว ∞ + x = ∞ ไม่ชนะ)',
    ret: 'D = ระยะสั้นสุดของทุกคู่',
  },
  out: 'Shortest Distance Matrix:\n[0, 3, 5, 6]\n[5, 0, 2, 3]\n[3, 6, 0, 1]\n[2, 5, 7, 0]',
  run() { const r = Rec(); const f = floydTrace(W17, r, {}); r.add('ret', 'เสร็จ: D คือระยะสั้นสุดของทุกคู่ปม', f.pn(null, [], null, [], [])); return V1(r.steps); },
  quiz: [
    { t: 'num', q: 'ระยะสั้นสุดจากปม 0 ไปปม 2 (D[0][2]) เท่ากับเท่าไร?', a: '5', why: '0 → 1 → 2 = 3 + 2 = 5 (ไม่มีเส้นตรงจาก 0 ไป 2)' },
    { t: 'num', q: 'ระยะสั้นสุดจากปม 3 ไปปม 1 (D[3][1]) เท่ากับเท่าไร?', a: '5', why: '3 → 0 → 1 = 2 + 3 = 5' },
    { t: 'mc', q: 'ทำไมลูป k ต้องอยู่นอกสุด?', o: ['เพื่อให้ D[i][k] และ D[k][j] สะท้อน “ใช้ตัวกลาง 0..k−1” ครบทุกคู่ก่อนเพิ่มตัวกลาง k', 'เพื่อให้โค้ดสั้น', 'เพราะ Python บังคับ', 'สลับตำแหน่งได้ไม่มีผล'], a: 0, why: 'ถ้าสลับ k ไปข้างใน คำตอบของตัวกลางแต่ละตัวจะไม่ถูกคำนวณครบก่อนใช้ ผลลัพธ์อาจผิด' },
  ],
  get ans() {
    const k2 = at(F17.changes, 2);
    return `<p><b>ตารางระยะสั้นสุด</b> (ผลของ Floyd): <code>[[0,3,5,6],[5,0,2,3],[3,6,0,1],[2,5,7,0]]</code></p>
    <p><b>ที่ k = 2</b> (ปมที่ 2 เป็นจุดผ่านกลาง) เกิดการอัปเดตที่ตำแหน่ง: <b>${fmtCells(k2)}</b></p>
    <p>เหตุผล: เส้นทาง i → 2 → j สั้นกว่าค่าเดิมในตาราง (เช่นคู่ที่เดิมเป็น ∞ กลายเป็นเดินผ่านปม 2 ได้) — ดูรายละเอียดทีละคู่ในอนิเมชัน (ช่วง k = 2)</p>`;
  },
  reflect: [
    'ถ้าฉันเปลี่ยนน้ำหนักเส้นเชื่อม 0→3 จาก 7 เป็น 1 ตารางระยะทางและการอัปเดตในแต่ละรอบ k จะเปลี่ยนอย่างไร',
    'ท้าทายให้ฉันพิสูจน์ว่า Floyd มี Overlap Subproblems โดยชี้ว่า D[i][k] และ D[k][j] ถูกใช้ซ้ำในหลายคู่ (i, j) อย่างไร',
    'ถ้าฉันใช้ Greedy (เลือกเส้นเชื่อมที่สั้นที่สุดที่ออกจากแต่ละปมเสมอ) จะหาระยะสั้นสุดทุกคู่ไม่ได้อย่างไร ยกตัวอย่างกราฟที่ Greedy ผิด',
  ],
});

/* ---------- ข้อ 18 Negative Cycle ---------- */
const WNEG = [[0, -1, INF], [INF, 0, -2], [-3, INF, 0]];
P({
  n: 18, group: 4, title: 'Negative Cycle Detection', th: 'ตรวจจับวงจรน้ำหนักติดลบด้วย Floyd',
  story: `หากปรับน้ำหนักเส้นเชื่อมให้เกิดวงจรที่น้ำหนักรวมติดลบ (Negative Cycle) เช่น <code>0→1 (−1), 1→2 (−2), 2→0 (−3)</code> รวม −6 อัลกอริทึมจะสะท้อนความผิดพลาดออกมาที่ตำแหน่งใดในตาราง?`,
  q: `เขียนเงื่อนไขภาษา Python สั้นๆ เพื่อดักจับว่ากราฟที่ผ่านการวนลูปของ Floyd แล้ว มีวงจรน้ำหนักติดลบซ่อนอยู่หรือไม่`,
  rec: `มี Negative Cycle ⇔ ∃ i : D[i][i] &lt; 0 (หลังรัน Floyd)`,
  idea: ['ปกติ D[i][i] = 0 (ไปหาตัวเอง ไม่ต้องเดิน)', 'ถ้ามีวงจรติดลบผ่านปม i เดินวนรอบหนึ่งแล้วกลับมา i จะได้ระยะติดลบ D[i][i] < 0', 'ตรวจเส้นทแยงมุมหลังรัน Floyd'],
  cx: 'เวลา O(V³) + ตรวจ O(V)',
  code: `
def has_negative_cycle(matrix):
    D = floyd(matrix)                                 #@run
    for i in range(len(D)):                           #@loop
        if D[i][i] < 0: return True                   #@chk
    return False                                      #@ret

graph_with_neg = [[0, -1, inf], [inf, 0, -2], [-3, inf, 0]]
print("Has Negative Cycle?:", has_negative_cycle(graph_with_neg))`,
  ex: {
    run: 'รัน Floyd ตามปกติ (ฟังก์ชัน floyd จากข้อ 17)',
    loop: 'ตรวจเส้นทแยงมุม D[0][0], D[1][1], …',
    chk: 'ถ้า D[i][i] &lt; 0 หมายถึง “ออกจากปม i แล้วกลับมา i ได้ระยะทางติดลบ” = อยู่บนวงจรติดลบ (ปกติต้องเป็น 0)',
    ret: 'ไม่พบค่าติดลบบนเส้นทแยง → ไม่มี Negative Cycle',
  },
  out: 'Has Negative Cycle?: True',
  run() {
    const r = Rec(); const f = floydTrace(WNEG, r, { pos: GP3, updLine: 'run', initLine: 'run', kLine: 'run' });
    const neg = range(0, 3).filter(i => f.D[i][i] < 0);
    r.add('chk', `ตรวจเส้นทแยงมุม: ${range(0, 3).map(i => `D[${i}][${i}] = ${f.D[i][i]}`).join(' · ')} → ค่าติดลบ ⇒ <b>มี Negative Cycle</b> (วง 0→1→2→0 น้ำหนักรวม −6 วนได้ไม่จำกัด ระยะสั้นสุดไม่มีจริง)`, f.pn(null, [], null, [], neg.map(i => [i, i])));
    return V1(r.steps);
  },
  quiz: [
    { t: 'mc', q: 'อัลกอริทึมจะสะท้อน Negative Cycle ออกมาที่ตำแหน่งใดในตาราง D?', o: ['เส้นทแยงมุม D[i][i] มีค่า < 0', 'ช่อง D[0][n−1]', 'ช่องที่เป็น ∞', 'แถวสุดท้ายทั้งแถว'], a: 0, why: 'ระยะทางจากปมไปหาตัวเองควรเป็น 0 ถ้ามีวงจรติดลบผ่านปมนั้น จะกลายเป็นค่าติดลบ' },
    { t: 'num', q: 'ผลรวมน้ำหนักของวง 0→1→2→0 ในตัวอย่างนี้เท่ากับเท่าไร?', a: '-6', why: '(−1) + (−2) + (−3) = −6 ทุกครั้งที่วนรอบ ผลรวมยิ่งต่ำลงไม่รู้จบ' },
    { t: 'mc', q: 'เงื่อนไข Python สั้นๆ ที่ใช้ตรวจ Negative Cycle คือ?', o: ['any(D[i][i] < 0 for i in range(n))', 'D[0][0] == 0', 'min(D) < 0', 'len(D) > 0'], a: 0, why: 'ตรวจว่ามีสมาชิกบนเส้นทแยงติดลบหรือไม่ (เขียนแบบวนลูปก็ได้เหมือนในโค้ด)' },
  ],
  ans: `<p><b>ตำแหน่งที่สะท้อนความผิดพลาด:</b> เส้นทแยงมุมของตาราง <code>D[i][i]</code> จะมีค่าเป็นลบ เพราะระยะทางจากปม i ไปยังตัวมันเอง (ควรเป็น 0) กลายเป็นค่าติดลบเมื่อเดินไปตามวงจรติดลบแล้วกลับมาที่เดิม</p>
  <p><b>โค้ดสั้นๆ:</b></p><pre>def has_negative_cycle(D):
    return any(D[i][i] &lt; 0 for i in range(len(D)))</pre>
  <p>หรือแบบในโค้ดตัวอย่าง <code>for i in range(len(D)): if D[i][i] &lt; 0: return True</code> ผลของกราฟตัวอย่างคือ <b>True</b></p>`,
  reflect: [
    'ถ้าฉันเปลี่ยนน้ำหนักเส้น 2→0 จาก −3 เป็น 4 กราฟยังมี Negative Cycle อยู่ไหม และเส้นทแยงมุมของ D จะเปลี่ยนอย่างไร',
    'ท้าทายให้ฉันอธิบายว่าทำไมเมื่อมี Negative Cycle ตัวหลักการ Optimal Substructure ของ Floyd จึงไม่ถูกต้องอีกต่อไป และเกี่ยวกับ Overlap Subproblems อย่างไร',
    'ถ้าฉันใช้ Dijkstra (ซึ่งเป็น Greedy) กับกราฟที่มีเส้นน้ำหนักติดลบ ผลจะพังตรงไหน ยกตัวอย่างกราฟเล็กๆ',
  ],
});

/* ---------- ข้อ 19 Path Reconstruction ---------- */
P({
  n: 19, group: 4, title: 'Path Reconstruction ใน Floyd', th: 'ย้อนรอยเส้นทางสั้นที่สุด',
  story: `สร้างอาร์เรย์ <code>P[i][j]</code> เก็บ “ปมที่เดินผ่านล่าสุด” เพื่อระบุลำดับปมของเส้นทางสั้นที่สุดจริงๆ จากปม i ไปปม j (ใช้กราฟเดียวกับข้อ 17)`,
  q: `จงอธิบายขั้นตอนคิดแบบ Recursive ในการนำข้อมูลจากอาร์เรย์ P มาพิมพ์รายชื่อปมเดินทางตั้งแต่ต้นจนถึงจุดหมายปลายทาง`,
  rec: `เมื่ออัปเดต D[i][j] ผ่าน k ให้ P[i][j] = k<br>path(i, j) = [i, j] ถ้า P[i][j] = −1 · ไม่งั้น path(i, k) + path(k, j)`,
  idea: ['P[i][j] = −1: เดินตรงจาก i ไป j (ไม่มีปมกลาง)', 'P[i][j] = k: เส้นทางสั้นสุดผ่านปม k → แตกเป็น i→k และ k→j', 'เรียกซ้ำจนทุกท่อนเป็นเส้นตรง'],
  cx: 'สร้าง P: O(V³) · ย้อนรอยแต่ละเส้นทาง: O(ความยาวเส้นทาง)',
  code: `
def floyd_with_path(graph):
    n = len(graph)
    D = [row[:] for row in graph]
    P = [[-1] * n for _ in range(n)]   # -1 แปลว่า วิ่งตรงถึงกันได้   #@pinit
    for k in range(n):                                #@loopk
        for i in range(n):
            for j in range(n):
                if D[i][k] + D[k][j] < D[i][j]:       #@cmp
                    D[i][j] = D[i][k] + D[k][j]
                    P[i][j] = k                       #@pset
    return D, P                                       #@ret

_, path_table = floyd_with_path(weight_matrix)
print("Path Table (Middle nodes):", path_table[0][2])   # แสดงปมตัวกลางระหว่าง 0 ไป 2

# ย้อนรอยเส้นทาง (เพิ่มโดยเว็บนี้ เพื่อตอบคำถามของโจทย์)
def get_path(P, i, j):
    k = P[i][j]                                       #@gk
    if k == -1: return [i, j]                         #@direct
    return get_path(P, i, k)[:-1] + get_path(P, k, j) #@join`,
  ex: {
    loopk: 'k = ปมที่ให้เป็นจุดผ่านกลางในรอบนี้',
    pinit: 'P เริ่มต้นเป็น −1 ทุกช่อง หมายความว่ายังไม่มีปมกลางทาง (ถ้าเดินได้ก็เดินตรง)',
    cmp: 'ทางอ้อมผ่าน k สั้นกว่าทางเดิมหรือไม่',
    pset: '<b>จดว่าผ่าน k:</b> ถ้าอัปเดตแล้ว จำว่า i→j ที่ดีที่สุดต้องแวะปม k',
    ret: 'คืนทั้งตารางระยะทาง D และตารางปมกลาง P',
    gk: 'อ่านปมกลางของคู่ (i, j) จากตาราง P',
    direct: '−1 = ไม่มีปมกลาง เดินตรง คืน [i, j]',
    join: 'มีปมกลาง k: หาเส้นทาง i→k กับ k→j แบบเรียกซ้ำ แล้วต่อกัน (ตัดปม k ตัวท้ายของก้อนแรกออก 1 ตัว [:-1] เพื่อไม่ให้ซ้ำ)',
  },
  out: 'Path Table (Middle nodes): 1',
  run() {
    const r = Rec(), f = floydTrace(W17, r, { withP: true, updLine: 'pset', initLine: 'pinit' });
    r.add('ret', 'เสร็จ: ได้ D (ระยะสั้นสุด) และ P (ปมกลางทาง) เช่น P[0][2] = 1 หมายถึง 0→2 ที่สั้นสุดต้องผ่านปม 1', f.pn(null, [], null, [], [[0, 2]]));
    const gp = (i, j, depth, out) => {
      const k = f.P[i][j], pad = '&nbsp;&nbsp;'.repeat(depth);
      if (k === -1) { out.push(`${pad}get_path(${i},${j}): P[${i}][${j}] = −1 → เดินตรง = [${i}, ${j}]`); r.add('direct', `get_path(${i}, ${j}): P[${i}][${j}] = −1 → เดินตรง คืน <b>[${i}, ${j}]</b>`, f.pn([i, j], [], null, [[i, j, '', 'new']], [[i, j]]).concat([textP('สายการเรียกซ้ำ', out.join('<br>'))])); return [i, j]; }
      out.push(`${pad}get_path(${i},${j}): P[${i}][${j}] = ${k} → แยกเป็น (${i}→${k}) + (${k}→${j})`);
      r.add('gk', `get_path(${i}, ${j}): P[${i}][${j}] = <b>${k}</b> → มีปมกลาง ${k} → แตกเป็น get_path(${i}, ${k}) และ get_path(${k}, ${j})`, f.pn([i, j]).concat([textP('สายการเรียกซ้ำ', out.join('<br>'))]));
      const a = gp(i, k, depth + 1, out), b = gp(k, j, depth + 1, out), res = a.slice(0, -1).concat(b);
      out.push(`${pad}→ get_path(${i},${j}) = [${res.join(', ')}]`);
      r.add('join', `ต่อ [${a.join(', ')}][:-1] + [${b.join(', ')}] = <b>[${res.join(', ')}]</b>`, f.pn([i, j]).concat([textP('สายการเรียกซ้ำ', out.join('<br>'))]));
      return res;
    };
    gp(0, 2, 0, []);
    return V1(r.steps);
  },
  quiz: [
    { t: 'num', q: 'P[0][2] เท่ากับเท่าไร (ปมกลางทางของ 0 → 2)?', a: '1', why: '0 → 1 → 2 (3+2 = 5) จึง P[0][2] = 1' },
    { t: 'mc', q: 'P[i][j] = −1 หมายความว่าอย่างไร?', o: ['เดินตรงจาก i ไป j ได้เลย ไม่มีปมกลางทาง', 'ไม่มีเส้นทางจาก i ไป j', 'มีวงจรติดลบ', 'ระยะทางเป็น 0'], a: 0, why: '−1 เป็นค่าเริ่มต้น หมายความว่าไม่เคยอัปเดตผ่านปมใดๆ (ถ้ามีเส้นตรงก็ใช้ได้)' },
    { t: 'num', q: 'P[3][1] เท่ากับเท่าไร? (ทางสั้นสุด 3 → 0 → 1)', a: '0', why: '3 → 0 → 1 = 2 + 3 = 5 จึงผ่านปม 0' },
  ],
  ans: `<p><b>ขั้นตอนแบบ Recursive:</b> พิมพ์เส้นทาง i → j</p>
  <ol><li>อ่าน <code>k = P[i][j]</code></li>
  <li>ถ้า <code>k = −1</code>: เดินตรง จึงพิมพ์ <b>i แล้ว j</b> (base case)</li>
  <li>ถ้า <code>k ≠ −1</code>: เส้นทางสั้นสุดต้องผ่านปม k → แบ่งเป็นสองท่อน: <code>path(i, k)</code> และ <code>path(k, j)</code> แล้วต่อกัน (ตัดปม k ที่ซ้ำกันทิ้ง 1 ตัว)</li>
  <li>ทั้งสองท่อนเป็นปัญหาย่อยที่สั้นกว่า เรียกซ้ำจนกว่าจะเจอ −1</li></ol>
  <p>ตัวอย่าง: path(0, 2) → P[0][2] = 1 → path(0,1) = [0,1] และ path(1,2) = [1,2] → ผลลัพธ์ <b>[0, 1, 2]</b> (ระยะ 5)</p>`,
  reflect: [
    'ถ้าฉันเปลี่ยนน้ำหนักเส้น 0→1 จาก 3 เป็น 10 ตาราง P และเส้นทางสั้นสุดจาก 0 ไป 2 จะเปลี่ยนอย่างไร',
    'ท้าทายให้ฉันอธิบายว่าการเก็บ P ทำให้เราไม่ต้องคำนวณเส้นทางซ้ำอย่างไร และเกี่ยวกับ Optimal Substructure ของเส้นทางสั้นสุดอย่างไร',
    'ถ้าฉันใช้ Greedy (เดินไปหาปมถัดไปที่ใกล้ที่สุดเสมอ) จะได้เส้นทางที่ถูกต้องเหมือน P หรือไม่ ยกตัวอย่างกรณีที่ต่างกัน',
  ],
});

/* ---------- ข้อ 20 Floyd vs Dijkstra ---------- */
P({
  n: 20, group: 4, title: 'Floyd vs Dijkstra', th: 'เปรียบเทียบประสิทธิภาพเชิงทฤษฎี',
  story: `กราฟหนึ่งมีจำนวนโหนด <code>V = 100</code> และมีเส้นเชื่อมหนาแน่นมาก (Dense Graph) คำนวณเปรียบเทียบเชิงทฤษฎีของ Time Complexity ระหว่างการรัน Floyd หนึ่งครั้ง กับการรัน Dijkstra ซ้ำกันจำนวน V ครั้ง`,
  q: `สรุปเกณฑ์การเลือกใช้งานที่เหมาะสมระหว่าง Floyd และ Dijkstra ในงานวิเคราะห์ระบบเครือข่ายแผนที่จริง`,
  rec: `Floyd: V³ · Dijkstra × V (อาร์เรย์): V · V² = V³ · Dijkstra × V (Min-heap): V · (E + V) · log V`,
  idea: ['หนาแน่น (E ≈ V²): Dijkstra แบบอาร์เรย์ V ครั้ง = V³ เท่า Floyd', 'ถ้าใช้ Min-heap กับกราฟหนาแน่น กลับช้ากว่า (E log V ใหญ่กว่า V²)', 'กราฟบาง (E ≈ V): Dijkstra + heap เร็วกว่า Floyd มาก · แต่ Floyd ทนน้ำหนักติดลบได้ (ไม่มี negative cycle) และโค้ดสั้น'],
  cx: 'Floyd O(V³) · Dijkstra ซ้ำ V ครั้ง O(V·V²) หรือ O(V·E log V)',
  code: `
V = 100
floyd_operations = V ** 3
dijkstra_all_pairs = V * (V ** 2)     # กรณีดั้งเดิมที่ไม่มี Min-heap ช่วยเหลือ #@dij
print(f"Floyd Ops: {floyd_operations}, Repeated Dijkstra Ops: {dijkstra_all_pairs}")

# เปรียบเทียบเพิ่ม (เพิ่มโดยเว็บนี้): Dijkstra + Min-heap บนกราฟหนาแน่น E ≈ V²
import math
dijkstra_heap = V * (V**2 + V) * math.log2(V)         #@heap`,
  ex: {
    dij: 'Dijkstra แบบอาร์เรย์หนึ่งครั้ง = O(V²) รันซ้ำ V ครั้ง (ทุกโหนดเป็นต้นทาง) = V × V² = V³ — เท่ากับ Floyd พอดีในกราฟหนาแน่น',
    heap: 'ถ้าใช้ Min-heap Dijkstra หนึ่งครั้ง = O((V+E) log V) — เมื่อ E ≈ V² ค่า E log V ใหญ่กว่า V² จึงช้ากว่าแบบอาร์เรย์ · Min-heap คุ้มเมื่อกราฟบาง',
  },
  out: 'Floyd Ops: 1000000, Repeated Dijkstra Ops: 1000000',
  run() {
    const mk = dense => {
      const r = Rec(), Vs = range(1, 11).map(x => x * 10), E = V => dense ? V * V : 3 * V, fmt = x => Math.round(x).toLocaleString('en-US'), max = (() => { const V = 100; return Math.max(V ** 3, V * (E(V) + V) * Math.log2(V)); })();
      Vs.forEach(V => {
        const fl = V ** 3, da = V * V * V, dh = V * (E(V) + V) * Math.log2(V);
        r.add(V === 100 ? 'dij' : null, `V = ${V}, E ≈ ${fmt(E(V))} · Floyd = V³ = ${fmt(fl)} · Dijkstra×V (อาร์เรย์) = V·V² = ${fmt(da)} · Dijkstra×V (Min-heap) = V·(E+V)·log₂V ≈ ${fmt(dh)}`,
          [barsP('จำนวนการคำนวณโดยประมาณ (ยิ่งน้อยยิ่งดี)', [{ label: 'Floyd', value: fl, txt: fmt(fl), cls: 'b1' }, { label: 'Dijkstra × V (อาร์เรย์)', value: da, txt: fmt(da), cls: 'b2' }, { label: 'Dijkstra × V (Min-heap)', value: dh, txt: fmt(dh), cls: 'b3' }], max), textP('สรุปที่ V=' + V, dense ? 'กราฟหนาแน่น: Floyd = Dijkstra แบบอาร์เรย์ · Min-heap ช้ากว่า' : 'กราฟบาง: Dijkstra + Min-heap เร็วกว่า Floyd')]);
      });
      return r.steps;
    };
    return { variants: [{ name: 'กราฟหนาแน่น (E ≈ V²)', steps: mk(true) }, { name: 'กราฟบาง (E ≈ 3V)', steps: mk(false) }] };
  },
  quiz: [
    { t: 'num', q: 'V = 100: Floyd ทำงานประมาณกี่การคำนวณ? (V³)', a: '1000000', why: '100³ = 1,000,000' },
    { t: 'mc', q: 'กราฟหนาแน่น (E ≈ V²) ควรเลือกอะไรสำหรับหาระยะสั้นสุดทุกคู่?', o: ['Floyd (โค้ดสั้น เร็วเท่ากัน)', 'Dijkstra + Min-heap', 'BFS', 'Bellman-Ford'], a: 0, why: 'Dijkstra แบบอาร์เรย์ซ้ำ V ครั้งเท่ากับ V³ เท่า Floyd แต่ Floyd เขียนง่ายกว่า และ Min-heap ยิ่งช้ากว่าในกราฟหนาแน่น' },
    { t: 'mc', q: 'ในกราฟบางมาก (เช่นแผนที่ถนน) ควรเลือกอะไร?', o: ['Dijkstra + Min-heap ซ้ำ V ครั้ง (หรือ Dijkstra ต่อคำถาม)', 'Floyd เสมอ', 'Warshall', 'ไม่มีวิธีที่เหมาะ'], a: 0, why: 'V·(E+V)·log V กับ E ≈ V ให้ ~V² log V ซึ่งน้อยกว่า V³ มากเมื่อ V ใหญ่' },
  ],
  ans: `<p>V = 100 (Dense): <b>Floyd = 100³ = 1,000,000</b> · <b>Dijkstra ซ้ำ V ครั้ง (แบบอาร์เรย์) = 100 × 100² = 1,000,000</b> เท่ากันเชิงทฤษฎี (Θ(V³) ทั้งคู่)</p>
  <p><b>เกณฑ์เลือกใช้จริง:</b></p>
  <ul><li><b>กราฟหนาแน่น / V ไม่ใหญ่ / ต้องการหาทุกคู่:</b> Floyd — โค้ดสั้น เขียนง่าย ได้ทุกคู่ในครั้งเดียว และรองรับเส้นน้ำหนักติดลบ (ถ้าไม่มี negative cycle)</li>
  <li><b>กราฟบาง (E ≈ V) เช่นแผนที่ถนน/เครือข่ายใหญ่:</b> Dijkstra + Min-heap ซ้ำ V ครั้ง (V·E log V) เร็วกว่ามาก หรือรัน Dijkstra เฉพาะต้นทางที่ต้องการ</li>
  <li><b>มีน้ำหนักติดลบ:</b> Dijkstra ใช้ไม่ได้ (เป็น Greedy) ต้องใช้ Floyd หรือ Bellman-Ford</li>
  <li><b>ต้องการแค่ต้นทางเดียว:</b> Dijkstra ตัวเดียวพอ Floyd เปลืองเกินจำเป็น</li></ul>`,
  reflect: [
    'ถ้าฉันเปลี่ยน V เป็น 1000 และให้กราฟเป็นกราฟบาง (E = 3V) ตัวเลขการคำนวณของ Floyd กับ Dijkstra เปลี่ยนไปอย่างไร',
    'ท้าทายให้ฉันอธิบายว่า Floyd ใช้ DP (Overlap Subproblems) อย่างไร ส่วน Dijkstra เป็น Greedy ต่างกันอย่างไรในแง่ความถูกต้อง',
    'ถ้าฉันเปลี่ยนจากการใช้ Floyd ไปใช้ Dijkstra ในกราฟที่มีเส้นน้ำหนักติดลบ ผลจะพังตรงไหน ยกตัวอย่างกราฟ',
  ],
});
