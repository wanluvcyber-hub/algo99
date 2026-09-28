/* greedy-problems.js — คลังโจทย์ Greedy 12 ข้อ (labgreedy.html + greedy_lab.ipynb)
 * เนื้อหาเดิมอยู่ใน AP.LABGREEDY (greedy-problems.data.js) ไฟล์นี้เพิ่ม: หลักการ/เหตุผลจาก notebook,
 * จุดที่แก้จากต้นฉบับ, อนิเมชันทีละขั้น และควิซ */
(function () {
  'use strict';
  const esc = AP.esc;

  // ข้อมูลจาก greedy_lab.ipynb (ภาค 1.4 + ภาค 2)
  const NB = {
    1: { level: 'easy', strat: 'ใช้เหรียญใหญ่สุดก่อน', key: 'มูลค่า ↓', cx: 'O(k)',
      idea: ['เรียงเหรียญจาก <b>ใหญ่ → เล็ก</b>', 'สำหรับเหรียญแต่ละชนิด ใช้ให้ได้มากที่สุดเท่าที่ไม่เกินยอดคงเหลือ: <code>count = amount // coin</code>', 'ยอดคงเหลือ = เศษที่เหลือ: <code>amount %= coin</code>'],
      why: 'เหรียญ 20 = 10+10, 10 = 5+5, 5 = 1+1+… ดังนั้นถ้าใช้เหรียญเล็กหลายเหรียญรวมกันได้เท่ากับเหรียญใหญ่หนึ่งเหรียญ <i>การใช้เหรียญใหญ่จะไม่มีทางแย่กว่า</i> (exchange argument) ⇒ ใช้ได้เฉพาะระบบเหรียญที่ "เหรียญใหญ่หารด้วยเหรียญเล็กลงมาลงตัว" (canonical coin system) — ถ้าเป็น {1, 3, 4} greedy ผิดได้ (ดูบท 2.1)' },
    2: { level: 'easy', strat: 'ขับให้ไกลสุดก่อนเติม', key: 'ตำแหน่งปั๊ม ↑', cx: 'O(n)',
      idea: ['ใส่จุดเริ่ม (0) และปลายทาง (D) เข้าไปในรายการปั๊ม', 'จากจุดปัจจุบัน ขยับไปปั๊มถัดไปเรื่อย ๆ ตราบที่ระยะจากจุด "เติมล่าสุด" ไม่เกิน <code>L</code>', 'ถึงปั๊มที่ไกลสุดที่ไปได้แล้วให้ <i>เติมที่นั่น</i> (นับ +1 ครั้ง) แล้วเริ่มรอบใหม่', 'ถ้าเติมเต็มถังแล้วก็ยังไม่ขยับได้เลย (ปั๊มถัดไปห่างเกิน L) → <b>-1</b>'],
      why: 'การเติมเร็วเกินไป = ทิ้งน้ำมันที่ใช้ได้ไปเปล่า ๆ ส่วนการเติมที่ปั๊มไกลที่สุดที่ยังไปถึง ทำให้ถังเต็มถูกใช้ประโยชน์ระยะสูงสุด ไม่มีทางแย่กว่าการเติมที่ปั๊มใกล้กว่า' },
    3: { level: 'easy', strat: 'นั่งที่แรกสุดที่ห่างพอ', key: 'ตำแหน่ง ↑', cx: 'O(n)',
      idea: ['นั่งตำแหน่งแรกสุดเสมอ (เหลือพื้นที่ทางขวามากที่สุด)', 'ไล่ตำแหน่งถัดไป ถ้าห่างจาก <i>คนล่าสุด</i> ≥ K → จัดนั่งทันที แล้วอัปเดต <code>last_position</code>'],
      why: 'ถ้าคำตอบที่ดีที่สุดเลือกตำแหน่งที่ไกลกว่าตำแหน่งแรกที่ "ใช้ได้" เราสามารถ <i>เลื่อนคนนั้นมาซ้ายสุดที่เป็นไปได้</i> โดยไม่ทำให้คนถัดไปละเมิดระยะ ⇒ จำนวนคนไม่ลด (exchange argument)',
      fix: '<code>max_people([1,2,4,8,9,12], 3)</code> → ที่ถูกคือ <b>4</b> (ตำแหน่ง 1, 4, 8, 12) ไม่ใช่ 3 ตามคอมเมนต์ในโจทย์เดิม' },
    4: { level: 'easy', strat: 'ยัดกล่องเดิมจนเต็มก่อนเปิดใหม่', key: 'ลำดับที่กำหนด', cx: 'O(n)',
      idea: ['ถือกล่องปัจจุบัน สะสมน้ำหนัก', 'ชิ้นถัดไป <i>ใส่ได้</i> (น้ำหนักรวม ≤ max) → ใส่ ; <i>ใส่ไม่ได้</i> → ปิดกล่อง เปิดกล่องใหม่ แล้วใส่ชิ้นนั้นเป็นชิ้นแรก'],
      why: 'เพราะห้ามสลับลำดับ กล่องเก่าที่ปิดแล้วจะไม่มีวันได้รับของอีก (ชิ้นถัด ๆ ไปอยู่หลังชิ้นที่ไม่พอดี) การ <i>ปิดกล่องเมื่อจำเป็นต้องปิดเท่านั้น</i> จึงเป็นทางเลือกที่ดีที่สุด',
      warn: 'ถ้า <b>สลับลำดับได้</b> นี่คือปัญหา <i>Bin Packing</i> ซึ่งเป็น NP-hard ต้องใช้ heuristic อย่าง First-Fit Decreasing' },
    5: { level: 'medium', strat: 'เลือกงานที่จบเร็วสุด', key: 'เวลาจบ ↑', cx: 'O(n log n)',
      idea: ['เรียงงานตาม <code>end</code> จากน้อยไปมาก', 'เลือกงานแรก', 'งานถัดไปที่ <code>start >= last_end</code> → เลือก'],
      extra: '<table class="gp-mini"><thead><tr><th>เกณฑ์</th><th>ตัวอย่างที่พัง</th></tr></thead><tbody><tr><td>เริ่มก่อนสุด</td><td><code>(0,100)</code> ครอบงานเล็กทั้งหมด → ได้ 1 งาน</td></tr><tr><td>สั้นสุดก่อน</td><td><code>(1,6)</code>, <code>(5,8)</code>, <code>(7,12)</code>: งานกลางสั้นสุดแต่ชนทั้งสองข้าง</td></tr><tr><td><b>จบเร็วสุด</b> ✅</td><td>คืนห้องเร็วสุด → เหลือเวลาให้งานอื่นมากที่สุด</td></tr></tbody></table>',
      why: 'ให้ <code>g</code> = งานที่จบเร็วสุด และ <code>o</code> = งานแรกของคำตอบดีที่สุดใด ๆ เนื่องจาก <code>end(g) ≤ end(o)</code> สลับ <code>o</code> เป็น <code>g</code> ได้โดยไม่ชนงานอื่น ⇒ มีคำตอบที่ดีที่สุดที่เริ่มด้วย <code>g</code>' },
    6: { level: 'medium', strat: 'ของคุ้มค่าสุดก่อน', key: 'value/weight ↓', cx: 'O(n log n)',
      idea: ['คำนวณ <b>มูลค่าต่อหน่วยน้ำหนัก</b> <code>value / weight</code> ของทุกชิ้น', 'เรียงจาก <i>มาก → น้อย</i>', 'หยิบทั้งชิ้นถ้าจุได้ ; ถ้าจุไม่ได้ → <b>หั่นเฉพาะส่วนที่เหลือ</b> (<code>ratio × ที่ว่าง</code>) แล้วจบ'],
      why: 'น้ำหนัก 1 หน่วยในกระเป๋ามีค่าเท่ากัน ดังนั้นควรเติมด้วย "หน่วยที่คุ้มที่สุด" เสมอ ถ้ามีหน่วยที่คุ้มน้อยกว่าอยู่ในกระเป๋าทั้งที่ยังมีของคุ้มกว่าเหลือ สลับแล้วมูลค่ารวมจะเพิ่ม ⇒ ขัดแย้งกับการเป็นคำตอบดีที่สุด',
      warn: 'ต้องแบ่งได้ <i>เท่านั้น</i> — แบบ 0/1 ใช้ DP (บท 1.5 Knapsack)' },
    7: { level: 'medium', strat: 'จับคู่ เล็กสุด + ใหญ่สุด', key: 'ค่า ↑ + two pointers', cx: 'O(n log n)',
      idea: ['เรียงค่าจากน้อยไปมาก', 'ตัวชี้ <code>left</code> = ตัวเล็กสุด, <code>right</code> = ตัวใหญ่สุด → จับคู่, เลื่อนเข้าหากัน', 'คำตอบ = ผลรวมคู่ที่ใหญ่ที่สุดจากทุกคู่'],
      why: 'ตัวใหญ่สุด <code>M</code> ต้องได้คู่ไม่ว่าอย่างไร ถ้าจับกับตัวอื่นที่ไม่ใช่ตัวเล็กสุด <code>m</code> ผลรวม <code>M + x ≥ M + m</code> อยู่แล้ว การจับกับ <code>m</code> จึงเป็นทางที่ดีที่สุดสำหรับ <code>M</code> และเหลือตัวกลาง ๆ ไปทำปัญหาที่เล็กลง',
      fix: '<code>minimize_max_pair([3,5,4,5,2,6])</code> → ที่ถูกคือ <b>9</b> (2+6, 3+5, 4+5) ไม่ใช่ 8' },
    8: { level: 'medium', strat: 'ต่อ 2 เส้นสั้นสุดก่อน', key: 'Min-Heap', cx: 'O(n log n)',
      idea: ['เชือกที่ถูกต่อ <i>ก่อน</i> จะถูก "นับซ้ำ" ในต้นทุนของการต่อรอบถัด ๆ ไปอีกหลายครั้ง ⇒ <b>เชือกสั้นควรต่อก่อน</b>', 'ใช้ <b>Min-Heap</b> ดึง 2 เส้นสั้นสุดได้เร็ว O(log n)', 'ต่อกัน → บวกค่า → ใส่เส้นใหม่กลับ heap → ซ้ำจนเหลือ 1 เส้น'],
      extra: '<p><b>มุมมองเชิงโครงสร้าง:</b> ผลลัพธ์คือ <b>ต้นไม้ไบนารี</b> ที่ใบ = เชือกเดิม ต้นทุนรวม = Σ (ความยาว × ความลึกในต้นไม้) เชือกสั้น → ลึก, เชือกยาว → ตื้น เป็นหลักการเดียวกับ <b>Huffman</b> (ข้อ 12 และบท 2.5)</p>',
      why: 'ทุกครั้งที่เชือกถูกต่อขึ้นไปอีก 1 ระดับ ความยาวของมันถูกนับเพิ่มอีก 1 ครั้ง จึงควรให้เชือกสั้นอยู่ลึก (ถูกนับหลายครั้ง) และเชือกยาวอยู่ตื้น — เหตุผลเดียวกับการพิสูจน์ Huffman',
      fix: '<code>min_cost_connect([1,2,5,10,35])</code> → ที่ถูกคือ <b>82</b> (3 → 8 → 18 → 53 : 3+8+18+53) ไม่ใช่ 85' },
    9: { level: 'advanced', strat: 'งานกำไรสูงสุดก่อน วางช่องท้ายสุดที่ทัน', key: 'กำไร ↓', cx: 'O(n log n + n·d)',
      idea: ['เรียงงานตาม <b>กำไรมาก → น้อย</b> (งานที่ทำเงินได้มากมีสิทธิ์ก่อน)', 'มีช่องเวลา (slot) 1..max_deadline', 'แต่ละงานลองวางในช่องว่าง <b>ท้ายสุดที่ยังไม่เกิน deadline</b> (ไล่ถอยหลังจาก deadline)', 'ถ้าไม่มีช่องว่าง → ทิ้งงานนั้น'],
      extra: '<p><b>ทำไมต้องวางช่อง "ท้ายสุด"?</b> ช่องต้น ๆ (เช่น slot 1) เป็นทรัพยากรที่ <i>ทุกงานใช้ได้</i> ควรเก็บไว้ให้งานที่ deadline กระชั้น การวางท้ายสุดที่ทันจึง "ไม่แย่งที่" งานอื่นโดยไม่จำเป็น</p>',
      why: 'ปัญหานี้เป็น <b>Matroid</b> (ชุดงานที่จัดตารางได้ทั้งหมดมีโครงสร้างแบบ matroid) และ greedy ที่เลือกน้ำหนักมากสุดก่อนจะได้คำตอบดีที่สุดเสมอ' },
    10: { level: 'advanced', strat: 'วางเสาให้ไกลขวาสุดที่ยังคลุมบ้านแรกที่หลุด', key: 'ตำแหน่ง ↑', cx: 'O(n log n)',
      idea: ['เรียงตำแหน่งบ้าน', 'หา <b>บ้านแรกที่ยังไม่ถูกคลุม</b> (<code>loc</code>)', 'วางเสาให้ <b>ไกลไปทางขวามากที่สุด</b> ที่ยังคลุม <code>loc</code> ได้ คือที่ตำแหน่ง <code>loc + R</code> (เสาจะคลุมถึง <code>loc + 2R</code>)', 'ข้ามบ้านทุกหลังที่ <code>≤ loc + 2R</code> แล้วทำซ้ำกับบ้านแรกที่หลุด'],
      why: 'บ้านซ้ายสุดที่ยังไม่คลุมต้องมีเสาคลุมมันแน่ ๆ ซึ่งวางได้ไม่เกิน <code>loc + R</code> การเลื่อนเสาไปทางขวาสุดที่ทำได้ จะคลุมบ้านฝั่งขวาได้มากที่สุดเสมอ (ฝั่งซ้ายไม่มีบ้านค้างแล้ว)',
      fix: 'โค้ดเฉลยเดิมวางเสา "ที่ตำแหน่งบ้าน" ทำให้บางกรณีได้มากเกินจำเป็น เช่น <code>[1,5], R=3</code> ควรใช้ <b>1 เสา</b> (วางที่ 4) และ <code>[1,5,9], R=2</code> ควรได้ <b>2</b> — แก้เป็นวางเสาที่ <code>loc + R</code> (ดูโค้ดแก้แล้วด้านล่าง). และ <code>min_stations([1,2,3,10,14,17], 3)</code> ที่ถูกคือ <b>3</b> ไม่ใช่ 2 (บ้าน 10 และ 17 ห่างกัน 7 > 2R = 6)',
      code: 'def min_stations(houses, R):\n    if not houses:\n        return 0\n\n    houses = sorted(houses)\n    stations, i, n = 0, 0, len(houses)\n\n    while i < n:\n        station_pos = houses[i] + R                    # วางเสาไกลขวาสุดที่ยังคลุมบ้านแรกที่หลุด\n        stations += 1\n        while i < n and houses[i] <= station_pos + R:  # ข้ามทุกบ้านที่เสานี้คลุม\n            i += 1\n\n    return stations\n\nassert min_stations([1, 2, 3, 10, 14, 17], 3) == 3\nassert min_stations([1, 5, 9], 2) == 2      # เสา @3 คลุม 1,5 และเสา @11 คลุม 9\nassert min_stations([1, 2, 3, 4], 2) == 1' },
    11: { level: 'advanced', strat: 'ไล่เหตุการณ์ตามเวลา นับที่ซ้อนกันสูงสุด', key: 'เวลาเข้า/ออก ↑ แยกกัน', cx: 'O(n log n)',
      idea: ['จำนวนชานชาลาที่ต้องมี = <b>จำนวนรถไฟที่จอดพร้อมกันสูงสุด</b> ณ เวลาใดเวลาหนึ่ง', 'เรียง <code>arrival</code> และ <code>departure</code> <b>แยกกัน</b>', 'two-pointers ไล่เวลา: <code>arrival[i] ≤ departure[j]</code> → รถเข้า <code>platforms += 1</code> ไม่เช่นนั้น → รถออก <code>platforms -= 1</code>', 'เก็บค่าสูงสุดของ <code>platforms</code>'],
      extra: '<p><b>ทำไมเรียงแยกได้?</b> เพราะเรากำลังนับ "จำนวนเหตุการณ์เข้าลบเหตุการณ์ออก ณ เวลา t" ซึ่งไม่ขึ้นกับว่ารถขบวนไหนออก</p>',
      why: 'ณ เวลาที่มีรถจอดพร้อมกันมากที่สุด k ขบวน ต้องมีอย่างน้อย k ชานชาลาแน่นอน และ k ชานชาลาก็พอเสมอ (ขบวนที่ออกคืนชานชาลาให้ขบวนถัดไป) จึงนับค่าสูงสุดได้เลย' },
    12: { level: 'advanced', strat: 'รวม 2 ความถี่น้อยสุดก่อน', key: 'Min-Heap', cx: 'O(n log n)',
      idea: ['ใส่ความถี่ทุกตัวลง Min-Heap', 'ดึง 2 โหนดที่ความถี่น้อยสุด → รวมเป็นโหนดแม่ (freq = ผลบวก)', 'ใส่โหนดแม่กลับ heap ; ซ้ำจนเหลือรากเดียว', 'อ่านรหัส: เดินจากรากลงใบ ซ้าย = <code>0</code>, ขวา = <code>1</code>'],
      extra: '<p><b>ข้อสังเกตสำคัญ:</b> ผลรวมของค่าที่ถูกรวมทั้งหมด (คำตอบของโจทย์) = จำนวนบิตรวมทั้งหมดของข้อความที่เข้ารหัสแล้ว = Σ (ความถี่ × ความยาวรหัส) เพราะทุกครั้งที่โหนดถูกรวมขึ้นไป 1 ระดับ ความยาวรหัสของตัวอักษรนั้นเพิ่ม 1 บิต</p>',
      why: 'ตัวอักษรที่ถี่น้อยสุด 2 ตัวควรอยู่ <b>ลึกสุดและเป็นพี่น้องกัน</b> ในต้นไม้ที่ดีที่สุด (สลับกับตัวที่ลึกกว่า/ถี่กว่า ต้นทุนไม่เพิ่ม) จึงรวมสองตัวนี้ก่อนได้เลย แล้วแก้ปัญหาที่เล็กลง — ข้อ 8 (ต่อเชือก) กับข้อ 12 คือปัญหาเดียวกันในรูปแบบต่างกัน' },
  };
  const LEVEL = { easy: ['ระดับง่าย', 'Easy'], medium: ['ระดับปานกลาง', 'Medium'], advanced: ['ระดับประยุกต์ / ขั้นสูง', 'Advanced'] };

  /* ================= อนิเมชันทีละขั้น (ใช้ StepPlayer ของ Greedy Tutor) ================= */
  const W = 560, X0 = 40, X1 = 540;
  const svgWrap = (h, inner) => `<svg class="ga" viewBox="0 0 ${W} ${h}" role="img" aria-label="ภาพประกอบขั้นตอน">${inner}</svg>`;
  const axis = (lo, hi, y, step) => { const sx = (v) => X0 + (v - lo) / (hi - lo) * (X1 - X0); let o = `<line class="ga-axis" x1="${X0}" y1="${y}" x2="${X1}" y2="${y}"/>`; for (let v = lo; v <= hi; v += step) o += `<line class="ga-axis" x1="${sx(v)}" y1="${y}" x2="${sx(v)}" y2="${y + 5}"/><text class="ga-tick" x="${sx(v)}" y="${y + 18}">${v}</text>`; return { o, sx }; };

  const ANIM = {
    5: { title: 'Activity Selection: เรียงตามเวลาจบ แล้วเลือกงานที่ไม่ชน',
      input: 'acts = [(1,4), (3,5), (0,6), (5,7), (3,8), (5,9), (6,10), (8,11)]',
      pseudo: ['sort activities by end time', 'count ← 1; last_end ← end of first', 'for (start, end) in the rest do', '    if start ≥ last_end then', '        count ← count + 1; last_end ← end', 'return count'],
      build() {
        const acts = [[1, 4], [3, 5], [0, 6], [5, 7], [3, 8], [5, 9], [6, 10], [8, 11]].sort((a, b) => a[1] - b[1]);
        const st = acts.map(() => ''); const steps = []; let last = null, count = 0;
        const draw = (cur) => { const { o, sx } = axis(0, 12, 26 + acts.length * 26, 1); let g = o; acts.forEach(([s, e], i) => { const y = 14 + i * 26, cls = i === cur ? 'cand' : st[i]; g += `<rect class="ga-bar ${cls}" x="${sx(s)}" y="${y}" width="${sx(e) - sx(s)}" height="18" rx="4"/><text class="ga-lab" x="${sx(s) + 6}" y="${y + 13}">(${s}, ${e})</text>`; }); if (last !== null) g += `<line class="ga-mark" x1="${sx(last)}" y1="6" x2="${sx(last)}" y2="${22 + acts.length * 26}"/><text class="ga-marklab" x="${sx(last) + 4}" y="12">last_end = ${last}</text>`; return svgWrap(60 + acts.length * 26, g); };
        steps.push({ svg: draw(-1), hl: [0], text: `<b>เริ่มต้น:</b> เรียงงานตามเวลาจบ (end) จากน้อยไปมาก ได้ ${acts.map((a) => `(${a})`).join(' ')}` });
        acts.forEach(([s, e], i) => {
          if (i === 0) { st[0] = 'ok'; last = e; count = 1; steps.push({ svg: draw(0), hl: [1], text: `เลือกงานแรก <b>(${s}, ${e})</b> เพราะจบเร็วที่สุด → คืนห้องเร็วสุด เหลือเวลาให้งานอื่นมากที่สุด. count = 1, last_end = ${e}` }); return; }
          steps.push({ svg: draw(i), hl: [2, 3], text: `พิจารณา <b>(${s}, ${e})</b>: start = ${s} ${s >= last ? '≥' : '<'} last_end = ${last}` });
          if (s >= last) { st[i] = 'ok'; last = e; count++; steps.push({ svg: draw(-1), hl: [4], text: `✓ ไม่ชน → เลือก. count = ${count}, last_end = ${e}` }); }
          else { st[i] = 'bad'; steps.push({ svg: draw(-1), hl: [3], text: `✗ เริ่มก่อนงานล่าสุดจบ (ชนกัน) → ข้าม` }); }
        });
        steps.push({ svg: draw(-1), hl: [5], text: `<b>เสร็จ:</b> เลือกได้ <b>${count} งาน</b>: ${acts.filter((_, i) => st[i] === 'ok').map((a) => `(${a})`).join(', ')}` });
        return steps;
      } },
    6: { title: 'Fractional Knapsack: เติมกระเป๋าด้วยของที่คุ้มค่าต่อหน่วยสูงสุด',
      input: 'items = [(60, 10), (100, 20), (120, 30)]   (value, weight)   W = 50',
      pseudo: ['compute ratio = value / weight', 'sort items by ratio (desc)', 'for (value, weight) in items do', '    if capacity ≥ weight: take all', '    else: take ratio × capacity; break', 'return total value'],
      build() {
        const items = [[60, 10], [100, 20], [120, 30]].map(([v, w], i) => ({ v, w, r: v / w, n: 'ABC'[i] })).sort((a, b) => b.r - a.r); const Wc = 50;
        const parts = []; let cap = Wc, tot = 0; const steps = [];
        const draw = (cur) => { const sx = (x) => X0 + x / Wc * (X1 - X0); let g = `<rect class="ga-bag" x="${X0}" y="110" width="${X1 - X0}" height="40" rx="6"/><text class="ga-lab" x="${X0}" y="104">กระเป๋า W = ${Wc}</text>`; let x = 0; parts.forEach((p) => { g += `<rect class="ga-bar ok" x="${sx(x)}" y="110" width="${sx(x + p.w) - sx(x)}" height="40" rx="4"/><text class="ga-lab" x="${sx(x) + 6}" y="135">${p.n} ${p.w === p.full ? '' : `(${p.w}/${p.full})`}</text>`; x += p.w; });
          items.forEach((it, i) => { const y = 14 + i * 28, cls = i === cur ? 'cand' : parts.find((p) => p.n === it.n) ? 'ok' : ''; g += `<rect class="ga-chip ${cls}" x="${X0}" y="${y}" width="250" height="22" rx="5"/><text class="ga-lab" x="${X0 + 8}" y="${y + 15}">${it.n}: v=${it.v}, w=${it.w}, v/w = ${it.r}</text>`; });
          g += `<text class="ga-marklab" x="${X1}" y="30" text-anchor="end">มูลค่ารวม = ${+tot.toFixed(2)}</text><text class="ga-marklab" x="${X1}" y="50" text-anchor="end">ที่ว่างเหลือ = ${cap}</text>`; return svgWrap(165, g); };
        steps.push({ svg: draw(-1), hl: [0, 1], text: `คำนวณ value/weight แล้วเรียงจากมากไปน้อย: ${items.map((it) => `${it.n} (${it.r})`).join(' > ')}` });
        for (const it of items) {
          steps.push({ svg: draw(items.indexOf(it)), hl: [2], text: `ชิ้นที่คุ้มสุดที่เหลือคือ <b>${it.n}</b> (v/w = ${it.r}) น้ำหนัก ${it.w} ที่ว่างเหลือ ${cap}` });
          if (cap >= it.w) { parts.push({ n: it.n, w: it.w, full: it.w }); cap -= it.w; tot += it.v; steps.push({ svg: draw(-1), hl: [3], text: `ใส่ได้ทั้งชิ้น → มูลค่ารวม ${tot}, ที่ว่างเหลือ ${cap}` }); }
          else { const add = it.r * cap; parts.push({ n: it.n, w: cap, full: it.w }); tot += add; steps.push({ svg: draw(-1), hl: [4], text: `ใส่ทั้งชิ้นไม่ได้ → <b>หั่น</b> ${cap}/${it.w} ของชิ้น ได้มูลค่า ${it.r} × ${cap} = ${add}. มูลค่ารวม = <b>${tot}</b>` }); cap = 0; break; }
        }
        steps.push({ svg: draw(-1), hl: [5], text: `<b>เสร็จ:</b> มูลค่าสูงสุด = <b>${tot}</b> (ถ้าเป็น 0/1 knapsack ห้ามหั่น คำตอบดีสุดคือ 220 — greedy ใช้ไม่ได้ ต้องใช้ DP)` });
        return steps;
      } },
    8: { title: 'Connect Ropes: ต่อสองเส้นที่สั้นที่สุดก่อนเสมอ (Min-Heap)',
      input: 'ropes = [4, 3, 2, 6]',
      pseudo: ['heap ← ropes; total ← 0', 'while |heap| > 1 do', '    a ← pop(heap); b ← pop(heap)', '    total ← total + (a + b)', '    push(heap, a + b)', 'return total'],
      build() {
        let heap = [4, 3, 2, 6].sort((a, b) => a - b); let tot = 0; const log = []; const steps = [];
        const draw = (pick, made) => { let g = ''; const mx = 15; heap.forEach((L, i) => { const y = 14 + i * 30, cls = pick && i < 2 ? 'cand' : L === made ? 'ok' : ''; g += `<rect class="ga-bar ${cls}" x="${X0}" y="${y}" width="${L / mx * 360}" height="20" rx="4"/><text class="ga-lab" x="${X0 + L / mx * 360 + 8}" y="${y + 15}">${L}</text>`; }); g += `<text class="ga-marklab" x="${X1}" y="24" text-anchor="end">ต้นทุนรวม = ${tot}</text>`; log.forEach((l, i) => { g += `<text class="ga-tick" x="${X1}" y="${50 + i * 18}" text-anchor="end">${l}</text>`; }); return svgWrap(Math.max(140, 20 + heap.length * 30), g); };
        steps.push({ svg: draw(false), hl: [0], text: `ใส่เชือกทั้งหมดลง min-heap: ${heap.join(', ')}` });
        while (heap.length > 1) {
          const [a, b] = heap;
          steps.push({ svg: draw(true), hl: [2], text: `ดึงสองเส้นที่สั้นที่สุด: <b>${a}</b> และ <b>${b}</b> — เชือกที่ต่อก่อนจะถูกนับซ้ำในการต่อรอบถัดไป จึงควรเป็นเส้นสั้น` });
          heap = heap.slice(2); tot += a + b; heap.push(a + b); heap.sort((x, y) => x - y); log.push(`${a} + ${b} = ${a + b}`);
          steps.push({ svg: draw(false, a + b), hl: [3, 4], text: `ต่อได้เส้นยาว ${a + b} ค่าใช้จ่าย +${a + b} → รวม <b>${tot}</b> แล้วใส่กลับเข้า heap` });
        }
        steps.push({ svg: draw(false), hl: [5], text: `<b>เสร็จ:</b> ต้นทุนรวมต่ำสุด = <b>${tot}</b>` });
        return steps;
      } },
    9: { title: 'Job Sequencing: งานกำไรมากก่อน วางในช่องท้ายสุดที่ยังทัน deadline',
      input: "jobs = [('A',2,100), ('B',1,19), ('C',2,27), ('D',1,25), ('E',3,15)]",
      pseudo: ['sort jobs by profit (desc)', 'slots[1..max_deadline] ← empty', 'for (id, deadline, profit) in jobs do', '    for t ← deadline downto 1 do', '        if slots[t] is empty: slots[t] ← id; break', 'return jobs in slots'],
      build() {
        const jobs = [['A', 2, 100], ['B', 1, 19], ['C', 2, 27], ['D', 1, 25], ['E', 3, 15]].sort((a, b) => b[2] - a[2]); const slots = [null, null, null, null]; const st = {}; const steps = [];
        const draw = (cur, probe) => { let g = ''; for (let t = 1; t <= 3; t++) { const x = X0 + (t - 1) * 120; const cls = probe === t ? 'cand' : slots[t] ? 'ok' : ''; g += `<rect class="ga-slot ${cls}" x="${x}" y="20" width="110" height="54" rx="6"/><text class="ga-tick" x="${x + 55}" y="14">slot ${t}</text><text class="ga-big" x="${x + 55}" y="56">${slots[t] || '—'}</text>`; }
          jobs.forEach((j, i) => { const x = X0 + i * 100, cls = i === cur ? 'cand' : st[j[0]] || ''; g += `<rect class="ga-chip ${cls}" x="${x}" y="100" width="92" height="44" rx="6"/><text class="ga-lab" x="${x + 8}" y="118">${j[0]} · d=${j[1]}</text><text class="ga-lab" x="${x + 8}" y="136">กำไร ${j[2]}</text>`; }); return svgWrap(160, g); };
        steps.push({ svg: draw(-1), hl: [0, 1], text: `เรียงงานตามกำไรจากมากไปน้อย: ${jobs.map((j) => `${j[0]}(${j[2]})`).join(', ')} และเตรียมช่องเวลา slot 1..3` });
        jobs.forEach((j, i) => {
          steps.push({ svg: draw(i), hl: [2], text: `พิจารณางาน <b>${j[0]}</b> (deadline ${j[1]}, กำไร ${j[2]}) — ลองช่องท้ายสุดที่ทัน คือ slot ${j[1]} แล้วถอยหลัง` });
          let placed = false;
          for (let t = j[1]; t >= 1; t--) {
            if (!slots[t]) { slots[t] = j[0]; st[j[0]] = 'ok'; placed = true; steps.push({ svg: draw(-1, t), hl: [4], text: `slot ${t} ว่าง → วาง <b>${j[0]}</b> ไว้ที่ slot ${t} (เก็บช่องต้น ๆ ไว้ให้งานที่ deadline กระชั้นกว่า)` }); break; }
            steps.push({ svg: draw(i, t), hl: [3], text: `slot ${t} มีงาน ${slots[t]} แล้ว → ถอยไปช่องก่อนหน้า` });
          }
          if (!placed) { st[j[0]] = 'bad'; steps.push({ svg: draw(-1), hl: [3], text: `ไม่มีช่องว่างก่อน deadline ${j[1]} → ทิ้งงาน <b>${j[0]}</b>` }); }
        });
        const res = slots.filter(Boolean); const profit = jobs.filter((j) => res.includes(j[0])).reduce((s, j) => s + j[2], 0);
        steps.push({ svg: draw(-1), hl: [5], text: `<b>เสร็จ:</b> ลำดับงาน ${res.join(' → ')} กำไรรวม <b>${profit}</b>` });
        return steps;
      } },
    10: { title: 'Minimum Stations: วางเสาไกลขวาสุดที่ยังคลุมบ้านแรกที่หลุด',
      input: 'houses = [1, 2, 3, 10, 14, 17]   R = 3',
      pseudo: ['sort houses', 'i ← 0; stations ← 0', 'while i < n do', '    pos ← houses[i] + R; stations += 1', '    while i < n and houses[i] ≤ pos + R: i += 1', 'return stations'],
      build() {
        const H = [1, 2, 3, 10, 14, 17], R = 3; const st = []; const cov = H.map(() => 0); let i = 0; const steps = [];
        const draw = (curH) => { const { o, sx } = axis(0, 22, 110, 2); let g = o; st.forEach((p, k) => { g += `<rect class="ga-cover" x="${sx(p - R)}" y="54" width="${sx(p + R) - sx(p - R)}" height="30" rx="6"/><path class="ga-tower" d="M${sx(p)} 50 l-7 14 h14 z"/><text class="ga-marklab" x="${sx(p)}" y="44" text-anchor="middle">เสา ${k + 1} @${p}</text>`; }); H.forEach((h, k) => { g += `<circle class="ga-house ${k === curH ? 'cand' : cov[k] ? 'ok' : ''}" cx="${sx(h)}" cy="${97}" r="8"/>`; }); return svgWrap(135, g); };
        steps.push({ svg: draw(-1), hl: [0, 1], text: `เรียงตำแหน่งบ้าน ${H.join(', ')} รัศมีเสา R = ${R} (เสาที่ X คลุม [X−R, X+R])` });
        while (i < H.length) {
          const loc = H[i], pos = loc + R;
          steps.push({ svg: draw(i), hl: [2], text: `บ้านแรกที่ยังไม่ถูกคลุมคือ <b>${loc}</b> — ต้องมีเสาคลุมบ้านนี้แน่ ๆ ซึ่งวางได้ไกลสุดที่ ${loc} + R = ${pos}` });
          st.push(pos); const from = i;
          while (i < H.length && H[i] <= pos + R) { cov[i] = 1; i++; }
          steps.push({ svg: draw(-1), hl: [3, 4], text: `วางเสาที่ <b>${pos}</b> คลุมถึง ${pos + R} → คลุมบ้าน ${H.slice(from, i).join(', ')}` });
        }
        steps.push({ svg: draw(-1), hl: [5], text: `<b>เสร็จ:</b> ใช้เสา <b>${st.length}</b> ต้น (ที่ ${st.join(', ')}) — ตรงกับค่าที่แก้แล้ว (ต้นฉบับเขียน 2)` });
        return steps;
      } },
    11: { title: 'Minimum Platforms: เรียงเวลาเข้า/ออกแยกกัน แล้วนับรถที่จอดพร้อมกัน',
      input: 'arrival = [900, 940, 950, 1100, 1500, 1800]   departure = [910, 1200, 1120, 1130, 1900, 2000]',
      pseudo: ['sort arrival; sort departure', 'i ← j ← 0; now ← best ← 0', 'while i < n and j < n do', '    if arrival[i] ≤ departure[j]: now += 1; best ← max(best, now); i += 1', '    else: now −= 1; j += 1', 'return best'],
      build() {
        const A = [900, 940, 950, 1100, 1500, 1800], D = [910, 1200, 1120, 1130, 1900, 2000]; const trains = A.map((a, k) => [a, D[k]]);
        const a = A.slice().sort((x, y) => x - y), d = D.slice().sort((x, y) => x - y); let i = 0, j = 0, now = 0, best = 0, t = null; const steps = [];
        const hm = (v) => `${String(Math.floor(v / 100)).padStart(2, '0')}:${String(v % 100).padStart(2, '0')}`;
        const mins = (v) => Math.floor(v / 100) * 60 + v % 100;
        const draw = () => { const lo = mins(900), hi = mins(2000), sx = (v) => X0 + (mins(v) - lo) / (hi - lo) * (X1 - X0); let g = ''; trains.forEach(([s, e], k) => { const y = 12 + k * 24, active = t !== null && s <= t && e >= t; g += `<rect class="ga-bar ${active ? 'cand' : ''}" x="${sx(s)}" y="${y}" width="${Math.max(3, sx(e) - sx(s))}" height="16" rx="4"/><text class="ga-lab" x="${sx(s)}" y="${y + 12}" dx="${sx(e) - sx(s) > 90 ? 6 : -4}" text-anchor="${sx(e) - sx(s) > 90 ? 'start' : 'end'}">${hm(s)}–${hm(e)}</text>`; });
          [900, 1200, 1500, 1800, 2000].forEach((v) => { g += `<text class="ga-tick" x="${sx(v)}" y="170">${hm(v)}</text>`; });
          if (t !== null) g += `<line class="ga-mark" x1="${sx(t)}" y1="4" x2="${sx(t)}" y2="156"/>`;
          g += `<text class="ga-marklab" x="${X1}" y="196" text-anchor="end">จอดอยู่ตอนนี้ = ${now} · สูงสุด = ${best}</text>`; return svgWrap(206, g); };
        steps.push({ svg: draw(), hl: [0, 1], text: `เรียง arrival = [${a.map(hm).join(', ')}] และ departure = [${d.map(hm).join(', ')}] <b>แยกกัน</b> — เราสนใจแค่จำนวนเหตุการณ์เข้า/ออก ไม่ต้องรู้ว่าเป็นขบวนไหน` });
        while (i < a.length && j < d.length) {
          if (a[i] <= d[j]) { t = a[i]; now++; best = Math.max(best, now); steps.push({ svg: draw(), hl: [3], text: `arrival ${hm(a[i])} ≤ departure ${hm(d[j])} → มีรถเข้า: จอดอยู่ ${now} ขบวน (สูงสุด ${best})` }); i++; }
          else { t = d[j]; now--; steps.push({ svg: draw(), hl: [4], text: `departure ${hm(d[j])} มาก่อน arrival ${hm(a[i])} → มีรถออก: จอดอยู่ ${now} ขบวน` }); j++; }
        }
        steps.push({ svg: draw(), hl: [5], text: `<b>เสร็จ:</b> ต้องใช้ชานชาลาอย่างน้อย <b>${best}</b> ชานชาลา (ช่วง 11:00 มีรถจอดพร้อมกัน 3 ขบวน)` });
        return steps;
      } },
  };

  function mountAnim(n, host) {
    const A = ANIM[n];
    host.innerHTML = `<div class="m-gr"><div class="lab-head"><h2>${A.title}</h2><p class="mono">${esc(A.input)}</p></div>
      <div class="lab-grid"><div class="col-main"><div class="stage card"><div class="ga-stage"></div><div class="legend"><span><i></i>ยังไม่พิจารณา</span><span><i class="c"></i>กำลังพิจารณา</span><span><i class="o"></i>เลือกแล้ว</span><span><i class="b"></i>ปฏิเสธ</span></div></div><div class="pl"></div><div class="why card"><h3>ทำไมถึงเลือกแบบนี้?</h3><div class="why-body"></div></div></div>
      <div class="col-side"><div class="pseudo card"><h3>Pseudocode</h3><pre class="code">${A.pseudo.map((l, i) => `<span class="ln" data-i="${i}">${esc(l)}</span>`).join('')}</pre><p class="cx">ความซับซ้อน: ${NB[n].cx}</p></div></div></div></div>`;
    const stage = host.querySelector('.ga-stage'), why = host.querySelector('.why-body'), lns = [...host.querySelectorAll('.ln')];
    const pl = new AP.gr.StepPlayer(host.querySelector('.pl'), (st) => { stage.innerHTML = st.svg; why.innerHTML = st.text; lns.forEach((l, k) => l.classList.toggle('on', st.hl.includes(k))); });
    pl.setSteps(A.build(), 0);
    return pl;
  }

  /* ================= ควิซ (ข้อละ 2 คำถาม) ================= */
  const Q = [
    [1, 'เหรียญ [20, 10, 5, 1] ทอน 68 บาทด้วย greedy ได้ผลลัพธ์ใด', ['{20: 3, 5: 1, 1: 3}', '{20: 3, 10: 0, 5: 1, 1: 3, 2: 0}', '{20: 2, 10: 2, 5: 1, 1: 3}', '{10: 6, 5: 1, 1: 3}'], 0, '68 − 60 = 8 → 5 × 1 → 3 × 1 ได้ {20: 3, 5: 1, 1: 3} (บันทึกเฉพาะเหรียญที่ใช้ > 0)'],
    [1, 'ทำไม greedy ใช้ได้กับเหรียญ [20, 10, 5, 1] แต่พังกับ [1, 3, 4]', ['เพราะ [20,10,5,1] เป็น canonical coin system เหรียญใหญ่แทนด้วยเหรียญเล็กได้ลงตัว', 'เพราะ [1, 3, 4] ไม่มีเหรียญ 2', 'เพราะ greedy ต้องเรียงจากน้อยไปมาก', 'เพราะเหรียญต้องมีจำนวนจำกัด'], 0, 'การใช้เหรียญใหญ่ไม่มีทางแย่กว่าเมื่อระบบเหรียญเป็น canonical; {1,3,4} ทอน 6 greedy ได้ 4+1+1 แต่ดีสุด 3+3'],
    [2, 'min_refuels(950, 400, [200, 375, 550, 750]) ได้กี่ครั้ง', ['1', '2', '3', '-1'], 1, 'จาก 0 ไปได้ไกลสุด 375 → เติม, จาก 375 ไปได้ถึง 750 → เติม, จาก 750 ถึง 950 ได้ = 2 ครั้ง'],
    [2, 'Car Fueling คืนค่า -1 เมื่อใด', ['เมื่อเติมเต็มถังแล้วยังไปปั๊มถัดไปไม่ถึง', 'เมื่อไม่ต้องเติมเลย', 'เมื่อมีปั๊มมากกว่า L', 'เมื่อปั๊มไม่ได้เรียงลำดับ'], 0, 'ถ้าตำแหน่งไม่ขยับเลยหลังเติมเต็มถัง (ปั๊มถัดไปห่างเกิน L) แปลว่าไปต่อไม่ได้'],
    [3, 'max_people([1, 2, 4, 8, 9, 12], 3) ได้กี่คน (ค่าที่แก้แล้ว)', ['3', '4', '5', '6'], 1, 'นั่ง 1 → 4 (ห่าง 3) → 8 → 12 = 4 คน (ต้นฉบับเขียน 3 ซึ่งผิด)'],
    [3, 'ทำไมต้องให้คนแรกนั่งตำแหน่งแรกสุด', ['เหลือพื้นที่ทางขวาให้คนถัดไปมากที่สุด', 'เพราะโจทย์บังคับ', 'เพื่อให้ห่างกันมากที่สุด', 'เพราะต้องเรียงจากมากไปน้อย'], 0, 'exchange argument: เลื่อนคนมาซ้ายสุดที่ทำได้ไม่ทำให้จำนวนคนลดลง'],
    [4, 'min_boxes([3, 2, 2, 1, 4, 2], 5) ได้กี่กล่อง', ['3', '4', '5', '6'], 1, '[3,2] [2,1] [4] [2] = 4 กล่อง (ห้ามสลับลำดับ)'],
    [4, 'ถ้า Box Packing อนุญาตให้สลับลำดับของได้ จะกลายเป็นปัญหาใด', ['Bin Packing ซึ่งเป็น NP-hard', 'Activity Selection', 'Fractional Knapsack', 'Shortest path'], 0, 'Bin Packing เป็น NP-hard ต้องใช้ heuristic อย่าง First-Fit Decreasing'],
    [5, 'Activity Selection ควรเรียงงานตามอะไร', ['เวลาจบ จากน้อยไปมาก', 'เวลาเริ่ม จากน้อยไปมาก', 'ระยะเวลางาน สั้นไปยาว', 'ระยะเวลางาน ยาวไปสั้น'], 0, 'งานที่จบเร็วสุดคืนห้องเร็วสุด เหลือเวลาให้งานอื่นมากที่สุด'],
    [5, 'max_activities([(1,4), (3,5), (0,6), (5,7), (3,8), (5,9), (6,10), (8,11)]) ได้กี่งาน', ['2', '3', '4', '5'], 1, 'เลือก (1,4) → (5,7) → (8,11) = 3 งาน'],
    [6, 'Fractional knapsack items [(60,10),(100,20),(120,30)], W = 50 ได้มูลค่าสูงสุดเท่าไร', ['220', '240', '180', '160'], 1, 'หยิบ 60 + 100 ทั้งชิ้น เหลือที่ 20 หั่น 120 × 20/30 = 80 รวม 240'],
    [6, 'ถ้าห้ามหั่นของ (0/1 knapsack) greedy ตาม value/weight ได้ผลอย่างไร', ['อาจไม่ได้คำตอบที่ดีที่สุด ต้องใช้ DP', 'ได้คำตอบดีที่สุดเสมอ', 'ได้คำตอบดีที่สุดถ้าเรียงจากน้อยไปมาก', 'ทำงานไม่ได้เลย'], 0, 'ตัวอย่างเดียวกันถ้าห้ามหั่น greedy ได้ 160 แต่ดีสุดคือ 100 + 120 = 220'],
    [7, 'minimize_max_pair([3, 5, 4, 5, 2, 6]) ได้เท่าไร (ค่าที่แก้แล้ว)', ['8', '9', '10', '11'], 1, 'เรียง [2,3,4,5,5,6] จับคู่ 2+6, 3+5, 4+5 → max = 9 (ต้นฉบับเขียน 8)'],
    [7, 'ตัวที่ใหญ่ที่สุดควรจับคู่กับใคร', ['ตัวที่เล็กที่สุด', 'ตัวที่ใหญ่รองลงมา', 'ตัวตรงกลาง', 'ตัวที่ค่าเท่ากัน'], 0, 'M + m ≤ M + x ทุก x จึงจับกับตัวเล็กสุดดีที่สุด'],
    [8, 'min_cost_connect([4, 3, 2, 6]) ได้เท่าไร', ['27', '29', '31', '15'], 1, '2+3=5, 4+5=9, 6+9=15 → 5+9+15 = 29'],
    [8, 'min_cost_connect([1, 2, 5, 10, 35]) ได้เท่าไร (ค่าที่แก้แล้ว)', ['82', '85', '53', '90'], 0, '3 → 8 → 18 → 53 : 3+8+18+53 = 82 (ต้นฉบับเขียน 85)'],
    [9, "jobs [('A',2,100), ('B',1,19), ('C',2,27), ('D',1,25), ('E',3,15)] ได้ลำดับงานใด", ["['C', 'A', 'E']", "['A', 'C', 'E']", "['A', 'D', 'E']", "['D', 'A', 'C']"], 0, 'A → slot 2, C → slot 1, D ไม่มีช่อง, B ไม่มีช่อง, E → slot 3 ได้ C, A, E กำไร 142'],
    [9, 'ทำไมวางงานในช่อง "ท้ายสุดที่ยังทัน"', ['เก็บช่องต้น ๆ ไว้ให้งานที่ deadline กระชั้นกว่า', 'เพื่อให้งานเสร็จเร็วที่สุด', 'เพราะช่องท้ายสุดมีกำไรมากกว่า', 'เพราะต้องเรียงตาม deadline'], 0, 'ช่องต้น ๆ ทุกงานใช้ได้ จึงไม่ควรแย่งไปโดยไม่จำเป็น'],
    [10, 'min_stations([1, 2, 3, 10, 14, 17], 3) ได้กี่ต้น (ค่าที่แก้แล้ว)', ['2', '3', '4', '6'], 1, 'เสา @4 คลุม 1,2,3 · @13 คลุม 10,14 · @20 คลุม 17 = 3 ต้น'],
    [10, 'บ้านแรกที่หลุดอยู่ที่ loc ควรวางเสาที่ใด', ['loc + R', 'loc', 'loc − R', 'loc + 2R'], 0, 'ไกลขวาสุดที่ยังคลุม loc ได้คือ loc + R (คลุมถึง loc + 2R)'],
    [11, 'arrival [900,940,950,1100,1500,1800] departure [910,1200,1120,1130,1900,2000] ต้องใช้กี่ชานชาลา', ['2', '3', '4', '6'], 1, 'ช่วง 11:00 มีรถจอดพร้อมกัน 3 ขบวน (940–1200, 950–1120, 1100–1130)'],
    [11, 'ทำไมเรียง arrival กับ departure แยกกันได้', ['เพราะนับแค่จำนวนเหตุการณ์เข้า/ออก ไม่ต้องรู้ว่าขบวนไหน', 'เพราะรถไฟทุกขบวนยาวเท่ากัน', 'เพราะต้องเรียงตามชานชาลา', 'เพราะเวลาเข้าน้อยกว่าเวลาออกเสมอ'], 0, 'จำนวนที่จอด ณ t = (#เข้า ≤ t) − (#ออก < t)'],
    [12, "huffman_base_cost({'a':5,'b':9,'c':12,'d':13,'e':16,'f':45}) ได้เท่าไร", ['224', '100', '232', '216'], 0, '14, 25, 30, 55, 100 → 14+25+30+55+100 = 224'],
    [12, 'ผลรวมต้นทุนการรวมของ Huffman เท่ากับอะไร', ['จำนวนบิตรวมของข้อความที่เข้ารหัส = Σ ความถี่ × ความยาวรหัส', 'ความยาวรหัสที่ยาวที่สุด', 'จำนวนตัวอักษร', 'ความถี่ที่มากที่สุด'], 0, 'ทุกครั้งที่โหนดถูกรวมขึ้นไป 1 ระดับ รหัสของมันยาวขึ้น 1 บิต'],
  ].map(([n, q, opts, ans, why]) => ({ n, q, opts, ans, why, src: `โจทย์ Greedy ข้อ ${n}` }));

  AP.GP = { NB, LEVEL, ANIM, mountAnim, QUIZ: Q, byN: (n) => AP.LABGREEDY.find((p) => p.n === n) };
})();
