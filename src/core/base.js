/* base.js — namespace กลาง AP, storage คีย์เดียว, ตัวช่วยเล็ก ๆ */
window.AP = (function () {
  'use strict';
  const KEY = 'algoprep:v1';
  let mem = {};
  try { mem = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { mem = {}; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* ใช้ storage ไม่ได้ก็ทำงานต่อได้ */ } };
  const store = {
    get(k, d) { return mem[k] === undefined ? d : JSON.parse(JSON.stringify(mem[k])); },
    set(k, v) { mem[k] = v; save(); },
    clear() { mem = { theme: mem.theme }; save(); },
    keys() { return Object.keys(mem); },
    // storage แยกชื่อสำหรับแต่ละโมดูล (โค้ดเดิมเรียก get/set แบบเดิมได้)
    ns(p) { return { get: (k, d) => store.get(p + ':' + k, d), set: (k, v) => store.set(p + ':' + k, v) }; },
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  function toast(msg) {
    const t = document.createElement('div'); t.className = 'ap-toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), 1800);
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); toast('คัดลอกแล้ว ✓'); return true; } catch (e) { toast('คัดลอกอัตโนมัติไม่ได้ — เลือกข้อความแล้วกด Ctrl+C'); return false; }
  }
  // ปุ่มยืนยันในหน้า (เว็บนี้ใช้ confirm() ไม่ได้): กดครั้งแรกเปลี่ยนข้อความ กดซ้ำภายใน 4 วิถึงทำจริง
  function confirmBtn(btn, label, fn) {
    if (btn.dataset.armed) { delete btn.dataset.armed; btn.textContent = btn.dataset.orig; fn(); return; }
    btn.dataset.orig = btn.textContent; btn.dataset.armed = '1'; btn.textContent = label;
    setTimeout(() => { if (btn.dataset.armed) { delete btn.dataset.armed; btn.textContent = btn.dataset.orig; } }, 4000);
  }
  // ความคืบหน้าต่อบท {v: เคยเปิด, q: คะแนนควิซดีที่สุด 0..1, n: จำนวนครั้งที่ทำควิซ}
  const prog = {
    all() { return store.get('prog', {}); },
    get(id) { return store.get('prog', {})[id] || null; },
    touch(id) { const a = store.get('prog', {}); if (!a[id]) { a[id] = { v: 1, q: 0, n: 0 }; store.set('prog', a); } },
    quiz(id, ratio) { const a = store.get('prog', {}); const p = a[id] || { v: 1, q: 0, n: 0 }; p.q = Math.max(p.q || 0, ratio); p.n = (p.n || 0) + 1; a[id] = p; store.set('prog', a); },
    status(id) { const p = prog.get(id); return !p ? 'new' : p.q >= 0.6 ? 'passed' : 'started'; },
  };
  return {
    store, esc, shuffle, rnd, toast, copy, confirmBtn, prog,
    hooks: {},               // shell ใส่ callback เช่น onProgress
    progress() { if (this.hooks.onProgress) this.hooks.onProgress(); },
    RM: !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches),
  };
})();
