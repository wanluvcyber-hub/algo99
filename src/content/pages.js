/* pages.js — หน้าที่ไม่ใช่ "บท": หน้าแรก, Cheat sheet, ความคืบหน้า, คำถามทบทวน, ศูนย์เกม
 * และตัวแสดงผลย่อยของบท (โจทย์ Greedy 12 ข้อ, เดโมเกณฑ์ Greedy, กล่องเสริมท้ายหน้าเรียน DP) */
(function () {
  'use strict';
  const { esc } = AP, U = AP.ui;
  const P = {};
  const pct = (x) => Math.round(x * 100) + '%';
  const doneCount = (ids) => ids.filter((id) => AP.prog.status(id) === 'passed').length;

  /* ============ หน้าแรก ============ */
  P.home = (host) => {
    const total = AP.TOPICS.length, passed = doneCount(AP.TOPICS.map((t) => t.id)), started = AP.TOPICS.filter((t) => AP.prog.status(t.id) !== 'new').length;
    const nextT = AP.TOPICS.find((t) => AP.prog.status(t.id) !== 'passed') || AP.TOPICS[0];
    host.innerHTML = `<div class="ap-wrap">
      <div class="ap-hero"><span class="ap-eyebrow">254383 Algorithm Design &amp; Analysis · อ่านก่อนสอบ</span>
        <h1 class="ap-h1">เตรียมสอบให้ครบใน <em>เว็บเดียว</em></h1>
        <p class="ap-lede">รวมเนื้อหา Space &amp; Time Trade-offs (Week 7), Dynamic Programming (Week 8), Greedy (Week 9) และ DTM/NTM ไว้ด้วยกัน เรียงตามสไลด์ แต่ละบทอ่านแล้วดูอนิเมชันทีละขั้น ทำแบบฝึก ทำควิซ และเล่นเกม — เนื้อหาเดิมทั้งหมดอยู่ครบ และเติมส่วนที่ขาดไว้ให้แล้ว (มีป้าย <span class="ap-chip new">เนื้อหาเพิ่ม</span> กำกับ)</p>
        <div class="ap-row"><a class="ap-btn pri" href="#t/${nextT.id}/learn">${started ? '▶ อ่านต่อ: ' + nextT.no + ' ' + esc(nextT.short) : '▶ เริ่มที่บท ' + nextT.no}</a><a class="ap-btn" href="#exam">⏱ สอบจำลอง</a><a class="ap-btn" href="#games">🎮 เล่นเกม</a></div>
        <div class="ap-hero-prog"><div class="ap-bar"><i style="width:${passed / total * 100}%"></i></div><span>ผ่านควิซแล้ว <b>${passed}</b> / ${total} บท · เริ่มอ่านแล้ว ${started} บท</span></div></div>

      <h2 class="ap-h2">สารบัญ</h2>
      <div class="ap-parts">${AP.PARTS.filter((p) => p.id < 4).map((p) => { const ts = AP.TOPICS.filter((t) => t.part === p.id); const first = ts[0]; return `<a class="ap-pcard ap-card" href="#t/${first.id}/learn" style="--pc:${p.color}"><span class="k">${p.k}</span><b>${p.title}</b><span>${p.sub}</span><span class="ap-small ap-mono">${ts.length} บท · ผ่านแล้ว ${doneCount(ts.map((t) => t.id))}</span></a>`; }).join('')}
        <a class="ap-pcard ap-card" href="#exam" style="--pc:var(--ap-rv)"><span class="k">PART 4</span><b>ฝึกและทบทวน</b><span>สอบจำลอง · เกม 4 แบบ · Cheat sheet · ความคืบหน้า</span></a></div>

      <h2 class="ap-h2">ทุกบทมีให้ครบ 4 อย่าง</h2>
      <div class="ap-grid">
        <div class="ap-card"><b>📖 เรียน</b><p class="ap-small ap-muted">โจทย์ แนวคิด recurrence ความซับซ้อน และจุดที่พลาดบ่อย + "จุดที่ข้อสอบมักถาม"</p></div>
        <div class="ap-card"><b>🎬 อนิเมชัน</b><p class="ap-small ap-muted">กดทีละขั้นหรือเล่นอัตโนมัติ ปรับความเร็ว สุ่มโจทย์ใหม่ แก้ข้อมูลเองได้ มีโหมดฝึกทายค่าในช่อง</p></div>
        <div class="ap-card"><b>✍️ แบบฝึก</b><p class="ap-small ap-muted">โจทย์ 20 ข้อของ DP Lab (โค้ดอธิบายทีละบรรทัด) และโจทย์ Greedy 12 ข้อ พร้อมเฉลย</p></div>
        <div class="ap-card"><b>✅ ควิซ</b><p class="ap-small ap-muted">รวมข้อสอบจากทุกแหล่ง สุ่มใหม่ทุกครั้ง เฉลยพร้อมเหตุผลและทบทวนข้อที่พลาด</p></div></div>

      <h2 class="ap-h2">แผนอ่าน</h2>
      <div class="ap-plan">
        <div class="ap-card"><span class="day">วันที่ 1 · Week 7 + DP พื้นฐาน</span><ul><li>${U.link('sti')} · ${U.link('cmp')} · ${U.link('dist')} · ${U.link('hor')} · ${U.link('bm')} · ${U.link('hash')} · ${U.link('bt')}</li><li>${U.link('fib')} → ${U.link('coinrow')} → ${U.link('change')} → ${U.link('collect')}</li><li>${U.link('olympic')} · ${U.link('knap')} · ${U.link('knapx')}</li><li>ควิซท้ายบท + เกม "เติมตาราง DP"</li></ul></div>
        <div class="ap-card"><span class="day">วันที่ 2 · DP ขั้นสูง + Greedy</span><ul><li>${U.link('obst')} · ${U.link('warshall')} · ${U.link('floyd')} · ${U.link('lcsmcm')}</li><li>${U.link('gprin')} · ${U.link('gcoin')} · ${U.link('prim')} · ${U.link('kruskal')}</li></ul></div>
        <div class="ap-card"><span class="day">วันที่ 3 · Greedy + ทฤษฎี</span><ul><li>${U.link('dijkstra')} · ${U.link('huffman')} · ${U.link('gprob')}</li><li>${U.link('dtm')} · ${U.link('pnp')}</li><li>สอบจำลองรวมทุกบท</li></ul></div>
        <div class="ap-card"><span class="day">ก่อนสอบ 1 ชั่วโมง</span><ul><li><a href="#cheat">Cheat sheet</a> อ่านให้จบ</li><li><a href="#exam">สอบจำลอง</a> 20 ข้อ แล้วดูข้อที่พลาด</li><li><a href="#realexam">ข้อสอบจริง</a> 25 ข้อ</li><li>เล่นเกม "Greedy ได้ optimal ไหม?"</li></ul></div></div>

      <h2 class="ap-h2">โจทย์แบบนี้ ใช้เทคนิคไหน?</h2>
      <div class="ap-flow">
        <div class="q"><b>Q1</b><span>เลือกทีละอย่างแล้ว <u>ไม่ต้องย้อนแก้</u> และพิสูจน์ได้ (exchange argument)? → <a href="#t/gprin/learn">Greedy</a> (เร็วกว่า)</span></div>
        <div class="q"><b>Q2</b><span>Greedy มี counter-example (เหรียญ {1,3,4}, 0/1 knapsack) แต่ปัญหาย่อยซ้อนทับกัน? → <a href="#t/fib/learn">Dynamic Programming</a> ตั้ง recurrence แล้วเติมตาราง</span></div>
        <div class="q"><b>Q3</b><span>ต้องการ "ทุกคู่โหนด" หรือ "ปิดกั้นทางอ้อม" (transitive closure)? → <a href="#t/warshall/learn">Warshall</a> / <a href="#t/floyd/learn">Floyd</a></span></div>
        <div class="q"><b>Q4</b><span>ทั้งสองแบบยังช้าเป็นเลขชี้กำลัง (TSP, Bin Packing)? → เข้าเขต <a href="#t/pnp/learn">NP</a> ต้องใช้ heuristic หรือยอมรับเวลา exponential</span></div></div>

      <h2 class="ap-h2">เครื่องมือ</h2>
      <div class="ap-grid">${AP.TOOLS.map((t) => `<a class="ap-card ap-tool" href="${t.href}"><b>${t.icon} ${t.title}</b><span class="ap-small ap-muted">${t.desc}</span></a>`).join('')}</div>
      <p class="ap-srcnote" style="margin-top:28px">รวมจาก: week7 (Space &amp; Time) · dp-week8 (9 บท) · dp-lab (20 ข้อ) · greedy-tutor · labgreedy + greedy_lab.ipynb (12 ข้อ) · DTM_vs_NTM_Presentation. อ้างอิง: Levitin, Introduction to the Design &amp; Analysis of Algorithms, 3rd ed. และสไลด์ Week 8–9. ความคืบหน้าเก็บในเบราว์เซอร์เครื่องนี้เท่านั้น</p></div>`;
  };

  /* ============ Cheat sheet ============ */
  const X = [
    { name: 'Unbounded Knapsack', rec: 'F(j) = max{F(j−wᵢ) + vᵢ}', base: 'F(0)=0', time: 'Θ(nW)', space: 'Θ(W)', use: 'หยิบของชนิดเดิมซ้ำได้', id: 'knapx' },
    { name: 'Subset Sum / Partition', rec: 'F(i,j) = F(i−1,j) ∨ F(i−1,j−sᵢ)', base: 'F(i,0)=จริง', time: 'Θ(nT)', space: 'Θ(nT)', use: 'มีเซตย่อยที่รวมได้ T ไหม (pseudo-poly)', id: 'knapx' },
    { name: 'Matrix Chain', rec: 'm[i][j] = min{m[i][k]+m[k+1][j]+pᵢ₋₁pₖpⱼ}', base: 'm[i][i]=0', time: 'Θ(n³)', space: 'Θ(n²)', use: 'จัดวงเล็บคูณเมทริกซ์', id: 'lcsmcm' },
    { name: 'LCS', rec: 'ตรงกัน: L[i−1][j−1]+1 · ไม่ตรง: max(บน, ซ้าย)', base: 'L[0][j]=L[i][0]=0', time: 'Θ(mn)', space: 'Θ(mn)', use: 'ลำดับย่อยร่วมที่ยาวที่สุด', id: 'lcsmcm' },
  ];
  const G = [
    ['Greedy ทอนเหรียญ', 'ใช้เหรียญใหญ่สุดก่อน', 'O(k)', 'ถูกเฉพาะ canonical coin system', 'gcoin'],
    ['Activity Selection', 'เรียงตามเวลาจบ เลือกงานที่ไม่ชน', 'O(n log n)', 'เกณฑ์ "เริ่มก่อน/สั้นสุด" ผิด', 'gprob'],
    ['Fractional Knapsack', 'เรียงตาม value/weight', 'O(n log n)', 'ต้องแบ่งของได้ (0/1 ใช้ DP)', 'gprob'],
    ['Prim', 'ขยายต้นไม้ด้วยเส้นเบาสุดที่ข้ามรอยตัด', 'O(|E| log |V|) heap · Θ(|V|²) array', 'เก็บน้ำหนักเส้นเดียว', 'prim'],
    ['Kruskal', 'เรียงเส้น รับถ้าไม่เกิดวงจร (Union-Find)', 'O(|E| log |E|)', 'หยุดเมื่อได้ |V|−1 เส้น', 'kruskal'],
    ['Dijkstra', 'เลือกโหนดที่ d น้อยสุด (ผ่อนคลายเส้น)', 'Θ(|V|²) array · O(|E| log |V|) heap', 'ห้ามน้ำหนักติดลบ', 'dijkstra'],
    ['Huffman', 'รวม 2 ความถี่น้อยสุดซ้ำ', 'O(n log n)', 'prefix-free · bits เฉลี่ย Σ ความถี่×ความยาว', 'huffman'],
  ];
  P.cheat = (host) => {
    const dp = AP.dp8.CH.map((c) => ({ name: c.title, num: c.num, id: c.id, ...c.cheat }));
    const row = (c) => `<tr><th><a href="#t/${c.id}/learn">${esc(c.name)}</a></th><td class="ap-mono">${c.rec}</td><td class="ap-mono">${c.base}</td><td class="ap-mono">${c.time}</td><td class="ap-mono">${c.space}</td><td>${c.use}</td></tr>`;
    host.innerHTML = `<div class="ap-wrap"><div class="ap-thead"><span class="ap-eyebrow">ฝึกและทบทวน</span><h1 class="ap-h1">📋 Cheat sheet</h1>
      <div class="ap-row"><button class="ap-btn" type="button" id="cs-print">🖨 พิมพ์ / บันทึกเป็น PDF</button><span class="ap-muted ap-small">หน้านี้จัดรูปแบบสำหรับพิมพ์ (ปิดสี/เมนูอัตโนมัติ)</span></div></div>
      <h2 class="ap-h2">Space &amp; Time Trade-offs (Week 7)</h2>
      ${U.table(['เทคนิค', 'หลักคิด', 'เวลา', 'พื้นที่เพิ่ม'], [
        ['<a href="#t/cmp/learn">Comparison Counting</a>', 'Count[i] = จำนวนตัวที่น้อยกว่า → ตำแหน่งใน S', 'Θ(n²)', 'Count[], S[]'],
        ['<a href="#t/dist/learn">Distribution Counting</a>', 'นับความถี่ → สะสม → วางจากขวาไปซ้าย', 'Θ(n)', 'D[] ตามช่วงค่า, S[]'],
        ['<a href="#t/hor/learn">Horspool</a>', 'Table[P[j]] = m−1−j (j = 0..m−2), อื่น ๆ = m', 'เฉลี่ยดี · แย่สุด Θ(nm)', 'ตารางเดียว'],
        ['<a href="#t/bm/learn">Boyer-Moore</a>', 'k=0: d₁ · k>0: max{d₁, d₂}, d₁ = max{t₁(c)−k, 1}', 'แย่สุดเชิงเส้น', 'bad-symbol + good-suffix'],
        ['<a href="#t/hash/learn">Hashing</a>', 'คีย์ → ที่อยู่ · ชนแก้ด้วย chaining หรือ probing', 'เฉลี่ย Θ(1)', 'ตารางแฮช'],
        ['<a href="#t/bt/learn">B-Tree</a>', 'โหนดหลายคีย์ ใบระดับเดียวกัน · เต็มแล้ว split ดันค่ากลาง', 'Θ(log n)', 'ใช้ทำ index'],
      ], 'ap-cheat')}
      <h2 class="ap-h2">Dynamic Programming</h2>
      <div class="ap-tscroll"><table class="ap-t ap-cheat"><thead><tr><th>ปัญหา</th><th>Recurrence</th><th>ค่าเริ่มต้น</th><th>เวลา</th><th>พื้นที่</th><th>ใช้เมื่อ</th></tr></thead><tbody>${dp.map(row).join('')}${X.map(row).join('')}</tbody></table></div>
      <h2 class="ap-h2">Greedy</h2>
      ${U.table(['อัลกอริทึม', 'แต่ละขั้นเลือกอะไร', 'เวลา', 'จุดจำ'], G.map(([n, s, t, k, id]) => [`<a href="#t/${id}/learn">${n}</a>`, s, `<span class="ap-mono">${t}</span>`, k]), 'ap-cheat')}
      <h2 class="ap-h2">เลือกเทคนิคจากสัญญาณในโจทย์</h2>
      ${U.table(['สัญญาณ', 'เทคนิค'], [
        ['ขอค่าที่ดีที่สุด + ปัญหาย่อยซ้อนทับ (Fibonacci, Coin, Knapsack)', 'DP: ตั้ง recurrence → เติมตาราง (หรือ memoization)'],
        ['เลือกช่วงเวลา/วางจุดครอบคลุม/นับที่ซ้อนกัน', 'Greedy: เรียงตามเวลาจบ / ตำแหน่ง / เหตุการณ์แยกกัน'],
        ['รวมของโดยตัวเล็กก่อน (ต่อเชือก, Huffman)', 'Greedy + Min-Heap'], ['เส้นทางสั้นสุดทุกคู่ / ปิดกั้นทางอ้อม', 'Floyd / Warshall (Θ(n³))'],
        ['เส้นทางสั้นสุดจากต้นทางเดียว น้ำหนักไม่ติดลบ', 'Dijkstra'], ['เชื่อมทุกโหนดให้น้ำหนักรวมน้อยสุด', 'Prim / Kruskal (MST)'],
        ['Greedy ให้ค่าไม่ optimal (เหรียญ {1,3,4}, 0/1 knapsack)', 'ใช้ DP แทน'], ['ทุกเทคนิคยังเป็นเลขชี้กำลัง (TSP, Bin Packing)', 'NP-hard → heuristic'],
      ], 'ap-cheat')}
      <h2 class="ap-h2">ทฤษฎีการคำนวณ</h2>
      ${U.table(['', 'DTM', 'NTM'], [['ทางเลือกต่อขั้น', '1', 'หลายทางพร้อมกัน (computation tree)'], ['accept เมื่อ', 'เส้นทางเดียวสำเร็จ', 'มีอย่างน้อยหนึ่งกิ่งสำเร็จ'], ['พลังการคำนวณ', 'เท่ากัน', 'เท่ากัน (NTM เร็วกว่าในทฤษฎี)'], ['มีเครื่องจริง', 'ใช่ (คอมพิวเตอร์ทุกเครื่อง)', 'ไม่ (แบบจำลอง)']], 'ap-cheat')}
      <p><b>P</b> = DTM แก้ได้เร็ว (poly) · <b>NP</b> = NTM แก้ได้เร็ว / DTM ตรวจคำตอบเร็ว · P ⊆ NP · <b>P = NP?</b> ยังเป็นปัญหาเปิด · TSP: (n−1)! เส้นทาง; DP (Held–Karp) O(n²2ⁿ)</p></div>`;
    host.querySelector('#cs-print').onclick = () => window.print();
  };

  /* ============ ความคืบหน้า ============ */
  P.progress = (host) => {
    const pr = AP.prog.all(), ex = AP.store.get('exam', []), gs = AP.store.get('games', {});
    const chip = (s) => `<span class="ap-chip ${s === 'passed' ? 'ok' : s === 'started' ? 'started' : ''}">${s === 'passed' ? 'ผ่านแล้ว' : s === 'started' ? 'กำลังเรียน' : 'ยังไม่เริ่ม'}</span>`;
    host.innerHTML = `<div class="ap-wrap"><div class="ap-thead"><span class="ap-eyebrow">ฝึกและทบทวน</span><h1 class="ap-h1">📈 ความคืบหน้า</h1><p class="ap-lede">ข้อมูลเก็บในเบราว์เซอร์เครื่องนี้เท่านั้น ผ่านบท = ทำควิซท้ายบทได้ตั้งแต่ 60%</p></div>
      ${U.table(['บท', 'สถานะ', 'ควิซดีที่สุด', 'ทำแล้ว (ครั้ง)'], AP.TOPICS.map((t) => { const p = pr[t.id] || {}; return [`<a href="#t/${t.id}/learn">${t.no} ${esc(t.short)}</a>`, chip(AP.prog.status(t.id)), p.n ? pct(p.q) : '–', p.n || 0]; }))}
      <h2 class="ap-h2">เกม</h2>
      ${U.table(['เกม', 'คะแนนสูงสุด', 'ตอบถูกรวม', 'streak สูงสุด'], AP.GAMES.map((g) => { const s = gs[g.id] || {}; return [`<a href="#game/${g.id}">${g.icon} ${g.title}</a>`, s.best || 0, s.ok || 0, s.streak || 0]; }))}
      <h2 class="ap-h2">สอบจำลอง</h2>
      ${ex.length ? U.table(['ครั้งที่', 'คะแนน', 'จำนวนข้อ'], ex.slice().reverse().map((x, k) => [ex.length - k, `${x.s} (${pct(x.s / x.t)})`, x.t])) : '<p class="ap-muted">ยังไม่เคยสอบจำลอง — <a href="#exam">เริ่มเลย</a></p>'}
      <h2 class="ap-h2">ล้างข้อมูล</h2><button class="ap-btn" type="button" id="pg-reset">ล้างความคืบหน้าทั้งหมด</button></div>`;
    const b = host.querySelector('#pg-reset');
    b.onclick = () => AP.confirmBtn(b, 'กดอีกครั้งเพื่อยืนยันการล้าง', () => { AP.dp8.reset(); AP.lab.reset(); AP.store.clear(); AP.progress(); AP.toast('ล้างข้อมูลแล้ว'); P.progress(host); });
  };

  /* ============ โจทย์ Greedy 12 ข้อ (หน้าโจทย์ต่อข้อ) ============ */
  P.gproblem = (host, n) => {
    const p = AP.GP.byN(n), nb = AP.GP.NB[n], lv = AP.LEVEL_ICON[nb.level];
    const html = p.html, cut = html.indexOf('<details');
    const stmt = cut < 0 ? html : html.slice(0, cut), sol = cut < 0 ? '' : html.slice(cut);
    const A = AP.GP.ANIM[n];
    const jump = n === 1 ? U.link('gcoin', '▶ ดูอนิเมชันทอนเหรียญ (Greedy vs DP) ที่บท 2.1') : n === 12 ? U.link('huffman', '▶ ดูอนิเมชัน Huffman ที่บท 2.5') : '';
    host.innerHTML = `<article class="ap-prob"><div class="ap-row" style="margin-bottom:6px"><span class="ap-chip">${lv[0]} ${lv[1]}</span><span class="ap-chip">กลยุทธ์: ${nb.strat}</span><span class="ap-chip">เรียงตาม: ${nb.key}</span><span class="ap-chip"><span class="ap-mono">${nb.cx}</span></span></div>
      <h2 class="ap-h2" style="margin-top:6px">${esc(p.title)}</h2>
      <div class="ap-card gp-stmt">${stmt}</div>
      <h3 class="ap-h3" style="margin-top:20px">💡 หลักการ</h3><ol class="ap-idea">${nb.idea.map((x) => `<li>${x}</li>`).join('')}</ol>
      ${nb.extra ? `<div class="ap-card" style="margin:12px 0">${nb.extra}</div>` : ''}
      <div class="ap-note"><b class="h">✅ ทำไม Greedy ถูก?</b>${nb.why}</div>
      ${nb.warn ? U.note('⚠ ระวัง', nb.warn, 'warn') : ''}
      ${nb.fix ? U.note('แก้จากต้นฉบับ', `<p>ค่าตัวอย่างในโจทย์เดิมไม่ตรงกับที่โค้ดคำนวณได้จริง: ${nb.fix}</p>${nb.code ? `<p>โค้ดที่แก้แล้ว:</p><pre class="ap-pre"><code>${esc(nb.code)}</code></pre>` : ''}`, 'bad') : ''}
      ${A ? `<h3 class="ap-h3" style="margin-top:22px">🎬 อนิเมชัน</h3><div class="gp-anim"></div>` : (jump ? `<p style="margin-top:16px">${jump}</p>` : '')}
      <h3 class="ap-h3" style="margin-top:22px">✍️ เฉลยเดิมจากโจทย์</h3>${sol}
      <div class="ap-row" style="margin-top:22px"><a class="ap-btn" href="#t/gprob/quiz">✅ ทำควิซ Greedy</a>${n > 1 ? `<a class="ap-btn" href="#t/gprob/practice/${n - 1}">← ข้อ ${n - 1}</a>` : ''}${n < 12 ? `<a class="ap-btn pri" href="#t/gprob/practice/${n + 1}">ข้อ ${n + 1} →</a>` : ''}</div></article>`;
    if (A) AP.GP.mountAnim(n, host.querySelector('.gp-anim'));
  };

  /* ============ เดโม: เกณฑ์ Greedy ของ Activity Selection ============ */
  P.criteria = (host) => {
    const acts = [[1, 4], [3, 5], [0, 6], [5, 7], [3, 8], [5, 9], [6, 10], [8, 11]];
    const CR = {
      finish: ['จบเร็วสุดก่อน', (a, b) => a[1] - b[1] || a[0] - b[0]],
      start: ['เริ่มก่อนสุด', (a, b) => a[0] - b[0] || a[1] - b[1]],
      short: ['ระยะเวลาสั้นสุด', (a, b) => (a[1] - a[0]) - (b[1] - b[0]) || a[1] - b[1]],
      late: ['เริ่มช้าสุด', (a, b) => b[0] - a[0] || a[1] - b[1]],
    };
    const run = (key) => { const ord = acts.slice().sort(CR[key][1]); const ch = []; ord.forEach((a) => { if (ch.every((c) => a[1] <= c[0] || a[0] >= c[1])) ch.push(a); }); return { ord, ch }; };
    const best = run('finish').ch.length;
    host.innerHTML = `<p class="ap-lede">Activity Selection: เลือกงานให้ได้มากที่สุดโดยไม่ซ้อนเวลากัน — เกณฑ์ที่ใช้เรียงต่างกัน ผลต่างกัน ลองกดดู (ที่ถูกคือ "จบเร็วสุดก่อน")</p>
      <div class="ap-sub" role="group" aria-label="เกณฑ์">${Object.entries(CR).map(([k, v], i) => `<button type="button" data-k="${k}" aria-pressed="${i === 0}">${v[0]}</button>`).join('')}</div>
      <div class="ap-card"><svg class="ap-crit" viewBox="0 0 600 260" role="img" aria-label="ไทม์ไลน์งาน"></svg><p class="ap-crit-out" aria-live="polite"></p><div class="m-gr"><div class="pl"></div></div></div>`;
    const svg = host.querySelector('.ap-crit'), out = host.querySelector('.ap-crit-out');
    let cur = 'finish', player;
    const sx = (v) => 30 + v / 12 * 540;
    function draw(st) {
      const rows = st.ord; let g = '';
      for (let t = 0; t <= 11; t++) g += `<line class="ga-axis" x1="${sx(t)}" y1="10" x2="${sx(t)}" y2="236" style="stroke-dasharray:2 4"/><text class="ga-tick" x="${sx(t)}" y="252">${t}</text>`;
      rows.forEach((a, i) => { const y = 14 + i * 27, cls = st.pick.some((c) => c === a) ? 'ok' : st.cur === a ? 'cand' : st.rej.includes(a) ? 'bad' : ''; g += `<rect class="ga-bar ${cls}" x="${sx(a[0])}" y="${y}" width="${sx(a[1]) - sx(a[0])}" height="20" rx="4"/><text class="ga-lab" x="${sx(a[0]) + 6}" y="${y + 14}">(${a[0]},${a[1]})</text>`; });
      svg.innerHTML = g; out.innerHTML = st.text;
    }
    function build() {
      const { ord, ch } = run(cur), steps = [], pick = [], rej = [];
      steps.push({ ord, pick: [], rej: [], cur: null, text: `เรียงตามเกณฑ์ <b>${CR[cur][0]}</b> ได้ ${ord.map((a) => `(${a})`).join(' ')}` });
      ord.forEach((a) => { const ok = pick.every((c) => a[1] <= c[0] || a[0] >= c[1]); steps.push({ ord, pick: pick.slice(), rej: rej.slice(), cur: a, text: `พิจารณา (${a}) — ${ok ? 'ไม่ชนงานที่เลือกไว้ → <b>เลือก</b>' : 'ชนกับงานที่เลือกไว้ → ข้าม'}` }); if (ok) pick.push(a); else rej.push(a); });
      steps.push({ ord, pick: pick.slice(), rej: rej.slice(), cur: null, text: `<b>เสร็จ:</b> ได้ ${pick.length} งาน — ${pick.length === best ? '✓ เท่ากับคำตอบที่ดีที่สุด (' + best + ' งาน)' : `✗ น้อยกว่าคำตอบที่ดีที่สุด (${best} งาน) เกณฑ์นี้ไม่ถูกต้อง`}` });
      player.setSteps(steps, 0);
    }
    player = new AP.gr.StepPlayer(host.querySelector('.pl'), draw);
    host.addEventListener('click', (e) => { const b = e.target.closest('[data-k]'); if (!b) return; cur = b.dataset.k; host.querySelectorAll('[data-k]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); build(); });
    build();
    return player;
  };

  /* ============ ศูนย์เกม ============ */
  P.games = (host) => {
    const gs = AP.store.get('games', {});
    host.innerHTML = `<div class="ap-wrap"><div class="ap-thead"><span class="ap-eyebrow">ฝึกและทบทวน</span><h1 class="ap-h1">🎮 เกม</h1><p class="ap-lede">ทบทวนแบบไม่น่าเบื่อ: ทุกเกมสุ่มโจทย์ใหม่ทุกรอบ เก็บคะแนนสูงสุดและ streak ไว้ในเครื่อง</p></div>
      <div class="ap-grid ap-games">${AP.GAMES.map((g) => { const s = gs[g.id] || {}; return `<a class="ap-card ap-tool" href="#game/${g.id}"><b class="ap-gt">${g.icon} ${g.title}</b><span class="ap-small ap-muted">${g.desc}</span><span class="ap-small ap-mono">คะแนนสูงสุด ${s.best || 0} · streak ${s.streak || 0}</span></a>`; }).join('')}</div></div>`;
  };

  /* ============ กล่องเสริมท้ายหน้าเรียนของบท DP (จาก dp-week8 + DP Lab) ============ */
  P.dpExtras = (t) => {
    const ch = AP.dp8.byId(t.dp8), out = [];
    if (ch && ch.cheat) out.push(`<div class="ap-card ap-cheatbox"><b>📌 สรุปย่อ (สำหรับท่องก่อนสอบ)</b><dl><dt>Recurrence</dt><dd class="ap-mono">${ch.cheat.rec}</dd><dt>ค่าเริ่มต้น</dt><dd class="ap-mono">${ch.cheat.base}</dd><dt>เวลา / พื้นที่</dt><dd class="ap-mono">${ch.cheat.time} / ${ch.cheat.space}</dd><dt>ใช้เมื่อ</dt><dd>${ch.cheat.use}</dd></dl></div>`);
    t.lab.forEach((n) => { const p = AP.lab.byId(n); if (p && p.pdfFix) out.push(`<div class="ap-note bad"><b class="h">⚠ จุดที่โจทย์/PDF พิมพ์ผิด (DP Lab ข้อ ${n})</b>${p.pdfFix}</div>`); });
    return out.join('');
  };

  AP.pages = P;
})();
