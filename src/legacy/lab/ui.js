/* ================= app: rendering, state, player ================= */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const store = AP.store.ns("lab");

const S = { host: null, view: 'home', pid: 1, tab: 'problem', variant: 0, step: 0, playing: false, speed: 900, sel: null, rpid: 1 };
let timer = null;
const byId = n => PROBLEMS.find(p => p.n === n);
const code = p => p._code || (p._code = parseCode(p.code));
const run = p => p._run || (p._run = p.run());
const lineIdx = (p, l) => l == null ? -1 : (typeof l === 'string' ? (code(p).marks[l] ?? -1) : l);
const stripHtml = h => String(h).replace(/<br\s*\/?>/g, '\n').replace(/<\/(p|li|pre)>/g, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\n{3,}/g, '\n\n').trim();

/* ---------- storage-backed state ---------- */
const quizState = pid => (store.get('quiz', {})[pid] || {});
const saveQuiz = (pid, qs) => { const a = store.get('quiz', {}); a[pid] = qs; store.set('quiz', a); };
const isDone = p => Object.keys(quizState(p.n)).length >= p.quiz.length;
const getAns = pid => (store.get('ans', {})[pid] || '');
const setAns = (pid, v) => { const a = store.get('ans', {}); a[pid] = v; store.set('ans', a); };
const getChat = pid => (store.get('chat', {})[pid] || '');
const setChat = (pid, v) => { const a = store.get('chat', {}); a[pid] = v; store.set('chat', a); };
const toast = AP.toast;
const copy = AP.copy;

/* ---------- code highlighting ---------- */
function hlPy(line) {
  return esc(line).replace(/(#.*$)|("[^"]*"|'[^']*')|\b(def|for|in|if|else|elif|return|and|or|not|while|import|lambda|None|True|False)\b|\b(\d+\.?\d*)\b|\b([A-Za-z_]\w*)(?=\()/g,
    (m, c, s, k, n, f) => c ? `<span class="c">${c}</span>` : s ? `<span class="s">${s}</span>` : k ? `<span class="k">${k}</span>` : n ? `<span class="n">${n}</span>` : `<span class="f">${f}</span>`);
}
function codeHtml(p, cur, sel) {
  const { lines, marks } = code(p), exLines = new Set(Object.keys(p.ex || {}).map(k => marks[k]).filter(x => x !== undefined));
  return `<div class="codebox">${lines.map((t, i) => `<div class="cl${i === cur ? ' cur' : ''}${exLines.has(i) ? ' ex' : ''}${i === sel ? ' sel' : ''}" data-line="${i}"><span class="ln">${i + 1}</span><span>${hlPy(t) || ' '}</span></div>`).join('')}</div>`;
}
const exFor = (p, i) => { const { marks } = code(p); const k = Object.keys(p.ex || {}).find(k => marks[k] === i); return k ? p.ex[k] : null; };

/* ---------- panel renderers ---------- */
const fv = v => v === null || v === undefined ? '' : v === INF ? '∞' : v === -INF ? '−∞' : v === true ? 'T' : v === false ? 'F' : typeof v === 'number' ? String(rnd(v)) : esc(v);
function tableHtml(pn) {
  const key = (a) => a ? a.join(',') : '', cur = key(pn.cur), cur2 = key(pn.cur2), src = new Set((pn.src || []).map(key)), ok = new Set((pn.ok || []).map(key));
  const cols = pn.cl || pn.rows[0].map((_, i) => i);
  const head = `<tr><th></th>${cols.map((c, j) => `<th class="${pn.cur && pn.cur[1] === j ? 'hcur' : ''}">${fv(c)}</th>`).join('')}</tr>`;
  const body = pn.rows.map((row, i) => `<tr><th class="rh ${pn.cur && pn.cur[0] === i ? 'hcur' : ''}">${pn.rl ? fv(pn.rl[i]) : ''}</th>${row.map((v, j) => {
    const k = i + ',' + j, cls = [k === cur || k === cur2 ? 'cur' : src.has(k) ? 'src' : ok.has(k) ? 'ok' : '', v === null ? 'nul' : '', pn.dimNeg && v === -1 ? 'dim' : '', pn.rowK != null && i === pn.rowK ? 'rk' : '', pn.colK != null && j === pn.colK ? 'ck' : ''].join(' ');
    return `<td class="${cls}">${fv(v)}</td>`;
  }).join('')}</tr>`).join('');
  return `<div class="tw"><table class="dp">${head}${body}</table></div>`;
}
function graphHtml(pn) {
  const { pos, n, edges } = pn.g, R = 18, uid = 'g' + Math.floor(Math.random() * 1e6);
  const mk = c => `<marker id="${uid}-${c}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="ah-${c}" d="M0 0L10 5L0 10z"/></marker>`;
  const es = edges.map(([u, v, lab, cls]) => {
    const [x1, y1] = pos[u], [x2, y2] = pos[v], dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    const a = [x1 + ux * R, y1 + uy * R], b = [x2 - ux * (R + 4), y2 - uy * (R + 4)], off = 22, cx = (x1 + x2) / 2 - uy * off, cy = (y1 + y2) / 2 + ux * off;
    const lx = 0.25 * a[0] + 0.5 * cx + 0.25 * b[0], ly = 0.25 * a[1] + 0.5 * cy + 0.25 * b[1];
    return `<path class="edge ${cls}" d="M${a[0]} ${a[1]} Q${cx} ${cy} ${b[0]} ${b[1]}" marker-end="url(#${uid}-${cls})"/>${lab ? `<text class="elab" x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="central">${esc(lab)}</text>` : ''}`;
  }).join('');
  const ns = pos.slice(0, n).map(([x, y], i) => `<g class="node ${(pn.nodes || {})[i] || ''}"><circle cx="${x}" cy="${y}" r="${R}"/><text x="${x}" y="${y}">${i}</text></g>`).join('');
  return `<svg class="gfx" viewBox="0 0 320 240" role="img" aria-label="กราฟ"><defs>${mk('orig')}${mk('hl')}${mk('new')}</defs>${es}${ns}</svg>`;
}
function layoutTree(nodes) {
  const kids = nodes.map(() => []); nodes.forEach(nd => { if (nd.parent >= 0) kids[nd.parent].push(nd.id); });
  const pos = [], bst = nodes.some(nd => nd.side); let x = 0, maxD = 0;
  if (nodes.length === 0) return { pos, w: 0, h: 0 };
  if (bst) { (function go(id, d) { const L = kids[id].find(c => nodes[c].side === 'L'), Rr = kids[id].find(c => nodes[c].side === 'R'); if (L !== undefined) go(L, d + 1); pos[id] = { x: x++, d }; maxD = Math.max(maxD, d); if (Rr !== undefined) go(Rr, d + 1); })(0, 0); }
  else { (function go(id, d) { maxD = Math.max(maxD, d); if (!kids[id].length) { pos[id] = { x: x++, d }; return; } kids[id].forEach(c => go(c, d + 1)); pos[id] = { x: (pos[kids[id][0]].x + pos[kids[id][kids[id].length - 1]].x) / 2, d }; })(0, 0); }
  return { pos, w: x, h: maxD + 1 };
}
function treeHtml(pn) {
  const nodes = pn.nodes, hasVal = pn.val.some(v => v !== null && v !== undefined), { pos, w, h } = layoutTree(nodes);
  if (!nodes.length) return '<div class="legend">ยังไม่มีโหนด</div>';
  const maxLen = Math.max(...nodes.map(nd => nd.label.length)), nw = Math.max(46, maxLen * 8 + 14), sw = nw + 14, nh = hasVal ? 40 : 28, sh = nh + 26, W = w * sw + 20, H = h * sh + 12;
  const P = id => ({ x: 10 + pos[id].x * sw + sw / 2 - 7, y: 6 + pos[id].d * sh + nh / 2 });
  const edges = nodes.filter(nd => nd.parent >= 0 && (pn.st[nd.id] || 0) > 0).map(nd => { const a = P(nd.parent), b = P(nd.id); return `<path class="tedge" d="M${a.x} ${a.y + nh / 2} L${b.x} ${b.y - nh / 2}"/>`; }).join('');
  const ns = nodes.filter(nd => (pn.st[nd.id] || 0) > 0).map(nd => { const { x, y } = P(nd.id), v = pn.val[nd.id]; return `<g class="tnode s${pn.st[nd.id]}"><rect x="${x - nw / 2}" y="${y - nh / 2}" width="${nw}" height="${nh}" rx="8"/><text x="${x}" y="${y - (hasVal ? 7 : 0)}">${esc(nd.label)}</text>${hasVal ? `<text class="v" x="${x}" y="${y + 10}">${v === null || v === undefined ? '' : '= ' + esc(v)}</text>` : ''}</g>`; }).join('');
  return `<div class="tw-tree"><svg class="gfx" style="max-height:none;min-width:${Math.min(W, 900)}px" viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="ต้นไม้">${edges}${ns}</svg></div>`;
}
const barsHtml = pn => `<div class="bars">${pn.items.map(it => `<div class="bar"><div class="lbl"><span>${esc(it.label)}</span><span>${esc(it.txt)}</span></div><div class="trk"><div class="fill ${it.cls}" style="width:${Math.max(1.5, it.value / pn.max * 100)}%"></div></div></div>`).join('')}</div>`;
function panelHtml(pn) {
  const body = pn.type === 'table' ? tableHtml(pn) : pn.type === 'graph' ? graphHtml(pn) : pn.type === 'tree' ? treeHtml(pn) : pn.type === 'bars' ? barsHtml(pn) : `<div>${pn.html}</div>`;
  return `<section class="panel"><h4>${esc(pn.title || '')}</h4>${body}</section>`;
}

/* ---------- views ---------- */
const TABS = [['problem', '📝 โจทย์'], ['anim', '🎬 อนิเมชัน'], ['code', '📖 อธิบายโค้ด'], ['quiz', '✅ Quiz']];
function problemHtml(p) {
  const g = GROUPS.find(g => g.id === p.group);
  return `<div class="wrap"><div class="phead"><div class="ptitle"><div class="pno">${p.n}</div><div><h1>${esc(p.title)}</h1><small>${g.icon} ${esc(p.th)}</small></div></div>
    <div class="pnav"><a class="btn sm" href="${AP.labHref(Math.max(1, p.n - 1), S.tab)}" ${p.n === 1 ? 'aria-disabled="true"' : ''}>← ข้อ ${Math.max(1, p.n - 1)}</a><a class="btn sm" href="${AP.labHref(Math.min(20, p.n + 1), S.tab)}">ข้อ ${Math.min(20, p.n + 1)} →</a></div></div>
    <div class="tabs" role="tablist">${TABS.map(([id, l]) => `<button class="tab ${S.tab === id ? 'on' : ''}" role="tab" aria-selected="${S.tab === id}" data-tab="${id}">${l}</button>`).join('')}</div>
    <div id="tabbody">${tabBody(p)}</div></div>`;
}
function tabBody(p) {
  if (S.tab === 'problem') return `${p.pdfFix ? `<div class="callout"><b class="h">⚠️ แก้ไขจาก PDF</b>${p.pdfFix}</div>` : ''}
    <div class="card"><h3>โจทย์</h3>${p.story}</div>
    <div class="card"><h3>คำถามให้เขียนตอบ</h3>${p.q}</div>
    <div class="two"><div class="card"><h3>สมการ Recurrence Relation</h3><div class="rec">${p.rec}</div></div><div class="card"><h3>ไอเดียหลัก</h3><ol class="idea">${p.idea.map(i => `<li>${i}</li>`).join('')}</ol><p style="margin:10px 0 0;color:var(--ink2);font-size:.9rem">⏱ ${p.cx}</p></div></div>
    <div class="row"><a class="btn pri" href="${AP.labHref(p.n, 'anim')}">🎬 ดูอนิเมชัน →</a></div>`;
  if (S.tab === 'anim') return animHtml(p);
  if (S.tab === 'code') return codeTabHtml(p);
  if (S.tab === 'quiz') return quizHtml(p);
  return answerHtml(p);
}

/* animation */
function animHtml(p) {
  const r = run(p); if (S.variant >= r.variants.length) S.variant = 0;
  return `${r.variants.length > 1 ? `<div class="variants">${r.variants.map((v, i) => `<button class="vbtn ${i === S.variant ? 'on' : ''}" data-variant="${i}">${esc(v.name)}</button>`).join('')}</div>` : ''}<div id="viz"></div>`;
}
function drawViz() {
  const p = byId(S.pid), box = $('#viz'); if (!box) return;
  const steps = run(p).variants[S.variant].steps; S.step = Math.max(0, Math.min(steps.length - 1, S.step));
  const st = steps[S.step], li = lineIdx(p, st.line), ex = li >= 0 ? exFor(p, li) : null;
  box.innerHTML = `<div class="player"><button class="btn sm" data-act="first" title="เริ่มใหม่">⏮</button><button class="btn sm" data-act="prev" title="ย้อน (←)">◀</button><button class="btn pri sm" data-act="play" style="min-width:76px">${S.playing ? '⏸ หยุด' : '▶ เล่น'}</button><button class="btn sm" data-act="next" title="ถัดไป (→)">▶|</button>
    <div class="grow"><input type="range" min="0" max="${steps.length - 1}" value="${S.step}" data-act="seek" aria-label="ขั้นตอน"><span class="stepno">${S.step + 1} / ${steps.length}</span></div>
    <select data-act="speed" aria-label="ความเร็ว"><option value="1600" ${S.speed === 1600 ? 'selected' : ''}>ช้า</option><option value="900" ${S.speed === 900 ? 'selected' : ''}>ปกติ</option><option value="400" ${S.speed === 400 ? 'selected' : ''}>เร็ว</option><option value="120" ${S.speed === 120 ? 'selected' : ''}>เร็วมาก</option></select></div>
    <div class="note" aria-live="polite">${st.note}</div>
    <div class="anim"><div class="panels">${st.panels.map(panelHtml).join('')}${st.panels.some(x => x.type === 'table') ? '<div class="legend"><span><i style="background:var(--cur)"></i>ช่องที่กำลังเติม</span><span><i style="background:var(--src)"></i>ช่องที่ใช้คำนวณ</span><span><i style="background:var(--ok)"></i>ผลลัพธ์/เส้นทาง</span></div>' : ''}</div>
    <div>${codeHtml(p, li, null)}<div class="lineex ${ex ? '' : 'empty'}">${ex ? `<div class="tag">บรรทัด ${li + 1}</div>${ex}` : (li >= 0 ? 'บรรทัดนี้เป็นบรรทัดประกอบ' : 'ขั้นตอนนี้ไม่อยู่ในโค้ด (เป็นส่วนเปรียบเทียบ/ผลลัพธ์)')}</div></div></div>`;
  followTrees(box);
}
function followTrees(box) {
  box.querySelectorAll('.tw-tree').forEach(w => {
    const a = [...w.querySelectorAll('.tnode.s1')].pop() || w.querySelector('.tnode'); if (!a) return;
    const r = a.getBoundingClientRect(), wr = w.getBoundingClientRect(); w.scrollLeft += (r.left + r.width / 2) - (wr.left + wr.width / 2);
  });
}
function stopPlay() { S.playing = false; clearInterval(timer); timer = null; }
function startPlay() {
  const steps = run(byId(S.pid)).variants[S.variant].steps; if (S.step >= steps.length - 1) S.step = 0;
  S.playing = true; clearInterval(timer);
  timer = setInterval(() => { if (S.step >= steps.length - 1) { stopPlay(); drawViz(); return; } S.step++; drawViz(); }, S.speed); drawViz();
}

/* explain-code tab */
function codeTabHtml(p) {
  const { marks } = code(p), exLines = Object.keys(p.ex || {}).map(k => marks[k]).filter(x => x !== undefined).sort((a, b) => a - b);
  if (S.sel === null || !exLines.includes(S.sel)) S.sel = exLines[0] ?? -1;
  const pos = exLines.indexOf(S.sel);
  return `<div class="two codetab" style="grid-template-columns:repeat(auto-fit,minmax(min(340px,100%),1fr))"><div><div class="legend">คลิกบรรทัดที่มีแถบสีเทาเมื่อ hover เพื่ออ่านคำอธิบาย</div>${codeHtml(p, -1, S.sel)}
    <div class="card" style="margin-top:14px"><h3>ผลลัพธ์ที่ได้จากการรัน</h3><pre class="out">${esc(p.out)}</pre></div></div>
    <div><div class="lineex" id="lineex">${lineExHtml(p, pos, exLines)}</div>
    <div class="exnav"><button class="btn sm" data-act="exprev" ${pos <= 0 ? 'disabled' : ''}>◀ บรรทัดก่อน</button><button class="btn sm pri" data-act="exnext" ${pos >= exLines.length - 1 ? 'disabled' : ''}>บรรทัดถัดไป ▶</button><span class="cnt">${pos + 1} / ${exLines.length}</span></div>
    <div class="card" style="margin-top:14px"><h3>ภาพรวม</h3><ol class="idea">${p.idea.map(i => `<li>${i}</li>`).join('')}</ol><div class="rec" style="margin-top:10px">${p.rec}</div><p style="margin:10px 0 0;color:var(--ink2);font-size:.9rem">⏱ ${p.cx}</p></div></div></div>`;
}
function lineExHtml(p, pos, exLines) {
  if (pos < 0) return 'ไม่มีคำอธิบาย';
  const i = exLines[pos]; return `<div class="tag">บรรทัด ${i + 1}: <code>${esc(code(p).lines[i].trim())}</code></div>${exFor(p, i)}`;
}
function moveEx(dir) {
  const p = byId(S.pid), { marks } = code(p), exLines = Object.keys(p.ex || {}).map(k => marks[k]).filter(x => x !== undefined).sort((a, b) => a - b);
  const pos = Math.max(0, Math.min(exLines.length - 1, exLines.indexOf(S.sel) + dir)); S.sel = exLines[pos]; $('#tabbody').innerHTML = codeTabHtml(p);
}

/* quiz */
const norm = s => String(s).trim().replace(/[,\s]/g, '').replace(/−/g, '-');
function checkNum(val, ans) { const a = norm(val), b = norm(ans); if (a === b) return true; const x = parseFloat(a), y = parseFloat(b); return !isNaN(x) && !isNaN(y) && Math.abs(x - y) < 1e-9; }
function quizHtml(p) {
  const qs = quizState(p.n), answered = Object.keys(qs).length, score = Object.values(qs).filter(x => x.ok).length;
  return `<div class="score"><b>คะแนน: ${score} / ${p.quiz.length}</b><span style="color:var(--ink2)">ทำแล้ว ${answered} / ${p.quiz.length}</span>${answered ? '<button class="btn sm" data-act="quizreset">ทำใหม่</button>' : ''}</div>` +
    p.quiz.map((q, i) => {
      const a = qs[i], done = !!a;
      const inner = q.t === 'mc' ? `<div class="opts">${q.o.map((o, j) => `<button class="opt ${done ? (j === q.a ? 'right' : (j === a.val ? 'wrong' : '')) : ''}" data-qi="${i}" data-opt="${j}" ${done ? 'disabled' : ''}>${esc(o)}</button>`).join('')}</div>`
        : `<div class="numrow"><input type="text" inputmode="decimal" placeholder="พิมพ์คำตอบ" data-qinput="${i}" value="${done ? esc(a.val) : ''}" ${done ? 'disabled' : ''}><button class="btn pri" data-qcheck="${i}" ${done ? 'disabled' : ''}>ตรวจ</button></div>`;
      return `<div class="qcard"><div class="qn">คำถามที่ ${i + 1}</div><div class="q">${esc(q.q)}</div>${inner}${done ? `<div class="fb ${a.ok ? 'ok' : 'bad'}"><b>${a.ok ? '✓ ถูกต้อง' : '✗ ยังไม่ถูก'}</b> — ${q.t === 'num' && !a.ok ? `คำตอบที่ถูกคือ <b>${esc(q.a)}</b>. ` : ''}${esc(q.why)}</div>` : ''}</div>`;
    }).join('') + `<div class="row"><a class="btn" href="${AP.labHref(p.n, 'anim')}">🎬 กลับไปดูอนิเมชัน</a></div>`;
}
function answerQuiz(i, val) {
  const p = byId(S.pid), q = p.quiz[i], qs = quizState(p.n); if (qs[i]) return;
  const ok = q.t === 'mc' ? val === q.a : checkNum(val, q.a); if (q.t === 'num' && !String(val).trim()) return;
  qs[i] = { val, ok }; saveQuiz(p.n, qs); $('#tabbody').innerHTML = quizHtml(p); AP.progress();
}

/* answer tab */
function answerHtml(p) {
  return `<div class="card"><h3>คำถามจากโจทย์</h3>${p.q}</div>
  <div class="card"><h3>คำตอบของคุณ (บันทึกอัตโนมัติในเบราว์เซอร์นี้)</h3><textarea class="ta" id="myans" placeholder="อธิบายด้วยคำพูดของตัวเอง เช่น ตาราง F ที่ได้ เหตุผลของการเลือกค่า ...">${esc(getAns(p.n))}</textarea>
  <div class="row"><button class="btn" data-act="copyans">📋 คัดลอกคำตอบ</button><button class="btn pri" data-act="showans">👁 ดูเฉลยตัวอย่าง</button><a class="btn" href="#reflect" data-goreflect="${p.n}">🤖 ไปสร้าง Prompt คุยกับ AI</a></div><div id="modelans" hidden><div class="ans"><span class="pill">เฉลยตัวอย่าง</span>${p.ans}</div></div></div>
  <div class="card"><h3>โค้ดที่ใช้ส่ง (พร้อมผลรัน)</h3><pre>${esc(code(p).lines.join('\n'))}</pre><div class="row"><button class="btn" data-act="copycode">📋 คัดลอกโค้ด</button></div><h3 style="margin-top:8px">ผลลัพธ์</h3><pre class="out">${esc(p.out)}</pre></div>`;
}

/* reflect */
function promptFor(p) {
  const mine = getAns(p.n).trim(), c = code(p).lines.join('\n');
  return `สวัสดี AI ฉันกำลังศึกษาเรื่อง Dynamic Programming จากโจทย์ข้อ ${p.n} เรื่อง ${p.title} นี่คือโค้ดและตารางคำนวณที่ฉันทำขึ้นมา:

โจทย์: ${stripHtml(p.story)}

โค้ด Python:
${c}

ผลลัพธ์ที่ได้: ${p.out}

คำตอบของฉัน: ${mine || '[ให้นิสิตแปะคำตอบเขียนตอบของตัวเองตรงนี้]'}

ช่วยตรวจสอบและตั้งคำถามสัมภาษณ์ฉันทีละ 1 คำถาม โดยใช้เกณฑ์ตรวจสอบดังนี้:
*** ในส่วนของคำถามนิสิตต้องตั้งคำถามให้สอดคล้องกับเรื่องที่กำลังคุยด้วย ***
โดยข้างล่างนี้จะเป็นตัวอย่างคำถาม ของหัวข้อเรื่องที่ ${p.n}
${p.reflect.map((q, i) => `${i + 1}. ${q}`).join('\n')}

หมายเหตุ: ให้ AI ถามทีละข้อ และรอให้ฉันพิมพ์ตอบก่อน ค่อยประเมินว่าฉันเข้าใจถูกไหม แล้วจึงค่อยถามคำถามข้อถัดไปนะ`;
}
function reflectHtml() {
  const p = byId(S.rpid);
  return `<div class="wrap"><div class="phead"><div class="ptitle"><div class="pno">🤖</div><div><h1>Reflection Prompts</h1><small>ส่วนที่ 2: ไปถกเถียงและวิเคราะห์ร่วมกับ AI</small></div></div></div>
  <div class="callout info"><b class="h">งานที่ต้องส่ง</b>ไฟล์ PDF ที่ประกอบด้วย โจทย์ที่เขียนโปรแกรมและมีผลแสดงเรียบร้อยแล้ว และถามตอบกับ AI ทุกข้อ (แต่ละข้อมีอย่างน้อย 3 คำถามหลัก ไม่รวมคำถามรองที่ AI ถามคุณ ในกรณีที่มีคำถามวัดความมั่นใจ)</div>
  <div class="card"><h3>1) เลือกข้อ (แถบเขียว = มีบันทึกบทสนทนาแล้ว)</h3><div class="pickers">${PROBLEMS.map(q => `<button class="pick ${q.n === S.rpid ? 'on' : ''} ${getChat(q.n) ? 'has' : ''}" data-rpick="${q.n}">${q.n}</button>`).join('')}</div></div>
  <div class="card"><h3>2) คัดลอก Prompt นี้ไปวางในแชตกับ AI — ข้อ ${p.n}: ${esc(p.title)}</h3>
    <p style="margin:0 0 8px;color:var(--ink2);font-size:.92rem">Prompt ใส่โค้ดและคำตอบของคุณให้อัตโนมัติ (แก้คำตอบได้ที่แท็บ <a href="${AP.labHref(p.n, 'answer')}">ตอบคำถาม</a>) — คำถามตัวอย่าง 3 ข้อด้านล่างปรับให้ตรงกับเรื่องนี้แล้ว</p>
    <pre class="promptbox" id="promptbox">${esc(promptFor(p))}</pre><div class="row"><button class="btn pri" data-act="copyprompt">📋 คัดลอก Prompt</button></div></div>
  <div class="card"><h3>3) บันทึกบทสนทนากับ AI ของข้อนี้ (ใช้ทำรายงาน)</h3><textarea class="ta" id="chatlog" style="min-height:220px" placeholder="วางบทสนทนา (คำถามของ AI + คำตอบของคุณ) ตรงนี้ อย่างน้อย 3 คำถามหลัก">${esc(getChat(p.n))}</textarea></div>
  <div class="card"><h3>4) รวมรายงานทั้ง 20 ข้อ</h3><p style="margin:0 0 8px;color:var(--ink2);font-size:.92rem">รวมโจทย์ โค้ด ผลลัพธ์ คำตอบของคุณ และบทสนทนากับ AI เป็นข้อความ Markdown — กดคัดลอกแล้วไปวางใน Word / Google Docs เพื่อทำเป็น PDF ต่อ</p><div class="row"><button class="btn pri" data-act="report">📋 คัดลอกรายงาน (Markdown)</button><button class="btn" data-act="showreport">👁 แสดงรายงาน</button></div><textarea class="ta" id="reportbox" readonly hidden style="min-height:260px;margin-top:10px"></textarea></div></div>`;
}
function reportMd() {
  return `# รายงาน Dynamic Programming Lab\n\n` + PROBLEMS.map(p => `## ข้อ ${p.n}: ${p.title}\n\n**โจทย์:** ${stripHtml(p.story)}\n\n**คำถาม:** ${stripHtml(p.q)}\n\n### โค้ด Python\n\n\`\`\`python\n${code(p).lines.join('\n')}\n\`\`\`\n\n### ผลลัพธ์\n\n\`\`\`\n${p.out}\n\`\`\`\n\n### คำตอบของฉัน\n\n${getAns(p.n).trim() || '_(ยังไม่ได้เขียน)_'}\n\n### บทสนทนากับ AI\n\n${getChat(p.n).trim() || '_(ยังไม่ได้บันทึก)_'}\n`).join('\n---\n\n');
}

/* ---------- mount (แทน router เดิม) ---------- */
const TAB_IDS = TABS.map(t => t[0]);
function mount(host, n, tab) {
  stopPlay();
  const changed = S.pid !== n || S.view !== 'p';
  S.host = host; S.view = 'p'; S.pid = n; S.tab = TAB_IDS.includes(tab) ? tab : 'problem';
  if (changed) { S.variant = 0; S.sel = null; }
  S.step = changed || S.tab !== 'anim' ? 0 : S.step;
  host.innerHTML = problemHtml(byId(n));
  if (S.tab === 'anim') drawViz();
}
// แสดงแค่อนิเมชันของข้อ (ใช้ในแท็บ "อนิเมชัน" ของบทที่ไม่มีเครื่องเล่นจาก dp-week8)
function mountAnim(host, n) {
  stopPlay();
  const changed = S.pid !== n;
  S.host = host; S.view = 'p'; S.pid = n; S.tab = 'anim'; if (changed) { S.variant = 0; S.step = 0; }
  const p = byId(n);
  host.innerHTML = `<div class="wrap">${animHtml(p)}</div>`;
  drawViz();
}
function mountReflect(host, n) { stopPlay(); S.host = host; S.view = 'reflect'; if (n) S.rpid = n; host.innerHTML = reflectHtml(); }
const live = () => S.host && S.host.isConnected;
const inHost = e => live() && S.host.contains(e.target);

document.addEventListener('click', e => {
  if (!inHost(e)) return;
  const t = e.target.closest('button,a,[data-line]'); if (!t) return;
  const d = t.dataset, p = S.view === 'p' ? byId(S.pid) : null;
  if (d.tab) { location.hash = AP.labHref(S.pid, d.tab); return; }
  if (d.variant !== undefined) { stopPlay(); S.variant = +d.variant; S.step = 0; $('#tabbody') ? ($('#tabbody').innerHTML = animHtml(p)) : (S.host.firstElementChild.innerHTML = animHtml(p)); drawViz(); return; }
  if (d.qi !== undefined) { answerQuiz(+d.qi, +d.opt); return; }
  if (d.qcheck !== undefined) { answerQuiz(+d.qcheck, $(`[data-qinput="${d.qcheck}"]`).value); return; }
  if (d.rpick) { S.rpid = +d.rpick; S.host.innerHTML = reflectHtml(); return; }
  if (d.goreflect) { S.rpid = +d.goreflect; return; }
  if (d.line !== undefined && S.tab === 'code') { const i = +d.line; if (exFor(p, i)) { S.sel = i; $('#tabbody').innerHTML = codeTabHtml(p); } return; }
  const a = d.act; if (!a) return;
  const steps = p && S.tab === 'anim' ? run(p).variants[S.variant].steps : null;
  switch (a) {
    case 'play': S.playing ? (stopPlay(), drawViz()) : startPlay(); break;
    case 'next': stopPlay(); S.step = Math.min(steps.length - 1, S.step + 1); drawViz(); break;
    case 'prev': stopPlay(); S.step = Math.max(0, S.step - 1); drawViz(); break;
    case 'first': stopPlay(); S.step = 0; drawViz(); break;
    case 'exprev': moveEx(-1); break; case 'exnext': moveEx(1); break;
    case 'quizreset': saveQuiz(p.n, {}); $('#tabbody').innerHTML = quizHtml(p); AP.progress(); break;
    case 'showans': { const el = $('#modelans'); el.hidden = !el.hidden; t.textContent = el.hidden ? '👁 ดูเฉลยตัวอย่าง' : '🙈 ซ่อนเฉลย'; break; }
    case 'copyans': copy(getAns(p.n) || ''); break;
    case 'copycode': copy(code(p).lines.join('\n')); break;
    case 'copyprompt': copy(promptFor(byId(S.rpid))); break;
    case 'report': copy(reportMd()); break;
    case 'showreport': { const el = $('#reportbox'); el.value = reportMd(); el.hidden = !el.hidden; if (!el.hidden) el.select(); break; }
  }
});
document.addEventListener('input', e => {
  if (!inHost(e)) return;
  const t = e.target;
  if (t.matches('[data-act="seek"]')) { stopPlay(); S.step = +t.value; drawViz(); }
  else if (t.id === 'myans') setAns(S.pid, t.value);
  else if (t.id === 'chatlog') { setChat(S.rpid, t.value); }
});
document.addEventListener('change', e => { if (inHost(e) && e.target.matches('[data-act="speed"]')) { S.speed = +e.target.value; if (S.playing) startPlay(); } });
document.addEventListener('keydown', e => {
  if (!live()) { stopPlay(); return; }
  if (e.target.matches('input,textarea,select')) { if (e.key === 'Enter' && e.target.dataset.qinput !== undefined && inHost(e)) answerQuiz(+e.target.dataset.qinput, e.target.value); return; }
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (S.view !== 'p' || S.tab !== 'anim' || !$('#viz')) return;
  const steps = run(byId(S.pid)).variants[S.variant].steps;
  if (e.key === 'ArrowRight') { stopPlay(); S.step = Math.min(steps.length - 1, S.step + 1); drawViz(); e.preventDefault(); }
  else if (e.key === 'ArrowLeft') { stopPlay(); S.step = Math.max(0, S.step - 1); drawViz(); e.preventDefault(); }
  else if (e.key === ' ' && !e.target.closest('button')) { S.playing ? (stopPlay(), drawViz()) : startPlay(); e.preventDefault(); }
});
function reset() { ['quiz', 'ans', 'chat'].forEach(k => store.set(k, {})); }
AP.lab = {
  PROBLEMS, GROUPS, byId, isDone, mount, mountAnim, mountReflect, stop: stopPlay, reset,
  quizScore: n => { const qs = quizState(n); return { done: Object.keys(qs).length, ok: Object.values(qs).filter(x => x.ok).length, total: byId(n).quiz.length }; },
};
