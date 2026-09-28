/* app.js — router, เครื่องเล่นสเต็ป (Playground), โหมดฝึกทาย, quiz, ความคืบหน้า */
(function () {
  'use strict';
  const E = window.Engines, CH = window.CHAPTERS, INF = Infinity;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clone = (o) => JSON.parse(JSON.stringify(o, (k, v) => (v === Infinity ? '∞' : v)));
  const r6 = (x) => Math.round(x * 1e6) / 1e6;
  const same = (a, b) => a === b || Math.abs(a - b) < 1e-6;

  /* ---------- เก็บข้อมูลในเครื่อง (ใช้ไม่ได้ก็ไม่เป็นไร) ---------- */
  const store = AP.store.ns("dp8");
  let progress = store.get('progress', {});
  const saveProgress = () => store.set('progress', progress);
  const status = (id) => { const p = progress[id]; return !p ? 'new' : p.passed ? 'passed' : 'started'; };
  const STATUS_LABEL = { new: 'ยังไม่เริ่ม', started: 'กำลังเรียน', passed: 'ผ่านแล้ว' };

  /* ---------- ตัวเลือกปลอมสำหรับคำถามแบบเลือกตอบ ---------- */
  function makeChoices(answer, hints, count) {
    count = count || 4;
    const step = Number.isInteger(answer) || answer === INF ? 1 : 0.1;
    const seen = new Map();
    const add = (v) => { if (typeof v !== 'number' || Number.isNaN(v) || v < 0) return; const key = String(r6(v)); if (!seen.has(key)) seen.set(key, r6(v)); };
    add(answer);
    const distract = [];
    const push = (v) => { if (typeof v !== 'number' || Number.isNaN(v) || v < 0 || same(v, answer)) return; if (!distract.some((x) => same(x, v))) distract.push(r6(v)); };
    (hints || []).forEach(push);
    [answer + step, answer - step, answer + 2 * step, answer - 2 * step, answer * 2, answer + 3 * step].forEach((v) => { if (answer !== INF) push(v); });
    if (answer === INF) [1, 2, 3].forEach(push);
    const shuffled = window.shuffle(distract.slice(0, Math.max(3, distract.length)));
    const pickD = [];
    // ให้ความสำคัญกับ hints ก่อน (ซึ่งอยู่ต้น list) แล้วสุ่มส่วนที่เหลือ
    const hintPart = distract.filter((_, i) => i < (hints || []).length).slice(0, count - 1);
    hintPart.forEach((v) => pickD.push(v));
    shuffled.forEach((v) => { if (pickD.length < count - 1 && !pickD.some((x) => same(x, v))) pickD.push(v); });
    return window.shuffle([answer].concat(pickD.slice(0, count - 1)));
  }
  const fmtV = (x) => E.fmt(x);
  const parseNum = (s) => { const t = String(s).trim(); if (t === '∞' || /^inf/i.test(t)) return INF; if (t === '') return null; const x = Number(t); return Number.isNaN(x) ? null : x; };

  /* ---------- ตัวเรนเดอร์ภาพ ---------- */
  function tableHTML(t, ti, hide) {
    const hs = new Set((hide || []).filter((h) => Array.isArray(h)).map((h) => h.join(',')));
    let s = `<div class="tblbox"><div class="tbl-name">${t.name}</div><div class="tbl-wrap"><table class="dp ${t.kind || 'row'}"><thead><tr><th class="corner">${esc(t.corner || '')}</th>`;
    t.cols.forEach((c, i) => { s += `<th scope="col" class="${(t.colCls && t.colCls[i]) || ''}">${esc(c)}</th>`; });
    s += '</tr></thead><tbody>';
    t.cells.forEach((row, r) => {
      s += `<tr><th scope="row" class="rowh ${(t.rowCls && t.rowCls[r]) || ''}">${esc(t.rows[r])}</th>`;
      row.forEach((cell, c) => {
        const q = hs.has(`${ti},${r},${c}`);
        s += `<td class="${esc(cell.c)}${q ? ' q' : ''}">${q ? '?' : esc(cell.t)}</td>`;
      });
      s += '</tr>';
    });
    return s + '</tbody></table></div></div>';
  }

  function treeSVG(sv, hideNodes) {
    const by = {}; sv.nodes.forEach((n) => { by[n.id] = n; });
    let o = `<svg class="tree" viewBox="0 0 ${sv.w} ${sv.h}" role="img" aria-label="ต้นไม้">`;
    sv.edges.forEach((e) => { const a = by[e.a], b = by[e.b]; if (a && b && a.cls !== 'hidden' && b.cls !== 'hidden') o += `<line class="edge" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`; });
    sv.nodes.forEach((n) => {
      if (n.cls === 'hidden') return;
      const hid = hideNodes && hideNodes.includes(n.id);
      o += `<g class="node ${esc(n.cls)}" transform="translate(${n.x},${n.y})"><rect x="-27" y="-20" width="54" height="40" rx="11"/><text class="lab" y="${n.sub || hid ? -3 : 5}" text-anchor="middle">${esc(n.label)}</text>${n.sub || hid ? `<text class="sub" y="12" text-anchor="middle">${hid ? '?' : esc(n.sub)}</text>` : ''}</g>`;
    });
    return o + '</svg>';
  }

  function graphSVG(sv) {
    const R = 19;
    let o = `<svg class="graph" viewBox="0 0 ${sv.w} ${sv.h}" role="img" aria-label="กราฟ"><defs>`;
    ['base', 'derived', 'new'].forEach((k) => { o += `<marker id="ar-${k}" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path class="mk mk-${k}" d="M0,0 L10,5 L0,10 z"/></marker>`; });
    o += '</defs>';
    const labels = [];
    sv.edges.forEach((e) => {
      const p = sv.nodes[e.a], q = sv.nodes[e.b];
      const dx = q.x - p.x, dy = q.y - p.y, len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len, off = e.off == null ? 16 : e.off;
      const cx = (p.x + q.x) / 2 + nx * off * 2, cy = (p.y + q.y) / 2 + ny * off * 2;
      const d1 = Math.hypot(cx - p.x, cy - p.y) || 1, d2 = Math.hypot(q.x - cx, q.y - cy) || 1;
      const sx = p.x + ((cx - p.x) / d1) * R, sy = p.y + ((cy - p.y) / d1) * R;
      const ex = q.x - ((q.x - cx) / d2) * (R + 3), ey = q.y - ((q.y - cy) / d2) * (R + 3);
      o += `<path class="ge ge-${e.cls}" d="M${sx.toFixed(1)},${sy.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}" marker-end="url(#ar-${e.cls})"/>`;
      if (e.label != null) {
        const mx = 0.25 * sx + 0.5 * cx + 0.25 * ex, my = 0.25 * sy + 0.5 * cy + 0.25 * ey;
        labels.push(`<text class="gl gl-${e.cls}" x="${(mx + nx * 6).toFixed(1)}" y="${(my + ny * 6 + 4).toFixed(1)}" text-anchor="middle">${esc(e.label)}</text>`);
      }
    });
    o += labels.join('');
    sv.nodes.forEach((n) => { o += `<g class="gn ${esc(n.cls)}" transform="translate(${n.x.toFixed(1)},${n.y.toFixed(1)})"><circle r="${R}"/><text y="5" text-anchor="middle">${esc(n.label)}</text></g>`; });
    return o + '</svg>';
  }

  /* ---------- ตัวแก้ไขข้อมูลนำเข้าแบบกริด ---------- */
  function gridEditor(def, val, onChange) {
    const wrap = document.createElement('div'); wrap.className = 'gridw';
    const alpha = def.alpha, isW = def.type === 'wmatrix', square = def.square || isW;
    const headL = (i) => (alpha || isW ? 'abcdefghij'[i] : i + 1);
    function draw() {
      let h = '<div class="gridw-size">';
      if (square) h += `<label>จำนวนโหนด <input type="number" data-sz="n" min="${def.min}" max="${def.max}" value="${val.n}"></label>`;
      else h += `<label>แถว <input type="number" data-sz="n" min="${def.min}" max="${def.max}" value="${val.n}"></label><label>คอลัมน์ <input type="number" data-sz="m" min="${def.min}" max="${def.max}" value="${val.m}"></label>`;
      h += '</div><div class="tbl-wrap"><table class="gridtab"><tr><th></th>';
      for (let j = 0; j < val.m; j++) h += `<th>${headL(j)}</th>`;
      h += '</tr>';
      for (let i = 0; i < val.n; i++) {
        h += `<tr><th>${headL(i)}</th>`;
        for (let j = 0; j < val.m; j++) {
          const v = val.cells[i][j];
          if (isW) h += i === j ? '<td class="diag">0</td>' : `<td><input class="wcell" data-i="${i}" data-j="${j}" value="${v === '∞' || v === INF ? '' : v}" placeholder="∞" inputmode="numeric" aria-label="น้ำหนักเส้น ${headL(i)} ไป ${headL(j)}"></td>`;
          else if (def.style === 'bit' && i === j) h += '<td class="diag">–</td>';
          else h += `<td><button type="button" class="gcell ${v ? 'on' : ''}" data-i="${i}" data-j="${j}" aria-pressed="${v ? 'true' : 'false'}" aria-label="ช่อง ${headL(i)},${headL(j)}">${def.style === 'coin' ? (v ? '●' : '') : (v ? '1' : '0')}</button></td>`;
        }
        h += '</tr>';
      }
      wrap.innerHTML = h + '</table></div>';
    }
    function resize(n, m) {
      const cells = Array.from({ length: n }, (_, i) => Array.from({ length: m }, (_, j) => (val.cells[i] && val.cells[i][j] !== undefined ? val.cells[i][j] : (isW && i === j ? 0 : (isW ? '' : 0)))));
      val.n = n; val.m = m; val.cells = cells;
    }
    wrap.addEventListener('click', (e) => {
      const b = e.target.closest('.gcell'); if (!b) return;
      const i = +b.dataset.i, j = +b.dataset.j; val.cells[i][j] = val.cells[i][j] ? 0 : 1; draw(); onChange();
    });
    wrap.addEventListener('change', (e) => {
      const t = e.target;
      if (t.dataset.sz) {
        let x = Math.max(def.min, Math.min(def.max, parseInt(t.value, 10) || def.min));
        if (square) resize(x, x); else resize(t.dataset.sz === 'n' ? x : val.n, t.dataset.sz === 'm' ? x : val.m);
        draw(); onChange();
      } else if (t.classList.contains('wcell')) { val.cells[+t.dataset.i][+t.dataset.j] = t.value.trim(); onChange(); }
    });
    draw();
    return wrap;
  }

  /* ============ Playground ============ */
  class Playground {
    constructor(ch, root) {
      this.ch = ch; this.root = root;
      this.modeId = ch.modes[0].id;
      this.raw = clone(ch.defaults);
      this.predict = false; this.idx = 0; this.steps = []; this.answered = new Set(); this.tries = {}; this.qCache = {};
      this.timer = null; this.speed = 1;
      this.stat = store.get('practice:' + ch.id, { asked: 0, correct: 0 });
      this.onKey = this.onKey.bind(this);
      document.addEventListener('keydown', this.onKey);
      AP.hooks.dispose = () => this.destroy();
      this.build();
      this.apply();
    }
    destroy() { this.stop(); document.removeEventListener('keydown', this.onKey); }
    get mode() { return this.ch.modes.find((m) => m.id === this.modeId); }

    build() {
      const ch = this.ch;
      this.root.innerHTML = `
      <div class="pg">
        <div class="pg-top">
          ${ch.modes.length > 1 ? `<div class="seg" role="tablist" aria-label="วิธีคำนวณ">${ch.modes.map((m) => `<button role="tab" data-act="mode" data-mode="${m.id}" aria-selected="${m.id === this.modeId}">${esc(m.label)}</button>`).join('')}</div>` : ''}
          <label class="switch" title="ระบบจะถามค่าของช่องถัดไปก่อนเฉลย"><input type="checkbox" data-act="predict"><span class="track"></span><span>โหมดฝึกทาย</span></label>
          <span class="pg-score" hidden></span>
        </div>
        <div class="pg-inputs"></div>
        <div class="pg-err" role="alert" hidden></div>
        <div class="pg-ctl" role="group" aria-label="ควบคุมการเล่น">
          <button data-act="first" aria-label="เริ่มใหม่ (Home)" title="เริ่มใหม่">⏮</button>
          <button data-act="prev" aria-label="ย้อนกลับ (←)" title="ย้อนกลับ (←)">◀</button>
          <button data-act="next" class="primary" aria-label="ถัดไป (→)" title="ถัดไป (→)">ถัดไป ▶</button>
          <button data-act="play" aria-label="เล่นอัตโนมัติ (เว้นวรรค)" title="เล่นอัตโนมัติ (เว้นวรรค)">⏵ เล่น</button>
          <button data-act="last" aria-label="ไปสเต็ปสุดท้าย" title="ไปสุดท้าย">⏭</button>
          <input type="range" class="pg-range" min="0" max="0" value="0" aria-label="เลือกสเต็ป">
          <span class="pg-count" aria-live="polite"></span>
          <label class="speed">ความเร็ว <select data-act="speed"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option><option value="4">4×</option></select></label>
        </div>
        <div class="pg-main">
          <div class="pg-vis" aria-live="off"></div>
          <div class="pg-side">
            <div class="pg-note" aria-live="polite"></div>
            <div class="pg-code" aria-label="Pseudocode"></div>
          </div>
        </div>
      </div>`;
      this.buildInputs();
      this.root.addEventListener('click', (e) => this.onClick(e));
      this.root.addEventListener('change', (e) => this.onChange(e));
      this.root.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('.q-input')) { e.preventDefault(); this.submitTyped(); } else if (e.key === 'Enter' && e.target.matches('.pg-inputs input')) { this.apply(); } });
      this.root.querySelector('.pg-range').addEventListener('input', (e) => { this.stop(); this.goto(+e.target.value); });
    }

    buildInputs() {
      const box = this.root.querySelector('.pg-inputs'), ch = this.ch;
      box.innerHTML = '';
      const fields = document.createElement('div'); fields.className = 'fields';
      ch.inputs.forEach((d) => {
        if (d.type === 'grid' || d.type === 'wmatrix') {
          const w = document.createElement('details'); w.className = 'field wide'; w.open = !!this.gridOpen;
          w.addEventListener('toggle', () => { this.gridOpen = w.open; });
          w.innerHTML = `<summary>✎ แก้ไขข้อมูล: ${esc(d.label)}</summary>`;
          w.appendChild(gridEditor(d, this.raw[d.id], () => this.apply()));
          fields.appendChild(w);
        } else {
          const l = document.createElement('label'); l.className = 'field';
          l.innerHTML = `<span class="flabel">${esc(d.label)}</span><input data-id="${d.id}" type="${d.type === 'number' ? 'number' : 'text'}" value="${esc(this.raw[d.id])}" ${d.type === 'text' ? `size="${d.size || 20}"` : ''} autocomplete="off" spellcheck="false">${d.help ? `<span class="fhelp">${esc(d.help)}</span>` : ''}`;
          fields.appendChild(l);
        }
      });
      box.appendChild(fields);
      const acts = document.createElement('div'); acts.className = 'iacts';
      acts.innerHTML = `<button data-act="apply" class="primary">เริ่มด้วยข้อมูลนี้</button>
        <label class="preset">ตัวอย่าง <select data-act="preset"><option value="">— เลือก —</option>${this.ch.presets.map((p, i) => `<option value="${i}">${esc(p.label)}</option>`).join('')}</select></label>
        <button data-act="random">🎲 สุ่มโจทย์</button>`;
      box.appendChild(acts);
    }

    readRaw() { $$('.pg-inputs input[data-id]', this.root).forEach((inp) => { this.raw[inp.dataset.id] = inp.value; }); }
    showErr(msg) { const e = this.root.querySelector('.pg-err'); e.hidden = !msg; e.textContent = msg || ''; }

    apply() {
      this.stop(); this.readRaw();
      try {
        const args = this.ch.parse(this.raw, this.modeId);
        const out = this.mode.run(args);
        this.steps = out.steps; this.result = out.result;
      } catch (err) { this.showErr(err.message); return; }
      this.showErr('');
      this.idx = 0; this.answered = new Set(); this.tries = {}; this.qCache = {};
      this.render();
    }

    /* ----- การนำทาง ----- */
    frontier() { for (let i = 0; i < this.steps.length; i++) if (this.steps[i].ask && !this.answered.has(i)) return i; return this.steps.length - 1; }
    isPending() { const s = this.steps[this.idx]; return this.predict && s && s.ask && !this.answered.has(this.idx); }
    goto(i) {
      i = Math.max(0, Math.min(this.steps.length - 1, i));
      if (this.predict) i = Math.min(i, this.frontier());
      this.idx = i; this.render();
    }
    next() { if (this.isPending()) { const f = this.root.querySelector('.q-input'); if (f) f.focus(); return; } this.goto(this.idx + 1); }
    prev() { this.stop(); this.goto(this.idx - 1); }
    play() {
      if (this.predict) return;
      if (this.timer) { this.stop(); return; }
      if (this.idx >= this.steps.length - 1) this.idx = 0;
      this.setPlaying(true);
      this.timer = setInterval(() => { if (this.idx >= this.steps.length - 1) { this.stop(); return; } this.goto(this.idx + 1); }, 1100 / this.speed);
      this.render();
    }
    stop() { if (this.timer) { clearInterval(this.timer); this.timer = null; } this.setPlaying(false); }
    setPlaying(v) { const b = this.root.querySelector('[data-act=play]'); if (b) b.textContent = v ? '⏸ หยุด' : '⏵ เล่น'; }

    /* ----- ทายค่า ----- */
    choicesFor(i) {
      if (this.qCache[i]) return this.qCache[i];
      const a = this.steps[i].ask;
      const ch = a.choices ? a.choices.slice() : makeChoices(a.answer, a.hints).map((v) => ({ label: fmtV(v), value: v }));
      return (this.qCache[i] = ch);
    }
    record(correctFirst) {
      const tr = this.tries[this.idx] || {};
      if (!tr.counted) { this.stat.asked++; if (correctFirst) this.stat.correct++; tr.counted = true; this.tries[this.idx] = tr; store.set('practice:' + this.ch.id, this.stat); }
    }
    answer(value) {
      const s = this.steps[this.idx], a = s.ask; if (!a) return;
      const tr = (this.tries[this.idx] = this.tries[this.idx] || { wrong: [] });
      tr.wrong = tr.wrong || [];
      if (same(value, a.answer)) { this.record(tr.wrong.length === 0); this.answered.add(this.idx); this.lastFb = 'ok'; this.render(); }
      else { tr.wrong.push(value); tr.hintShown = true; this.qFeedback = { bad: value }; this.render(); }
    }
    submitTyped() {
      const inp = this.root.querySelector('.q-input'); if (!inp) return;
      const v = parseNum(inp.value);
      if (v === null) { this.qFeedback = { msg: 'พิมพ์เป็นตัวเลข (หรือ ∞)' }; this.render(); return; }
      this.answer(v);
    }
    reveal() { this.record(false); this.answered.add(this.idx); this.render(); }

    questionHTML() {
      const s = this.steps[this.idx], a = s.ask, tr = this.tries[this.idx] || { wrong: [] };
      const ch = this.choicesFor(this.idx);
      const btn = ch.map((c, k) => { const dead = tr.wrong.some((w) => same(w, c.value)); return `<button class="choice${dead ? ' dead' : ''}" data-act="choice" data-k="${k}" ${dead ? 'disabled' : ''}>${esc(c.label)}</button>`; }).join('');
      const bad = tr.wrong.length ? `<div class="q-fb bad">ยังไม่ใช่ — ลองอ่านคำใบ้แล้วตอบใหม่</div>` : '';
      const msg = this.qFeedback && this.qFeedback.msg ? `<div class="q-fb bad">${esc(this.qFeedback.msg)}</div>` : '';
      return `<div class="q"><div class="q-tag">ทายก่อนเปิดช่อง</div><div class="q-text">${a.q}</div>
        <div class="q-choices">${btn}</div>
        ${a.noType ? '' : `<div class="q-type"><label>หรือพิมพ์เอง <input class="q-input" inputmode="decimal" autocomplete="off" placeholder="ตัวเลข"></label><button data-act="submit">ตอบ</button></div>`}
        ${bad}${msg}
        ${tr.hintShown ? `<div class="q-hint"><b>คำใบ้:</b> ${a.hint || 'ดูช่องสีเหลือง'}</div>` : ''}
        <button class="linkbtn" data-act="reveal">ไม่แน่ใจ — ดูเฉลย</button></div>`;
    }

    /* ----- แสดงผล ----- */
    render() {
      const s = this.steps[this.idx]; if (!s) return;
      const pending = this.isPending();
      const hide = pending ? s.ask.hide : null, hideNodes = pending ? s.ask.hideNodes : null;
      let vis = '';
      if (s.svg) vis += `<div class="svgbox">${s.svg.type === 'tree' ? treeSVG(s.svg, hideNodes) : graphSVG(s.svg)}${s.svg.type === 'graph' ? graphLegend() : ''}${s.svg.type === 'tree' ? treeLegend(this.modeId) : ''}</div>`;
      s.tables.forEach((t, ti) => { vis += tableHTML(t, ti, hide); });
      this.root.querySelector('.pg-vis').innerHTML = vis;
      const note = this.root.querySelector('.pg-note');
      note.innerHTML = pending ? this.questionHTML() : `<div class="note-body">${s.note}</div>${this.predict && s.ask && this.tries[this.idx] ? '<div class="q-fb ok">✓ ถูกต้อง</div>' : ''}`;
      const code = this.mode.code, act = Array.isArray(s.line) ? s.line : [s.line];
      this.root.querySelector('.pg-code').innerHTML = `<div class="code-title">Pseudocode</div><pre>${code.map((l, i) => `<span class="ln${act.includes(i) ? ' on' : ''}">${esc(l)}</span>`).join('')}</pre>${this.mode.hint ? `<div class="mode-hint">${esc(this.mode.hint)}</div>` : ''}`;
      const n = this.steps.length, rng = this.root.querySelector('.pg-range');
      rng.max = n - 1; rng.value = this.idx;
      rng.disabled = this.predict && false;
      this.root.querySelector('.pg-count').textContent = `สเต็ป ${this.idx + 1} / ${n}`;
      this.root.querySelector('[data-act=prev]').disabled = this.idx === 0;
      const nx = this.root.querySelector('[data-act=next]'); nx.disabled = this.idx >= n - 1 || pending;
      this.root.querySelector('[data-act=play]').disabled = this.predict;
      this.root.querySelector('[data-act=first]').disabled = this.idx === 0;
      this.root.querySelector('[data-act=last]').disabled = this.predict && this.frontier() > this.idx;
      const sc = this.root.querySelector('.pg-score'); sc.hidden = !this.predict;
      sc.textContent = `ตอบถูกในครั้งแรก ${this.stat.correct}/${this.stat.asked}`;
      this.qFeedback = null;
      if (pending) { const f = this.root.querySelector('.q-input'); if (f && this._focusQ) f.focus(); }
    }

    /* ----- อีเวนต์ ----- */
    onClick(e) {
      const b = e.target.closest('[data-act]'); if (!b || b.tagName === 'SELECT' || b.tagName === 'INPUT') return;
      const act = b.dataset.act;
      if (act === 'next') { this._focusQ = true; this.next(); }
      else if (act === 'prev') this.prev();
      else if (act === 'first') { this.stop(); this.goto(0); }
      else if (act === 'last') { this.stop(); this.goto(this.steps.length - 1); }
      else if (act === 'play') this.play();
      else if (act === 'apply') this.apply();
      else if (act === 'random') { this.raw = clone(this.ch.random()); this.buildInputs(); this.apply(); }
      else if (act === 'mode') { this.modeId = b.dataset.mode; $$('[data-act=mode]', this.root).forEach((x) => x.setAttribute('aria-selected', x.dataset.mode === this.modeId)); this.apply(); }
      else if (act === 'choice') { const c = this.choicesFor(this.idx)[+b.dataset.k]; this.answer(c.value); }
      else if (act === 'submit') this.submitTyped();
      else if (act === 'reveal') this.reveal();
    }
    onChange(e) {
      const t = e.target;
      if (t.matches('[data-act=predict]')) { this.predict = t.checked; this.stop(); this.idx = 0; this.answered = new Set(); this.tries = {}; this.qCache = {}; this._focusQ = false; this.render(); if (this.predict) this.goto(1); }
      else if (t.matches('[data-act=speed]')) { this.speed = +t.value; if (this.timer) { this.stop(); this.play(); } }
      else if (t.matches('[data-act=preset]')) { if (t.value === '') return; this.raw = clone(this.ch.presets[+t.value].raw); this.buildInputs(); this.apply(); }
    }
    onKey(e) {
      if (!this.root.isConnected) { this.destroy(); return; }
      if (e.target.closest && e.target.closest('input, textarea, select')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); this._focusQ = true; this.next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); this.prev(); }
      else if (e.key === ' ' && !e.target.closest('button, a')) { e.preventDefault(); this.play(); }
      else if (e.key === 'Home') { this.stop(); this.goto(0); }
    }
  }
  const graphLegend = () => '<div class="legend"><span><i class="lg lg-base"></i>เส้นเดิม</span><span><i class="lg lg-derived"></i>เส้นทางที่อนุมานได้</span><span><i class="lg lg-new"></i>เพิ่มในรอบนี้</span></div>';
  const treeLegend = (m) => (m === 'tree' ? '<div class="legend"><span><i class="lg lg-call"></i>กำลังเรียก</span><span><i class="lg lg-dupe"></i>คำนวณซ้ำ</span></div>' : m === 'memo' ? '<div class="legend"><span><i class="lg lg-call"></i>กำลังเรียก</span><span><i class="lg lg-hit"></i>ดึงจาก memo</span></div>' : '');

  /* ============ Quiz ============ */
  function mountQuiz(ch, el) {
    let qs = [], i = 0, score = 0, locked = false;
    function build() {
      qs = ch.quiz.map((q) => {
        if (q.gen) {
          const g = q.gen();
          const opts = makeChoices(g.answer, g.hints, 4).map((v) => ({ label: fmtV(v), ok: same(v, g.answer) }));
          return { q: g.q, opts, why: g.why, gen: true };
        }
        return { q: q.q, opts: window.shuffle(q.opts.map((t, k) => ({ label: t, ok: k === q.ans }))), why: q.why };
      });
      i = 0; score = 0; locked = false; draw();
    }
    function draw() {
      if (i >= qs.length) return done();
      const q = qs[i];
      el.innerHTML = `<div class="quiz"><div class="qz-top"><span>ข้อ ${i + 1} / ${qs.length}</span><span class="dots">${qs.map((_, k) => `<i class="${k < i ? 'd' : k === i ? 'c' : ''}"></i>`).join('')}</span></div>
        <div class="qz-q">${q.q}</div><div class="qz-opts">${q.opts.map((o, k) => `<button class="choice" data-k="${k}">${esc(o.label)}</button>`).join('')}</div><div class="qz-fb" aria-live="polite"></div></div>`;
      locked = false;
    }
    function done() {
      const ratio = score / qs.length, passed = ratio >= 0.6;
      const p = progress[ch.id] = Object.assign({ visited: true }, progress[ch.id]);
      p.best = Math.max(p.best || 0, ratio); if (passed) p.passed = true; saveProgress(); AP.progress();
      el.innerHTML = `<div class="quiz done"><div class="score ${passed ? 'ok' : ''}">${score}<span>/${qs.length}</span></div>
        <p>${passed ? '🎉 ผ่านแล้ว! บทนี้ถูกทำเครื่องหมายว่าเรียนจบ' : 'ยังไม่ถึงเกณฑ์ผ่าน (60%) — ลองอ่านแนวคิดอีกรอบแล้วทำใหม่ได้เลย'}</p>
        <div class="row"><button data-act="retry" class="primary">ทำใหม่ (สุ่มข้อใหม่)</button>${AP.hooks.nextAfterQuiz ? AP.hooks.nextAfterQuiz() : ''}</div></div>`;
    }
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.act === 'retry') { build(); return; }
      if (b.dataset.act === 'nextq') { i++; draw(); return; }
      if (b.classList.contains('choice') && !locked) {
        locked = true;
        const q = qs[i], k = +b.dataset.k, ok = q.opts[k].ok;
        if (ok) score++;
        $$('.choice', el).forEach((x, kk) => { x.disabled = true; if (q.opts[kk].ok) x.classList.add('right'); else if (kk === k) x.classList.add('wrong'); });
        $('.qz-fb', el).innerHTML = `<div class="q-fb ${ok ? 'ok' : 'bad'}">${ok ? '✓ ถูกต้อง' : '✗ ยังไม่ถูก'}</div><div class="why">${q.why}</div><button data-act="nextq" class="primary">${i + 1 >= qs.length ? 'ดูผลคะแนน' : 'ข้อต่อไป →'}</button>`;
        const nb = $('[data-act=nextq]', el); if (nb) nb.focus();
      }
    });
    build();
  }

  /* ============ ส่วนที่ AlgoPrep ใช้ ============ */
  const fmScan = (root) => {
    root.addEventListener('mouseover', (e) => { const t = e.target.closest('[data-k]'); if (!t) return; const box = t.closest('.formula-box'); if (!box) return; $$(`[data-k="${t.dataset.k}"]`, box).forEach((x) => x.classList.add('hl')); });
    root.addEventListener('mouseout', (e) => { const t = e.target.closest('[data-k]'); if (!t) return; const box = t.closest('.formula-box'); if (box) $$('.hl', box).forEach((x) => x.classList.remove('hl')); });
  };
  // เนื้อหา "เรียน" ของบท (โจทย์ → แนวคิด → recurrence → ความซับซ้อน/จุดพลาด) ครบทุกส่วนเหมือนหน้าเดิม
  function learnHTML(ch) {
    return `<div class="chapter">
      <section id="s-problem"><h2><span class="n">1</span>โจทย์</h2>${ch.intro}</section>
      <section id="s-idea"><h2><span class="n">2</span>แนวคิดการแบ่งปัญหาย่อย</h2>${ch.idea}</section>
      <section id="s-formula"><h2><span class="n">3</span>Recurrence</h2><div class="formula-box">${ch.formula.html}<dl class="terms">${ch.formula.terms.map((t) => `<div data-k="${t.k}"><dt><i></i></dt><dd>${t.html}</dd></div>`).join('')}</dl></div><p class="muted small">เลื่อนเมาส์ไปที่ส่วนต่าง ๆ ของสูตรเพื่อดูความหมาย</p></section>
      <section id="s-cx"><h2><span class="n">4</span>ความซับซ้อน และจุดที่พลาดบ่อย</h2>${ch.complexity}<div class="callout warn"><b>ระวัง</b><ul>${ch.pitfalls.map((p) => `<li>${p}</li>`).join('')}</ul></div></section>
    </div>`;
  }
  function mountLearn(ch, el) { el.innerHTML = learnHTML(ch); fmScan(el); }
  function mountPlay(ch, el) {
    progress[ch.id] = Object.assign({ visited: true }, progress[ch.id]); saveProgress();
    el.innerHTML = '<p class="muted small" style="margin:0 0 10px">กด <kbd>→</kbd> ถัดไป · <kbd>←</kbd> ย้อน · <kbd>เว้นวรรค</kbd> เล่น/หยุด · เปิด “โหมดฝึกทาย” เพื่อทายค่าในช่องก่อนเฉลย</p><div class="pgmount"></div>';
    return new Playground(ch, el.querySelector('.pgmount'));
  }
  function reset() { progress = {}; saveProgress(); CH.forEach((c) => store.set('practice:' + c.id, { asked: 0, correct: 0 })); }
  AP.dp8 = {
    CH, byId: (id) => CH.find((c) => c.id === id), status: (id) => status(id), progressOf: (id) => progress[id] || null,
    practice: (id) => store.get('practice:' + id, { asked: 0, correct: 0 }),
    mountLearn, mountPlay, mountQuiz, reset, makeChoices, fmtV, same,
  };
})();
