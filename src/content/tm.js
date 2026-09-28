/* tm.js — Part 3 ทฤษฎีการคำนวณ (เนื้อหาใหม่จาก DTM_vs_NTM_Presentation.pptx)
 * 3.1 DTM vs NTM  ·  3.2 P, NP, P vs NP + TSP
 * ส่วนที่สไลด์ยังขาดหรือพูดไม่ตรงนัก ใส่กล่อง "เนื้อหาเพิ่ม" กำกับไว้ */
(function () {
  'use strict';
  const { esc } = AP, U = AP.ui, NS = 'http://www.w3.org/2000/svg';
  const $ = (s, r) => (r || document).querySelector(s);
  const L = {}, A = {};

  /* ============ 3.1 เนื้อหา ============ */
  L.dtm = () => `<div class="ap-learn">
    <p class="ap-lede">จากสไลด์ "เจาะลึกความต่าง DTM vs NTM และปริศนา P vs NP" — สองโมเดลของ Turing Machine ที่ต่างกันที่ว่าแต่ละขั้นมีกี่ทางเลือก</p>
    ${U.sec('Deterministic Turing Machine (DTM)', `<div class="ap-grid">
      <div class="ap-card"><b>ความหมาย</b><p>โมเดลการคำนวณที่มีเส้นทางชัดเจนแน่นอน</p></div>
      <div class="ap-card"><b>หลักการทำงาน</b><p>ในแต่ละสถานะ เมื่ออ่านสัญลักษณ์บนเทป จะมี <b>ทางเลือกเดียว</b> เสมอสำหรับสถานะถัดไป</p></div>
      <div class="ap-card"><b>รูปแบบการประมวลผล</b><p>เป็นเส้นตรง (Linear Path) จากจุดเริ่มต้นถึงจุดสิ้นสุดทีละขั้นตอน</p></div>
      <div class="ap-card"><b>การใช้งานจริง</b><p>เป็นรากฐานของคอมพิวเตอร์และชิปประมวลผลทุกเครื่องในปัจจุบัน</p></div></div>`, 1)}
    ${U.sec('Nondeterministic Turing Machine (NTM)', `<div class="ap-grid">
      <div class="ap-card"><b>ความหมาย</b><p>โมเดลการคำนวณในอุดมคติที่สามารถ "เดา" และประมวลผลขนานได้</p></div>
      <div class="ap-card"><b>หลักการทำงาน</b><p>ในแต่ละสถานะ เลือกสถานะถัดไปได้ <b>หลายทางเลือกพร้อมกัน</b></p></div>
      <div class="ap-card"><b>รูปแบบการประมวลผล</b><p>แตกแขนงเป็นต้นไม้ (Computation Tree)</p></div>
      <div class="ap-card"><b>เงื่อนไขการสำเร็จ</b><p>ขอเพียงมี <b>เส้นทางเดียว</b> ที่เจอคำตอบที่ถูกต้อง เครื่องจะยอมรับ (accept) ทันที</p></div>
      <div class="ap-card"><b>การใช้งานจริง</b><p>เป็นเครื่องจักรในอุดมคติทางทฤษฎี ไม่มีฮาร์ดแวร์จริงที่ทำได้สมบูรณ์แบบ</p></div></div>`, 2)}
    ${U.sec('ตารางเปรียบเทียบ', U.table(['คุณสมบัติ', 'DTM (Deterministic)', 'NTM (Nondeterministic)'], [
      ['ทางเลือกถัดไป', 'มีเพียง 1 ทางเลือกเสมอ', 'มีได้หลายทางเลือกพร้อมกัน'],
      ['โครงสร้างการวิ่ง', 'เส้นตรง (Linear sequence)', 'แตกกิ่งก้านขนาน (Parallel tree)'],
      ['ความเร็วโจทย์ยาก', 'ใช้เวลามาก (Exponential)', 'ใช้เวลาน้อย (Polynomial)'],
      ['Computational Power', 'เท่ากัน (แก้ปัญหาได้เหมือนกัน)', 'เท่ากัน (แก้ปัญหาได้เหมือนกัน)'],
    ]), 3)}
    ${U.extra(`<ul>
      <li><b>นิยามเชิงรูปแบบ:</b> DTM มีฟังก์ชันเปลี่ยนสถานะ <code>δ : Q × Γ → Q × Γ × {L, R}</code> (ผลลัพธ์เดียว) ส่วน NTM ใช้ <code>δ : Q × Γ → 𝒫(Q × Γ × {L, R})</code> (ได้ <i>เซตของ</i> ทางเลือก)</li>
      <li><b>accept / reject:</b> NTM ยอมรับเมื่อ <i>มีอย่างน้อยหนึ่งกิ่ง</i> ที่ accept แต่จะปฏิเสธได้ต่อเมื่อ <i>ทุกกิ่ง</i> ปฏิเสธ</li>
      <li><b>ทำไม "Computational Power เท่ากัน":</b> DTM จำลอง NTM ได้ โดยไล่ต้นไม้การคำนวณทีละระดับ (BFS) — ถ้าต้นไม้สูง t และแตกกิ่งละ b ทาง ต้องตรวจราว b<sup>t</sup> โหนด จึงช้าลงแบบเลขชี้กำลัง แต่ตอบได้เหมือนกัน. NTM ไม่ได้ "แก้ปัญหาที่ DTM แก้ไม่ได้" แต่ "เร็วกว่า" เท่านั้น</li>
      <li><b>เวลาของ NTM</b> = ความสูงของกิ่งที่ accept สั้นที่สุด (ไม่ใช่จำนวนโหนดทั้งต้น). "ขนาน" ในสไลด์เป็นภาพเปรียบเทียบ ไม่ใช่เครื่องขนานจริง</li></ul>`)}
    ${U.exam(['DTM: 1 ทางเลือกต่อขั้น · NTM: หลายทาง (computation tree, accept ถ้ามีกิ่งเดียวสำเร็จ)', 'พลังการคำนวณเท่ากัน ต่างที่ความเร็ว (เวลา)', 'NTM เป็นแบบจำลองทางทฤษฎี ไม่มีเครื่องจริง'])}
  </div>`;

  /* ============ 3.2 เนื้อหา ============ */
  const fact = (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
  const human = (sec) => {
    if (sec < 1) return '< 1 วินาที'; const m = 60, h = 3600, d = 86400, y = 31557600;
    if (sec < m) return sec.toFixed(0) + ' วินาที'; if (sec < h) return (sec / m).toFixed(0) + ' นาที'; if (sec < d) return (sec / h).toFixed(1) + ' ชั่วโมง';
    if (sec < y) return (sec / d).toFixed(0) + ' วัน'; const yr = sec / y;
    return yr < 1e6 ? yr.toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' ปี' : yr.toExponential(1).replace('e+', ' × 10^') + ' ปี';
  };
  L.pnp = () => `<div class="ap-learn">
    <p class="ap-lede">ความเชื่อมโยงจาก DTM/NTM สู่คลาสปัญหา P และ NP — และคำถามที่ยังไม่มีใครตอบ: P = NP หรือไม่?</p>
    ${U.sec('Class P และ Class NP', `<div class="ap-grid">
      <div class="ap-card"><b>Class P (Polynomial Time)</b><p>กลุ่มปัญหาที่ <b>DTM แก้ได้เร็ว</b> (ในเวลา polynomial) — คอมพิวเตอร์ปัจจุบันจัดการได้ดี เช่น การเรียงลำดับข้อมูล</p></div>
      <div class="ap-card"><b>Class NP (Nondeterministic Polynomial Time)</b><p>กลุ่มปัญหาที่ <b>NTM แก้ได้เร็ว</b> แต่ถ้าใช้ DTM แก้จะช้ามาก (แต่ DTM <b>ตรวจสอบคำตอบ</b> ได้เร็ว)</p></div>
      <div class="ap-card"><b>คำถามระดับโลก: P = NP หรือไม่?</b><p>ถ้าเท่ากัน แปลว่าปัญหาที่ NTM แก้ได้เร็ว DTM ก็ต้องมีวิธีแก้ได้เร็วเช่นกัน — ปัจจุบันยังไม่มีใครพิสูจน์ได้</p></div></div>`, 1)}
    ${U.sec('กรณีศึกษา: ปัญหาพนักงานขายเดินทาง (TSP)', `<p><b>โจทย์:</b> หาเส้นทางผ่านทุกเมือง เมืองละ 1 ครั้ง (แล้วกลับจุดเริ่ม) ให้ได้ระยะทางสั้นที่สุด</p>
      <ul><li><b>DTM:</b> ต้องตรวจทีละเส้นทางจนครบทุกรูปแบบ ยิ่งเมืองเยอะยิ่งใช้เวลาเพิ่มแบบทวีคูณ (Exponential Time) คำนวณเป็นร้อยปี</li>
      <li><b>NTM:</b> แตกกิ่งขนานคิดทุกเส้นทางที่เป็นไปได้พร้อมกัน แล้วหยิบเส้นทางที่สั้นที่สุดออกมา (Polynomial Time)</li></ul>
      <p>จำนวนเส้นทาง (ทัวร์แบบมีทิศทาง) ของ n เมือง = <b>(n − 1)!</b> :</p>
      ${U.table(['n เมือง', '(n − 1)! เส้นทาง', 'ที่ 10⁹ เส้นทาง/วินาที'], [5, 10, 15, 20, 25].map((n) => [n, n <= 15 ? fact(n - 1).toLocaleString('en-US') : fact(n - 1).toExponential(2).replace('e+', ' × 10^'), human(fact(n - 1) / 1e9)]))}`, 2)}
    ${U.extra(`<ul>
      <li><b>P ⊆ NP:</b> DTM คือ NTM ที่มีทางเลือกเดียวต่อขั้น ปัญหาใดที่แก้ได้เร็วด้วย DTM ก็ตรวจคำตอบได้เร็ว. คำถามคือ <i>NP ⊆ P</i> ด้วยหรือไม่</li>
      <li><b>นิยาม NP อีกแบบ (verifier):</b> ปัญหาอยู่ใน NP ถ้ามี "ใบรับรองคำตอบ" (certificate) ที่ DTM ตรวจได้ใน polynomial time — เช่น ให้ทัวร์มาหนึ่งเส้น ตรวจได้ว่าผ่านครบทุกเมืองและยาว ≤ k ไหมในเวลา O(n)</li>
      <li><b>TSP ที่สไลด์พูดถึงตรงกับเวอร์ชันไหน:</b> เครื่องจักร NTM เป็นตัว <i>ตัดสินใจ</i> (accept/reject) จึงเหมาะกับ <b>TSP แบบ decision</b>: "มีทัวร์ที่ยาวไม่เกิน k หรือไม่" — NTM เดาทัวร์หนึ่งเส้นแล้วตรวจความยาว ใช้เวลา polynomial ดังนั้น TSP-decision ∈ NP (และเป็น <b>NP-complete</b>). ส่วนแบบ "หาเส้นทางที่สั้นที่สุด" (optimization) เป็น NP-hard ได้คำตอบโดยเรียก decision หลายครั้งเปลี่ยน k (binary search)</li>
      <li><b>NP-complete:</b> ปัญหาที่ "ยากที่สุดใน NP" ถ้ามีวิธีแก้ปัญหาใดปัญหาหนึ่งเร็วได้ ก็แก้ทุกปัญหาใน NP ได้เร็ว (ผ่านการ reduce). ตัวอย่าง: TSP-decision, Subset Sum, Hamiltonian cycle, SAT</li>
      <li><b>โยงกับ Part 1–2:</b> Held–Karp ใช้ DP แก้ TSP ในเวลา O(n²·2ⁿ) ดีกว่า (n−1)! มากแต่ยังเป็นเลขชี้กำลัง · Knapsack/Subset Sum ที่ DP ได้ Θ(nW) เป็น pseudo-polynomial ไม่ใช่ polynomial จริง (${U.link('knapx', '1.6')}) · Dijkstra/Prim/Kruskal ∈ P แต่ Bin Packing เป็น NP-hard จึงใช้ Greedy แบบ heuristic (ไม่การันตี optimal)</li></ul>`)}
    ${U.exam(['P = แก้ได้เร็วด้วย DTM · NP = ตรวจคำตอบได้เร็วด้วย DTM (แก้ได้เร็วด้วย NTM)', 'P = NP ยังไม่มีใครพิสูจน์ได้', 'TSP brute force: (n − 1)! เส้นทาง โตเกินเลขชี้กำลัง', 'ทำไม Knapsack DP Θ(nW) ไม่ถือว่า polynomial'])}
  </div>`;

  /* ============ 3.1 อนิเมชัน: ต้นไม้การคำนวณ DTM vs NTM ============ */
  const svgEl = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
  A.dtm = (host) => {
    const state = { depth: 3, acc: 5, mode: 'dtm' };
    host.innerHTML = `<div class="ap-thead"><p class="ap-lede">โจทย์สมมติ: มีเส้นทางลงมาถึงใบทั้งหมด 2<sup>d</sup> เส้น และมี <b>ใบเดียว</b> ที่เป็นคำตอบ (✓) — คลิกใบเพื่อเลือกว่าใบไหนคือคำตอบ แล้วดูว่า DTM กับ NTM ใช้กี่ขั้นถึง accept</p></div>
      <div class="ap-row" style="margin-bottom:10px"><div class="ap-sub" role="group" aria-label="โหมด"><button type="button" data-mode="dtm" aria-pressed="true">DTM · ลองทีละเส้นทาง</button><button type="button" data-mode="ntm" aria-pressed="false">NTM · แตกกิ่งพร้อมกัน</button></div>
        <label class="ap-field" style="margin-left:auto">ความลึก d<select id="tm-d"><option>2</option><option selected>3</option><option>4</option></select></label></div>
      <div class="ap-card"><svg class="tm-svg" viewBox="0 0 640 300" role="img" aria-label="ต้นไม้การคำนวณ"></svg><div class="tm-cnt" aria-live="polite"></div></div>
      <div class="m-gr"><div class="pl"></div><div class="why-body ap-note" style="margin-top:10px"></div></div>`;
    const svg = $('.tm-svg', host), cnt = $('.tm-cnt', host), why = $('.why-body', host);
    let pos = [], player;
    function layout() {
      const d = state.depth, W = 640, H = 300, leaves = 2 ** d; pos = [];
      for (let lv = 0; lv <= d; lv++) { const n = 2 ** lv; for (let k = 0; k < n; k++) pos.push({ lv, k, x: (k + 0.5) * W / n, y: 24 + lv * (H - 60) / d }); }
    }
    const idx = (lv, k) => (2 ** lv - 1) + k;
    function draw(st) {
      svg.innerHTML = ''; const d = state.depth, act = st.active || new Set(), path = st.path || new Set(), dead = st.dead || new Set();
      for (let lv = 1; lv <= d; lv++) for (let k = 0; k < 2 ** lv; k++) { const a = pos[idx(lv - 1, k >> 1)], b = pos[idx(lv, k)]; if (st.hideBelow !== undefined && lv > st.hideBelow) continue; svg.appendChild(svgEl('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'tm-e' + (path.has(idx(lv, k)) ? ' on' : '') })); }
      pos.forEach((p, i) => {
        if (st.hideBelow !== undefined && p.lv > st.hideBelow) return;
        const leaf = p.lv === d, isAcc = leaf && p.k === state.acc;
        const g = svgEl('g', { class: 'tm-n' + (act.has(i) ? ' act' : '') + (path.has(i) ? ' on' : '') + (dead.has(i) ? ' dead' : '') + (leaf ? ' leaf' : '') + (isAcc && (st.showAcc || st.win) ? ' acc' : ''), transform: `translate(${p.x},${p.y})` });
        g.appendChild(svgEl('circle', { r: leaf && d >= 4 ? 10 : 13 }));
        if (leaf) { g.dataset.leaf = p.k; const t = svgEl('text', { y: 4, 'text-anchor': 'middle' }); t.textContent = isAcc ? '✓' : (dead.has(i) ? '✗' : ''); g.appendChild(t); g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button'); g.setAttribute('aria-label', `ใบที่ ${p.k + 1}${isAcc ? ' (คำตอบ)' : ''} — คลิกเพื่อตั้งเป็นคำตอบ`); }
        svg.appendChild(g);
      });
      cnt.innerHTML = st.cnt || '';
    }
    function pathTo(k) { const s = new Set(); for (let lv = 0; lv <= state.depth; lv++) s.add(idx(lv, k >> (state.depth - lv))); return s; }
    function build() {
      layout(); const d = state.depth, leaves = 2 ** d, steps = [];
      if (state.mode === 'dtm') {
        const dead = new Set();
        steps.push({ path: new Set([0]), dead: new Set(dead), text: '<b>DTM:</b> มีทางเลือกเดียวต่อขั้น จึงต้องเลือกเส้นทางหนึ่งเส้นแล้วเดินไปจนสุด ถ้าไม่ใช่ค่อยย้อนกลับมาลองเส้นทางอื่น (backtrack)', cnt: `ลองแล้ว <b>0</b> / ${leaves} เส้นทาง` });
        for (let k = 0; k < leaves; k++) {
          const p = pathTo(k), ok = k === state.acc;
          steps.push({ path: p, dead: new Set(dead), win: ok, text: ok ? `เส้นทางที่ ${k + 1}: ถึงใบ ✓ <b>พบคำตอบ → accept</b> หลังลองไป ${k + 1} เส้นทาง` : `เส้นทางที่ ${k + 1}: ถึงใบแล้ว ✗ ไม่ใช่คำตอบ ต้องย้อนกลับไปลองเส้นทางถัดไป`, cnt: `ลองแล้ว <b>${k + 1}</b> / ${leaves} เส้นทาง` });
          if (ok) break; dead.add(idx(d, k));
        }
        steps.push({ ...steps[steps.length - 1], win: true, text: `<b>สรุป DTM:</b> ในกรณีแย่สุดต้องลองครบ 2<sup>${d}</sup> = ${leaves} เส้นทาง — เพิ่ม d ขึ้น 1 จำนวนเส้นทางเพิ่มเป็นสองเท่า (Exponential)` });
      } else {
        for (let lv = 0; lv <= d; lv++) {
          const act = new Set(); for (let k = 0; k < 2 ** lv; k++) act.add(idx(lv, k));
          steps.push({ active: act, hideBelow: lv, text: lv === 0 ? '<b>NTM:</b> เริ่มที่ราก' : `ขั้นที่ ${lv}: ทุกกิ่งแตกออกเป็นสองทางเลือก <b>พร้อมกัน</b> → ตอนนี้มี ${2 ** lv} กิ่งทำงานอยู่`, cnt: `ผ่านไป <b>${lv}</b> ขั้น (= ความลึกของต้นไม้)` });
        }
        const act = new Set(); for (let k = 0; k < leaves; k++) act.add(idx(d, k));
        steps.push({ active: act, showAcc: true, win: true, path: pathTo(state.acc), text: `<b>มีอย่างน้อยหนึ่งกิ่งถึงใบ ✓ → NTM accept</b> ด้วยเวลา d = ${d} ขั้น (polynomial ต่อขนาดปัญหา) ไม่ต้องลองครบ ${leaves} เส้นทางทีละเส้น`, cnt: `ใช้ <b>${d}</b> ขั้น` });
        steps.push({ ...steps[steps.length - 1], text: 'ข้อควรจำ: ในโลกจริงไม่มีเครื่องที่แตกกิ่งได้ไม่จำกัดพร้อมกัน — NTM เป็นแบบจำลองทางทฤษฎี และ DTM จำลองมันได้ด้วยการไล่ทีละกิ่ง (ช้าลงแบบเลขชี้กำลัง แต่ตอบได้เหมือนกัน)' });
      }
      player.setSteps(steps, 0);
    }
    player = new AP.gr.StepPlayer($('.pl', host), (st) => { draw(st); why.innerHTML = st.text; });
    host.addEventListener('click', (e) => {
      const m = e.target.closest('[data-mode]'), leaf = e.target.closest('[data-leaf]');
      if (m) { state.mode = m.dataset.mode; $$('[data-mode]', host).forEach((b) => b.setAttribute('aria-pressed', String(b === m))); build(); }
      else if (leaf) { state.acc = +leaf.dataset.leaf; build(); }
    });
    host.addEventListener('keydown', (e) => { const leaf = e.target.closest && e.target.closest('[data-leaf]'); if (leaf && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.stopPropagation(); state.acc = +leaf.dataset.leaf; build(); } });
    host.addEventListener('change', (e) => { if (e.target.id === 'tm-d') { state.depth = +e.target.value; state.acc = Math.min(state.acc, 2 ** state.depth - 1); build(); } });
    build();
    return player;
  };
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ============ 3.2 อนิเมชัน: TSP ============ */
  A.pnp = (host) => {
    host.innerHTML = `<div class="ap-thead"><p class="ap-lede">ส่วนที่ 1: DTM ลอง "ทุกเส้นทาง" ของ TSP ทีละเส้น (เมืองน้อย ๆ ให้เห็นภาพ) · ส่วนที่ 2: ดูว่าจำนวนเส้นทางโตเร็วแค่ไหนเมื่อเมืองเพิ่ม</p></div>
      <div class="ap-row" style="margin-bottom:10px"><label class="ap-field">จำนวนเมือง<select id="ts-n"><option>4</option><option>5</option><option selected>6</option><option>7</option></select></label><button class="ap-btn" type="button" id="ts-new">🎲 สุ่มตำแหน่งเมืองใหม่</button></div>
      <div class="ap-card"><svg class="tm-svg" viewBox="0 0 640 320" role="img" aria-label="แผนที่เมืองและเส้นทาง TSP"></svg><div class="tm-cnt" aria-live="polite"></div></div>
      <div class="m-gr"><div class="pl"></div><div class="why-body ap-note" style="margin-top:10px"></div></div>
      <h2 class="ap-h2">จำนวนเส้นทางโตเร็วแค่ไหน</h2>
      <div class="ap-card"><div class="ap-row" style="gap:16px"><label class="ap-field" style="flex:1 1 260px">จำนวนเมือง n = <b id="gr-n">12</b><input id="gr-r" type="range" min="3" max="25" value="12" aria-label="จำนวนเมือง"></label>
        <label class="ap-field">ความเร็วตรวจเส้นทาง<select id="gr-s"><option value="1e6">10⁶ /วินาที (โน้ตบุ๊ก)</option><option value="1e9" selected>10⁹ /วินาที (เครื่องแรง)</option><option value="1e12">10¹² /วินาที (ซูเปอร์คอมพิวเตอร์)</option></select></label></div>
        <div class="gr-bars" id="gr-b"></div><p class="ap-small ap-muted" id="gr-t"></p></div>`;
    const svg = $('.tm-svg', host), cnt = $('.tm-cnt', host), why = $('.why-body', host);
    let cities = [], player;
    const rndCities = (n) => Array.from({ length: n }, () => ({ x: 60 + Math.random() * 520, y: 40 + Math.random() * 240 }));
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const tourLen = (t) => t.reduce((s, c, i) => s + dist(cities[c], cities[t[(i + 1) % t.length]]), 0);
    function perms(arr) { if (arr.length <= 1) return [arr]; const out = []; arr.forEach((x, i) => perms([...arr.slice(0, i), ...arr.slice(i + 1)]).forEach((p) => out.push([x, ...p]))); return out; }
    function drawStep(st) {
      svg.innerHTML = '';
      if (st.best) svg.appendChild(svgEl('polygon', { points: st.best.map((c) => `${cities[c].x},${cities[c].y}`).join(' '), class: 'tsp-best' }));
      if (st.tour) svg.appendChild(svgEl('polygon', { points: st.tour.map((c) => `${cities[c].x},${cities[c].y}`).join(' '), class: 'tsp-cur' }));
      cities.forEach((c, i) => { const g = svgEl('g', { class: 'tsp-c' + (i === 0 ? ' home' : ''), transform: `translate(${c.x},${c.y})` }); g.appendChild(svgEl('circle', { r: 13 })); const t = svgEl('text', { y: 5, 'text-anchor': 'middle' }); t.textContent = String.fromCharCode(65 + i); g.appendChild(t); svg.appendChild(g); });
      cnt.innerHTML = st.cnt || '';
    }
    function build() {
      const n = +$('#ts-n', host).value; cities = rndCities(n);
      const all = perms(Array.from({ length: n - 1 }, (_, i) => i + 1)).map((p) => [0, ...p]);
      const steps = []; let best = null, bl = Infinity;
      steps.push({ cnt: `เมือง ${n} เมือง มี (n − 1)! = <b>${all.length}</b> เส้นทาง (เริ่มที่ A)`, text: `<b>DTM:</b> ต้องตรวจทุกเส้นทางทีละเส้นแล้วเก็บเส้นที่สั้นที่สุด — กด "ถัดไป" หรือเล่นอัตโนมัติ (ปรับความเร็วได้) แล้วดูเส้นสีเขียว = ดีที่สุดจนถึงตอนนี้` });
      all.forEach((t, k) => { const l = tourLen(t), better = l < bl; if (better) { bl = l; best = t; } steps.push({ tour: t, best, cnt: `เส้นทางที่ <b>${k + 1}</b> / ${all.length} · ยาว ${l.toFixed(0)} · ดีที่สุดตอนนี้ <b>${bl.toFixed(0)}</b>`, text: `${t.map((c) => String.fromCharCode(65 + c)).join(' → ')} → A · ${better ? '<b>ดีที่สุดใหม่ ✓</b>' : 'ไม่ดีกว่าเดิม'}` }); });
      steps.push({ best, cnt: `ตรวจครบ <b>${all.length}</b> เส้นทาง · สั้นที่สุด <b>${bl.toFixed(0)}</b>`, text: `<b>เสร็จ:</b> ตรวจ ${all.length} เส้นทางสำหรับ ${n} เมือง — ถ้าเป็น 20 เมืองจะมี ${fact(19).toExponential(1).replace('e+', ' × 10^')} เส้นทาง. ส่วน NTM (ในทฤษฎี) เดาเส้นทางหนึ่งเส้นแล้วตรวจความยาวว่า ≤ k ไหมด้วยเวลา polynomial` });
      player.setSteps(steps, 0);
    }
    player = new AP.gr.StepPlayer($('.pl', host), (st) => { drawStep(st); why.innerHTML = st.text; });
    host.addEventListener('change', (e) => { if (e.target.id === 'ts-n') build(); else if (e.target.id === 'gr-s') growth(); });
    host.addEventListener('click', (e) => { if (e.target.id === 'ts-new') build(); });
    host.addEventListener('input', (e) => { if (e.target.id === 'gr-r') growth(); });
    function growth() {
      const n = +$('#gr-r', host).value, sp = +$('#gr-s', host).value; $('#gr-n', host).textContent = n;
      const rows = [['n³', n ** 3, 'poly'], ['2ⁿ', 2 ** n, 'exp'], ['(n − 1)!', fact(n - 1), 'fact']];
      const mx = Math.log10(Math.max(...rows.map((r) => r[1])) + 1) || 1;
      $('#gr-b', host).innerHTML = rows.map(([l, v, c]) => `<div class="gr-b ${c}"><span class="lb">${l}</span><div class="trk"><div class="fill" style="width:${Math.max(2, Math.log10(v + 1) / mx * 100)}%"></div></div><span class="v">${v < 1e9 ? v.toLocaleString('en-US') : v.toExponential(2).replace('e+', ' × 10^')}</span></div>`).join('');
      $('#gr-t').innerHTML = `แกนเป็น <b>log</b> (ต่างกัน 1 ขีด = 10 เท่า). ที่ ${sp.toExponential(0).replace('e+', ' × 10^')} เส้นทาง/วินาที: ตรวจ (n − 1)! เส้นทางใช้เวลา <b>${human(fact(n - 1) / sp)}</b> · เวลา n³ ใช้ <b>${human(n ** 3 / sp)}</b>`;
    }
    build(); growth();
    return player;
  };

  AP.tm = { learn: L, anim: A };

  /* ============ ควิซ Part 3 ============ */
  const Q = (src, q, opts, a, why) => ({ src, q, opts, a, why });
  AP.EXTRAQ = AP.EXTRAQ || {};
  AP.EXTRAQ.dtm = [
    Q('3.1 DTM vs NTM', 'ใน DTM ทุกครั้งที่อ่านสัญลักษณ์บนเทปในสถานะหนึ่ง ๆ มีทางเลือกสถานะถัดไปกี่ทาง', ['ทางเดียวเสมอ', 'สองทางเสมอ', 'หลายทางพร้อมกัน', 'ขึ้นกับขนาดอินพุต'], 0, 'DTM = Deterministic มีเส้นทางชัดเจนแน่นอน ทางเลือกเดียวต่อขั้น'),
    Q('3.1 DTM vs NTM', 'รูปแบบการประมวลผลของ NTM คือแบบใด', ['เส้นตรง (Linear path)', 'ต้นไม้แตกกิ่ง (Computation tree)', 'ตาราง 2 มิติ', 'วนลูปไม่รู้จบ'], 1, 'NTM แตกกิ่งได้หลายทางเลือกพร้อมกัน เป็น computation tree'),
    Q('3.1 DTM vs NTM', 'NTM จะยอมรับ (accept) อินพุตเมื่อใด', ['เมื่อทุกกิ่ง accept', 'เมื่อมีอย่างน้อยหนึ่งกิ่งที่ accept', 'เมื่อกิ่งซ้ายสุด accept', 'เมื่อไม่มีกิ่งใด reject'], 1, 'ขอเพียงมีเส้นทางเดียวที่เจอคำตอบที่ถูกต้อง เครื่องจักรจะยอมรับทันที'),
    Q('3.1 DTM vs NTM', 'เปรียบเทียบ Computational Power ของ DTM กับ NTM', ['NTM แก้ปัญหาได้มากกว่า', 'DTM แก้ปัญหาได้มากกว่า', 'เท่ากัน (แก้ได้ชุดเดียวกัน ต่างที่ความเร็ว)', 'เทียบกันไม่ได้'], 2, 'DTM จำลอง NTM ได้โดยไล่ทุกกิ่ง (ช้ากว่าแบบเลขชี้กำลัง) จึงแก้ปัญหาได้เท่ากัน'),
    Q('3.1 DTM vs NTM', 'ข้อใดกล่าวถูกต้องเกี่ยวกับ NTM', ['มีชิปใช้งานจริงทุกเครื่อง', 'เป็นเครื่องจักรในอุดมคติทางทฤษฎี', 'เป็นรากฐานของคอมพิวเตอร์ปัจจุบัน', 'ใช้ได้เฉพาะปัญหาการเรียงลำดับ'], 1, 'รากฐานของคอมพิวเตอร์ปัจจุบันคือ DTM ส่วน NTM เป็นแบบจำลองในอุดมคติ'),
    { src: '3.1 DTM vs NTM', type: 'num', q: 'ต้นไม้การคำนวณแตกกิ่งละ 2 ทาง ลึก 4 ระดับ มีใบกี่ใบ (DTM ในกรณีแย่สุดต้องลองกี่เส้นทาง)', ans: '16', why: '2⁴ = 16 เส้นทาง — เพิ่มความลึก 1 ระดับ จำนวนเส้นทางเป็นสองเท่า (เลขชี้กำลัง)' },
  ];
  AP.EXTRAQ.pnp = [
    Q('3.2 P vs NP', 'Class P คือกลุ่มปัญหาที่ใด', ['DTM แก้ได้ในเวลา polynomial', 'NTM เท่านั้นที่แก้ได้', 'ไม่มีอัลกอริทึมแก้ได้', 'ต้องใช้เวลา exponential เสมอ'], 0, 'P = Polynomial time บน DTM เช่น การเรียงลำดับข้อมูล'),
    Q('3.2 P vs NP', 'ข้อใดตรงกับ Class NP', ['ปัญหาที่ NTM แก้ได้เร็ว (DTM ตรวจสอบคำตอบได้เร็ว)', 'ปัญหาที่ไม่มีคำตอบ', 'ปัญหาที่ต้องใช้หน่วยความจำมาก', 'ปัญหาที่ DTM แก้ได้ใน O(n) เท่านั้น'], 0, 'NP = Nondeterministic Polynomial time: แก้เร็วด้วย NTM ⇔ ตรวจสอบคำตอบเร็วด้วย DTM'),
    Q('3.2 P vs NP', 'ถ้า P = NP จริง จะสรุปอะไรได้', ['ปัญหาที่ NTM แก้ได้เร็ว DTM ก็มีวิธีแก้เร็วเช่นกัน', 'TSP แก้ไม่ได้เลย', 'DTM ทุกเครื่องเร็วเท่า NTM', 'ทุกปัญหาแก้ได้ใน O(1)'], 0, 'เท่ากันแปลว่าทุกปัญหาที่ตรวจคำตอบเร็วได้ ก็ต้องหาคำตอบได้เร็วด้วย DTM'),
    Q('3.2 P vs NP', 'สถานะของคำถาม "P = NP หรือไม่" ในปัจจุบันคือ', ['พิสูจน์แล้วว่าเท่ากัน', 'พิสูจน์แล้วว่าไม่เท่ากัน', 'ยังไม่มีใครพิสูจน์ได้', 'ไม่มีความหมายทางคณิตศาสตร์'], 2, 'เป็นปัญหาเปิดระดับโลก'),
    { src: '3.2 P vs NP', type: 'num', q: 'TSP 6 เมือง (เริ่มที่เมืองเดียวกัน ทัวร์มีทิศทาง) มีเส้นทางที่ต้องตรวจทั้งหมดกี่เส้นทาง', ans: '120', why: '(n − 1)! = 5! = 120' },
    Q('3.2 P vs NP', 'เมื่อใช้ DTM แก้ TSP โดยตรวจทุกเส้นทาง เวลาที่ใช้เพิ่มขึ้นตามจำนวนเมืองแบบใด', ['เชิงเส้น', 'polynomial ระดับ n²', 'เลขชี้กำลัง/แฟกทอเรียล', 'คงที่'], 2, '(n − 1)! โตเร็วกว่า 2ⁿ ด้วยซ้ำ จึงเป็นร้อยปีเมื่อเมืองเยอะ'),
    Q('3.2 P vs NP', 'อัลกอริทึม DP ของ TSP (Held–Karp) ใช้เวลา O(n²·2ⁿ) สรุปได้ว่า', ['เป็น polynomial แล้ว จึงพิสูจน์ P = NP', 'ดีกว่า n! มากแต่ยังเป็นเลขชี้กำลัง', 'ช้ากว่าตรวจทุกเส้นทาง', 'ใช้ได้เฉพาะ n ≤ 3'], 1, 'DP ลดงานจากแฟกทอเรียลเหลือ 2ⁿ แต่ยังไม่ใช่ polynomial จึงไม่ได้ตอบ P vs NP'),
    Q('3.2 P vs NP', 'ปัญหาใดอยู่ใน Class P', ['เส้นทางสั้นที่สุด (Dijkstra) / MST', 'TSP แบบ decision', 'Hamiltonian cycle', 'Subset Sum ทั่วไป'], 0, 'Dijkstra, Prim, Kruskal ทำได้ใน polynomial time ส่วนที่เหลือเป็น NP-complete'),
    Q('3.2 P vs NP', 'ทำไม Knapsack DP เวลา Θ(nW) ไม่ถือว่าเป็น polynomial-time จริง', ['เพราะ W เป็น "ค่า" ที่อาจโตแบบเลขชี้กำลังเมื่อเทียบกับจำนวนบิตของอินพุต', 'เพราะใช้พื้นที่มาก', 'เพราะใช้ตาราง 2 มิติ', 'เพราะเรียกซ้ำ'], 0, 'เรียกว่า pseudo-polynomial: polynomial ในค่าของ W แต่ไม่ใช่ในความยาวที่ใช้เขียน W'),
    Q('3.2 P vs NP', 'ความสัมพันธ์ระหว่าง P กับ NP ที่แน่นอนแล้วคือ', ['P ⊆ NP', 'NP ⊆ P', 'P และ NP แยกจากกันโดยสิ้นเชิง', 'P = NP'], 0, 'DTM คือ NTM ที่มีทางเลือกเดียว ปัญหาที่ DTM แก้ได้เร็วจึงอยู่ใน NP ด้วย (ส่วนกลับกันยังไม่รู้)'),
  ];
})();
