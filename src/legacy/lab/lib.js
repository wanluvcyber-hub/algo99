'use strict';
/* ===== helpers & builders for problem data ===== */
const INF = Infinity;
const PROBLEMS = [];
const GROUPS = [
  { id: 1, name: 'Coin Problems & Basic DP', short: 'Coin & Basic', range: [1, 5], icon: '🪙', desc: 'สร้าง Recurrence Relation และหลีกเลี่ยงการคำนวณซ้ำ' },
  { id: 2, name: 'Knapsack & Memory Functions', short: 'Knapsack', range: [6, 10], icon: '🎒', desc: 'ปัญหาสองมิติ: น้ำหนักและความคุ้มค่า' },
  { id: 3, name: 'Optimal BST, Matrix Chain, LCS', short: 'Optimal BST', range: [11, 15], icon: '🌳', desc: 'จัดโครงสร้างข้อมูลให้คุ้มที่สุดตามความถี่ / จุดแบ่งปัญหาย่อย' },
  { id: 4, name: "Warshall's & Floyd's", short: 'Warshall & Floyd', range: [16, 20], icon: '🗺️', desc: 'DP บนกราฟ อัปเดตข้อมูลผ่านจุดผ่านกลาง (vertex k)' },
];

const cl = a => Array.isArray(a) ? a.map(cl) : a;           // deep clone of nested arrays
const rnd = v => (typeof v === 'number' && isFinite(v)) ? Math.round(v * 100) / 100 : v;
const range = (a, b) => Array.from({ length: Math.max(0, b - a) }, (_, i) => a + i);
const inf = v => v === INF ? '∞' : v;

/* code string -> {lines, marks}; a trailing "#@name" marks a line */
function parseCode(src) {
  const lines = [], marks = {};
  src.replace(/^\n/, '').replace(/\n$/, '').split('\n').forEach((raw, i) => {
    const m = raw.match(/\s*#@(\w+)\s*$/);
    if (m) { marks[m[1]] = i; raw = raw.slice(0, m.index); }
    lines.push(raw);
  });
  return { lines, marks };
}

/* panel builders */
const tbl = (title, rows, o = {}) => ({ type: 'table', title, rows: cl(Array.isArray(rows[0]) ? rows : [rows]), ...o });
const graphP = (title, g, o = {}) => ({ type: 'graph', title, g, ...o });
const treeP = (title, nodes, st, val, o = {}) => ({ type: 'tree', title, nodes, st: st.slice(), val: val ? val.slice() : [], ...o });
const barsP = (title, items, max) => ({ type: 'bars', title, items, max });
const textP = (title, html) => ({ type: 'text', title, html });

/* trace recorder: line may be a marker name */
function Rec() {
  const steps = [];
  return { steps, add(line, note, panels) { steps.push({ line, note, panels }); } };
}
const V1 = steps => ({ variants: [{ name: '', steps }] });

/* register */
function P(o) { PROBLEMS.push(o); }
