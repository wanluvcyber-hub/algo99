/* games.js — เกม 4 แบบ (สุ่มโจทย์ใหม่ทุกรอบ, เก็บคะแนนสูงสุด/streak ใน AP.store)
 *  dpfill  เติมตาราง DP แข่งเวลา       (ตรวจด้วย Engines จาก dp-week8)
 *  algo    เล่นเป็น Prim/Kruskal/Dijkstra (ตรวจตามกฎของอัลกอริทึม ไม่ผูกกับลำดับตายตัว)
 *  match   จับคู่ Flashcard
 *  greedy  Greedy ได้ optimal ไหม?     (เทียบกับ DP / ลองทุกแบบ)                        */
(function () {
  'use strict';
  const { esc, shuffle, rnd } = AP;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const E = () => window.Engines;
  const INF = Infinity;
  const NS = 'http://www.w3.org/2000/svg';
  const pick = (a) => a[rnd(0, a.length - 1)];
  const svgEl = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };

  /* ---------- กรอบเกมร่วม: HUD, คะแนน, สรุปผล ---------- */
  function Session(host, meta, rounds, startRound) {
    const S = { score: 0, streak: 0, best: 0, ok: 0, round: 0, rounds, t0: 0, timer: null };
    host.innerHTML = `<div class="ap-wrap ap-game"><div class="ap-thead"><a class="ap-small" href="#games">← เกมทั้งหมด</a><h1 class="ap-h1">${meta.icon} ${meta.title}</h1><p class="ap-lede">${meta.how}</p></div>
      <div class="ap-hud" aria-live="polite"><span>รอบ <b class="h-r">1</b>/${rounds}</span><span>คะแนน <b class="h-s">0</b></span><span>Streak 🔥 <b class="h-k">0</b></span><span class="h-t">⏱ 0</span></div><div class="ap-gstage"></div></div>`;
    const stage = $('.ap-gstage', host);
    const hud = () => { $('.h-r', host).textContent = Math.min(S.round + 1, rounds); $('.h-s', host).textContent = S.score; $('.h-k', host).textContent = S.streak; };
    S.stage = stage;
    S.startTimer = () => { S.t0 = Date.now(); clearInterval(S.timer); S.timer = setInterval(() => { const el = $('.h-t', host); if (el) el.textContent = '⏱ ' + Math.round((Date.now() - S.t0) / 1000); }, 500); };
    S.elapsed = () => (Date.now() - S.t0) / 1000;
    S.stopTimer = () => clearInterval(S.timer);
    // เพิ่มคะแนนรอบ: ถูกครบ → โบนัสความเร็ว + streak
    S.award = (base, allOk, quick) => {
      let pts = Math.round(base);
      if (allOk) { S.streak++; S.best = Math.max(S.best, S.streak); S.ok++; pts += Math.max(0, Math.round(quick)) + Math.min(50, (S.streak - 1) * 10); } else S.streak = 0;
      S.score += pts; hud(); return pts;
    };
    S.next = () => { S.round++; hud(); if (S.round >= rounds) S.finish(); else startRound(S); };
    S.finish = () => {
      S.stopTimer(); const all = AP.store.get('games', {}), g = all[meta.id] || { best: 0, ok: 0, streak: 0, plays: 0 };
      const newBest = S.score > g.best; g.best = Math.max(g.best, S.score); g.ok += S.ok; g.streak = Math.max(g.streak, S.best); g.plays = (g.plays || 0) + 1; all[meta.id] = g; AP.store.set('games', all); AP.progress();
      stage.innerHTML = `<div class="ap-card" style="text-align:center;max-width:560px;margin:20px auto"><div class="ap-score">${S.score}<small> คะแนน</small></div><p>ถูกครบ <b>${S.ok}</b> / ${rounds} รอบ · streak สูงสุด <b>${S.best}</b>${newBest ? ' · 🏆 คะแนนสูงสุดใหม่!' : ` · สูงสุดเดิม ${g.best}`}</p>
        <div class="ap-row" style="justify-content:center"><button class="ap-btn pri" data-again>↻ เล่นอีกครั้ง</button><a class="ap-btn" href="#games">เลือกเกมอื่น</a></div></div>`;
      $('[data-again]', stage).onclick = () => AP.games.mount(meta.id, host);
    };
    AP.hooks.disposeGame = S.stopTimer;
    hud(); startRound(S);
    return S;
  }
  const fb = (el, ok, html) => { el.innerHTML = `<div class="ap-fb ${ok ? 'ok' : 'bad'}"><b>${ok ? '✓' : '✗'}</b> ${html}</div>`; };

  /* ============ 1) เติมตาราง DP ============ */
  const isNum = (s) => /^-?\d+(\.\d+)?$/.test(s);
  const normAns = (s) => String(s).trim().replace(/−/g, '-').replace(/infinity|inf|∞/i, '∞');
  const dpTypes = {
    coinrow: () => { const C = Array.from({ length: 6 }, () => rnd(1, 9)); const r = E().coinRow(C); return { title: 'Coin-row', input: `เหรียญ C = [${C.join(', ')}] (เลือกได้ แต่ห้ามติดกัน)`, rec: 'F(i) = max{Cᵢ + F(i−2), F(i−1)}', ch: 'coinrow', steps: r.steps, row: 1, minC: 2 }; },
    change: () => { const D = pick([[1, 3, 4], [1, 5, 7], [1, 2, 5], [1, 4, 6], [1, 3, 5]]); const n = rnd(7, 11); const r = E().changeMaking(D, n); return { title: 'Change-making', input: `ชนิดเหรียญ D = {${D.join(', ')}} · ยอดที่ต้องแลก n = ${n} (F = จำนวนเหรียญน้อยสุด)`, rec: 'F(i) = min{F(i − dⱼ)} + 1', ch: 'change', steps: r.steps, row: 0, minC: 2 }; },
    knap: () => { const n = 4, w = [], v = []; for (let i = 0; i < n; i++) { w.push(rnd(1, 4)); v.push(rnd(2, 9) * 5); } const W = rnd(5, 7); const r = E().knapsack(w, v, W); return { title: 'Knapsack 0/1', input: `น้ำหนัก w = [${w}] · มูลค่า v = [${v}] · ความจุ W = ${W}`, rec: 'F(i, j) = max{F(i−1, j), vᵢ + F(i−1, j−wᵢ)} (ถ้า j ≥ wᵢ)', ch: 'knap', steps: r.steps, minR: 1, minC: 1, all: true }; },
    collect: () => { const n = 4, m = 5, C = Array.from({ length: n }, () => Array.from({ length: m }, () => (Math.random() < 0.45 ? 1 : 0))); const r = E().coinCollect(C); return { title: 'Coin-collection', input: `กระดาน (● = มีเหรียญ):<div class="ap-mini-grid">${C.map((row) => `<div>${row.map((x) => `<i class="${x ? 'c' : ''}"></i>`).join('')}</div>`).join('')}</div>เดินได้เฉพาะขวา/ลง จากมุมซ้ายบน`, rec: 'F(i, j) = max{F(i−1, j), F(i, j−1)} + Cᵢⱼ', ch: 'collect', steps: r.steps, minR: 0, minC: 0, all: true }; },
    floyd: () => { const n = 4, L = 'abcd', W = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : (Math.random() < 0.6 ? rnd(1, 9) : INF)))); for (let i = 0; i < n; i++) W[i][(i + 1) % n] = W[i][(i + 1) % n] === INF ? rnd(1, 9) : W[i][(i + 1) % n]; const r = E().floyd(W); return { title: 'Floyd', input: `เมทริกซ์น้ำหนัก W (แถว → คอลัมน์, ∞ = ไม่มีเส้น):<div class="ap-mini-tab">${W.map((row, i) => `${L[i]}: ` + row.map((x) => (x === INF ? '∞' : x)).join('  ')).join('<br>')}</div>`, rec: 'D(k)[i,j] = min{D(k−1)[i,j], D(k−1)[i,k] + D(k−1)[k,j]}', ch: 'floyd', steps: r.steps, offDiag: true, finiteOnly: true }; },
    warshall: () => { const n = 4, L = 'abcd', A = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i !== j && Math.random() < 0.3 ? 1 : 0))); const r = E().warshall(A); return { title: 'Warshall', input: `เมทริกซ์ความสัมพันธ์ A (1 = มีเส้นตรง):<div class="ap-mini-tab">${A.map((row, i) => `${L[i]}: ` + row.join('  ')).join('<br>')}</div>`, rec: 'R(k)[i,j] = R(k−1)[i,j] หรือ (R(k−1)[i,k] และ R(k−1)[k,j])', ch: 'warshall', steps: r.steps, offDiag: true }; },
  };
  function gameDpFill(host) {
    Session(host, { id: 'dpfill', icon: '🧮', title: 'เติมตาราง DP แข่งเวลา', how: 'สุ่มโจทย์จาก Week 8 แล้วกรอกช่องที่เป็นช่องว่างให้ครบ ตอบถูกครบและเร็วได้คะแนนเพิ่ม (5 รอบ)' }, 5, (S) => {
      const T = pick(Object.values(dpTypes))();
      const last = T.steps[T.steps.length - 1], tab = last.tables[0], cells = [];
      tab.cells.forEach((row, r) => row.forEach((c, k) => {
        if (T.row !== undefined && r !== T.row) return;
        if (T.minR !== undefined && r < T.minR) return;
        if (T.minC !== undefined && k < T.minC) return;
        if (T.offDiag && r === k) return;
        if (c.t === '' || c.t === undefined) return;
        if (T.finiteOnly && c.t === '∞') return;
        cells.push([r, k]);
      }));
      const chosen = new Set(shuffle(cells).slice(0, Math.min(T.offDiag ? 3 : 4, cells.length)).map(([r, c]) => r + ',' + c));
      const stripLab = (s) => String(s);
      S.stage.innerHTML = `<div class="ap-card"><div class="ap-eyebrow">${T.title}</div><p class="ap-gin">${T.input}</p><p class="ap-small ap-muted">สูตร: <span class="ap-mono">${T.rec}</span></p>
        <div class="ap-tscroll"><table class="ap-dpt ap-gtab"><thead><tr><th>${tab.corner && tab.corner !== 'index' ? tab.corner : ''}</th>${tab.cols.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${tab.cells.map((row, r) => `<tr><th>${tab.rows[r]}</th>${row.map((c, k) => (chosen.has(r + ',' + k) ? `<td class="blank"><input inputmode="decimal" data-r="${r}" data-c="${k}" aria-label="ช่องแถว ${r + 1} คอลัมน์ ${k + 1}" autocomplete="off"></td>` : `<td class="${/coin/.test(c.c) ? 'coin' : ''}">${stripLab(c.t)}</td>`)).join('')}</tr>`).join('')}</tbody></table></div>
        <div class="ap-row" style="margin-top:12px"><button class="ap-btn pri" data-check>ตรวจคำตอบ</button><button class="ap-btn" data-hint>💡 ดูสูตรอ้างอิงช่องแรก</button></div><div class="ap-gfb"></div></div>`;
      S.startTimer(); const first = $('.blank input', S.stage); if (first) first.focus();
      let done = false;
      S.stage.onclick = (e) => {
        if (e.target.closest('[data-hint]')) { AP.toast('ดูจากช่องที่อยู่ซ้าย/บนของช่องนั้นแล้วแทนในสูตร'); return; }
        if (e.target.closest('[data-next]')) { S.next(); return; }
        if (!e.target.closest('[data-check]') || done) return;
        done = true; S.stopTimer(); let ok = 0, tot = 0;
        $$('.blank input', S.stage).forEach((inp) => { const c = tab.cells[+inp.dataset.r][+inp.dataset.c], right = normAns(c.t) === normAns(inp.value) || (isNum(normAns(inp.value)) && isNum(c.t) && Math.abs(+inp.value - +c.t) < 1e-9); tot++; if (right) ok++; inp.disabled = true; inp.parentNode.classList.add(right ? 'right' : 'wrong'); if (!right) inp.parentNode.insertAdjacentHTML('beforeend', `<span class="ans">${c.t}</span>`); });
        const pts = S.award(100 * ok / tot, ok === tot, 60 - S.elapsed());
        fb($('.ap-gfb', S.stage), ok === tot, `ถูก ${ok}/${tot} ช่อง · +${pts} คะแนน${ok === tot ? '' : ' · ช่องที่ผิดแสดงคำตอบที่ถูกไว้แล้ว'} <button class="ap-btn pri sm" data-next style="margin-left:10px">${S.round + 1 >= S.rounds ? 'ดูผล' : 'รอบถัดไป →'}</button>`);
      };
      S.stage.onkeydown = (e) => { if (e.key === 'Enter' && e.target.matches('.blank input')) { const all = $$('.blank input', S.stage), i = all.indexOf(e.target); if (i < all.length - 1) all[i + 1].focus(); else $('[data-check]', S.stage).click(); } };
    });
  }

  /* ============ 2) เล่นเป็นอัลกอริทึม ============ */
  function gameAlgo(host) {
    const st = { algo: AP.store.get('algoPick', 'prim') };
    const meta = { id: 'algo', icon: '🕹️', title: 'เล่นเป็นอัลกอริทึม', how: 'คลิก <b>เส้น</b> (Prim, Kruskal) หรือ <b>โหนด</b> (Dijkstra) ที่อัลกอริทึมจะเลือกเป็นลำดับถัดไป ถ้าผิดจะบอกเหตุผล (3 กราฟ)' };
    Session(host, meta, 3, (S) => {
      const g = AP.gr.randomGraph(6), V = g.nodes.map((n) => n.id), pos = {}; g.nodes.forEach((n) => { pos[n.id] = n; });
      const algo = st.algo, edgeName = (e) => `${e.u}–${e.v}`;
      const state = { inT: new Set(['a']), acc: new Set(), off: new Set(), fin: new Set(), d: {}, moves: 0, wrong: 0, comp: {} };
      V.forEach((v) => { state.d[v] = v === 'a' ? 0 : INF; state.comp[v] = v; });
      const other = (e, v) => (e.u === v ? e.v : e.u);
      const same = (u, v) => state.comp[u] === state.comp[v];
      const merge = (u, v) => { const a = state.comp[u], b = state.comp[v]; V.forEach((x) => { if (state.comp[x] === b) state.comp[x] = a; }); };
      const need = algo === 'dijkstra' ? V.length - 1 : V.length - 1;
      S.stage.innerHTML = `<div class="ap-card"><div class="ap-sub" role="group" aria-label="อัลกอริทึม">${[['prim', 'Prim (เริ่มที่ a)'], ['kruskal', 'Kruskal'], ['dijkstra', 'Dijkstra (ต้นทาง a)']].map(([k, l]) => `<button type="button" data-al="${k}" aria-pressed="${k === algo}">${l}</button>`).join('')}</div>
        <p class="ap-gask"></p><svg class="ap-ag" viewBox="0 0 520 330" role="img" aria-label="กราฟ"></svg><div class="ap-gfb" aria-live="polite"></div></div>`;
      const svg = $('.ap-ag', S.stage), ask = $('.ap-gask', S.stage), out = $('.ap-gfb', S.stage);
      const label = { prim: 'คลิก <b>เส้น</b> ที่ Prim จะเพิ่มเข้าต้นไม้เป็นลำดับถัดไป (เส้นที่เบาที่สุดที่ต่อจากต้นไม้ไปโหนดนอกต้นไม้)', kruskal: 'คลิก <b>เส้น</b> ที่ Kruskal จะรับเป็นลำดับถัดไป (เส้นที่เบาที่สุดที่ไม่ทำให้เกิดวงจร)', dijkstra: 'คลิก <b>โหนด</b> ที่ Dijkstra จะเลือกเป็นลำดับถัดไป (โหนดที่ d น้อยที่สุดในบรรดาที่ยังไม่ถูกเลือก) ตัวเลขข้างโหนดคือค่า d ตอนนี้' };
      function draw() {
        svg.innerHTML = '';
        g.edges.forEach((e, i) => {
          const a = pos[e.u], b = pos[e.v], t = e.t == null ? 0.5 : e.t, x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
          const cls = state.acc.has(i) ? 'acc' : state.off.has(i) ? 'off' : '';
          const gg = svgEl('g', { class: 'ag-e ' + cls, 'data-e': i, tabindex: algo === 'dijkstra' ? -1 : 0, role: algo === 'dijkstra' ? 'presentation' : 'button', 'aria-label': `เส้น ${edgeName(e)} น้ำหนัก ${e.w}` });
          gg.appendChild(svgEl('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'hit' })); gg.appendChild(svgEl('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'ln' }));
          gg.appendChild(svgEl('circle', { cx: x, cy: y, r: 11, class: 'wbg' })); const tx = svgEl('text', { x, y: y + 4, 'text-anchor': 'middle', class: 'wt' }); tx.textContent = e.w; gg.appendChild(tx); svg.appendChild(gg);
        });
        g.nodes.forEach((n) => {
          const inTree = algo === 'prim' ? state.inT.has(n.id) : algo === 'dijkstra' ? state.fin.has(n.id) : false;
          const gn = svgEl('g', { class: 'ag-n' + (inTree ? ' in' : '') + (n.id === 'a' ? ' src' : ''), transform: `translate(${n.x},${n.y})`, 'data-n': n.id, tabindex: algo === 'dijkstra' ? 0 : -1, role: algo === 'dijkstra' ? 'button' : 'presentation', 'aria-label': `โหนด ${n.id}` });
          gn.appendChild(svgEl('circle', { r: 20 })); const t = svgEl('text', { y: 5, 'text-anchor': 'middle' }); t.textContent = n.id; gn.appendChild(t);
          if (algo === 'dijkstra') { const dt = svgEl('text', { y: -27, 'text-anchor': 'middle', class: 'dv' }); dt.textContent = 'd=' + (state.d[n.id] === INF ? '∞' : state.d[n.id]); gn.appendChild(dt); }
          svg.appendChild(gn);
        });
      }
      function relax(id) { g.edges.forEach((e) => { if (e.u === id || e.v === id) { const v = other(e, id); if (!state.fin.has(v) && state.d[id] + e.w < state.d[v]) state.d[v] = state.d[id] + e.w; } }); }
      function wrong(msg) { state.wrong++; S.streak = 0; $('.h-k', host).textContent = 0; fb(out, false, msg); }
      function progress() { return algo === 'dijkstra' ? state.fin.size : state.acc.size; }
      function finishGraph() {
        S.stopTimer(); const acc = state.moves ? state.moves / (state.moves + state.wrong) : 0, allOk = state.wrong === 0;
        const total = algo === 'dijkstra' ? '' : ` น้ำหนักรวม MST = <b>${[...state.acc].reduce((s, i) => s + g.edges[i].w, 0)}</b>`;
        const pts = S.award(100 * acc, allOk, 60 - S.elapsed());
        fb(out, allOk, `${allOk ? 'ถูกทุกขั้น!' : `ผิด ${state.wrong} ครั้ง`}${total} · +${pts} คะแนน <button class="ap-btn pri sm" data-next style="margin-left:10px">${S.round + 1 >= S.rounds ? 'ดูผล' : 'กราฟถัดไป →'}</button>`);
        ask.innerHTML = '<b>เสร็จแล้ว</b>';
      }
      function clickEdge(i) {
        const e = g.edges[i]; if (progress() >= need) return;
        if (state.acc.has(i)) return; if (state.off.has(i)) return fb(out, false, `เส้น ${edgeName(e)} ถูกปฏิเสธไปแล้วเพราะจะเกิดวงจร (แสดงเป็นเส้นประ)`);
        if (algo === 'prim') {
          const cross = g.edges.map((x, k) => k).filter((k) => state.inT.has(g.edges[k].u) !== state.inT.has(g.edges[k].v)), mn = Math.min(...cross.map((k) => g.edges[k].w));
          if (!cross.includes(i)) return wrong(state.inT.has(e.u) && state.inT.has(e.v) ? `เส้น ${edgeName(e)} เชื่อมโหนดที่อยู่ในต้นไม้แล้วทั้งคู่ จะเกิดวงจร Prim ไม่เลือก` : `เส้น ${edgeName(e)} ยังไม่ต่อกับต้นไม้ (Prim ขยายจากต้นไม้เดิมเท่านั้น)`);
          if (e.w > mn) { const b = g.edges[cross.find((k) => g.edges[k].w === mn)]; return wrong(`เส้น ${edgeName(e)} หนัก ${e.w} แต่ยังมีเส้น ${edgeName(b)} หนัก <b>${mn}</b> ที่ต่อจากต้นไม้ได้และเบากว่า`); }
          state.acc.add(i); state.inT.add(state.inT.has(e.u) ? e.v : e.u);
        } else {
          if (same(e.u, e.v)) return wrong(`เส้น ${edgeName(e)} เชื่อมสองโหนดที่อยู่กลุ่มเดียวกันแล้ว ถ้ารับจะเกิด<b>วงจร</b> — Kruskal ปฏิเสธ`);
          const cand = g.edges.map((x, k) => k).filter((k) => !state.acc.has(k) && !state.off.has(k) && !same(g.edges[k].u, g.edges[k].v)), mn = Math.min(...cand.map((k) => g.edges[k].w));
          if (e.w > mn) { const b = g.edges[cand.find((k) => g.edges[k].w === mn)]; return wrong(`เส้น ${edgeName(e)} หนัก ${e.w} แต่ยังมีเส้น ${edgeName(b)} หนัก <b>${mn}</b> ที่เบากว่าและไม่ทำให้เกิดวงจร (Kruskal ไล่จากเบาไปหนัก)`); }
          state.acc.add(i); merge(e.u, e.v);
          g.edges.forEach((x, k) => { if (!state.acc.has(k) && same(x.u, x.v)) state.off.add(k); });
        }
        state.moves++; S.streak++; $('.h-k', host).textContent = S.streak; fb(out, true, `รับเส้น ${edgeName(e)} (น้ำหนัก ${e.w}) ถูกต้อง`); draw(); if (progress() >= need) finishGraph();
      }
      function clickNode(id) {
        if (state.fin.has(id) || progress() >= need + 1) return;
        const rest = V.filter((v) => !state.fin.has(v)), mn = Math.min(...rest.map((v) => state.d[v]));
        if (state.d[id] === INF) return wrong(`โหนด ${id} ยังไปไม่ถึงจากโหนดที่เลือกแล้ว (d = ∞)`);
        if (state.d[id] > mn) { const b = rest.find((v) => state.d[v] === mn); return wrong(`โหนด ${id} มี d = ${state.d[id]} แต่โหนด <b>${b}</b> มี d = <b>${mn}</b> ซึ่งน้อยกว่า Dijkstra เลือกโหนดที่ d น้อยที่สุดก่อน`); }
        state.fin.add(id); relax(id);
        state.moves++; S.streak++; $('.h-k', host).textContent = S.streak; fb(out, true, `เลือกโหนด ${id} (d = ${state.d[id]}) ถูกต้อง — ค่านี้ถือว่าสุดท้ายแล้ว และปรับค่า d ของเพื่อนบ้าน`); draw();
        if (state.fin.size >= V.length) finishGraph();
      }
      if (algo === 'dijkstra') { state.fin.add('a'); relax('a'); }
      ask.innerHTML = label[algo]; draw(); S.startTimer();
      svg.onclick = (e) => { const ge = e.target.closest('[data-e]'), gn = e.target.closest('[data-n]'); if (algo === 'dijkstra') { if (gn) clickNode(gn.dataset.n); } else if (ge) clickEdge(+ge.dataset.e); };
      svg.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { const ge = e.target.closest('[data-e]'), gn = e.target.closest('[data-n]'); if (algo === 'dijkstra' && gn) { e.preventDefault(); clickNode(gn.dataset.n); } else if (ge && algo !== 'dijkstra') { e.preventDefault(); clickEdge(+ge.dataset.e); } } };
      S.stage.onclick = (e) => {
        const a = e.target.closest('[data-al]'); if (a) { st.algo = a.dataset.al; AP.store.set('algoPick', st.algo); S.stopTimer(); S.round--; S.next(); return; }
        if (e.target.closest('[data-next]')) S.next();
      };
    });
  }

  /* ============ 3) จับคู่ Flashcard ============ */
  function cards() {
    const dp = AP.dp8.CH.map((c) => ({ name: c.short, rec: c.cheat.rec, time: c.cheat.time, use: c.cheat.use }));
    const ex = [
      { name: 'Unbounded Knapsack', rec: 'F(j) = max{F(j−wᵢ) + vᵢ}', time: 'Θ(nW)', use: 'หยิบของชนิดเดิมซ้ำได้' }, { name: 'Subset Sum', rec: 'F(i,j) = F(i−1,j) ∨ F(i−1,j−sᵢ)', time: 'Θ(nT)', use: 'มีเซตย่อยที่รวมได้ T ไหม' },
      { name: 'Matrix Chain', rec: 'm[i][j] = min{m[i][k] + m[k+1][j] + pᵢ₋₁pₖpⱼ}', time: 'Θ(n³) เวลา', use: 'จัดวงเล็บคูณเมทริกซ์' }, { name: 'LCS', rec: 'ตรงกัน: L[i−1][j−1]+1 · ไม่ตรง: max(บน, ซ้าย)', time: 'Θ(mn)', use: 'ลำดับย่อยร่วมที่ยาวที่สุด' },
      { name: 'Prim', rec: 'เลือกเส้นเบาสุดที่ต่อจากต้นไม้ออกไป', time: 'O(|E| log |V|) ด้วย heap', use: 'สร้าง MST โดยขยายต้นไม้ทีละโหนด' }, { name: 'Kruskal', rec: 'เรียงเส้น รับถ้าไม่เกิดวงจร', time: 'O(|E| log |E|)', use: 'สร้าง MST ด้วย Union-Find' },
      { name: 'Dijkstra', rec: 'เลือกโหนดที่ d น้อยสุด แล้วผ่อนคลายเส้น', time: 'Θ(|V|²) ด้วย array', use: 'เส้นทางสั้นสุดจากต้นทางเดียว (ไม่ติดลบ)' }, { name: 'Huffman', rec: 'รวม 2 ความถี่น้อยสุดซ้ำ', time: 'O(n log n)', use: 'เข้ารหัสแบบ prefix-free ให้ประหยัดบิต' },
      { name: 'Comparison Counting', rec: 'Count[i] = จำนวนตัวที่น้อยกว่า A[i] → ตำแหน่งใน S', time: 'Θ(n²)', use: 'เรียงโดยนับตัวที่น้อยกว่า (Space and Time)' }, { name: 'Distribution Counting', rec: 'นับความถี่ → สะสม → วางจากขวาไปซ้าย', time: 'Θ(n) เมื่อช่วงค่าจำกัด', use: 'เรียงตัวเลขช่วง l..u ที่ซ้ำได้' },
      { name: 'Horspool', rec: 'Table[P[j]] = m−1−j (j = 0..m−2)', time: 'เฉลี่ยดี แย่สุด Θ(nm)', use: 'หา pattern ในข้อความด้วยตารางเลื่อนตารางเดียว' }, { name: 'Boyer-Moore', rec: 'd = max{d₁, d₂} เมื่อ k > 0', time: 'มี bad-symbol + good-suffix', use: 'หา pattern โดยเลื่อนไกลกว่า Horspool' },
      { name: 'Hashing', rec: 'แปลงคีย์เป็นที่อยู่ ชนแก้ด้วย chaining/probing', time: 'ค้นหาเฉลี่ย Θ(1)', use: 'ค้นหา/แทรกเร็วด้วยตารางแฮช' }, { name: 'B-Tree', rec: 'โหนดหลายคีย์ เต็มแล้ว split ดันค่ากลางขึ้น', time: 'Θ(log n) การเข้าดิสก์', use: 'index ในฐานข้อมูล' },
      { name: 'Activity Selection', rec: 'เรียงตามเวลาจบ เลือกงานที่ไม่ชน', time: 'O(n log n)', use: 'เลือกงานได้มากที่สุดโดยไม่ซ้อนเวลา' }, { name: 'Fractional Knapsack', rec: 'เรียงตาม value/weight', time: 'O(n log n)', use: 'ของแบ่งได้ ได้มูลค่าสูงสุดเสมอ' },
    ];
    return dp.concat(ex);
  }
  function gameMatch(host) {
    Session(host, { id: 'match', icon: '🃏', title: 'จับคู่ Flashcard', how: 'คลิกชื่ออัลกอริทึมทางซ้าย แล้วคลิกคำอธิบายที่ตรงกันทางขวา (3 ชุด ชุดละ 5 คู่ โจทย์คือสูตร ความซับซ้อน หรือการใช้งาน)' }, 3, (S) => {
      const all = cards(); let attr, items;
      for (let tries = 0; tries < 30; tries++) { attr = pick(['rec', 'time', 'use']); const seen = new Set(); items = shuffle(all).filter((c) => { if (seen.has(c[attr])) return false; seen.add(c[attr]); return true; }).slice(0, 5); if (items.length === 5) break; }
      if (items.length < 5) { attr = 'use'; items = shuffle(all).slice(0, 5); }
      const title = { rec: 'สูตร / หลักการเลือก', time: 'ความซับซ้อนของเวลา', use: 'ใช้แก้ปัญหาอะไร' }[attr];
      const right = shuffle(items);
      S.stage.innerHTML = `<div class="ap-card"><p class="ap-gask">จับคู่ชื่อ ↔ <b>${title}</b></p><div class="ap-match"><div class="col">${items.map((c, i) => `<button class="ap-mc" data-l="${i}">${esc(c.name)}</button>`).join('')}</div><div class="col">${right.map((c) => `<button class="ap-mc r" data-r="${items.indexOf(c)}">${esc(c[attr])}</button>`).join('')}</div></div><div class="ap-gfb" aria-live="polite"></div></div>`;
      S.startTimer(); let sel = null, matched = 0, wrongs = 0; const out = $('.ap-gfb', S.stage);
      S.stage.onclick = (e) => {
        if (e.target.closest('[data-next]')) { S.next(); return; }
        const b = e.target.closest('.ap-mc'); if (!b || b.disabled) return;
        if (b.dataset.l !== undefined) { $$('.ap-mc[data-l]', S.stage).forEach((x) => x.classList.remove('sel')); sel = b; b.classList.add('sel'); return; }
        if (!sel) { fb(out, false, 'เลือกชื่อทางซ้ายก่อน'); return; }
        if (sel.dataset.l === b.dataset.r) { sel.disabled = b.disabled = true; sel.classList.remove('sel'); sel.classList.add('done'); b.classList.add('done'); sel = null; matched++; fb(out, true, 'ถูกคู่'); if (matched === 5) { S.stopTimer(); const pts = S.award(100 - wrongs * 15, wrongs === 0, 60 - S.elapsed()); fb(out, wrongs === 0, `จับคู่ครบ · ผิด ${wrongs} ครั้ง · +${pts} คะแนน <button class="ap-btn pri sm" data-next style="margin-left:10px">${S.round + 1 >= S.rounds ? 'ดูผล' : 'ชุดถัดไป →'}</button>`); } }
        else { wrongs++; S.streak = 0; $('.h-k', host).textContent = 0; b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 400); fb(out, false, 'ไม่ใช่คู่นี้ ลองใหม่'); }
      };
    });
  }

  /* ============ 4) Greedy ได้ optimal ไหม? ============ */
  function knapBest(items, cap) { const F = Array(cap + 1).fill(0); items.forEach(([v, w]) => { for (let j = cap; j >= w; j--) F[j] = Math.max(F[j], F[j - w] + v); }); return F[cap]; }
  function genCoin() {
    const pools = [[1, 5, 10, 25], [1, 2, 5, 10], [1, 5, 10, 20], [1, 3, 4], [1, 5, 6], [1, 4, 5], [1, 7, 10], [1, 6, 10], [1, 3, 5, 6], [1, 2, 4, 5, 10]];
    const coins = pick(pools), amount = rnd(6, 42), gr = []; let a = amount; coins.slice().sort((x, y) => y - x).forEach((c) => { while (a >= c) { gr.push(c); a -= c; } });
    const dp = AP.gr.coinDP(coins, amount);
    return { kind: 'coin', title: 'ทอนเหรียญ', text: `ชุดเหรียญ {${coins.join(', ')}} ทอนเงิน ${amount} บาท ด้วยวิธี "ใช้เหรียญใหญ่สุดก่อน"`, greedy: `Greedy: ${gr.join(' + ')} = <b>${gr.length}</b> เหรียญ`, best: `DP (ดีที่สุด): ${dp.list.join(' + ')} = <b>${dp.count}</b> เหรียญ`, optimal: gr.length === dp.count, why: gr.length === dp.count ? 'ชุดเหรียญนี้ Greedy ให้ผลดีที่สุดในยอดนี้ (ทดลองยอดอื่นอาจต่างได้ ถ้าไม่ใช่ canonical)' : 'ชุดเหรียญนี้ไม่ใช่ canonical: เหรียญใหญ่แทนด้วยเหรียญเล็กไม่ลงตัว Greedy จึงพลาด' };
  }
  function genKnap() {
    const items = Array.from({ length: 4 }, () => [rnd(2, 12) * 5, rnd(2, 9)]), cap = rnd(8, 16);
    const ord = items.map((it, i) => i).sort((a, b) => items[b][0] / items[b][1] - items[a][0] / items[a][1]); let w = 0, v = 0; const ch = [];
    ord.forEach((i) => { if (w + items[i][1] <= cap) { w += items[i][1]; v += items[i][0]; ch.push(i + 1); } });
    const best = knapBest(items, cap);
    return { kind: 'knap', title: 'Knapsack 0/1 (ห้ามหั่นของ)', text: `ของ (มูลค่า, น้ำหนัก): ${items.map((x, i) => `#${i + 1}(${x[0]},${x[1]})`).join(' ')} · ความจุ ${cap} · เลือกตาม value/weight มากไปน้อย ใส่ได้ก็ใส่`, greedy: `Greedy: ชิ้น ${ch.join(', ')} มูลค่า <b>${v}</b>`, best: `DP (ดีที่สุด): มูลค่า <b>${best}</b>`, optimal: v === best, why: v === best ? 'บังเอิญได้ดีที่สุด แต่ 0/1 knapsack ไม่มีหลักประกัน — ต้องใช้ DP' : 'ห้ามหั่นของ จึงมีที่ว่างเหลือที่ Greedy เติมไม่ได้ (0/1 ต้องใช้ DP)' };
  }
  function genFrac() {
    const items = Array.from({ length: 4 }, () => [rnd(2, 12) * 5, rnd(2, 9)]), cap = rnd(8, 16);
    const ord = items.slice().sort((a, b) => b[0] / b[1] - a[0] / a[1]); let c = cap, v = 0; ord.forEach(([val, w]) => { const t = Math.min(c, w); v += val * t / w; c -= t; });
    return { kind: 'frac', title: 'Fractional Knapsack (หั่นของได้)', text: `ของ (มูลค่า, น้ำหนัก): ${items.map((x, i) => `#${i + 1}(${x[0]},${x[1]})`).join(' ')} · ความจุ ${cap} · เลือกตาม value/weight มากไปน้อย ใส่ไม่พอก็หั่นส่วนที่เหลือ`, greedy: `Greedy: มูลค่า <b>${+v.toFixed(2)}</b>`, best: 'ที่ดีที่สุดเท่ากัน (พิสูจน์ด้วย exchange argument)', optimal: true, why: 'แบ่งของได้ → น้ำหนัก 1 หน่วยมีค่าเท่ากัน เติมหน่วยที่คุ้มสุดก่อนไม่มีทางแย่กว่า' };
  }
  function genAct() {
    const key = pick(['finish', 'start', 'short']), n = 6; const acts = Array.from({ length: n }, () => { const s = rnd(0, 9); return [s, s + rnd(1, 5)]; });
    const ok = (a, ch) => ch.every((c) => a[1] <= c[0] || a[0] >= c[1]);
    const run = (cmp) => { const ch = []; acts.slice().sort(cmp).forEach((a) => { if (ok(a, ch)) ch.push(a); }); return ch; };
    const cmps = { finish: (a, b) => a[1] - b[1] || a[0] - b[0], start: (a, b) => a[0] - b[0] || a[1] - b[1], short: (a, b) => (a[1] - a[0]) - (b[1] - b[0]) || a[0] - b[0] };
    const g = run(cmps[key]), best = run(cmps.finish), name = { finish: 'จบเร็วสุดก่อน', start: 'เริ่มก่อนสุดก่อน', short: 'ระยะเวลาสั้นสุดก่อน' }[key];
    return { kind: 'act', title: 'Activity Selection', text: `งาน (start, end): ${acts.map((a) => `(${a})`).join(' ')} · เลือกงานโดยเรียงตามเกณฑ์ <b>${name}</b> แล้วรับถ้าไม่ชน`, greedy: `Greedy: ${g.map((a) => `(${a})`).join(' ')} = <b>${g.length}</b> งาน`, best: `ที่ดีที่สุด (เรียงตามเวลาจบ): <b>${best.length}</b> งาน`, optimal: g.length === best.length, why: key === 'finish' ? 'เรียงตามเวลาจบพิสูจน์แล้วว่า optimal เสมอ' : g.length === best.length ? `ชุดนี้บังเอิญได้เท่ากัน แต่เกณฑ์ "${name}" ไม่การันตี` : `เกณฑ์ "${name}" มี counter-example จึงได้น้อยกว่า` };
  }
  function gameGreedy(host) {
    Session(host, { id: 'greedy', icon: '🤔', title: 'Greedy ได้ optimal ไหม?', how: 'ดูโจทย์แล้วทายว่าวิธี Greedy ที่ให้มาได้คำตอบดีที่สุดหรือไม่ จากนั้นดูเฉลยเทียบกับ DP/วิธีที่ถูก (6 รอบ)' }, 6, (S) => {
      const gens = [genCoin, genCoin, genKnap, genFrac, genAct, genAct], want = Math.random() < 0.5; let P;
      for (let t = 0; t < 40; t++) { P = pick(gens)(); if (P.optimal === want) break; }
      S.stage.innerHTML = `<div class="ap-card"><div class="ap-eyebrow">${P.title}</div><p class="ap-gin">${P.text}</p><p class="ap-gask"><b>Greedy ได้คำตอบที่ดีที่สุดในกรณีนี้หรือไม่?</b></p><div class="ap-row"><button class="ap-btn pri" data-a="1">✓ ใช่ optimal</button><button class="ap-btn" data-a="0">✗ ไม่ใช่</button></div><div class="ap-gfb"></div></div>`;
      S.startTimer(); let done = false;
      S.stage.onclick = (e) => {
        if (e.target.closest('[data-next]')) { S.next(); return; }
        const b = e.target.closest('[data-a]'); if (!b || done) return; done = true; S.stopTimer();
        const ok = (b.dataset.a === '1') === P.optimal, pts = S.award(ok ? 100 : 0, ok, 30 - S.elapsed());
        $$('[data-a]', S.stage).forEach((x) => { x.disabled = true; });
        fb($('.ap-gfb', S.stage), ok, `${ok ? 'ถูกต้อง' : 'ยังไม่ถูก'} · +${pts} คะแนน<div class="ap-why">${P.greedy}<br>${P.best}<br><span class="ap-muted">${P.why}</span></div><button class="ap-btn pri sm" data-next style="margin-top:10px">${S.round + 1 >= S.rounds ? 'ดูผล' : 'ข้อถัดไป →'}</button>`);
      };
    });
  }

  AP.games = {
    mount(id, host) {
      const g = { dpfill: gameDpFill, algo: gameAlgo, match: gameMatch, greedy: gameGreedy }[id];
      if (g) g(host); else host.innerHTML = '<p>ไม่พบเกมนี้</p>';
    },
  };
})();
