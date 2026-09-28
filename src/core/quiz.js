/* quiz.js — ควิซกลาง + โหมดสอบจำลอง
 * ทุกแหล่งถูกแปลงเป็นรูปแบบเดียว: {src, q(html), type:'mc'|'num', opts[](html), a(index) | ans(string), why(html), graph?}
 *   dp-week8: ch.quiz (บางข้อสุ่มโจทย์ใหม่ทุกครั้งด้วย gen)   dp-lab: p.quiz 3 ข้อ/ข้อ
 *   greedy-tutor: FIXED + สุ่มกราฟ   โจทย์ Greedy: AP.GP.QUIZ   เนื้อหาใหม่: AP.EXTRAQ[topicId] */
(function () {
  'use strict';
  const { esc, shuffle } = AP;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ---------- adapters ---------- */
  // ข้อเลือกตอบ: สลับตัวเลือกแล้วจำตำแหน่งข้อถูก (opts เป็น HTML แล้ว)
  function mc(o) {
    const idx = shuffle(o.opts.map((_, i) => i));
    return { src: o.src, q: o.q, type: 'mc', opts: idx.map((i) => o.opts[i]), a: idx.indexOf(o.a), why: o.why || '', graph: o.graph };
  }
  function fromDp8(id) {
    const ch = AP.dp8.byId(id); if (!ch) return [];
    return ch.quiz.map((q) => {
      const src = `Week 8 · ${ch.title}`;
      if (q.gen) {
        const g = q.gen();
        const vals = AP.dp8.makeChoices(g.answer, g.hints, 4);
        return { src, q: g.q, type: 'mc', opts: vals.map((v) => esc(AP.dp8.fmtV(v))), a: vals.findIndex((v) => AP.dp8.same(v, g.answer)), why: g.why || '' };
      }
      return mc({ src, q: q.q, opts: q.opts.map(esc), a: q.ans, why: q.why });
    });
  }
  function fromLab(n) {
    const p = AP.lab.byId(n); if (!p) return [];
    return p.quiz.map((q) => {
      const src = `DP Lab ข้อ ${n} · ${p.title}`;
      if (q.t === 'num') return { src, q: esc(q.q), type: 'num', ans: String(q.a), why: esc(q.why || '') };
      return mc({ src, q: esc(q.q), opts: q.o.map(esc), a: q.a, why: esc(q.why || '') });
    });
  }
  const grQ = (q, src) => mc({ src, q: q.q, opts: q.o.map((x) => esc(x)), a: q.a, why: esc(q.e || ''), graph: q.graph });
  function fromGr(tags) {
    if (!tags || !tags.length) return [];
    const keep = (q) => tags.includes(String(q.tag).replace(/^สุ่ม · /, ''));
    const fixed = AP.gr.FIXED.filter(keep).map((q) => grQ(q, `Greedy Tutor · ${q.tag}`));
    const rnd = AP.gr.randomQs().filter(keep).map((q) => Object.assign(grQ(q, `Greedy Tutor · ${q.tag}`), { fresh: true }));
    return fixed.concat(rnd);
  }
  function fromGp(n) {
    return AP.GP.QUIZ.filter((q) => q.n === n).map((q) => mc({ src: q.src, q: esc(q.q), opts: q.opts.map(esc), a: q.ans, why: esc(q.why) }));
  }
  const fromExtra = (id) => (AP.EXTRAQ && AP.EXTRAQ[id] || []).map((q) => (q.type === 'num' ? { src: q.src, q: q.q, type: 'num', ans: String(q.ans), why: q.why || '' } : mc({ src: q.src, q: q.q, opts: q.opts, a: q.a, why: q.why })));
  // ข้อสอบจริง (AP.REALEXAM): opts เป็นข้อความล้วน จึง escape ก่อนแสดง
  const realQ = (q) => (q.type === 'num'
    ? { src: q.src, q: esc(q.q), type: 'num', ans: q.ans, alt: q.alt, set: q.set, why: esc(q.why || ''), real: true }
    : Object.assign(mc({ src: q.src, q: esc(q.q), opts: q.opts.map(esc), a: q.a, why: esc(q.why || '') }), { real: true }));
  const fromReal = (id) => (AP.REALEXAM || []).filter((q) => q.topic === id).map(realQ);

  function forTopic(t) {
    const out = [];
    if (t.dp8) out.push(...fromDp8(t.dp8));
    t.lab.forEach((n) => out.push(...fromLab(n)));
    out.push(...fromGr(t.tags));
    t.gp.forEach((n) => out.push(...fromGp(n)));
    out.push(...fromExtra(t.id));
    out.push(...fromReal(t.id));
    out.forEach((q) => { q.topic = t.id; });
    return out;
  }
  const dedupe = (qs) => { const seen = new Set(); return qs.filter((q) => { const k = q.src + '|' + q.q.slice(0, 80); if (seen.has(k)) return false; seen.add(k); return true; }); };

  /* ---------- UI ---------- */
  const norm = (s) => String(s).trim().replace(/[,\s]/g, '').replace(/−/g, '-').replace(/infinity|inf/i, '∞');
  const toks = (s) => String(s).trim().toLowerCase().split(/\s+/).filter(Boolean).sort().join('|');
  const isRight = (q, v) => {
    if (q.type === 'mc') return v === q.a;
    const accepted = [q.ans].concat(q.alt || []);
    if (q.set) return accepted.some((x) => toks(x) === toks(v));
    return accepted.some((x) => {
      const a = norm(v).toLowerCase(), b = norm(x).toLowerCase(); if (a === b) return true;
      const p = parseFloat(a), r = parseFloat(b); return /^-?[\d.]+$/.test(a) && !isNaN(p) && !isNaN(r) && Math.abs(p - r) < 1e-9;
    });
  };
  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  /* cfg: {qs, key?, mode:'topic'|'exam', seconds?, onFinish?(score,total), again?()} */
  function mount(host, cfg) {
    const qs = cfg.qs, exam = cfg.mode === 'exam';
    let i = 0, score = 0, answered = false, t0 = Date.now(), timer = null, left = cfg.seconds || 0;
    const log = [];
    host.classList.add('ap-qz');
    function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
    function tick() {
      left = Math.max(0, cfg.seconds - Math.round((Date.now() - t0) / 1000));
      const el = $('.ap-qz-time', host); if (el) { el.textContent = '⏱ ' + fmtTime(left); el.classList.toggle('low', left <= 60); }
      if (!left) { stopTimer(); finish(true); }
    }
    function draw() {
      if (!qs.length) { host.innerHTML = '<div class="ap-note warn"><b class="h">ยังไม่มีข้อสอบในบทนี้</b></div>'; return; }
      const q = qs[i]; answered = false;
      host.innerHTML = `<div class="ap-qz-top"><span>ข้อ ${i + 1} / ${qs.length}</span><div class="ap-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${qs.length}" aria-valuenow="${i}"><i style="width:${i / qs.length * 100}%"></i></div>${cfg.seconds ? `<span class="ap-qz-time">⏱ ${fmtTime(left)}</span>` : `<span>ถูก ${score}</span>`}</div>
        <div class="ap-card"><div class="ap-qz-src">${esc(q.src)}</div><div class="ap-qz-q">${q.q}</div>${q.graph ? '<svg class="ap-qz-graph" viewBox="0 0 520 340" role="img" aria-label="กราฟประกอบโจทย์"></svg>' : ''}
        ${q.type === 'mc' ? `<div class="ap-opts">${q.opts.map((o, k) => `<button type="button" class="ap-opt" data-k="${k}">${o}</button>`).join('')}</div>`
          : '<form class="ap-num"><input inputmode="decimal" autocomplete="off" placeholder="พิมพ์คำตอบ (ตามรูปแบบในโจทย์)" aria-label="คำตอบ"><button class="ap-btn pri" type="submit">ตรวจ</button></form>'}
        <div class="ap-fb-slot" aria-live="polite"></div></div>`;
      if (q.graph) { const v = new AP.gr.GraphView($('.ap-qz-graph', host), q.graph, {}); v.update({ nodes: {}, edges: {} }, false); }
      const inp = $('.ap-num input', host); if (inp) inp.focus();
    }
    function answer(v) {
      if (answered) return; const q = qs[i];
      if (q.type === 'num' && !String(v).trim()) return;
      answered = true; const ok = isRight(q, v); if (ok) score++;
      log.push({ q, v, ok });
      if (exam) {
        $$('.ap-opt', host).forEach((b, k) => { b.disabled = true; if (k === v) b.classList.add('picked'); });
        const inp = $('.ap-num input', host); if (inp) inp.disabled = true;
        next(); return;
      }
      $$('.ap-opt', host).forEach((b, k) => { b.disabled = true; if (k === q.a) b.classList.add('right'); else if (k === v) b.classList.add('wrong'); });
      const inp = $('.ap-num input', host); if (inp) { inp.disabled = true; $('.ap-num button', host).disabled = true; }
      const last = i + 1 >= qs.length;
      $('.ap-fb-slot', host).innerHTML = `<div class="ap-fb ${ok ? 'ok' : 'bad'}"><b>${ok ? '✓ ถูกต้อง' : '✗ ยังไม่ถูก'}</b>${q.type === 'num' && !ok ? ` คำตอบที่ถูกคือ <b>${esc(q.ans)}</b>` : ''}${q.why ? `<div class="ap-why">${q.why}</div>` : ''}</div>
        <div class="ap-row" style="margin-top:12px"><button type="button" class="ap-btn pri" data-next>${last ? 'ดูผลคะแนน' : 'ข้อต่อไป →'}</button></div>`;
      const nb = $('[data-next]', host); if (nb) nb.focus();
    }
    function next() { i++; if (i >= qs.length) finish(false); else draw(); }
    function finish(timeout) {
      stopTimer(); const total = qs.length, ratio = total ? score / total : 0, passed = ratio >= 0.6;
      const wrong = log.filter((x) => !x.ok);
      const unanswered = total - log.length;
      if (cfg.key && !cfg.noSave) { AP.prog.quiz(cfg.key, ratio); AP.progress(); }
      if (cfg.onFinish) cfg.onFinish(score, total, Math.round((Date.now() - t0) / 1000));
      host.innerHTML = `<div class="ap-card" style="text-align:center"><div class="ap-score ${passed ? 'ok' : ''}">${score}<small> / ${total}</small></div>
        <p style="margin:8px 0 4px"><b>${Math.round(ratio * 100)}%</b> · ${passed ? '🎉 ผ่านเกณฑ์ 60%' : 'ยังไม่ถึงเกณฑ์ 60% ลองทำซ้ำได้เลย'}${timeout ? ' · หมดเวลา' : ''}${unanswered > 0 ? ` · ไม่ได้ตอบ ${unanswered} ข้อ` : ''}</p>
        <div class="ap-row" style="justify-content:center;margin-top:12px"><button type="button" class="ap-btn pri" data-again>↻ ทำใหม่${exam ? '' : ' (สุ่มข้อใหม่)'}</button>${cfg.extra ? cfg.extra() : ''}</div></div>
        ${wrong.length ? `<h3 class="ap-h3" style="margin-top:22px">ทบทวนข้อที่พลาด (${wrong.length})</h3><div class="ap-review">${wrong.map((x) => `<div class="ap-card"><div class="ap-qz-src">${esc(x.q.src)}</div><div>${x.q.q}</div><div class="ap-small" style="margin-top:6px">คำตอบที่ถูก: <b>${x.q.type === 'mc' ? x.q.opts[x.q.a] : esc(x.q.ans)}</b>${x.q.why ? `<br><span class="ap-muted">${x.q.why}</span>` : ''}</div></div>`).join('')}</div>` : ''}`;
    }
    host.onclick = (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.k !== undefined && b.classList.contains('ap-opt')) answer(+b.dataset.k);
      else if (b.hasAttribute('data-next')) next();
      else if (b.hasAttribute('data-again')) { if (cfg.again) cfg.again(); }
    };
    host.onsubmit = (e) => { e.preventDefault(); const inp = $('.ap-num input', host); if (inp) answer(inp.value); };
    if (cfg.seconds) { timer = setInterval(tick, 1000); }
    AP.hooks.disposeQuiz = stopTimer;
    draw();
    return { stop: stopTimer };
  }

  // ควิซประจำบท (หน้า "ควิซ")
  function mountTopic(host, t) {
    const run = () => {
      const qs = shuffle(dedupe(forTopic(t)));
      mount(host, { qs, key: t.id, mode: 'topic', again: run });
    };
    run();
  }

  /* ---------- สอบจำลอง ---------- */
  const EXAM_KEY = 'exam';
  function mountExam(host) {
    const sel = new Set(AP.store.get('examSel', AP.TOPICS.map((t) => t.id)));
    let count = AP.store.get('examN', 20), timed = AP.store.get('examTimed', true);
    const hist = () => AP.store.get(EXAM_KEY, []);
    function setup() {
      const parts = AP.PARTS.filter((p) => p.id < 4);
      const h = hist();
      host.innerHTML = `<div class="ap-thead"><span class="ap-eyebrow">ฝึกและทบทวน</span><h1 class="ap-h1">⏱ สอบจำลอง</h1><p class="ap-lede">สุ่มข้อสอบจากบทที่เลือก ตอบทุกข้อก่อนแล้วค่อยดูเฉลยและทบทวนข้อที่พลาดตอนจบ (ข้อ Week 8 บางข้อสุ่มตัวเลขใหม่ทุกครั้ง)</p></div>
        <div class="ap-card" style="max-width:860px"><h3 class="ap-h3">เลือกบทที่จะสอบ</h3>
        <div class="ap-row" style="margin-bottom:10px"><button class="ap-btn sm" data-all="1">เลือกทั้งหมด</button><button class="ap-btn sm" data-all="0">ล้าง</button>${parts.map((p) => `<button class="ap-btn sm" data-part="${p.id}">เฉพาะ Part ${p.id}</button>`).join('')}</div>
        ${parts.map((p) => `<fieldset class="ap-fs"><legend style="color:${p.color}">${p.title}</legend><div class="ap-checks">${AP.TOPICS.filter((t) => t.part === p.id).map((t) => `<label><input type="checkbox" data-t="${t.id}" ${sel.has(t.id) ? 'checked' : ''}> ${t.no} ${esc(t.short)}</label>`).join('')}</div></fieldset>`).join('')}
        <div class="ap-row" style="margin:16px 0;gap:18px"><label class="ap-field">จำนวนข้อ<select id="ex-n">${[10, 20, 30, 50].map((n) => `<option ${n === count ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
          <label class="ap-checks"><span><input type="checkbox" id="ex-timed" ${timed ? 'checked' : ''}> จับเวลา (ข้อละ ~1.2 นาที)</span></label></div>
        <button class="ap-btn pri" id="ex-go">▶ เริ่มสอบ</button> <span class="ap-muted ap-small" id="ex-avail"></span></div>
        ${h.length ? `<h3 class="ap-h3" style="margin-top:26px">ผลสอบล่าสุด</h3><div class="ap-tscroll" style="max-width:860px"><table class="ap-t"><thead><tr><th>ครั้งที่</th><th>คะแนน</th><th>จำนวนข้อ</th><th>เวลาที่ใช้</th></tr></thead><tbody>${h.slice().reverse().map((x, k) => `<tr><td>${h.length - k}</td><td><b>${x.s}</b> / ${x.t} (${Math.round(x.s / x.t * 100)}%)</td><td>${x.t}</td><td class="ap-mono">${fmtTime(x.sec)}</td></tr>`).join('')}</tbody></table></div>` : ''}`;
      const avail = () => { const n = dedupe(AP.TOPICS.filter((t) => sel.has(t.id)).flatMap(forTopic)).length; $('#ex-avail', host).textContent = `ข้อที่ใช้ได้ในบทที่เลือก ≈ ${n} ข้อ`; $('#ex-go', host).disabled = !n; };
      avail();
      host.onchange = (e) => {
        const t = e.target;
        if (t.dataset.t) { t.checked ? sel.add(t.dataset.t) : sel.delete(t.dataset.t); AP.store.set('examSel', [...sel]); avail(); }
        else if (t.id === 'ex-n') { count = +t.value; AP.store.set('examN', count); }
        else if (t.id === 'ex-timed') { timed = t.checked; AP.store.set('examTimed', timed); }
      };
      host.onclick = (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.all !== undefined) { sel.clear(); if (b.dataset.all === '1') AP.TOPICS.forEach((t) => sel.add(t.id)); AP.store.set('examSel', [...sel]); setup(); }
        else if (b.dataset.part) { sel.clear(); AP.TOPICS.filter((t) => t.part === +b.dataset.part).forEach((t) => sel.add(t.id)); AP.store.set('examSel', [...sel]); setup(); }
        else if (b.id === 'ex-go') start();
      };
    }
    function start() {
      // สุ่มแบบสลับบท เพื่อให้ข้อสอบกระจายทั่วทุกบทที่เลือก
      const per = AP.TOPICS.filter((t) => sel.has(t.id)).map((t) => shuffle(dedupe(forTopic(t))));
      const pool = []; let more = true;
      while (pool.length < count && more) { more = false; for (const arr of per) { if (arr.length && pool.length < count) { pool.push(arr.pop()); more = true; } } }
      const qs = shuffle(pool), seconds = timed ? Math.ceil(qs.length * 1.2) * 60 : 0;
      host.innerHTML = '<div class="qz-host"></div>';
      mount($('.qz-host', host), {
        qs, mode: 'exam', seconds, noSave: true, again: setup,
        onFinish: (s, t, sec) => { const h = hist(); h.push({ s, t, sec }); AP.store.set(EXAM_KEY, h.slice(-10)); AP.progress(); },
        extra: () => '<button type="button" class="ap-btn" id="ex-back">เลือกบทใหม่</button>',
      });
      host.onclick = (e) => { const b = e.target.closest('#ex-back'); if (b) setup(); };
      // mount() ตั้ง host.onclick ไว้ที่ .qz-host แล้ว ปุ่มด้านบนใช้ delegation ผ่าน host เดิม
    }
    setup();
  }

  // หน้า "ข้อสอบจริง": ทั้ง 25 ข้อตามลำดับเดิม ตอบทีละข้อพร้อมเฉลย
  function mountReal(host) {
    const qs = (AP.REALEXAM || []).map(realQ);
    host.innerHTML = `<div class="ap-thead"><span class="ap-eyebrow">ฝึกและทบทวน</span><h1 class="ap-h1">📝 ข้อสอบจริง: สอบเก็บคะแนนย่อยครั้งที่ 2 (algo 2569)</h1><p class="ap-lede">ข้อสอบ ${qs.length} ข้อที่นำมาเป็นแบบฝึก เรียงตามข้อสอบเดิม ตอบแล้วดูเฉลยและเหตุผลทีละข้อ ข้อที่ต้องพิมพ์คำตอบใช้รูปแบบตามโจทย์ ข้อสอบทุกข้อยังกระจายอยู่ในควิซของบทที่เกี่ยวข้องและในสอบจำลองด้วย</p></div><div class="qz-host"></div>`;
    const run = () => mount($('.qz-host', host), { qs: qs.map((q) => Object.assign({}, q)), mode: 'topic', noSave: true, again: run });
    run();
  }
  AP.quiz = { mountReal, forTopic, mountTopic, mountExam, mount, dedupe, fromDp8, fromLab, fromGr, fromGp };
})();
