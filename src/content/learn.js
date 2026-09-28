/* learn.js — หน้า "เรียน" ของบทที่ต้นฉบับยังไม่มีเนื้อหาสอน (เนื้อหาเพิ่มใหม่)
 * บท 1.6 Knapsack ขยาย · 1.10 Matrix Chain/LCS · 2.0 หลักการ Greedy · 2.1–2.5 · 2.6 คลังโจทย์
 * ตารางตัวอย่างทั้งหมดคำนวณสดด้วยโค้ดในหน้านี้ (ไม่พิมพ์ตัวเลขเอง) */
(function () {
  'use strict';
  const { esc } = AP;
  const INF = Infinity;
  const U = AP.ui = {};

  /* ---------- ตัวช่วยสร้าง HTML ---------- */
  U.sec = (title, html, n) => `<section class="ap-sec"><h2 class="ap-h2">${n ? `<span class="ap-n">${n}</span>` : ''}${title}</h2>${html}</section>`;
  U.note = (title, html, kind) => `<div class="ap-note ${kind || ''}"><b class="h">${title}</b>${html}</div>`;
  U.extra = (html) => `<div class="ap-note extra"><b class="h"><span class="ap-chip new">เนื้อหาเพิ่ม</span> สิ่งที่ต้นฉบับยังไม่มี</b>${html}</div>`;
  U.rec = (html) => `<div class="ap-rec">${html}</div>`;
  U.exam = (items) => `<div class="ap-note warn"><b class="h">🎯 จุดที่ข้อสอบมักถาม</b><ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul></div>`;
  U.table = (head, rows, cls) => `<div class="ap-tscroll"><table class="ap-t ${cls || ''}"><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th>${c}</th>` : `<td>${c}</td>`)).join('')}</tr>`).join('')}</tbody></table></div>`;
  // ตาราง DP: cells[r][c] = ข้อความ หรือ {t, c: class}
  U.dpt = (corner, cols, rows, cells) => `<div class="ap-tscroll"><table class="ap-dpt"><thead><tr><th>${corner}</th>${cols.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.map((r, i) => `<tr><th>${r}</th>${cells[i].map((c) => (typeof c === 'object' ? `<td class="${c.c || ''}">${c.t}</td>` : `<td>${c}</td>`)).join('')}</tr>`).join('')}</tbody></table></div>`;
  U.link = (id, label) => `<a href="#t/${id}/learn">${label || AP.topic(id).no + ' ' + AP.topic(id).short}</a>`;
  U.cx = (rows) => U.table(['', 'เวลา', 'พื้นที่'], rows);

  /* ---------- อัลกอริทึมช่วยคำนวณตารางตัวอย่าง ---------- */
  function unbounded(w, v, cap) {
    const F = [0];
    for (let j = 1; j <= cap; j++) { let b = 0; w.forEach((wi, i) => { if (wi <= j) b = Math.max(b, F[j - wi] + v[i]); }); F[j] = b; }
    return F;
  }
  function subsetTable(S, T) {
    const t = [Array.from({ length: T + 1 }, (_, j) => j === 0)];
    S.forEach((s, i) => t.push(t[i].map((x, j) => x || (j >= s && t[i][j - s]))));
    return t;
  }
  function lcsTable(X, Y) {
    const L = Array.from({ length: X.length + 1 }, () => Array(Y.length + 1).fill(0));
    for (let i = 1; i <= X.length; i++) for (let j = 1; j <= Y.length; j++) L[i][j] = X[i - 1] === Y[j - 1] ? L[i - 1][j - 1] + 1 : Math.max(L[i - 1][j], L[i][j - 1]);
    // ย้อนรอย: ถ้าเท่ากันเลือกขึ้นบนก่อน
    let i = X.length, j = Y.length, s = ''; const path = new Set();
    while (i > 0 && j > 0) {
      if (X[i - 1] === Y[j - 1]) { s = X[i - 1] + s; path.add(i + ',' + j); i--; j--; }
      else if (L[i - 1][j] >= L[i][j - 1]) i--; else j--;
    }
    return { L, s, path };
  }
  function mcm(p) {
    const n = p.length - 1, m = Array.from({ length: n + 1 }, () => Array(n + 1).fill(0)), s = Array.from({ length: n + 1 }, () => Array(n + 1).fill(0));
    for (let l = 2; l <= n; l++) for (let i = 1; i + l - 1 <= n; i++) { const j = i + l - 1; m[i][j] = INF; for (let k = i; k < j; k++) { const c = m[i][k] + m[k + 1][j] + p[i - 1] * p[k] * p[j]; if (c < m[i][j]) { m[i][j] = c; s[i][j] = k; } } }
    return { m, s, n };
  }
  const paren = (s, i, j) => (i === j ? 'A' + i : `(${paren(s, i, s[i][j])} ${paren(s, s[i][j] + 1, j)})`);
  U.calc = { unbounded, subsetTable, lcsTable, mcm, paren };

  const L = {};

  /* ============ 1.6 Knapsack ขยาย ============ */
  L.knapx = () => {
    const W = [2, 3], V = [10, 20], cap = 6, F = unbounded(W, V, cap);
    const S = [3, 34, 4, 12, 5, 2], T = 9, st = subsetTable(S, T);
    const sub = st.map((row, i) => row.map((x, j) => ({ t: x ? 'T' : 'F', c: x ? 'pick' : '' })));
    const nums = [1, 5, 11, 5], tot = nums.reduce((a, b) => a + b, 0), half = tot / 2;
    let reach = new Set([0]); const steps = [`เริ่ม: {0}`];
    nums.forEach((x) => { const nx = new Set(reach); reach.forEach((r) => { if (r + x <= half) nx.add(r + x); }); reach = nx; steps.push(`เพิ่ม ${x}: {${[...reach].sort((a, b) => a - b).join(', ')}}`); });
    return `<div class="ap-learn">
    <p class="ap-lede">ทั้งหมดนี้คือ "ตระกูล Knapsack": ตารางเดียวกับบท ${U.link('knap', '1.5')} แต่เปลี่ยนเงื่อนไขว่าหยิบซ้ำได้ไหม หรือถามแค่ว่า "ทำได้ / ทำไม่ได้" — ต้นฉบับใน dp-week8 ไม่มีหน้าสอนของบทนี้ จึงเขียนเพิ่มโดยอิงข้อ 8–10 ของ DP Lab</p>
    ${U.sec('เปรียบเทียบ 4 แบบให้เห็นความต่าง', U.table(['ปัญหา', 'สถานะ', 'Recurrence', 'เวลา / พื้นที่'], [
      ['0/1 Knapsack (บท 1.5)', 'F(i, j)', 'max{F(i−1, j), vᵢ + F(i−1, j−wᵢ)}', 'Θ(nW) / Θ(nW)'],
      ['Unbounded Knapsack (ข้อ 8)', 'F(j)', 'max{F(j−wᵢ) + vᵢ} ทุก i ที่ wᵢ ≤ j', 'Θ(nW) / Θ(W)'],
      ['Subset Sum (ข้อ 9)', 'F(i, j) จริง/เท็จ', 'F(i−1, j) ∨ F(i−1, j−sᵢ)', 'Θ(nT) / Θ(nT)'],
      ['Partition (ข้อ 10)', '= Subset Sum', 'T = sum/2 (sum ต้องเป็นเลขคู่)', 'Θ(n·sum/2)'],
    ]), 1)}
    ${U.sec('Unbounded Knapsack: หยิบชนิดเดิมซ้ำได้', `<p>ตัวอย่าง (ข้อ 8): น้ำหนัก <code>w = [2, 3]</code> มูลค่า <code>v = [10, 20]</code> ถุงจุ <code>${cap}</code></p>
      ${U.rec('F(j) = max<sub>i : wᵢ ≤ j</sub> { F(j − wᵢ) + vᵢ } · F(0) = 0')}
      ${U.dpt('j', [0, 1, 2, 3, 4, 5, 6], ['F(j)'], [F.map((x, j) => ({ t: x, c: j === cap ? 'pick' : '' }))])}
      <p>อ่านตาราง: F(6) = F(3) + 20 = 40 คือหยิบชิ้นน้ำหนัก 3 สองชิ้น (ได้ 40) ดีกว่าหยิบชิ้นน้ำหนัก 2 สามชิ้น (ได้ 30) เพราะ <b>หยิบชนิดเดิมซ้ำได้</b> จึงไม่ต้องจำว่า "ใช้ชนิดไหนไปแล้ว" — ลดจากตาราง 2 มิติเหลือแถวเดียว</p>
      ${U.note('ต่างจาก 0/1 อย่างไร', '<p>0/1 ต้องดูแถว <b>i−1</b> (ชิ้น i ใช้ได้ครั้งเดียว) แต่ Unbounded ดูช่องเดิมที่คำนวณแล้ว (<code>F(j−wᵢ)</code>) ซึ่งอาจรวมชิ้น i อยู่แล้ว. ถ้าใช้อาร์เรย์ 1 มิติกับ 0/1 ต้องวน j จาก <b>มากไปน้อย</b>; ถ้าวนจากน้อยไปมากจะกลายเป็น Unbounded โดยไม่รู้ตัว</p>')}`, 2)}
    ${U.sec('Subset Sum: มีเซตย่อยที่รวมได้ target ไหม', `<p>ตัวอย่าง (ข้อ 9): <code>S = [${S.join(', ')}]</code> target = <code>${T}</code></p>
      ${U.rec('F(i, j) = F(i−1, j) ∨ F(i−1, j − sᵢ) (ตัวหลังใช้เมื่อ j ≥ sᵢ) · F(i, 0) = จริง')}
      ${U.dpt('i \\ j', Array.from({ length: T + 1 }, (_, j) => j), ['∅', ...S.map((s, i) => `เพิ่ม ${s}`)], sub)}
      <p>คำตอบคือช่องสุดท้ายของคอลัมน์ ${T}: <b>${st[S.length][T] ? 'จริง (มีเซตย่อยที่รวมได้ ' + T + ', เช่น 4 + 5)' : 'เท็จ'}</b>. ตารางเป็นแบบ boolean จึงใช้ ∨ แทน max</p>`, 3)}
    ${U.sec('Partition Equal Subset Sum: แบ่งสองส่วนเท่ากัน', `<p>ตัวอย่าง (ข้อ 10): <code>nums = [${nums.join(', ')}]</code> ผลรวม = ${tot} → ต้องหา subset ที่รวมได้ <b>${half}</b></p>
      <ol><li>ถ้า sum เป็นเลขคี่ → ตอบเท็จทันที (แบ่งครึ่งเป็นจำนวนเต็มไม่ได้)</li><li>ไม่เช่นนั้นถาม Subset Sum ด้วย target = sum/2</li></ol>
      <p>ผลรวมที่ทำได้หลังใส่ทีละตัว (ตัดที่ ≤ ${half}):</p><div class="ap-rec">${steps.join('<br>')}</div>
      <p>${reach.has(half) ? `มี ${half} อยู่ในเซต → <b>แบ่งได้</b> (เช่น {11} กับ {1, 5, 5})` : 'ไม่มี → แบ่งไม่ได้'}</p>`, 4)}
    ${U.sec('ทำไม Θ(nT) ยังไม่ใช่ polynomial จริง (pseudo-polynomial)', `<p>เวลา Θ(n·T) ขึ้นกับ <b>ค่า</b> ของ T ไม่ใช่ <b>จำนวนบิต</b> ที่ใช้เขียน T. ถ้า T มี k บิต ค่าของ T ได้ถึง 2<sup>k</sup> เวลาจึงเป็นเลขชี้กำลังเมื่อเทียบกับขนาดอินพุต — Subset Sum และ Knapsack จึงเป็น NP-complete แต่ยังแก้ได้เร็วเมื่อ T หรือ W ไม่ใหญ่ (ดูต่อที่ ${U.link('pnp', '3.2 P vs NP')})</p>`, 5)}
    ${U.exam(['เขียน recurrence ของ Unbounded และบอกว่าต่างจาก 0/1 ที่ "ดูแถว i−1 หรือช่องเดิม"', 'Subset Sum ใช้ ∨ ไม่ใช่ max และเริ่มด้วย F(i,0) = จริง', 'Partition: sum เป็นเลขคี่ตอบเท็จ ไม่ต้องคำนวณต่อ', 'เหตุผลที่ Θ(nT) เรียกว่า pseudo-polynomial'])}
    </div>`;
  };

  /* ============ 1.10 Matrix Chain + LCS ============ */
  L.lcsmcm = () => {
    const p = [10, 20, 30, 40], M = mcm(p), n = M.n;
    const mrows = [], mcols = [];
    for (let j = 1; j <= n; j++) mcols.push('A' + j);
    for (let i = 1; i <= n; i++) mrows.push('A' + i);
    const mcells = mrows.map((_, i) => mcols.map((_, j) => (j < i ? '' : j === i ? '0' : { t: M.m[i + 1][j + 1].toLocaleString('en-US'), c: i === 0 && j === n - 1 ? 'pick' : '' })));
    const X = 'ABCBDAB', Y = 'BDCABA', R = lcsTable(X, Y);
    const lcells = R.L.map((row, i) => row.map((v, j) => ({ t: v, c: R.path.has(i + ',' + j) ? 'pick' : '' })));
    return `<div class="ap-learn">
    <p class="ap-lede">ปัญหา DP ที่มักออกสอบคู่กัน: แบ่งช่วง (Matrix Chain) และเทียบสองสายอักขระ (LCS) — ต้นฉบับมีแค่แบบฝึกข้อ 14–15 ใน DP Lab หน้านี้เพิ่มส่วนอธิบาย</p>
    ${U.sec('Matrix Chain Multiplication', `<p>จะคูณ A₁ × A₂ × … × Aₙ ให้ใช้ <b>จำนวนการคูณสเกลาร์น้อยที่สุด</b> ผลลัพธ์เหมือนกันไม่ว่าจัดวงเล็บแบบใด แต่ต้นทุนต่างกันมาก. เมทริกซ์ Aᵢ มีขนาด pᵢ₋₁ × pᵢ คูณ (a×b)(b×c) ใช้ a·b·c ครั้ง</p>
      <p>ตัวอย่าง (ข้อ 14): p = [${p.join(', ')}] คือ A₁ 10×20, A₂ 20×30, A₃ 30×40</p>
      ${U.table(['วงเล็บ', 'การคูณ', 'รวม'], [['(A₁A₂)A₃', '10·20·30 + 10·30·40', (10 * 20 * 30 + 10 * 30 * 40).toLocaleString('en-US')], ['A₁(A₂A₃)', '20·30·40 + 10·20·40', (20 * 30 * 40 + 10 * 20 * 40).toLocaleString('en-US')]])}
      ${U.rec('m[i][j] = min<sub>i ≤ k &lt; j</sub> { m[i][k] + m[k+1][j] + p<sub>i−1</sub>·p<sub>k</sub>·p<sub>j</sub> } · m[i][i] = 0')}
      <p>เติมตามความยาวห่วงโซ่ l = 2, 3, … (แนวทแยงขนานเส้นหลัก) คำตอบคือ m[1][n]</p>
      ${U.dpt('m[i][j]', mcols, mrows, mcells)}
      <p>ผลลัพธ์ m[1][${n}] = <b>${M.m[1][n].toLocaleString('en-US')}</b> ด้วยวงเล็บ <b>${paren(M.s, 1, n)}</b> (เก็บจุดตัด k ไว้ในตาราง s เพื่อย้อนรอย)</p>
      <p>ความซับซ้อน: Θ(n²) ช่อง × ลอง k ได้ถึง n ค่า = <b>Θ(n³)</b> เวลา, <b>Θ(n²)</b> พื้นที่. จำนวนวิธีวงเล็บทั้งหมดเป็นเลข Catalan (โตแบบเลขชี้กำลัง) จึงลองทุกแบบไม่ไหว</p>
      ${U.note('เชื่อมกับ Optimal BST', `โครงเดียวกับ ${U.link('obst', '1.7')} คือ "ลองทุกจุดตัด/ราก k แล้วบวกต้นทุนซ้าย + ขวา + ต้นทุนรวมช่วง" เติมตามความยาวช่วงเหมือนกัน`)}`, 1)}
    ${U.sec('Longest Common Subsequence (LCS)', `<p>หาลำดับย่อยร่วมที่ยาวที่สุดของ X และ Y — ตัวอักษรต้อง <b>เรียงตามลำดับเดิมแต่ไม่ต้องติดกัน</b>. ตัวอย่าง (ข้อ 15): X = <code>${X}</code>, Y = <code>${Y}</code></p>
      ${U.rec('L[i][j] = L[i−1][j−1] + 1 ถ้า Xᵢ = Yⱼ<br>L[i][j] = max(L[i−1][j], L[i][j−1]) ถ้า Xᵢ ≠ Yⱼ · L[0][j] = L[i][0] = 0')}
      ${U.dpt('X \\ Y', ['∅', ...Y.split('')], ['∅', ...X.split('')], lcells)}
      <p>L[${X.length}][${Y.length}] = <b>${R.L[X.length][Y.length]}</b> ย้อนรอยจากมุมขวาล่าง (ช่องที่ไฮไลต์: เมื่อตัวอักษรตรงกันไปทางเฉียง ไม่ตรงไปทางที่ค่ามากกว่า) ได้ตัวอย่างหนึ่งคำตอบคือ <b>${R.s}</b> (LCS มีได้หลายคำตอบ ความยาวเท่ากัน)</p>
      <p>ความซับซ้อน: <b>Θ(m·n)</b> เวลาและพื้นที่ (ลดเหลือ Θ(min(m, n)) ได้ถ้าต้องการแค่ความยาว)</p>
      ${U.note('ระวังสับสน', 'Longest Common <b>Subsequence</b> ไม่ต้องติดกัน ส่วน Longest Common <b>Substring</b> ต้องติดกัน (สูตรต่างกัน: ถ้าไม่ตรงให้ใส่ 0)', 'warn')}`, 2)}
    ${U.exam(['ระบุ pᵢ₋₁·pₖ·pⱼ ให้ถูก (ดัชนีสลับง่าย) และเติมตามความยาวห่วงโซ่', 'LCS: กรณีตรงกันใช้เส้นทแยง +1, ไม่ตรงใช้ max ของบนกับซ้าย', 'เวลา MCM Θ(n³) แต่ LCS Θ(mn)'])}
    </div>`;
  };

  /* ============ 2.0 หลักการ Greedy ============ */
  L.gprin = () => `<div class="ap-learn">
    <p class="ap-lede">Greedy (โลภ) คือกลยุทธ์ "เลือกตัวเลือกที่ดีที่สุดในตอนนั้นทันที โดยไม่ย้อนกลับมาแก้" หวังว่า local optimum ทีละจุดจะรวมกันเป็น global optimum — สรุปจาก notebook ภาค 1 และสไลด์ Week 9</p>
    ${U.sec('อัลกอริทึม Greedy ทำงาน 4 ขั้น', `<div class="ap-steps4"><div><b>1</b>เรียง / จัดลำดับตาม "เกณฑ์" เช่น เวลาจบ, ค่าต่อหน่วย, ตัวเล็กสุด</div><div><b>2</b>เลือกตัวแรกสุดที่ยังใช้ได้ (feasible)</div><div><b>3</b>ตัดสินใจแล้ว <u>ไม่ย้อน</u> อัปเดตสถานะ</div><div><b>4</b>ทำซ้ำจนหมดตัวเลือก</div></div>`, 1)}
    ${U.sec('เมื่อไหร่ Greedy ถึงถูกต้อง: 2 คุณสมบัติ', U.table(['คุณสมบัติ', 'ความหมาย', 'ตัวอย่าง'], [
      ['Greedy-choice property', 'มีคำตอบที่ดีที่สุดอย่างน้อยหนึ่งคำตอบที่ <i>เริ่มด้วยการเลือกแบบ greedy</i>', 'Activity Selection: เลือกงานที่จบเร็วสุดก่อนไม่เสียโอกาส'],
      ['Optimal substructure', 'หลังเลือกแล้วเหลือ "ปัญหาเดิมที่เล็กลง" และคำตอบย่อยที่ดีที่สุดรวมกับที่เลือก = ดีที่สุดรวม', 'หลังเลือกงานแรก เหลือเลือกงานที่เริ่มหลังเวลานั้น'],
    ]) + `<h3 class="ap-h3" style="margin-top:16px">เทคนิคพิสูจน์: Exchange Argument</h3><ol><li>สมมติมีคำตอบดีที่สุด OPT ที่ไม่ได้เลือกแบบ greedy</li><li>นำตัวเลือกแรกของ OPT มา <b>สลับ</b> กับตัวเลือกของ greedy</li><li>แสดงว่าคำตอบหลังสลับ <b>ไม่แย่ลง</b> และยังใช้ได้ → greedy ก็ดีที่สุดเช่นกัน</li></ol>`, 2)}
    ${U.sec('Greedy ไม่ได้ถูกต้องเสมอไป', `<div class="ap-grid">
      <div class="ap-card"><h3 class="ap-h3">ทอนเหรียญ {1, 3, 4} ยอด 6</h3><p>Greedy: 4 + 1 + 1 = <b>3 เหรียญ</b><br>ที่ดีที่สุด: 3 + 3 = <b>2 เหรียญ</b> → Greedy ผิด ต้องใช้ DP (บท ${U.link('change', '1.2')})</p></div>
      <div class="ap-card"><h3 class="ap-h3">Knapsack 0/1 (W = 50)</h3><p>ของ (มูลค่า, น้ำหนัก): (60,10) (100,20) (120,30). เรียงตามค่า/น้ำหนัก ได้ 60 + 100 = <b>160</b> แต่ที่ดีที่สุดคือ 100 + 120 = <b>220</b>. ถ้า <u>แบ่งของได้</u> Greedy ได้ 240 และดีที่สุดจริง</p></div>
      <div class="ap-card"><h3 class="ap-h3">Weighted Activity Selection</h3><p>ถ้างานมีค่าตอบแทน การเลือกงานที่จบเร็วสุดไม่รับประกันคำตอบที่ดีที่สุด → ต้องใช้ DP</p></div></div>
      ${U.note('ปัญหาเดียวกัน เกณฑ์ต่างกัน', 'ในปัญหาเดียวกันมีทั้ง "เกณฑ์ที่ถูก" และ "เกณฑ์ที่ผิด" — ลองเล่นด้านล่าง (แท็บอนิเมชัน) กับ Activity Selection 4 เกณฑ์', 'warn')}`, 3)}
    ${U.sec('แนวทางคิดโจทย์ Greedy', `<div class="ap-steps4"><div><b>1</b>ระบุ "สิ่งที่ต้องเลือก" งาน? เหรียญ? ตำแหน่งวางเสา?</div><div><b>2</b>เดาเกณฑ์ greedy เล็กสุด / ใหญ่สุด / จบเร็วสุด / ค่าต่อหน่วยสูงสุด</div><div><b>3</b>หา counter-example ลองเคสเล็กที่ทำให้เกณฑ์พัง</div><div><b>4</b>พิสูจน์ exchange argument หรือสุ่มเทสต์เทียบ brute force</div></div>
      ${U.table(['สถานการณ์ในโจทย์', 'เครื่องมือ'], [
        ['เลือกช่วงเวลาไม่ซ้อนกัน / นัดหมาย', 'เรียงตาม <b>เวลาจบ</b>'], ['วางจุดคลุมช่วง / ครอบคลุมเส้นตรง', 'เรียงตำแหน่ง + วาง <b>ไกลสุดที่ยังคลุมได้</b>'],
        ['นับทรัพยากรที่ใช้พร้อมกัน', 'เรียงเหตุการณ์แยกกัน + two pointers'], ['รวม/ต่อของโดยต้นทุนขึ้นกับผลรวม', '<b>Min-Heap</b> รวมตัวเล็กสุดก่อน'],
        ['เลือกของที่แบ่งได้', 'เรียงตาม <b>value/weight</b>'], ['มีเดดไลน์ + กำไร', 'เรียงตามกำไร + วางช่อง <b>ท้ายสุดที่ทัน</b>'],
        ['ต้องการ optimal เสมอแต่ Greedy พัง', '<b>Dynamic Programming</b> (0/1 knapsack, coin change ทั่วไป)'],
      ])}`, 4)}
    ${U.sec('DP กับ Greedy ต่างกันตรงไหน', U.table(['', 'Dynamic Programming', 'Greedy'], [
      ['วิธีตัดสินใจ', 'คำนวณทุกปัญหาย่อยแล้วเลือกที่ดีที่สุด (ย้อนดูตารางได้)', 'เลือกทีเดียวแล้วไม่ย้อน'], ['ต้องพิสูจน์อะไร', 'Optimal substructure + ปัญหาย่อยซ้อนทับ', 'Greedy-choice property (exchange argument)'],
      ['ความเร็ว', 'ปกติช้ากว่า (Θ(nW), Θ(n³) …)', 'เร็ว (มักเรียง O(n log n))'], ['ความแน่นอน', 'ได้ optimal เมื่อตั้ง recurrence ถูก', 'ได้ optimal เฉพาะปัญหาที่พิสูจน์แล้ว'],
    ]), 5)}
    ${U.exam(['ยกตัวอย่างที่ Greedy ผิด: เหรียญ {1, 3, 4}, 0/1 knapsack', 'อธิบาย exchange argument ของ Activity Selection ("จบเร็วสุด")', 'Fractional knapsack ใช้ Greedy ได้ แต่ 0/1 ต้องใช้ DP'])}
  </div>`;

  /* ============ 2.1 ทอนเหรียญ ============ */
  L.gcoin = () => `<div class="ap-learn">
    <p class="ap-lede">ทอนเหรียญเป็นตัวอย่างที่ชัดที่สุดว่า Greedy ใช้ได้เฉพาะบางกรณี — เปรียบเทียบกับ DP ของบท ${U.link('change', '1.2')} ในแท็บอนิเมชัน (มีโหมด Greedy vs Optimal)</p>
    ${U.sec('สองวิธี เทียบกัน', U.table(['', 'Greedy', 'DP (Change-making)'], [
      ['หลักคิด', 'ใช้เหรียญใหญ่สุดที่ไม่เกินยอดคงเหลือ ซ้ำจนครบ', 'F(n) = min{F(n − dⱼ)} + 1 เติมตารางตั้งแต่ 0 ถึง n'],
      ['เวลา', 'O(k) หลังเรียงเหรียญ (k = จำนวนชนิด)', 'Θ(n·k)'], ['ถูกต้องเมื่อไหร่', 'เฉพาะระบบเหรียญที่ Greedy ให้ optimal (canonical)', 'ทุกชุดเหรียญ (ที่มีเหรียญ 1 หรือทอนได้)'],
    ]), 1)}
    ${U.sec('ตัวอย่างสองชุด', U.table(['ชุดเหรียญ', 'ยอด', 'Greedy', 'ที่ดีที่สุด'], [
      ['{1, 2, 5, 10}', '28', '10 + 10 + 5 + 2 + 1 = 5 เหรียญ', '5 เหรียญ (เท่ากัน ✓)'], ['{1, 3, 4}', '6', '4 + 1 + 1 = 3 เหรียญ', '3 + 3 = 2 เหรียญ (Greedy พลาด ✗)'],
    ]) + '<p>เหรียญ {20, 10, 5, 1} ใช้ Greedy ได้ เพราะเหรียญใหญ่แทนด้วยเหรียญเล็กหลายเหรียญได้ลงตัว (20 = 10+10, 10 = 5+5 …) จึงไม่มีทางแย่กว่า — แต่ {1, 3, 4} ไม่ลงตัว</p>', 2)}
    ${U.extra('<p><b>ตรวจว่า Greedy ใช้ได้ไหม:</b> ลองเทียบ Greedy กับ DP ทุกยอดจนถึงเหรียญใหญ่สุด + เหรียญรองใหญ่สุด (มีทฤษฎีบทว่าพอ) หรือลองเล่นเกม "Greedy ได้ optimal ไหม?" ที่แท็บเกม เพื่อฝึกจับ counter-example. ระบบเหรียญที่ Greedy ใช้ได้เรียกว่า <i>canonical coin system</i></p>')}
    ${U.exam(['ยกตัวอย่างชุดเหรียญที่ Greedy ผิดและบอกคำตอบที่ถูก', 'ทำไมชุดเหรียญ {20, 10, 5, 1} ใช้ Greedy ได้', 'Greedy กับ DP ความซับซ้อนต่างกันอย่างไร'])}
  </div>`;

  /* ============ 2.2 Prim / MST ============ */
  L.prim = () => `<div class="ap-learn">
    ${U.sec('Spanning tree และ Minimum spanning tree', `<div class="ap-grid"><div class="ap-card"><b>spanning tree</b><p>sub graph ที่ไม่มีวงจร (acyclic) และเชื่อมทุกโหนดของกราฟไว้ด้วยกัน</p></div><div class="ap-card"><b>minimum spanning tree (MST)</b><p>spanning tree ที่มี weight รวมน้อยที่สุด</p></div></div>
      <div class="m-gr"><div class="def-grid" data-defs></div></div><p class="ap-small ap-muted">กราฟตั้งต้น 4 โหนดมี spanning tree หลายต้น (น้ำหนัก 6, 8, 9) — ต้นที่เบาที่สุดคือ MST. กราฟที่มี |V| โหนด MST มี <b>|V| − 1</b> เส้นเสมอ</p>`, 1)}
    ${U.sec('Prim: ขยายต้นไม้จากโหนดเดียวทีละโหนด', `${U.rec('VT ← {v₀}; ET ← ∅<br>for i ← 1 to |V| − 1 do<br>&nbsp;&nbsp;หาเส้น e* = (v*, u*) น้ำหนักน้อยสุด โดย v* ∈ VT และ u* ∈ V − VT<br>&nbsp;&nbsp;VT ← VT ∪ {u*}; ET ← ET ∪ {e*}<br>return ET')}
      <ul><li>ทุกรอบเลือกเส้นที่เบาที่สุดที่ <b>ข้ามจากต้นไม้ไปโหนดนอกต้นไม้</b></li><li>ระหว่างทำงานเป็นต้นไม้ต้นเดียวที่ต่อกันเสมอ</li><li>ทำไมถูก: เส้นเบาสุดที่ข้ามรอยตัด (cut) ใด ๆ อยู่ใน MST บางต้นเสมอ (ทำ exchange argument ได้)</li></ul>
      ${U.cx([['ใช้ weight matrix + array ธรรมดา', 'Θ(|V|²)', 'Θ(|V|²)'], ['ใช้ adjacency list + min-heap', 'O(|E| log |V|)', 'Θ(|V| + |E|)']])}`, 2)}
    ${U.note('ค่าที่เก็บในตาราง', 'Prim เก็บ <b>น้ำหนักของเส้นเดียว</b> ที่ดีที่สุดเข้าโหนดนั้น (ตาราง v(p, w)); Dijkstra เก็บ <b>ระยะสะสม</b> จากต้นทาง — สับสนสองอย่างนี้บ่อย ดูตารางเปรียบเทียบที่บท 2.4', 'warn')}
    ${U.exam(['เขียนลำดับโหนด/เส้นที่ Prim เลือกทีละรอบบนกราฟที่กำหนด (เริ่มที่ a)', 'น้ำหนักรวมของ MST และจำนวนเส้น |V| − 1', 'ความซับซ้อนแบบ heap: O(|E| log |V|)'])}
  </div>`;

  /* ============ 2.3 Kruskal ============ */
  L.kruskal = () => `<div class="ap-learn">
    ${U.sec('Kruskal: เรียงเส้นแล้วรับทีละเส้นถ้าไม่เกิดวงจร', `${U.rec('เรียงเส้นตามน้ำหนัก (น้อย → มาก) · ET ← ∅ · ecounter ← 0<br>for แต่ละเส้น (u, v) ตามลำดับ do<br>&nbsp;&nbsp;if ET ∪ {(u, v)} ไม่เกิดวงจร then ET ← ET ∪ {(u, v)}; ecounter ← ecounter + 1<br>&nbsp;&nbsp;if ecounter = |V| − 1 then หยุด')}
      <ul><li>ระหว่างทำงานเป็น <b>ป่า</b> (หลายต้น) แล้วค่อยรวมเป็นต้นเดียว ต่างจาก Prim</li><li>ตรวจวงจรด้วย <b>Union-Find</b>: ถ้า u กับ v อยู่กลุ่มเดียวกันอยู่แล้ว รับเส้นนี้จะเกิดวงจร → ปฏิเสธ; ไม่เช่นนั้นรับและรวมสองกลุ่ม</li><li>เส้นที่น้ำหนักเท่ากันเลือกลำดับใดก็ได้ MST อาจต่างกันแต่น้ำหนักรวมเท่ากัน</li></ul>
      ${U.cx([['เรียงเส้น + Union-Find', 'O(|E| log |E|) = O(|E| log |V|)', 'Θ(|V| + |E|)']])}`, 1)}
    ${U.extra('<p><b>เลือก Prim หรือ Kruskal:</b> กราฟหนาแน่น (|E| ≈ |V|²) Prim แบบ array Θ(|V|²) มักเหมาะ ส่วนกราฟบาง Kruskal ตรงไปตรงมาเพราะเรียงเส้นครั้งเดียว. ทั้งสองให้น้ำหนัก MST เท่ากัน</p>')}
    ${U.exam(['ไล่ sorted list ของเส้นและบอกว่าเส้นไหนถูกปฏิเสธเพราะวงจร', 'Kruskal ใช้ Union-Find; Prim ใช้ priority queue', 'ทำไมหยุดเมื่อ ecounter = |V| − 1'])}
  </div>`;

  /* ============ 2.4 Dijkstra ============ */
  L.dijkstra = () => `<div class="ap-learn">
    ${U.sec('Dijkstra: เส้นทางสั้นที่สุดจากต้นทางเดียว', `${U.rec('d[s] ← 0; d[v] ← ∞ ทุกโหนดอื่น; Q ← ทุกโหนด; VT ← ∅<br>while Q ไม่ว่าง do<br>&nbsp;&nbsp;u ← DeleteMin(Q) (โหนดที่ d น้อยสุด) → ย้ายเข้า VT<br>&nbsp;&nbsp;for แต่ละเพื่อนบ้าน v ของ u ที่ยังอยู่ใน Q: if d[u] + w(u,v) &lt; d[v] then d[v] ← d[u] + w(u,v); p[v] ← u')}
      <ul><li>เมื่อโหนดเข้า VT แล้ว ค่า d ถือว่า <b>สุดท้าย</b> (Greedy: ไม่ย้อนแก้)</li><li>ใช้ได้เมื่อ <b>ไม่มีเส้นน้ำหนักติดลบ</b> — ถ้ามี ค่า d ที่ถือว่าสุดท้ายแล้วอาจต้องแก้ทีหลัง</li><li>ผลคือ shortest-path tree จากต้นทาง อ่านเส้นทางย้อนด้วย p[·]</li></ul>
      ${U.cx([['weight matrix + unordered array', 'Θ(|V|²)', 'Θ(|V|²)'], ['adjacency list + min-heap', 'O(|E| log |V|)', 'Θ(|V| + |E|)']])}`, 1)}
    ${U.sec('เทียบ Prim / Kruskal / Dijkstra', AP.gr.SUMMARY.match(/<div class="table-scroll">[\s\S]*?<\/table><\/div>/)[0].replace('table-scroll', 'ap-tscroll').replace('class="cmp"', 'class="ap-t"'), 2)}
    ${U.sec('Floyd vs Dijkstra (ข้อ 20 ของ DP Lab)', `<p>ทุกคู่โหนด: Floyd รันครั้งเดียว Θ(V³) เทียบกับ Dijkstra ซ้ำ V ครั้ง — กราฟหนาแน่น (E ≈ V²) ทั้งสองเป็น V³ (Dijkstra แบบ array) ส่วนกราฟบาง Dijkstra + heap เร็วกว่ามาก แต่ Floyd ทนน้ำหนักติดลบ (ห้ามมีวงจรลบ) และโค้ดสั้น — ดูแบบฝึกที่แท็บ "แบบฝึก"</p>`, 3)}
    ${U.exam(['เขียนตาราง d และโหนดถัดไปที่ถูกเลือกในแต่ละรอบ', 'ข้อใดทำให้ Dijkstra ใช้ไม่ได้: น้ำหนักติดลบ (ไม่ใช่วงจร)', 'ต่างจาก Prim: ระยะสะสมจากต้นทาง vs น้ำหนักเส้นเดียว'])}
  </div>`;

  /* ============ 2.5 Huffman ============ */
  L.huffman = () => `<div class="ap-learn">
    ${U.sec('Huffman coding: รหัสความยาวแปรผันแบบ prefix-free', `<p>ให้ตัวอักษรที่ถี่ได้รหัสสั้น ตัวที่ไม่ถี่ได้รหัสยาว โดยไม่มีรหัสใดเป็น <b>prefix</b> ของรหัสอื่น จึงถอดรหัสได้ไม่กำกวม</p>
      ${U.rec('ใส่ตัวอักษรแต่ละตัวเป็นต้นไม้โหนดเดียว (น้ำหนัก = ความถี่) ลง priority queue<br>repeat: ดึง 2 ต้นที่น้ำหนักน้อยสุด → ต่อเป็นลูกซ้าย/ขวาของโหนดใหม่ น้ำหนัก = ผลรวม → ใส่กลับ<br>until เหลือต้นเดียว · อ่านรหัส: เดินจากรากลงใบ ซ้าย = 0, ขวา = 1')}
      <p>ตัวอย่างสไลด์: A 0.35, B 0.1, C 0.2, D 0.2, _ 0.15 → A = 11, B = 100, C = 00, D = 01, _ = 101</p>`, 1)}
    ${U.sec('คำนวณ', `<ul><li>จำนวนบิตเฉลี่ยต่อตัวอักษร = Σ (ความยาวรหัส × ความถี่) = 2·0.35 + 3·0.1 + 2·0.2 + 2·0.2 + 3·0.15 = <b>2.25</b></li><li>รหัสความยาวคงที่ของ 5 ตัวอักษรต้องใช้ 3 บิต → บีบอัดได้ (3 − 2.25)/3 = <b>25%</b></li><li>ถอดรหัส <code>011101</code> = 01 | 11 | 01 = <b>DAD</b> (อ่านบิตทีละตัวจนถึงใบ แล้วกลับไปที่ราก)</li></ul>${U.cx([['ใช้ min-heap (n ตัวอักษร)', 'O(n log n)', 'Θ(n)']])}`, 2)}
    ${U.extra('<p><b>เชื่อมกับโจทย์ต่อเชือก (ข้อ 8):</b> ต้นทุนรวมของการรวมทุกครั้ง = Σ (ความถี่ × ความลึก) เท่ากับจำนวนบิตรวมของข้อความที่เข้ารหัส เหตุผลเดียวกับที่ต้องรวมตัวเล็กสุดก่อน (ตัวเล็กควรลึก). ถ้ามีความถี่เท่ากันหลายตัว ต้นไม้/รหัสอาจต่างกันได้แต่ความยาวเฉลี่ยเท่ากัน</p>')}
    ${U.exam(['สร้างต้น Huffman จากตารางความถี่และอ่านรหัสของแต่ละตัว', 'คำนวณจำนวนบิตเฉลี่ยและเปอร์เซ็นต์การบีบอัด', 'ถอดรหัสสายบิตที่ให้มา'])}
  </div>`;

  /* ============ 2.6 คลังโจทย์ Greedy ============ */
  const LV = { easy: ['🟢', 'ง่าย'], medium: ['🟠', 'ปานกลาง'], advanced: ['🔴', 'ประยุกต์'] };
  L.gprob = () => `<div class="ap-learn">
    <p class="ap-lede">โจทย์ Greedy 12 ข้อจาก labgreedy.html เก็บโจทย์และเฉลยเดิมครบ เพิ่มหลักการ เหตุผลว่าทำไมถูก อนิเมชัน และควิซจาก notebook — เข้าไปทำที่แท็บ "แบบฝึก"</p>
    ${U.sec('แผนที่รูปแบบ Greedy ของ 12 ข้อ', U.table(['ข้อ', 'ปัญหา', 'กลยุทธ์ Greedy', 'เกณฑ์เรียง', 'เวลา'], AP.LABGREEDY.map((p) => {
      const nb = AP.GP.NB[p.n], lv = LV[nb.level];
      return [`<a href="#t/gprob/practice/${p.n}">${lv[0]} ${p.n}</a>`, esc(p.title.replace(/^ข้อ \d+:\s*/, '')), nb.strat, nb.key, `<span class="ap-mono">${nb.cx}</span>`];
    })) + `<p class="ap-small">🟢 Easy ข้อ 1–4 · 🟠 Medium ข้อ 5–8 · 🔴 Advanced ข้อ 9–12 · จับสังเกต: ข้อ 5, 10, 11 = ตระกูล Interval/Scheduling, ข้อ 8, 12 = Merge ด้วย Heap, ข้อ 1, 6 = เลือกตามค่าต่อหน่วยที่ดีที่สุด</p>`, 1)}
    ${U.sec('จุดที่แก้จากต้นฉบับ', `<p>ตรวจโดยรันโค้ดทุกข้อพบว่าค่าตัวอย่างในไฟล์ HTML เดิม 5 จุดไม่ตรงกับที่โค้ดคำนวณได้ (แก้ไว้ในหน้าโจทย์แต่ละข้อด้วย):</p><ul>
      <li><b>ข้อ 3</b> <code>max_people([1,2,4,8,9,12], 3)</code> → <b>4</b> ไม่ใช่ 3</li><li><b>ข้อ 7</b> <code>minimize_max_pair([3,5,4,5,2,6])</code> → <b>9</b> ไม่ใช่ 8</li>
      <li><b>ข้อ 8</b> <code>min_cost_connect([1,2,5,10,35])</code> → <b>82</b> ไม่ใช่ 85</li><li><b>ข้อ 10</b> โค้ดเดิมวางเสาที่ตำแหน่งบ้าน → ต้องวางที่ <code>loc + R</code>; <code>[1,2,3,10,14,17], R=3</code> → <b>3</b> ต้น</li></ul>`, 2)}
    ${U.sec('ทดสอบ Greedy ด้วย Brute Force', `<p>อย่าเชื่อ Greedy เพียงเพราะตัวอย่างผ่าน: สุ่มอินพุตหลายชุดแล้วเทียบกับการลองทุกความเป็นไปได้ (brute force) ถ้าตรงกันทุกครั้งแสดงว่าน่าเชื่อถือ (แต่ไม่ใช่การพิสูจน์) — ลองด้วยตัวเองในเกม "Greedy ได้ optimal ไหม?"</p>`, 3)}
    ${U.sec('แบบฝึกต่อยอด', `<ol><li>แก้ข้อ 1 ให้รับรายการเหรียญใดก็ได้ แล้วเทียบกับ DP ว่ากรณีไหน Greedy ผิด</li><li>ข้อ 9: ใช้ Union-Find (DSU) หาช่องว่างท้ายสุดเพื่อลดเวลา</li><li>ข้อ 12: เพิ่ม <code>encode(text)</code> / <code>decode(bits)</code></li><li>ข้อ 5: เปลี่ยนเป็น Weighted Activity Selection แล้วดูว่า Greedy ยังใช้ได้ไหม (คำใบ้: ไม่ได้ ต้อง DP)</li></ol>`, 4)}
  </div>`;

  AP.learn = L;
  AP.LEVEL_ICON = LV;
})();
