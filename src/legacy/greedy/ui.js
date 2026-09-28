/* ================= UI helpers ================= */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const NS='http://www.w3.org/2000/svg';
const svgEl=(t,a={})=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);return e};
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function tweenNum(el,from,to,fmt=x=>x){
  if(el._tw){cancelAnimationFrame(el._tw);el._tw=0}
  if(RM||from===null||from===to||from===undefined){el.textContent=fmt(to);return}
  const t0=performance.now(),D=450;
  const f=now=>{const k=Math.min(1,(now-t0)/D);el.textContent=fmt(Math.round(from+(to-from)*k));el._tw=k<1?requestAnimationFrame(f):0};
  el._tw=requestAnimationFrame(f);
}

/* ================= StepPlayer ================= */
class StepPlayer{
  constructor(host,onStep){
    this.host=host;this.onStep=onStep;this.steps=[];this.i=0;this.playing=false;this.speed=1;this.timer=null;
    host.classList.add('player');
    const uid='pl'+Math.random().toString(36).slice(2,7);
    host.innerHTML=`<div class="pl-row">
      <button class="btn" type="button" data-a="reset" aria-label="รีเซ็ต">⏮ รีเซ็ต</button>
      <button class="btn" type="button" data-a="prev" aria-label="ย้อนกลับ">◀ ย้อนกลับ</button>
      <button class="btn primary" type="button" data-a="next" aria-label="ถัดไป">ถัดไป ▶</button>
      <button class="btn" type="button" data-a="play" aria-label="เล่นอัตโนมัติ">⏯ เล่นอัตโนมัติ</button></div>
      <div class="pl-row2">
        <label class="pl-prog" for="${uid}-p"><span class="pl-count">ขั้นที่ 1 / 1</span><input id="${uid}-p" type="range" min="0" max="0" value="0" aria-label="ไปยังขั้นที่"></label>
        <label class="pl-speed" for="${uid}-s">ความเร็ว <input id="${uid}-s" type="range" min="0.5" max="3" step="0.5" value="1"><output>1x</output></label>
      </div>
      <p class="hint">คีย์บอร์ด: <span class="kbd">←</span> <span class="kbd">→</span> เปลี่ยนขั้น · <span class="kbd">Space</span> เล่น/หยุด · <span class="kbd">R</span> รีเซ็ต</p>`;
    this.count=$('.pl-count',host);this.prog=$('.pl-prog input',host);this.spd=$('.pl-speed input',host);this.out=$('.pl-speed output',host);this.playBtn=$('[data-a=play]',host);
    host.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a;if(a==='reset')this.reset();else if(a==='prev')this.prev();else if(a==='next')this.next();else this.toggle()});
    this.prog.addEventListener('input',()=>{this.pause();this.go(+this.prog.value)});
    this.spd.addEventListener('input',()=>{this.speed=+this.spd.value;this.out.textContent=this.speed+'x'});
  }
  setSteps(steps,i=0){this.pause();this.steps=steps;this.prog.max=Math.max(0,steps.length-1);this.i=-1;this.go(Math.min(i,steps.length-1),0)}
  go(i,dirOverride){
    i=Math.max(0,Math.min(this.steps.length-1,i));
    const dir=dirOverride!==undefined?dirOverride:(i===this.i+1?1:i<this.i?-1:0);
    this.i=i;this.prog.value=i;
    const n=this.steps.length;
    this.count.textContent=`ขั้นที่ ${i+1} / ${n}`;
    this.prog.style.setProperty('--p',(n>1?i/(n-1)*100:100)+'%');
    this.onStep(this.steps[i],i,dir);
  }
  next(){this.pause();this.go(this.i+1)}
  prev(){this.pause();this.go(this.i-1)}
  reset(){this.pause();this.go(0,0)}
  toggle(){this.playing?this.pause():this.play()}
  play(){
    if(this.i>=this.steps.length-1)this.go(0,0);
    this.playing=true;this.playBtn.textContent='⏸ หยุด';this.tick();
  }
  tick(){
    clearTimeout(this.timer);
    this.timer=setTimeout(()=>{
      if(!this.playing)return;
      if(this.i<this.steps.length-1){this.go(this.i+1);this.tick()}else this.pause();
    },1500/this.speed);
  }
  pause(){this.playing=false;clearTimeout(this.timer);this.playBtn.textContent='⏯ เล่นอัตโนมัติ'}
}

/* ================= GraphView ================= */
class GraphView{
  constructor(svg,g,{r=20,vb=[520,340],onEdge=null,onNode=null}={}){
    this.svg=svg;this.g=g;
    svg.setAttribute('viewBox',`0 0 ${vb[0]} ${vb[1]}`);svg.innerHTML='';
    const pos={};g.nodes.forEach(n=>pos[n.id]=n);
    const gE=svgEl('g'),gT=svgEl('g'),gN=svgEl('g');svg.append(gE,gT,gN);
    this.eL=[];this.eT=[];this.nG={};this.nC={};this.nS={};
    g.edges.forEach((e,i)=>{
      const a=pos[e.u],b=pos[e.v],t=e.t??.5;
      const ln=svgEl('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:'edge'});
      const tx=a.x+(b.x-a.x)*t,ty=a.y+(b.y-a.y)*t;
      const tt=svgEl('text',{x:tx,y:ty+5,class:'ew','text-anchor':'middle'});
      tt.textContent=e.w;
      if(onEdge){tt.setAttribute('tabindex','0');tt.setAttribute('role','button');tt.setAttribute('aria-label',`แก้น้ำหนักเส้น ${edgeName(e)} (ตอนนี้ ${e.w})`);
        tt.addEventListener('click',()=>onEdge(i,tx,ty));
        tt.addEventListener('keydown',ev=>{if(ev.key==='Enter'){ev.preventDefault();ev.stopPropagation();onEdge(i,tx,ty)}})}
      gE.append(ln);gT.append(tt);this.eL.push(ln);this.eT.push(tt);
    });
    g.nodes.forEach(n=>{
      const gg=svgEl('g',{class:'node'});
      const c=svgEl('circle',{cx:n.x,cy:n.y,r});
      const id=svgEl('text',{x:n.x,y:n.y,class:'id'});id.textContent=n.id;
      const sub=svgEl('text',{x:n.x,y:n.y+r+15,class:'sub'});
      gg.append(c,id,sub);gN.append(gg);
      this.nG[n.id]=gg;this.nC[n.id]=c;this.nS[n.id]=sub;
      if(onNode)gg.addEventListener('click',()=>onNode(n.id));
    });
  }
  setSub(id,sub,animate){
    const t=this.nS[id];if(t._tw){cancelAnimationFrame(t._tw);t._tw=0}
    if(sub&&typeof sub==='object'){
      if(sub.tween){const [a,b]=sub.tween;
        if(!animate||RM||a===INF||b===INF||a===b){t.textContent=sub.prefix+fmtD(b);return}
        const t0=performance.now();
        const f=now=>{const k=Math.min(1,(now-t0)/450);t.textContent=sub.prefix+Math.round(a+(b-a)*k);t._tw=k<1?requestAnimationFrame(f):0};
        t._tw=requestAnimationFrame(f);return}
      t.innerHTML=`<tspan class="strike">${sub.old}</tspan> ${sub.now}`;return;
    }
    t.textContent=sub??'';
  }
  update(st,animate=true){
    this.g.nodes.forEach(n=>{
      const s=(st.nodes&&st.nodes[n.id])||{};
      this.nG[n.id].setAttribute('class','node '+(s.cls||'')+(this.pickable?' pick':''));
      const c=this.nC[n.id];c.style.fill=s.color?`color-mix(in srgb, ${s.color} 32%, var(--surface))`:'';c.style.stroke=s.color||'';
      this.setSub(n.id,s.sub,animate);
    });
    this.g.edges.forEach((e,i)=>{
      const cls=(st.edges&&st.edges[i])||'';
      this.eL[i].setAttribute('class','edge '+cls);
      this.eT[i].setAttribute('class','ew '+cls);
    });
  }
}

/* ================= Lab (Prim / Kruskal / Dijkstra) ================= */
class Lab{
  constructor(id,cfg){
    this.id=id;this.cfg=cfg;this.root=$('#tab-'+id);this.editing=null;
    this.root.innerHTML=`
      <div class="lab-head"><h2>${cfg.title}</h2><p>${cfg.intro}</p></div>
      <div class="editor card">
        <div class="ed-row">
          <label for="${id}-preset">โจทย์<select id="${id}-preset"></select></label>
          ${cfg.hasStart?`<label for="${id}-start">โหนดเริ่มต้น<select id="${id}-start"></select></label>`:''}
          <button class="btn" type="button" id="${id}-rand">🎲 สุ่มโจทย์ใหม่</button>
          <button class="btn" type="button" id="${id}-reset">↺ กลับไปใช้ตัวอย่างจากสไลด์</button>
        </div>
        <p class="ed-hint">คลิกที่ตัวเลขบนเส้นเพื่อแก้น้ำหนัก แล้วกด Enter</p>
        <p class="ed-msg" role="status" hidden></p>
      </div>
      <div class="lab-grid">
        <div class="col-main">
          <div class="stage card">
            <div class="svgwrap"><svg class="gsvg" role="img" aria-label="กราฟที่ใช้สาธิต"></svg><input class="w-edit" id="${id}-wedit" type="number" step="1" hidden aria-label="น้ำหนักเส้น"></div>
            <div class="legend"><span><i></i>ยังไม่พิจารณา</span><span><i class="c"></i>กำลังพิจารณา</span><span><i class="o"></i>เลือกแล้ว</span><span><i class="b"></i>ปฏิเสธ</span></div>
            <div class="meta"></div>
            <div class="chips-wrap"><span class="chips-title"></span><div class="chips"></div></div>
          </div>
          <div class="pl"></div>
          <div class="why card"><h3>ทำไมถึงเลือกแบบนี้?</h3><div class="why-body"></div></div>
        </div>
        <div class="col-side">
          <div class="pseudo card"><h3>Pseudocode (Levitin)</h3><pre class="code"></pre><p class="cx">${cfg.cx}</p></div>
          <div class="paper card"><h3>ตารางแบบเขียนในกระดาษ</h3><div class="paper-body"></div></div>
        </div>
      </div>`;
    this.svg=$('.gsvg',this.root);this.inp=$('.w-edit',this.root);this.msg=$('.ed-msg',this.root);
    this.why=$('.why-body',this.root);this.meta=$('.meta',this.root);this.chips=$('.chips',this.root);this.chipsTitle=$('.chips-title',this.root);
    this.paper=$('.paper-body',this.root);
    $('.code',this.root).innerHTML=cfg.pseudo.map((l,i)=>`<span class="ln" data-i="${i}">${esc(l)}</span>`).join('');
    this.lns=$$('.ln',this.root);
    this.selPreset=$('#'+id+'-preset');this.selStart=$('#'+id+'-start');
    this.selPreset.innerHTML=cfg.presets.map(p=>`<option value="${p.key}">${p.label}</option>`).join('')+'<option value="random">สุ่มโจทย์</option>';
    this.player=new StepPlayer($('.pl',this.root),(st,i,dir)=>this.render(st,i,dir));
    this.selPreset.addEventListener('change',()=>this.setPreset(this.selPreset.value));
    if(this.selStart)this.selStart.addEventListener('change',()=>{this.start=this.selStart.value;this.recompute()});
    $('#'+id+'-rand',this.root).addEventListener('click',()=>this.setPreset('random'));
    $('#'+id+'-reset',this.root).addEventListener('click',()=>this.setPreset(this.presetKey==='random'?cfg.presets[0].key:this.presetKey));
    this.inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();this.commit()}else if(e.key==='Escape'){this.editing=null;this.inp.hidden=true}});
    this.inp.addEventListener('blur',()=>this.commit());
    this.setPreset(cfg.presets[0].key);
  }
  say(t){this.msg.hidden=!t;this.msg.textContent=t||''}
  setPreset(key){
    this.presetKey=key;this.say('');this.selPreset.value=key;
    this.graph=key==='random'?randomGraph(this.cfg.randN()):mk(this.cfg.presets.find(p=>p.key===key).data);
    this.start=this.graph.nodes[0].id;
    if(this.selStart){this.selStart.innerHTML=this.graph.nodes.map(n=>`<option value="${n.id}">${n.id}</option>`).join('');this.selStart.value=this.start}
    this.rebuild();this.recompute();
  }
  rebuild(){
    this.view=new GraphView(this.svg,this.graph,{onEdge:(i,x,y)=>this.editEdge(i,x,y),onNode:this.cfg.onNode?id=>this.cfg.onNode(this,id):null});
    this.view.pickable=!!this.cfg.onNode;
  }
  recompute(){this.selNode=null;this.steps=this.cfg.compute(this.graph,this.start);this.player.setSteps(this.steps,0)}
  editEdge(i,x,y){
    const r=this.svg.getBoundingClientRect(),k=r.width/this.svg.viewBox.baseVal.width;
    this.editing=i;this.inp.hidden=false;this.inp.value=this.graph.edges[i].w;
    this.inp.style.left=(x*k)+'px';this.inp.style.top=(y*k)+'px';this.inp.focus();this.inp.select();
  }
  commit(){
    if(this.editing===null)return;
    const i=this.editing;this.editing=null;
    const raw=this.inp.value.trim(),v=Number(raw);this.inp.hidden=true;
    if(raw===''||!Number.isInteger(v)){this.say('กรอกน้ำหนักเป็นจำนวนเต็ม เช่น 3');return}
    if(v<0&&this.cfg.noNegative){this.say('⚠️ Dijkstra ใช้ไม่ได้กับน้ำหนักติดลบ เพราะเมื่อย้ายโหนดเข้า VT แล้วจะไม่มีการกลับมาแก้ค่า ซึ่งอาจมีทางอ้อมที่สั้นกว่าจากเส้นติดลบ. กรุณาใส่ค่า 0 ขึ้นไป');return}
    if(Math.abs(v)>99){this.say('ใช้ค่าระหว่าง −99 ถึง 99');return}
    this.say('');
    if(v!==this.graph.edges[i].w){this.graph.edges[i].w=v;this.rebuild();this.recompute()}
  }
  render(st,i,dir){
    this.view.update(st,dir>0);
    this.why.innerHTML=st.text;
    this.lns.forEach((l,k)=>l.classList.toggle('on',(st.hl||[]).includes(k)));
    this.meta.innerHTML=st.meta||'';
    this.chipsTitle.textContent=st.chipsTitle||'';
    this.chips.innerHTML=(st.chips||[]).map(c=>`<span class="chip ${c.cls||''}">${c.t}</span>`).join('');
    this.paper.innerHTML=this.cfg.paper(st);
    if(this.cfg.after)this.cfg.after(this,st);
  }
}
const ptable=st=>{
  if(!st.rows.length)return '<p class="pnote">ยังไม่มีแถว กด “ถัดไป” เพื่อเริ่ม</p>';
  return `<table class="pt"><thead><tr><th>Tree vertices</th><th>Remaining vertices</th></tr></thead><tbody>${st.rows.map((r,i)=>`<tr class="${i===st.rows.length-1?'cur':''}"><td>${r.tree}</td><td>${r.rem.map(c=>`<span class="pc ${c.bold?'b':''} ${c.ch?'ch':''}">${c.v}(${c.p??'−'}, ${c.txt})</span>`).join('')}</td></tr>`).join('')}</tbody></table>`;
};
const ktable=st=>{
  if(!st.rows.length)return '<p class="pnote">ยังไม่มีแถว จะเพิ่มแถวเมื่อรับเส้นเข้า ET</p>';
  return `<table class="pt"><thead><tr><th>Tree edges</th><th>Sorted list of edges</th></tr></thead><tbody>${st.rows.map((r,i)=>`<tr class="${i===st.rows.length-1?'cur':''}"><td>${r.tree}</td><td>${r.list.map(c=>`<span class="pc ${c.cls}">${c.t}</span>`).join('')}</td></tr>`).join('')}</tbody></table>`;
};
const randN=()=>5+Math.round(Math.random());

const LABS={};
function initLabs(){
  LABS.prim=new Lab('prim',{
    title:'Prim’s Algorithm',
    intro:'สร้าง Minimum Spanning Tree โดยขยายต้นไม้จากโหนดเดียว ทีละโหนด ในแต่ละรอบเลือกเส้นที่เบาที่สุดที่ต่อจากต้นไม้ไปยังโหนดที่ยังไม่อยู่ในต้นไม้',
    hasStart:true,randN,paper:ptable,
    presets:[{key:'G1',label:'G1 · กราฟ a–f จากสไลด์',data:PRESETS.G1},{key:'G2',label:'G2 · กราฟ 1–6',data:PRESETS.G2},{key:'G3',label:'G3 · กราฟ A–F',data:PRESETS.G3}],
    pseudo:['ALGORITHM Prim(G)','  VT ← {v0}','  ET ← ∅','  for i ← 1 to |V| − 1 do','      find a minimum-weight edge e* = (v*, u*) among all the edges (v, u)','          such that v is in VT and u is in V − VT','      VT ← VT ∪ {u*}','      ET ← ET ∪ {e*}','  return ET'],
    cx:'ความซับซ้อน: (|V| − 1 + |E|) O(log |V|) = O(|E| log |V|) เมื่อใช้ min-heap',
    compute:primSteps
  });
  LABS.kruskal=new Lab('kruskal',{
    title:'Kruskal’s Algorithm',
    intro:'สร้าง MST โดยเรียงเส้นทั้งกราฟตามน้ำหนัก แล้วไล่รับทีละเส้น ถ้าเส้นไหนทำให้เกิดวงจรจะปฏิเสธ จนได้ครบ |V| − 1 เส้น',
    hasStart:false,randN,paper:ktable,
    presets:[{key:'G1',label:'G1 · กราฟ a–f จากสไลด์',data:PRESETS.G1},{key:'G3',label:'G3 · กราฟ A–F',data:PRESETS.G3}],
    pseudo:['ALGORITHM Kruskal(G)','  sort E in nondecreasing order of the edge weights','  ET ← ∅; ecounter ← 0','  k ← 0','  while ecounter < |V| − 1 do','      k ← k + 1','      if ET ∪ {e_ik} is acyclic','          ET ← ET ∪ {e_ik}; ecounter ← ecounter + 1','  return ET'],
    cx:'ความซับซ้อน: O(|E| log |E|) จากการเรียงเส้น (Union-Find ใช้เวลาน้อยกว่า)',
    compute:kruskalSteps
  });
  LABS.dijkstra=new Lab('dijkstra',{
    title:'Dijkstra’s Algorithm',
    intro:'หาระยะทางสั้นที่สุดจากโหนดต้นทางไปทุกโหนด (single-source shortest paths) โดยดึงโหนดที่มี d น้อยที่สุดออกจากคิวทีละตัว แล้ว relax เพื่อนบ้าน น้ำหนักเส้นต้องไม่ติดลบ',
    hasStart:true,randN,noNegative:true,paper:ptable,
    presets:[{key:'G4',label:'G4 · กราฟ a–e จากสไลด์',data:PRESETS.G4}],
    pseudo:['ALGORITHM Dijkstra(G, s)','  Initialize(Q)','  for every vertex v in V','      dv ← ∞; pv ← null','      Insert(Q, v, dv)','  ds ← 0; Decrease(Q, s, ds)','  VT ← ∅','  for i ← 0 to |V| − 1 do','      u* ← DeleteMin(Q)','      VT ← VT ∪ {u*}','      for every vertex u in V − VT that is adjacent to u* do','          if du* + w(u*, u) < du','              du ← du* + w(u*, u); pu ← u*','              Decrease(Q, u, du)'],
    cx:'ความซับซ้อน: Θ(|V|²) เมื่อใช้ weight matrix + unordered array, O(|E| log |V|) เมื่อใช้ adjacency list + min-heap',
    onNode:(lab,id)=>{const st=lab.steps[lab.player.i];if(!st||!st.final){lab.say('คลิกโหนดเพื่อดูเส้นทางได้เมื่อถึงขั้นสุดท้าย');return}lab.say('');lab.selNode=id;lab.showPath(st)},
    after:(lab,st)=>{if(st.final&&lab.selNode)lab.showPath(st)},
    compute:dijkstraSteps
  });
  LABS.dijkstra.showPath=function(st){
    const f=st.final,edges={...st.edges};let c=this.selNode;
    while(c&&f.p[c]){edges[f.pE[c]]='e-path';c=f.p[c]}
    this.view.update({nodes:st.nodes,edges},false);
  };
}

/* ================= Coin ================= */
class CoinLab{
  constructor(){
    this.root=$('#tab-coin');this.coins=[1,2,5,10];this.amount=28;this.prevLen=0;this.prevR=null;
    this.root.innerHTML=`
      <div class="lab-head"><h2>Coin Change (Greedy)</h2><p>ใช้เหรียญที่มีค่ามากที่สุดที่ยังไม่เกินยอดคงเหลือ แล้วหักลบไปเรื่อย ๆ ลองเทียบกับคำตอบที่ดีที่สุด (DP) เพื่อดูว่า Greedy พลาดได้เมื่อไร</p></div>
      <div class="editor card">
        <div class="ed-row"><span class="ed-label">ตัวอย่างจากสไลด์</span>
          <button class="btn" type="button" data-p="1,2,5,10|28">{1, 2, 5, 10} ทอน 28</button>
          <button class="btn" type="button" data-p="1,3,4|6">{1, 3, 4} ทอน 6</button>
          <button class="btn" type="button" id="coin-rand">🎲 สุ่มโจทย์ใหม่</button></div>
        <div class="ed-row">
          <label for="coin-coins">ชุดเหรียญ (คั่นด้วยจุลภาค)<input id="coin-coins" value="1, 2, 5, 10" style="width:170px"></label>
          <label for="coin-amount">ยอดเงิน<input id="coin-amount" type="number" min="1" max="200" value="28"></label>
          <button class="btn primary" type="button" id="coin-apply">ใช้ค่านี้</button>
          <button class="btn" type="button" id="coin-reset">↺ กลับไปใช้ตัวอย่างจากสไลด์</button>
          <label class="check" for="coin-cmp"><input id="coin-cmp" type="checkbox" checked> โหมด Greedy vs Optimal</label></div>
        <p class="ed-msg" role="status" hidden></p>
      </div>
      <div class="lab-grid">
        <div class="col-main">
          <div class="stage card coin-stage">
            <div><div class="chips-title" style="margin-bottom:6px">เหรียญที่มี (เรียงจากมากไปน้อย)</div><div class="denoms"></div></div>
            <div class="remain">ยอดคงเหลือ<b>0</b></div>
            <div><div class="chips-title" style="margin-bottom:6px">ถาดเหรียญที่ทอน</div><div class="tray"></div></div>
            <div class="compare"></div>
          </div>
          <div class="pl"></div>
          <div class="why card"><h3>ทำไมถึงเลือกแบบนี้?</h3><div class="why-body"></div></div>
        </div>
        <div class="col-side">
          <div class="pseudo card"><h3>Pseudocode</h3><pre class="code"></pre><p class="cx">ความซับซ้อน: O(n) เมื่อเรียงเหรียญไว้แล้ว (n = จำนวนชนิดเหรียญ) แต่ให้ผลที่ดีที่สุดเฉพาะชุดเหรียญบางแบบ</p></div>
          <div class="paper card"><h3>ตารางแบบเขียนในกระดาษ</h3><div class="paper-body"></div></div>
        </div>
      </div>`;
    this.msg=$('.ed-msg',this.root);this.why=$('.why-body',this.root);this.denoms=$('.denoms',this.root);this.remain=$('.remain b',this.root);this.tray=$('.tray',this.root);this.cmpBox=$('.compare',this.root);this.paper=$('.paper-body',this.root);
    const lines=['ALGORITHM GreedyCoin(coins, amount)','  sort coins in decreasing order','  for each coin c in coins do','      while amount ≥ c do','          take coin c; amount ← amount − c','  return the coins taken'];
    $('.code',this.root).innerHTML=lines.map((l,i)=>`<span class="ln" data-i="${i}">${esc(l)}</span>`).join('');
    this.lns=$$('.ln',this.root);
    this.player=new StepPlayer($('.pl',this.root),(st,i,dir)=>this.render(st,i,dir));
    $$('[data-p]',this.root).forEach(b=>b.addEventListener('click',()=>{const [c,a]=b.dataset.p.split('|');this.set(c.split(',').map(Number),+a)}));
    $('#coin-apply').addEventListener('click',()=>this.apply());
    $('#coin-coins').addEventListener('keydown',e=>{if(e.key==='Enter')this.apply()});
    $('#coin-amount').addEventListener('keydown',e=>{if(e.key==='Enter')this.apply()});
    $('#coin-reset').addEventListener('click',()=>this.set([1,2,5,10],28));
    $('#coin-cmp').addEventListener('change',()=>this.player.go(this.player.i,0));
    $('#coin-rand').addEventListener('click',()=>this.random());
    this.set(this.coins,this.amount);
  }
  say(t){this.msg.hidden=!t;this.msg.textContent=t||''}
  apply(){
    const parts=$('#coin-coins').value.split(/[,\s]+/).filter(Boolean).map(Number);
    const amount=Number($('#coin-amount').value);
    if(!parts.length||parts.some(x=>!Number.isInteger(x)||x<1||x>99)){this.say('ชุดเหรียญต้องเป็นจำนวนเต็ม 1–99 คั่นด้วยจุลภาค เช่น 1, 3, 4');return}
    if(new Set(parts).size>8){this.say('ใส่เหรียญได้ไม่เกิน 8 ชนิด');return}
    if(!Number.isInteger(amount)||amount<1||amount>200){this.say('ยอดเงินต้องเป็นจำนวนเต็ม 1–200');return}
    this.set(parts,amount);
  }
  set(coins,amount){
    this.say('');this.coins=[...new Set(coins)].sort((a,b)=>a-b);this.amount=amount;
    $('#coin-coins').value=this.coins.join(', ');$('#coin-amount').value=amount;
    this.steps=coinSteps(this.coins,amount);this.opt=coinDP(this.coins,amount);
    this.prevLen=0;this.prevR=null;this.player.setSteps(this.steps,0);
  }
  random(){
    let coins,amount,tries=0;const wantFail=Math.random()<.6;
    do{
      const pool=shuf([2,3,4,5,6,7,8,9,10,12]).slice(0,2+Math.floor(Math.random()*2));
      coins=[1,...pool];amount=10+Math.floor(Math.random()*50);
      const g=coinSteps(coins,amount).result.taken.length,o=coinDP(coins,amount).count;
      if(!wantFail||g>o)break;
    }while(++tries<40);
    this.set(coins,amount);
  }
  render(st,i,dir){
    const hue=c=>[210,150,32,280,340,58,190,100][st.coins.indexOf(c)%8];
    this.denoms.innerHTML=st.coins.map(c=>{const n=st.taken.filter(x=>x===c).length;return `<div class="coin ${st.active!==null&&c!==st.active?'dim':''} ${c===st.active?'act':''}" style="--h:${hue(c)}">${c}${n?`<em>×${n}</em>`:''}</div>`}).join('');
    tweenNum(this.remain,this.prevR,st.r);this.prevR=st.r;
    const animFrom=dir>0?this.prevLen:st.taken.length;
    this.tray.innerHTML=st.taken.length?st.taken.map((c,k)=>`<span class="coin small ${k>=animFrom?'drop':''}" style="--h:${hue(c)}">${c}</span>`).join(''):'<span class="tray-empty">ยังไม่มีเหรียญในถาด</span>';
    this.prevLen=st.taken.length;
    this.lns.forEach((l,k)=>l.classList.toggle('on',(st.hl||[]).includes(k)));
    this.why.innerHTML=st.text;
    this.paper.innerHTML=st.lines.length?st.lines.map(l=>`<div class="paper-line">${l}</div>`).join(''):'<p class="pnote">ยังไม่มีบรรทัด จะเพิ่มเมื่อใช้เหรียญครบแต่ละชนิด</p>';
    if($('#coin-cmp').checked){
      const g=st.taken,o=this.opt,gs=g.length?`${g.join(' + ')} = ${g.reduce((a,b)=>a+b,0)}`:'—';
      let banner='';
      if(st.final){
        if(!o&&st.r>0)banner='<div class="warn" style="grid-column:1/-1">⚠️ ชุดเหรียญนี้ทอนยอดนี้ไม่ได้เลย ไม่ว่าจะวิธีใด</div>';
        else if(st.r>0)banner=`<div class="warn" style="grid-column:1/-1">⚠️ Greedy ไม่ได้ให้คำตอบที่ดีที่สุดเสมอ! Greedy ทอนไม่ได้ แต่มีวิธีที่ใช้ ${o.count} เหรียญ</div>`;
        else if(g.length>o.count)banner=`<div class="warn" style="grid-column:1/-1">⚠️ Greedy ไม่ได้ให้คำตอบที่ดีที่สุดเสมอ! Greedy ใช้ ${g.length} เหรียญ แต่ที่ดีที่สุดใช้ ${o.count} เหรียญ</div>`;
        else banner='<div class="good" style="grid-column:1/-1">✓ โจทย์นี้ Greedy ได้คำตอบเท่ากับ Optimal (แต่ไม่ได้รับประกันสำหรับชุดเหรียญอื่น)</div>';
      }
      this.cmpBox.innerHTML=`<div class="cmp-box"><h4>GREEDY (ทำงานอยู่)</h4><div class="big">${g.length} เหรียญ</div><div class="mono">${gs}</div></div>
        <div class="cmp-box opt"><h4>OPTIMAL (DP เบื้องหลัง)</h4><div class="big">${o?o.count+' เหรียญ':'ทอนไม่ได้'}</div><div class="mono">${o?o.list.join(' + ')+' = '+this.amount:'—'}</div></div>${banner}`;
      this.cmpBox.hidden=false;
    }else this.cmpBox.hidden=true;
  }
}

/* ================= Huffman ================= */
function layoutForest(roots){
  const pos={};let slot=0,maxD=0;
  const walk=(n,d)=>{maxD=Math.max(maxD,d);if(!n.l){pos[n.id]={x:slot++,d};return pos[n.id].x}const a=walk(n.l,d+1),b=walk(n.r,d+1);pos[n.id]={x:(a+b)/2,d};return pos[n.id].x};
  roots.forEach(r=>walk(r,0));
  return {pos,slots:slot,maxD};
}
function drawHuff(svg,roots,o={}){
  const SX=62,SY=78,{pos,slots,maxD}=layoutForest(roots);
  const W=Math.max(360,slots*SX+24),H=30+maxD*SY+64,ox=(W-slots*SX)/2;
  const X=id=>ox+(pos[id].x+.5)*SX,Y=id=>30+pos[id].d*SY;
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
  let edges='',bits='',nodes='';
  const hlN=o.path||new Set();
  const visit=nd=>{
    if(!nd.l)return;
    [[nd.l,'0'],[nd.r,'1']].forEach(([c,b])=>{
      const hl=hlN.has(nd.id)&&hlN.has(c.id);
      edges+=`<line class="he ${hl?'hl':''}" x1="${X(nd.id)}" y1="${Y(nd.id)}" x2="${X(c.id)}" y2="${Y(c.id)}"/>`;
      if(o.bits){const bx=X(nd.id)+(X(c.id)-X(nd.id))*.45,by=Y(nd.id)+(Y(c.id)-Y(nd.id))*.45;bits+=`<g class="hb"><circle cx="${bx}" cy="${by}" r="9"/><text x="${bx}" y="${by}">${b}</text></g>`}
      visit(c);
    });
  };
  roots.forEach(visit);
  const draw=nd=>{
    const x=X(nd.id),y=Y(nd.id);
    const cls=(o.picked&&o.picked.includes(nd.id)?'pk ':'')+(o.newId===nd.id?'nw ':'')+(hlN.has(nd.id)?'hl':'');
    if(!nd.l){
      const code=o.codes&&o.codes[nd.sym];
      nodes+=`<g transform="translate(${x} ${y})"><g class="hn ${cls}"><rect x="-20" y="-15" width="40" height="30" rx="6"/><text class="sym" y="1">${esc(nd.sym)}</text><text class="fw" y="30">${hfmt(nd.w)}</text>${code?`<text class="cw" y="46">${code}</text>`:''}</g></g>`;
    }else{
      nodes+=`<g transform="translate(${x} ${y})"><g class="hn ${cls}"><circle r="19"/><text class="iw" y="1">${hfmt(nd.w)}</text></g></g>`;
      draw(nd.l);draw(nd.r);
    }
  };
  roots.forEach(draw);
  svg.innerHTML=edges+bits+nodes;
}
class HuffLab{
  constructor(){
    this.root=$('#tab-huffman');
    this.def=[['A',.35],['B',.1],['C',.2],['D',.2],['_',.15]];
    this.rows=this.def.map(r=>r.slice());
    this.root.innerHTML=`
      <div class="lab-head"><h2>Huffman Trees and Codes</h2><p>เข้ารหัสแบบความยาวแปรผัน ตัวอักษรที่ถี่ได้รหัสสั้น ตัวที่ไม่ค่อยถี่ได้รหัสยาว โดยไม่มีรหัสใดเป็น prefix ของอีกตัว สร้างต้นไม้ด้วยการรวมสองก้อนที่น้อยที่สุดซ้ำ ๆ</p></div>
      <div class="editor card">
        <div class="ed-row" style="align-items:start">
          <div class="sym-table" id="hf-rows" role="group" aria-label="ตัวอักษรและความถี่"></div>
          <div class="ed-row" style="flex-direction:column;align-items:stretch">
            <button class="btn" type="button" id="hf-add">＋ เพิ่มตัวอักษร</button>
            <button class="btn" type="button" id="hf-norm">ทำให้ผลรวม = 1</button>
            <button class="btn" type="button" id="hf-rand">🎲 สุ่มโจทย์ใหม่</button>
            <button class="btn" type="button" id="hf-reset">↺ กลับไปใช้ตัวอย่างจากสไลด์</button>
          </div>
        </div>
        <p class="ed-hint" id="hf-sum"></p>
        <p class="ed-msg" role="status" hidden></p>
      </div>
      <div class="lab-grid">
        <div class="col-main">
          <div class="stage card">
            <div class="chips-wrap"><span class="chips-title"></span><div class="chips" style="padding-top:4px"></div></div>
            <svg class="hsvg" role="img" aria-label="ต้นไม้ Huffman"></svg>
          </div>
          <div class="pl"></div>
          <div class="why card"><h3>ทำไมถึงเลือกแบบนี้?</h3><div class="why-body"></div></div>
        </div>
        <div class="col-side">
          <div class="pseudo card"><h3>ขั้นตอน (Levitin)</h3><pre class="code"></pre><p class="cx">ความซับซ้อน: O(n log n) เมื่อใช้ priority queue (min-heap)</p></div>
          <div class="paper card"><h3>ตารางแบบเขียนในกระดาษ</h3><div class="paper-body"></div></div>
          <div class="stats card"><h3>คำนวณ</h3><div class="stat-line" id="hf-stats"></div></div>
        </div>
      </div>
      <div class="tools">
        <div class="card"><h3>Encode: ข้อความ → บิต</h3>
          <div class="tool-in"><input id="hf-enc" value="DAD" aria-label="ข้อความที่จะเข้ารหัส" autocomplete="off"></div>
          <div class="out" id="hf-enc-out"></div></div>
        <div class="card"><h3>Decode: บิต → ข้อความ (เดินในต้นไม้ทีละบิต)</h3>
          <div class="tool-in"><input id="hf-dec" value="10011011011101" inputmode="numeric" aria-label="บิตที่จะถอดรหัส" autocomplete="off"><button class="btn primary" type="button" id="hf-dec-go">ถอดรหัส</button></div>
          <div class="bits" id="hf-bits"></div>
          <div class="out" id="hf-dec-out"></div>
          <svg class="hsvg" id="hf-dsvg" role="img" aria-label="ต้นไม้สำหรับถอดรหัส"></svg>
          <div id="hf-dpl"></div>
          <p class="why-body" id="hf-dtext"></p></div>
      </div>`;
    this.msg=$('.ed-msg',this.root);this.svg=$('.stage .hsvg',this.root);this.why=$('.why-body',this.root);this.paper=$('.paper-body',this.root);
    this.chips=$('.chips',this.root);this.chipsTitle=$('.chips-title',this.root);
    const lines=['ALGORITHM Huffman(S, freq)','  Q ← n one-node trees, weight = frequency of each symbol','  while |Q| > 1 do','      T1 ← DeleteMin(Q); T2 ← DeleteMin(Q)','      T ← new tree: left = T1, right = T2','      weight(T) ← weight(T1) + weight(T2)','      Insert(Q, T)','  label every left edge 0 and right edge 1','  codeword of a symbol ← bits on path root → leaf'];
    $('.code',this.root).innerHTML=lines.map((l,i)=>`<span class="ln" data-i="${i}">${esc(l)}</span>`).join('');
    this.lns=$$('.ln',this.root);
    this.player=new StepPlayer($('.pl',this.root),(st,i,dir)=>this.render(st,i,dir));
    this.dplayer=new StepPlayer($('#hf-dpl'),(st,i)=>this.renderDec(st,i));
    this.dplayer.host.querySelector('.hint').remove();
    $('#hf-add').addEventListener('click',()=>{if(this.rows.length>=8){this.say('ใส่ได้ไม่เกิน 8 ตัวอักษร');return}this.readRows(true);this.rows.push(['',0.1]);this.drawRows();$('#hf-rows .hs:last-of-type,#hf-rows .sym-row:last-child .hs').focus()});
    $('#hf-reset').addEventListener('click',()=>{this.rows=this.def.map(r=>r.slice());this.drawRows();this.apply()});
    $('#hf-rand').addEventListener('click',()=>this.random());
    $('#hf-norm').addEventListener('click',()=>{const r=this.readRows(true);if(!r)return;const t=this.rows.reduce((s,x)=>s+x[1],0);if(t>0){this.rows=this.rows.map(x=>[x[0],+(x[1]/t).toFixed(4)]);this.drawRows();this.apply()}});
    $('#hf-rows').addEventListener('change',()=>this.apply());
    $('#hf-rows').addEventListener('click',e=>{const b=e.target.closest('.x');if(!b)return;if(this.rows.length<=2){this.say('ต้องมีอย่างน้อย 2 ตัวอักษร');return}this.readRows(true);this.rows.splice(+b.dataset.i,1);this.drawRows();this.apply()});
    $('#hf-enc').addEventListener('input',()=>this.encode());
    $('#hf-dec-go').addEventListener('click',()=>this.decode());
    $('#hf-dec').addEventListener('keydown',e=>{if(e.key==='Enter')this.decode()});
    this.drawRows();this.apply();
  }
  say(t){this.msg.hidden=!t;this.msg.textContent=t||''}
  drawRows(){
    $('#hf-rows').innerHTML=this.rows.map((r,i)=>`<div class="sym-row"><input class="hs" id="hs-${i}" maxlength="1" value="${esc(r[0])}" aria-label="ตัวอักษรที่ ${i+1}"><input class="hf" id="hf-${i}" type="number" step="any" min="0" value="${r[1]}" aria-label="ความถี่ของตัวอักษรที่ ${i+1}"><button class="btn x" type="button" data-i="${i}" aria-label="ลบตัวอักษรที่ ${i+1}">✕</button></div>`).join('');
  }
  readRows(soft){
    const rs=$$('#hf-rows .sym-row').map(r=>[$('.hs',r).value,Number($('.hf',r).value)]);
    if(soft){this.rows=rs;return true}
    return rs;
  }
  apply(){
    const rs=this.readRows();
    if(rs.length<2){this.say('ต้องมีอย่างน้อย 2 ตัวอักษร');return}
    if(rs.some(r=>r[0].length!==1)){this.say('ช่องตัวอักษรต้องใส่ 1 ตัวอักษร (ใช้ _ แทนช่องว่างได้)');return}
    if(new Set(rs.map(r=>r[0])).size!==rs.length){this.say('มีตัวอักษรซ้ำกัน กรุณาใช้ตัวอักษรที่ไม่ซ้ำ');return}
    if(rs.some(r=>!(r[1]>0)||!isFinite(r[1]))){this.say('ความถี่ต้องเป็นตัวเลขมากกว่า 0');return}
    this.say('');this.rows=rs;
    const sum=rs.reduce((s,r)=>s+r[1],0);
    $('#hf-sum').textContent=Math.abs(sum-1)<.0005?`ผลรวมความถี่ = 1`:`ผลรวมความถี่ = ${+sum.toFixed(4)} (ไม่ใช่ 1) การคำนวณจำนวนบิตเฉลี่ยจะถ่วงน้ำหนักตามสัดส่วน หรือกดปุ่ม “ทำให้ผลรวม = 1”`;
    $('#hf-norm').hidden=Math.abs(sum-1)<.0005;
    this.items=rs.map(r=>({sym:r[0],w:Math.max(1,Math.round(r[1]*10000))}));
    this.steps=huffSteps(this.items);this.res=this.steps.result;
    this.player.setSteps(this.steps,0);
    this.encode();this.decode(true);
  }
  random(){
    const n=4+Math.floor(Math.random()*3),r=Array.from({length:n},()=>1+Math.floor(Math.random()*20)),s=r.reduce((a,b)=>a+b,0);
    const q=r.map(x=>Math.max(1,Math.floor(x/s*100)));
    q[q.indexOf(Math.max(...q))]+=100-q.reduce((a,b)=>a+b,0);
    this.rows=q.map((x,i)=>['ABCDEFGH'[i],x/100]);this.drawRows();this.apply();
  }
  render(st,i,dir){
    drawHuff(this.svg,st.roots,{picked:st.picked,newId:dir>0?st.newId:null,bits:st.bits,path:st.path,codes:st.codes});
    this.why.innerHTML=st.text;
    this.lns.forEach((l,k)=>l.classList.toggle('on',(st.hl||[]).includes(k)));
    this.chipsTitle.textContent=st.chipsTitle;
    this.chips.innerHTML=st.chips.map(c=>`<span class="chip ${c.cls}">${c.t}${c.sub?` <small>(${esc(c.sub)})</small>`:''}</span>`).join('');
    let h=`<table class="pt"><thead><tr><th>คิวหลังแต่ละรอบ (น้อย → มาก)</th></tr></thead><tbody>${st.rows.map((r,k)=>`<tr class="${k===st.rows.length-1?'cur':''}"><td>${r.map(x=>`<span class="pc">${esc(x)}</span>`).join('')}</td></tr>`).join('')}</tbody></table>`;
    const cs=Object.keys(st.codes);
    if(cs.length){
      h+=`<table class="ct" style="margin-top:8px"><thead><tr><th>symbol</th><th>frequency</th><th>codeword</th></tr></thead><tbody>${this.items.filter(x=>x.sym in st.codes).map(x=>`<tr><td>${esc(x.sym)}</td><td>${hfmt(x.w)}</td><td class="cw">${st.codes[x.sym]}</td></tr>`).join('')}</tbody></table>`;
    }
    this.paper.innerHTML=h;
    const r=this.res,tot=r.tot;
    $('#hf-stats').innerHTML=st.final?`จำนวนบิตเฉลี่ย = Σ(ความยาว × ความถี่)<br>= ${this.items.map(x=>`${r.codes[x.sym].length}·${hfmt(x.w)}`).join(' + ')}${Math.abs(tot-10000)<5?'':` (หารด้วยผลรวม ${hfmt(tot)})`}<br>= <b>${+r.avg.toFixed(4)}</b> บิต/ตัวอักษร<br>รหัสความยาวคงที่ = ⌈log₂ ${this.items.length}⌉ = <b>${r.fixed}</b> บิต<br>Compression ratio = (${r.fixed} − ${+r.avg.toFixed(4)}) / ${r.fixed} × 100% = <b>${+r.ratio.toFixed(2)}%</b>`:'<span class="muted">ไปให้ถึงขั้นสุดท้ายเพื่อดูการคำนวณ</span>';
  }
  encode(){
    const t=$('#hf-enc').value,o=$('#hf-enc-out');
    if(!t){o.textContent='';return}
    const r=huffEncode(this.res.codes,t);
    o.innerHTML=r.err?`<span class="warn">${esc(r.err)}</span>`:`${t.split('').map(c=>`<span class="mono muted" style="font-size:.8em">${esc(c)}=</span>${this.res.codes[c]}`).join(' · ')}<br>→ ${r.bits}`;
  }
  decode(quiet){
    const bits=$('#hf-dec').value.trim(),out=$('#hf-dec-out');
    if(!/^[01]*$/.test(bits)){out.innerHTML='<span class="warn">ใส่ได้เฉพาะเลข 0 และ 1</span>';return}
    this.dbits=bits;
    this.dsteps=huffDecodeSteps(this.res.root,bits);
    this.dplayer.setSteps(this.dsteps,0);
  }
  renderDec(st,i){
    drawHuff($('#hf-dsvg'),[this.res.root],{bits:true,path:st.path,codes:this.res.codes});
    $('#hf-bits').innerHTML=this.dbits.split('').map((b,k)=>`<span class="${k<st.i?'done':k===st.i?'now':''}">${b}</span>`).join('')||'<span>(ว่าง)</span>';
    $('#hf-dec-out').textContent=st.out?'→ '+st.out:'';
    $('#hf-dtext').innerHTML=st.text;
  }
}

/* ================= Home: รูปนิยาม spanning tree ================= */
function mountDefs(el){
  const base={nodes:[{id:"a",x:38,y:34},{id:"b",x:192,y:34},{id:"c",x:38,y:126},{id:"d",x:192,y:126}],edges:[["a","b",1],["a","d",2],["c","d",3],["a","c",5]]};
  const sets=[["กราฟตั้งต้น",null,""],["spanning tree · w(T₁) = 6 (MST)",[0,1,2],"best"],["spanning tree · w(T₂) = 9",[0,3,2],""],["spanning tree · w(T₃) = 8",[0,3,1],""]];
  el.innerHTML=sets.map(([c,,k])=>`<figure class="${k}"><svg class="mini" role="img" aria-label="${c}"></svg><figcaption>${c}</figcaption></figure>`).join("");
  $$("svg",el).forEach((svg,i)=>{
    const v=new GraphView(svg,mk(base),{r:15,vb:[230,160]});
    const st={nodes:{},edges:{}};
    if(sets[i][1]){[0,1,2,3].forEach(e=>st.edges[e]=sets[i][1].includes(e)?"e-tree":"e-off");base.nodes.forEach(n=>st.nodes[n.id]={cls:"n-tree"})}
    v.update(st,false);
  });
}

/* ================= Quiz ================= */
const FIXED=[
  {tag:'Greedy',q:'หลักคิดของ Greedy Technique คือข้อใด',o:['เลือกสิ่งที่ดีที่สุดในตอนนี้ โดยไม่ย้อนกลับมาแก้','ลองทุกความเป็นไปได้แล้วเลือกคำตอบที่ดีที่สุด','แบ่งปัญหาครึ่งหนึ่งซ้ำ ๆ แล้วรวมผลลัพธ์','จำผลของปัญหาย่อยไว้ในตารางเพื่อไม่ต้องคำนวณซ้ำ'],a:0,e:'Greedy ตัดสินใจทีละก้าวด้วยตัวเลือกที่ดีที่สุดในขณะนั้น และไม่เปลี่ยนใจภายหลัง ให้คำตอบที่ดีที่สุดได้เฉพาะบางปัญหา'},
  {tag:'เหรียญ',q:'เหรียญ {1, 2, 5, 10} ทอน 28 บาทด้วย Greedy ใช้กี่เหรียญ',o:['4','5','6','7'],a:1,e:'28 − 10×2 = 8, 8 − 5 = 3, 3 − 2 = 1, 1 − 1 = 0 ได้ 10, 10, 5, 2, 1 รวม 5 เหรียญ'},
  {tag:'เหรียญ',q:'เหรียญ {1, 3, 4} ทอน 6 บาทด้วย Greedy ได้กี่เหรียญ',o:['2','3','4','5'],a:1,e:'Greedy หยิบ 4 ก่อน แล้วเหลือ 2 จึงต้องหยิบ 1 อีก 2 เหรียญ ได้ 4 + 1 + 1 = 3 เหรียญ'},
  {tag:'เหรียญ',q:'เหรียญ {1, 3, 4} ทอน 6 บาท คำตอบที่ดีที่สุดใช้กี่เหรียญ',o:['2','3','4','ไม่มีคำตอบ'],a:0,e:'3 + 3 = 6 ใช้ 2 เหรียญ น้อยกว่าที่ Greedy ได้ (3 เหรียญ) จึงเป็นตัวอย่างที่ Greedy ไม่ได้ให้คำตอบที่ดีที่สุด'},
  {tag:'MST',q:'ข้อใดคือนิยามของ spanning tree',o:['sub graph ที่ไม่มีวงจรและเชื่อมทุกโหนดของกราฟไว้ด้วยกัน','sub graph ที่มีวงจรอย่างน้อยหนึ่งวง','เส้นทางที่สั้นที่สุดระหว่างสองโหนด','กราฟที่มีเส้นเชื่อมครบทุกคู่ของโหนด'],a:0,e:'spanning tree คือ sub graph ที่เป็น acyclic และครอบคลุมทุกโหนด'},
  {tag:'MST',q:'minimum spanning tree คืออะไร',o:['spanning tree ที่มี weight รวมน้อยที่สุด','spanning tree ที่มีจำนวนเส้นน้อยที่สุด','เส้นที่เบาที่สุดหนึ่งเส้นในกราฟ','เส้นทางที่ผ่านทุกโหนดครั้งเดียว'],a:0,e:'จำนวนเส้นของ spanning tree เท่ากันหมด (|V| − 1) สิ่งที่ต่างกันคือ weight รวม MST คือตัวที่น้อยที่สุด'},
  {tag:'MST',q:'กราฟที่มี |V| โหนด MST มีกี่เส้นเสมอ',o:['|V|','|V| − 1','|V| + 1','|E|'],a:1,e:'ต้นไม้ที่มี |V| โหนดมี |V| − 1 เส้นเสมอ Prim จึงวนรอบ |V| − 1 ครั้ง และ Kruskal หยุดเมื่อ ecounter = |V| − 1'},
  {tag:'Prim',q:'Prim บนกราฟ G3 (A–F) เริ่มที่ A โหนดที่ถูกเลือกเป็นลำดับที่ 3 คือโหนดใด',o:['B','D','E','F'],a:3,e:'ลำดับคือ C(A,8), B(C,2), F(B,4), D(F,3), E(D,5) ตัวที่ 3 คือ F'},
  {tag:'Kruskal',q:'Kruskal บนกราฟ G1 (a–f) เส้นที่ 4 ใน sorted list คือเส้นใด',o:['bc','ab','bf','ef'],a:2,e:'sorted list: bc1, ef2, ab3, bf4, cf4, af5, df5, ae6, cd6, de8 เส้นที่ 4 คือ bf'},
  {tag:'MST',q:'MST ของกราฟ G1 (a–f) มีน้ำหนักรวมเท่าไร',o:['13','14','15','16'],a:2,e:'MST = {bc 1, ef 2, ab 3, bf 4, df 5} รวม 15'},
  {tag:'MST',q:'MST ของกราฟ G3 (A–F) มีน้ำหนักรวมเท่าไร',o:['20','21','22','23'],a:2,e:'MST = {BC 2, DF 3, BF 4, DE 5, AC 8} รวม 22'},
  {tag:'Dijkstra',q:'Dijkstra บนกราฟ G4 จากต้นทาง a ได้ d(e) เท่าไร',o:['7','8','9','10'],a:2,e:'เส้นทางสั้นที่สุด a–b–d–e = 3 + 2 + 4 = 9'},
  {tag:'Huffman',q:'จากตาราง A 0.35, B 0.1, C 0.2, D 0.2, _ 0.15 รหัส Huffman ของ B คืออะไร',o:['100','101','00','11'],a:0,e:'รวม B+_ = 0.25 (B ซ้าย _ ขวา) แล้วรวมกับ A เป็น 0.6 อยู่กิ่ง 1 ต่อด้วย 0 ของ 0.25 จึงได้ B = 100 (และ _ = 101)'},
  {tag:'Huffman',q:'ถอดรหัส 011101 ด้วยรหัส A=11, B=100, C=00, D=01, _=101 ได้อะไร',o:['DAD','BAD','DAB','ADD'],a:0,e:'011101 = 01 | 11 | 01 = D, A, D'},
  {tag:'Huffman',q:'จำนวนบิตเฉลี่ยต่อตัวอักษรของรหัส Huffman ชุดตัวอย่างเท่าไร',o:['2.00','2.25','2.50','3.00'],a:1,e:'2·0.35 + 3·0.1 + 2·0.2 + 2·0.2 + 3·0.15 = 2.25'},
  {tag:'Huffman',q:'เทียบกับรหัสความยาวคงที่ 3 บิต รหัส Huffman ชุดตัวอย่างบีบอัดได้กี่เปอร์เซ็นต์',o:['15%','20%','25%','30%'],a:2,e:'(3 − 2.25) / 3 × 100% = 25%'},
  {tag:'Prim',q:'Prim ที่ใช้ min-heap มีความซับซ้อนเท่าใด',o:['O(|E| log |V|)','O(|V| + |E|) พอดี','O(|E|²)','O(2^|V|)'],a:0,e:'(|V| − 1 + |E|) O(log |V|) = O(|E| log |V|)'},
  {tag:'Dijkstra',q:'Dijkstra ที่ใช้ weight matrix กับ unordered array มีความซับซ้อนเท่าใด',o:['Θ(|V|²)','Θ(|V|)','Θ(|E| log |V|)','Θ(|V|³)'],a:0,e:'ต้องหาค่าต่ำสุดใน array ทีละรอบ (|V| รอบ × |V|) จึงเป็น Θ(|V|²) ส่วนแบบ adjacency list + min-heap เป็น O(|E| log |V|)'},
  {tag:'Dijkstra',q:'ข้อใดทำให้ Dijkstra ใช้ไม่ได้',o:['น้ำหนักเส้นติดลบ','กราฟมีวงจร','กราฟมีมากกว่า 5 โหนด','มีหลายเส้นน้ำหนักเท่ากัน'],a:0,e:'Dijkstra ถือว่าเมื่อโหนดเข้า VT แล้วค่า d สุดท้ายแล้ว ถ้ามีเส้นติดลบ อาจมีทางอ้อมที่สั้นกว่า'},
  {tag:'เปรียบเทียบ',q:'ตาราง v(p, w) ของ Prim ต่างจาก Dijkstra อย่างไร',o:['Prim เก็บน้ำหนักของเส้นเดียว ส่วน Dijkstra เก็บระยะสะสมจากต้นทาง','Prim เก็บระยะสะสม ส่วน Dijkstra เก็บน้ำหนักเส้นเดียว','สองแบบเก็บค่าเหมือนกันทุกประการ','Prim ไม่เก็บ parent'],a:0,e:'ตัวอย่าง: Prim ได้ d(b, 4) จากเส้น b–d ที่หนัก 4 แต่ Dijkstra ได้ d(b, 3+2) เพราะรวมระยะจากต้นทาง'}
];
function numOpts(c){
  const set=new Set([c]);
  for(const d of shuf([-3,-2,-1,1,2,3,4])){if(set.size>=4)break;if(c+d>0)set.add(c+d)}
  return shuf([...set]);
}
function randomQs(){
  const out=[];
  let g=randomGraph(randN()),pr=primSteps(g,'a');
  {const opts=numOpts(pr.result.total).map(String);
   out.push({tag:'สุ่ม · MST',q:'กราฟนี้มี MST น้ำหนักรวมเท่าไร',graph:g,o:opts,a:opts.indexOf(String(pr.result.total)),e:`MST ใช้เส้น {${pr.result.edges.join(', ')}} รวม ${pr.result.total}`,shuffled:true})}
  g=randomGraph(randN());pr=primSteps(g,'a');
  {const ord=pr.result.order.join(', ');const set=new Set([ord]);let tries=0;while(set.size<4&&tries++<40)set.add(shuf(pr.result.order).join(', '));
   const opts=shuf([...set]);
   out.push({tag:'สุ่ม · Prim',q:'Prim เริ่มที่ a จะเลือกโหนดตามลำดับใด (ถ้าค่าเท่ากันให้เลือกตามลำดับตัวอักษร)',graph:g,o:opts,a:opts.indexOf(ord),e:`Prim เพิ่มโหนดตามลำดับ ${ord} ทุกรอบเลือกเส้นที่เบาที่สุดที่ต่อออกจากต้นไม้`,shuffled:true})}
  g=randomGraph(randN());
  {const ds=dijkstraSteps(g,'a'),r=ds.result,ids=g.nodes.map(n=>n.id).filter(x=>x!=='a'),t=ids[Math.floor(Math.random()*ids.length)];
   const path=[];let c=t;while(c){path.unshift(c);c=r.p[c]}
   const opts=numOpts(r.d[t]).map(String);
   out.push({tag:'สุ่ม · Dijkstra',q:`Dijkstra จากต้นทาง a ได้ d(${t}) เท่าไร`,graph:g,o:opts,a:opts.indexOf(String(r.d[t])),e:`เส้นทางสั้นที่สุดคือ ${path.join('–')} ระยะ ${r.d[t]}`,shuffled:true})}
  return out;
}
class Quiz{
  constructor(root,opt={}){this.root=root;this.tags=opt.tags||null;this.start()}
  start(){
    const keep=q=>!this.tags||this.tags.includes(q.tag.replace(/^สุ่ม · /,""));
    const fixed=FIXED.filter(keep).map(q=>{const idx=shuf(q.o.map((t,i)=>i));return {...q,o:idx.map(i=>q.o[i]),a:idx.indexOf(q.a)}});
    this.qs=[...fixed,...randomQs().filter(keep)];this.ans={};this.draw();
  }
  draw(){
    this.root.innerHTML=`<div class="card score"><div><span class="muted">ตอบแล้ว</span> <span class="num" id="qz-done">0</span><span class="muted"> / ${this.qs.length}</span> · <span class="muted">ถูก</span> <span class="num" id="qz-ok">0</span></div><div class="bar" aria-hidden="true"><i id="qz-bar" style="width:0"></i></div><button class="btn" type="button" id="qz-reset">↺ ทำใหม่ (สุ่มโจทย์ใหม่)</button></div>
      <div class="qlist">${this.qs.map((q,i)=>`<article class="card q" id="q${i}"><div class="q-head"><span class="q-no">${String(i+1).padStart(2,'0')}</span><span class="q-text">${q.q}</span><span class="q-tag">${q.tag}</span></div>${q.graph?`<svg class="qsvg" data-g="${i}" role="img" aria-label="กราฟประกอบคำถาม"></svg>`:''}<div class="opts">${q.o.map((t,k)=>`<button class="opt" type="button" data-q="${i}" data-o="${k}">${esc(String(t))}</button>`).join('')}</div><div class="q-exp" hidden></div></article>`).join('')}</div>`;
    $$('.qsvg',this.root).forEach(s=>{const v=new GraphView(s,this.qs[+s.dataset.g].graph,{});v.update({nodes:{},edges:{}},false)});
    $('#qz-reset').addEventListener('click',()=>{this.start();window.scrollTo({top:this.root.getBoundingClientRect().top+scrollY-120})});
    if(!this.bound){this.bound=1;this.root.addEventListener('click',e=>{const b=e.target.closest('.opt');if(b)this.answer(+b.dataset.q,+b.dataset.o)})}
  }
  answer(i,k){
    if(i in this.ans)return;
    this.ans[i]=k;const q=this.qs[i],card=$('#q'+i);
    $$('.opt',card).forEach((b,j)=>{b.disabled=true;if(j===q.a)b.classList.add('right');else if(j===k)b.classList.add('wrong')});
    const ex=$('.q-exp',card);ex.hidden=false;ex.innerHTML=(k===q.a?'✅ <b>ถูกต้อง</b> ':'❌ <b>ยังไม่ถูก</b> ')+esc(q.e);
    const done=Object.keys(this.ans).length,ok=Object.entries(this.ans).filter(([a,b])=>this.qs[a].a===b).length;
    if(done===this.qs.length&&this.onDone)this.onDone(ok,done);
    $('#qz-done').textContent=done;$('#qz-ok').textContent=ok;$('#qz-bar').style.width=(done/this.qs.length*100)+'%';
  }
}

/* ================= ส่วนที่ AlgoPrep ใช้ (แทน App/boot เดิม) ================= */
// แล็บเดิมหา element ด้วย id คงที่ จึงสร้างไว้ครั้งเดียวในที่จอด (#ap-park) แล้วย้ายทั้งก้อนเข้าหน้าเมื่อเปิดดู
const PARK_IDS=['coin','prim','kruskal','dijkstra','huffman'];
const MODS={};let cur=null;
function section(id){
  let s=document.getElementById('tab-'+id);
  if(!s){s=document.createElement('section');s.id='tab-'+id;s.className='m-gr gr-lab';document.getElementById('ap-park').appendChild(s)}
  return s;
}
function ensure(id){
  if(MODS[id])return MODS[id];
  section(id);
  if(id==='coin')MODS.coin=new CoinLab();
  else if(id==='huffman')MODS.huffman=new HuffLab();
  else{if(!LABS.prim)PARK_IDS.slice(1,4).forEach(section),initLabs();MODS.prim=LABS.prim;MODS.kruskal=LABS.kruskal;MODS.dijkstra=LABS.dijkstra}
  return MODS[id];
}
function mountLab(id,host){
  const m=ensure(id),s=section(id);
  host.appendChild(s);cur=m;
  if(m.player)m.player.go(m.player.i,0);
  return m;
}
function unmount(){
  if(cur&&cur.player)cur.player.pause();cur=null;
  const park=document.getElementById('ap-park');
  PARK_IDS.forEach(id=>{const s=document.getElementById('tab-'+id);if(s&&s.parentNode!==park)park.appendChild(s)});
}
document.addEventListener('keydown',e=>{
  if(!cur||!cur.root||!cur.root.isConnected||cur.root.closest('[hidden]'))return;
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  const t=e.target;if(t&&(/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)||t.isContentEditable))return;
  const p=cur.player;if(!p)return;
  if(e.key==='ArrowRight'){e.preventDefault();p.next()}
  else if(e.key==='ArrowLeft'){e.preventDefault();p.prev()}
  else if(e.key===' '&&!t.closest('button,a')){e.preventDefault();p.toggle()}
  else if(e.key==='r'||e.key==='R'){p.reset()}
});
const SUMMARY=`<h2 class="sec">สรุปย่อ</h2>
    <div class="sum-grid">
      <div class="card"><b>Prim</b><span>สร้าง MST โดยขยายต้นไม้จากโหนดเดียว ทีละโหนด</span></div>
      <div class="card"><b>Kruskal</b><span>สร้าง MST โดยเรียงเส้นตามน้ำหนัก แล้วเลือกเส้นที่ไม่ทำให้เกิดวงจร</span></div>
      <div class="card"><b>Dijkstra</b><span>หา single-source shortest paths (น้ำหนักต้องไม่ติดลบ)</span></div>
      <div class="card"><b>Huffman</b><span>เข้ารหัสแบบความยาวแปรผัน (prefix-free) เพื่อลดขนาดข้อมูล</span></div>
    </div>
    <h2 class="sec">ตารางเปรียบเทียบ</h2>
    <div class="table-scroll"><table class="cmp">
      <thead><tr><th></th><th>Prim</th><th>Kruskal</th><th>Dijkstra</th></tr></thead>
      <tbody>
        <tr><th>แก้ปัญหา</th><td>MST</td><td>MST</td><td>Shortest path จากต้นทางเดียว</td></tr>
        <tr><th>เลือกอะไรในแต่ละขั้น</th><td>เส้นที่เบาที่สุดที่ต่อจากต้นไม้ออกไป</td><td>เส้นที่เบาที่สุดทั้งกราฟที่ไม่ทำให้เกิดวงจร</td><td>โหนดที่มี d (ระยะสะสมจากต้นทาง) น้อยที่สุด</td></tr>
        <tr><th>ค่าที่เก็บในโหนด</th><td>น้ำหนักของ<b>เส้นเดียว</b></td><td>ไม่มี (ใช้กลุ่ม Union-Find)</td><td><b>ระยะรวม</b>จากต้นทาง</td></tr>
        <tr><th>โครงสร้างข้อมูล</th><td>Priority queue (min-heap)</td><td>Sort + Union-Find</td><td>Priority queue (min-heap)</td></tr>
        <tr><th>ความซับซ้อน</th><td class="mono">O(|E| log |V|)</td><td class="mono">O(|E| log |E|)</td><td class="mono">Θ(|V|²) หรือ O(|E| log |V|)</td></tr>
        <tr><th>ระหว่างทำงานเป็นต้นไม้เดียวที่ต่อกันไหม</th><td>ใช่</td><td>ไม่จำเป็น (เป็นป่าก่อน)</td><td>ใช่ (shortest-path tree)</td></tr>
      </tbody>
    </table></div>
    <h2 class="sec">จุดที่มักสับสน</h2>
    <div class="pitfalls">
      <div class="pit">Prim เก็บน้ำหนัก<b>ของเส้น</b> ส่วน Dijkstra เก็บ<b>ระยะสะสม</b> ตาราง <code>v(p, w)</code> ของสองแบบจึงให้ค่าต่างกัน</div>
      <div class="pit">MST ไม่จำเป็นต้องให้เส้นทางที่สั้นที่สุดระหว่างสองโหนด</div>
      <div class="pit">Dijkstra ใช้ไม่ได้กับน้ำหนักติดลบ</div>
      <div class="pit">Greedy ไม่ได้ให้คำตอบที่ดีที่สุดเสมอ (ตัวอย่างเหรียญ {1, 3, 4} ทอน 6)</div>
      <div class="pit">MST มีเส้นทั้งหมด |V| − 1 เส้นเสมอ</div>
    </div>`;
AP.gr={mountLab,unmount,mountDefs,Quiz,FIXED,randomQs,SUMMARY,StepPlayer,GraphView,PRESETS,mk,randomGraph,primSteps,kruskalSteps,dijkstraSteps,coinSteps,coinDP,huffSteps,edgeName,shuf,esc};
