/* shell.js — router (hash), sidebar, ธีม, หน้าบท (แท็บ เรียน/อนิเมชัน/แบบฝึก/ควิซ/เกม)
 * โมดูลเดิมทั้งสาม (dp8, lab, gr) ถูก mount เข้ามาทีละแท็บ และถูกเก็บกวาดก่อนเปลี่ยนหน้า
 * เส้นทาง: #home · #t/<บท>/<แท็บ>[/<ข้อ>[/<แท็บย่อยของ lab>]] · #exam · #realexam · #games · #game/<id> · #cheat · #reflect · #progress */
(function () {
  'use strict';
  const { esc } = AP;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const main = $('#ap-main'), side = $('#ap-side');
  const P = AP.pages;
  AP.TAB_LABEL.game = 'เกม';
  const TAB_ICON = { learn: '📖', anim: '🎬', practice: '✍️', quiz: '✅', game: '🎮' };
  let cleanups = [], lastKey = '';

  /* ---------- ธีม ---------- */
  const root = document.documentElement;
  const savedTheme = AP.store.get('theme', null);
  if (savedTheme) root.dataset.theme = savedTheme;
  const isDark = () => (root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
  $('#ap-theme').addEventListener('click', () => { const t = isDark() ? 'light' : 'dark'; root.dataset.theme = t; AP.store.set('theme', t); });

  /* ---------- เมนูมือถือ ---------- */
  const setNav = (open) => { document.body.classList.toggle('ap-nav-open', open); $('#ap-menu').setAttribute('aria-expanded', String(open)); $('#ap-scrim').hidden = !open; };
  $('#ap-menu').addEventListener('click', () => setNav(!document.body.classList.contains('ap-nav-open')));
  $('#ap-scrim').addEventListener('click', () => setNav(false));
  side.addEventListener('click', (e) => { if (e.target.closest('a')) setNav(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setNav(false); });

  /* ---------- sidebar ---------- */
  function renderSide(curId) {
    const cur = curId || side.dataset.cur || '';
    side.dataset.cur = cur;
    const tools = [['home', '#home', '🏠', 'หน้าแรก'], ['exam', '#exam', '⏱', 'สอบจำลอง'], ['realexam', '#realexam', '📝', 'ข้อสอบจริง'], ['games', '#games', '🎮', 'เกม'], ['cheat', '#cheat', '📋', 'Cheat sheet'], ['progress', '#progress', '📈', 'ความคืบหน้า']];
    const passed = AP.TOPICS.filter((t) => AP.prog.status(t.id) === 'passed').length;
    side.innerHTML = `<div class="ap-nav-top">${tools.map(([id, href, ic, l]) => `<a class="ap-link ${cur === id ? 'cur' : ''}" href="${href}" ${cur === id ? 'aria-current="page"' : ''}><span class="no">${ic}</span><span class="t">${l}</span></a>`).join('')}</div>
      ${AP.PARTS.filter((p) => p.id < 4).map((p) => `<div class="ap-part" style="--pc:${p.color}"><div class="ap-part-h"><i></i>${p.title}</div>${AP.TOPICS.filter((t) => t.part === p.id).map((t) => { const st = AP.prog.status(t.id); return `<a class="ap-link ${cur === t.id ? 'cur' : ''}" href="#t/${t.id}/learn" ${cur === t.id ? 'aria-current="page"' : ''}><span class="no">${t.no}</span><span class="t">${esc(t.short)}</span><span class="ap-dot ${st === 'new' ? '' : st}" title="${st === 'passed' ? 'ผ่านแล้ว' : st === 'started' ? 'กำลังเรียน' : 'ยังไม่เริ่ม'}"></span></a>`; }).join('')}</div>`).join('')}
      <div class="ap-side-prog"><div class="ap-bar"><i style="width:${passed / AP.TOPICS.length * 100}%"></i></div>ผ่านควิซแล้ว <b>${passed}/${AP.TOPICS.length}</b> บท</div>`;
    const c = $('.ap-link.cur', side); if (c && side.scrollHeight > side.clientHeight) c.scrollIntoView({ block: 'nearest' });
  }
  AP.hooks.onProgress = () => renderSide();
  AP.hooks.nextAfterQuiz = () => '';

  /* ---------- เก็บกวาดโมดูลก่อนเปลี่ยนหน้า ---------- */
  function cleanup() {
    ['dispose', 'disposeQuiz', 'disposeGame'].forEach((k) => { if (AP.hooks[k]) { try { AP.hooks[k](); } catch (e) { /* ignore */ } AP.hooks[k] = null; } });
    cleanups.forEach((f) => { try { f(); } catch (e) { /* ignore */ } }); cleanups = [];
    try { AP.gr.unmount(); } catch (e) { /* ignore */ }
    try { AP.lab.stop(); } catch (e) { /* ignore */ }
  }
  // โมดูลบางตัวฝากตัวเก็บกวาดไว้ที่ AP.hooks.dispose ให้ย้ายมาไว้ในรายการของหน้านี้
  const adopt = () => { if (AP.hooks.dispose) { cleanups.push(AP.hooks.dispose); AP.hooks.dispose = null; } };
  const keepPlayer = (pl) => { if (pl && pl.pause) cleanups.push(() => pl.pause()); return pl; };

  /* ---------- หน้าบท ---------- */
  const tabsOf = (t) => { const ts = t.tabs.filter((k) => k !== 'practice' || t.lab.length || t.gp.length); if (t.games.length) ts.push('game'); return ts; };
  const hostDiv = (cls) => { const d = document.createElement('div'); if (cls) d.className = cls; return d; };

  function bodyLearn(t, body) {
    AP.prog.touch(t.id);
    if (t.dp8) {
      const ch = AP.dp8.byId(t.dp8);
      body.innerHTML = '<div class="m-dp8"><div class="lh"></div></div><div class="ap-after"></div>';
      AP.dp8.mountLearn(ch, $('.lh', body)); $('.ap-after', body).innerHTML = P.dpExtras(t);
    } else {
      const fn = AP.learn[t.extra] || (AP.tm && AP.tm.learn[t.extra]);
      body.innerHTML = fn ? fn() : '';
      const d = $('[data-defs]', body); if (d) AP.gr.mountDefs(d);
    }
  }
  function bodyAnim(t, body) {
    AP.prog.touch(t.id);
    if (t.dp8) {
      body.innerHTML = '<div class="m-dp8"><div class="am"></div></div>';
      AP.dp8.mountPlay(AP.dp8.byId(t.dp8), $('.am', body)); adopt();
    } else if (t.gr) {
      const h = hostDiv('gr-host'); body.appendChild(h); AP.gr.mountLab(t.gr, h);
    } else if (t.id === 'gprin') {
      const a = hostDiv(), b = hostDiv(); body.append(a, document.createElement('hr'), b);
      keepPlayer(P.criteria(a));
      b.innerHTML = '<h2 class="ap-h2">อนิเมชัน: Activity Selection เรียงตามเวลาจบ</h2><div class="gp-anim"></div>';
      keepPlayer(AP.GP.mountAnim(5, $('.gp-anim', b)));
    } else if (AP.w7 && AP.w7.DEMOS[t.id]) {
      body.innerHTML = '<div class="m-w7"><div class="w7h"></div></div>';
      keepPlayer(AP.w7.mount(t.id, $('.w7h', body)));
    } else if (AP.tm && AP.tm.anim[t.id]) {
      keepPlayer(AP.tm.anim[t.id](body));
    } else if (t.lab.length) {
      const first = t.lab[0];
      body.innerHTML = `<div class="ap-sub" role="group" aria-label="เลือกข้อ">${t.lab.map((n) => `<button type="button" data-n="${n}" aria-pressed="${n === first}">ข้อ ${n} · ${esc(AP.lab.byId(n).title)}</button>`).join('')}</div><div class="m-lab"><div class="lm"></div></div>`;
      const show = (n) => AP.lab.mountAnim($('.lm', body), n);
      show(first);
      body.querySelector('.ap-sub').addEventListener('click', (e) => { const b = e.target.closest('[data-n]'); if (!b) return; $$('[data-n]', body).forEach((x) => x.setAttribute('aria-pressed', String(x === b))); show(+b.dataset.n); });
    }
  }
  function bodyPractice(t, body, a, b) {
    AP.prog.touch(t.id);
    const items = [...t.lab.map((n) => ({ k: 'lab', n })), ...t.gp.map((n) => ({ k: 'gp', n }))];
    let n = +a; if (!items.some((x) => x.n === n)) n = items[0].n;
    const sel = items.find((x) => x.n === n);
    const labelOf = (x) => (x.k === 'lab' ? `ข้อ ${x.n} · ${esc(AP.lab.byId(x.n).title)}` : (t.gp.length > 4 ? `${AP.LEVEL_ICON[AP.GP.NB[x.n].level][0]} ${x.n}` : `Greedy ข้อ ${x.n} · ${esc(AP.GP.byN(x.n).title.replace(/^ข้อ \d+:\s*/, ''))}`));
    const href = (x) => `#t/${t.id}/practice/${x.n}${x.k === 'lab' ? '/problem' : ''}`;
    body.innerHTML = `<div class="ap-sub" role="navigation" aria-label="เลือกข้อ">${items.map((x) => `<a href="${href(x)}" ${x.n === n ? 'aria-current="page"' : ''}>${labelOf(x)}</a>`).join('')}</div><div class="pr-body"></div>`;
    const host = $('.pr-body', body);
    if (sel.k === 'lab') { host.innerHTML = '<div class="m-lab"><div class="lm"></div></div>'; AP.lab.mount($('.lm', host), n, b || 'problem'); }
    else { P.gproblem(host, n); const pl = $('.gp-anim', host); }
  }
  function bodyQuiz(t, body) {
    AP.prog.touch(t.id);
    body.innerHTML = '<div class="qz-host"></div>';
    AP.quiz.mountTopic($('.qz-host', body), t);
  }
  function bodyGame(t, body) {
    body.innerHTML = `<p class="ap-lede">เกมที่ช่วยทบทวนบทนี้ (สุ่มโจทย์ใหม่ทุกรอบ)</p><div class="ap-grid ap-games">${t.games.map((id) => { const g = AP.GAMES.find((x) => x.id === id); return `<a class="ap-card ap-tool" href="#game/${g.id}"><b class="ap-gt">${g.icon} ${g.title}</b><span class="ap-small ap-muted">${g.desc}</span></a>`; }).join('')}</div>`;
  }

  function renderTopic(t, tab, a, b) {
    const tabs = tabsOf(t); if (!tabs.includes(tab)) tab = tabs[0];
    const part = AP.PARTS.find((p) => p.id === t.part), i = AP.topicIndex(t.id), prev = AP.TOPICS[i - 1], next = AP.TOPICS[i + 1], st = AP.prog.status(t.id), pr = AP.prog.get(t.id);
    const chip = st === 'passed' ? `<span class="ap-chip ok">ผ่านแล้ว · ควิซ ${Math.round(pr.q * 100)}%</span>` : st === 'started' ? '<span class="ap-chip started">กำลังเรียน</span>' : '';
    main.innerHTML = `<div class="ap-wrap"><div class="ap-thead" style="--pc:${part.color}"><span class="ap-eyebrow" style="color:${part.color}">${part.k} · บท ${t.no}</span><h1 class="ap-h1">${esc(t.title)}</h1>${chip ? `<div class="ap-row">${chip}</div>` : ''}</div>
      <nav class="ap-tabs" aria-label="หัวข้อในบท">${tabs.map((k) => `<a href="#t/${t.id}/${k}" ${k === tab ? 'aria-current="page"' : ''}>${TAB_ICON[k]} ${AP.TAB_LABEL[k]}</a>`).join('')}</nav>
      <div class="ap-body" id="ap-body"></div>
      <div class="ap-row ap-cta">${tabs.indexOf(tab) < tabs.length - 1 ? `<a class="ap-btn pri" href="#t/${t.id}/${tabs[tabs.indexOf(tab) + 1]}">ต่อไป: ${AP.TAB_LABEL[tabs[tabs.indexOf(tab) + 1]]} →</a>` : (next ? `<a class="ap-btn pri" href="#t/${next.id}/learn">บทถัดไป: ${next.no} ${esc(next.short)} →</a>` : '<a class="ap-btn pri" href="#exam">⏱ ไปสอบจำลอง →</a>')}</div>
      <nav class="ap-pn" aria-label="ย้ายบท">${prev ? `<a href="#t/${prev.id}/learn">← ${prev.no} ${esc(prev.short)}</a>` : '<span></span>'}${next ? `<a href="#t/${next.id}/learn">${next.no} ${esc(next.short)} →</a>` : ''}</nav></div>`;
    const body = $('#ap-body', main);
    ({ learn: bodyLearn, anim: bodyAnim, practice: bodyPractice, quiz: bodyQuiz, game: bodyGame })[tab](t, body, a, b);
    adopt();
    renderSide(t.id);
    document.title = `${t.no} ${t.short} · ${AP.TAB_LABEL[tab]} — AlgoPrep`;
  }

  /* ---------- router ---------- */
  function route() {
    const parts = (location.hash || '#home').replace(/^#\/?/, '').split('/').filter(Boolean); if (!parts.length) parts.push('home');
    const key = parts.slice(0, 4).join('/');
    cleanup();
    const v = parts[0];
    let title = 'AlgoPrep 254383', sideId = v;
    if (v === 't') {
      const t = AP.topic(parts[1]);
      if (!t) { location.replace('#home'); return; }
      renderTopic(t, parts[2] || 'learn', parts[3], parts[4]); sideId = t.id;
    } else if (v === 'exam') { main.innerHTML = '<div class="ap-wrap"><div class="ex-host"></div></div>'; AP.quiz.mountExam($('.ex-host', main)); title = 'สอบจำลอง'; }
    else if (v === 'realexam') { main.innerHTML = '<div class="ap-wrap"><div class="re-host"></div></div>'; AP.quiz.mountReal($('.re-host', main)); title = 'ข้อสอบจริง'; }
    else if (v === 'games') { P.games(main); title = 'เกม'; }
    else if (v === 'game') { const g = AP.GAMES.find((x) => x.id === parts[1]); if (!g) { location.replace('#games'); return; } AP.games.mount(g.id, main); title = g.title; sideId = 'games'; }
    else if (v === 'cheat') { P.cheat(main); title = 'Cheat sheet'; }
    else if (v === 'progress') { P.progress(main); title = 'ความคืบหน้า'; }
    else { P.home(main); sideId = 'home'; }
    if (v !== 't') { renderSide(sideId); document.title = `${title} — AlgoPrep`; }
    adopt();
    // เลื่อนกลับบนสุด ยกเว้นเปลี่ยนแท็บย่อยภายในข้อเดียวกัน
    if (key !== lastKey && !(lastKey && key.split('/').slice(0, 4).join('/') === lastKey)) { window.scrollTo(0, 0); }
    lastKey = key;
    main.focus({ preventScroll: true });
  }
  window.addEventListener('hashchange', route);
  $('[data-skip]').addEventListener('click', (e) => { e.preventDefault(); main.focus(); });
  renderSide('home'); route();
})();
