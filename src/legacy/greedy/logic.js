// ==LOGIC-START==
const INF=Infinity;
const fmtD=d=>d===INF?'∞':String(d);
const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const ring=(ids,cx,cy,rx,ry,start=-90)=>ids.map((id,k)=>{const a=(start+360*k/ids.length)*Math.PI/180;return {id,x:Math.round(cx+rx*Math.cos(a)),y:Math.round(cy+ry*Math.sin(a))}});
const PRESETS={
  G1:{nodes:[{id:'a',x:60,y:170},{id:'b',x:170,y:60},{id:'c',x:350,y:60},{id:'d',x:460,y:170},{id:'e',x:260,y:290},{id:'f',x:260,y:170}],
      edges:[['a','b',3],['a','f',5],['a','e',6],['b','c',1],['b','f',4],['c','f',4],['c','d',6],['f','d',5],['f','e',2],['e','d',8]]},
  G2:{nodes:[...ring(['1','2','5','6','4'],260,170,150,125),{id:'3',x:260,y:170}].sort((a,b)=>a.id<b.id?-1:1),
      edges:[['1','2',6],['1','3',1],['1','4',5],['2','3',5],['2','5',3],['3','4',5],['3','5',6],['3','6',4],['4','6',2],['5','6',6]]},
  G3:{nodes:[{id:'A',x:50,y:170},{id:'B',x:170,y:60},{id:'C',x:170,y:280},{id:'D',x:470,y:170},{id:'E',x:340,y:290},{id:'F',x:340,y:80}],
      edges:[['A','C',8],['A','B',9],['C','B',2],['C','E',10],['C','D',9],['B','D',12,.3],['B','F',4],['E','D',5],['E','F',6,.72],['D','F',3]]},
  G4:{nodes:[{id:'a',x:60,y:260},{id:'b',x:190,y:70},{id:'c',x:400,y:70},{id:'d',x:260,y:260},{id:'e',x:460,y:260}],
      edges:[['a','b',3],['a','d',7],['b','c',4],['b','d',2],['c','d',5],['c','e',6],['d','e',4]]}
};
const mk=p=>({nodes:p.nodes.map(n=>({...n})),edges:p.edges.map(e=>Array.isArray(e)?{u:e[0],v:e[1],w:e[2],t:e[3]}:{...e})});
const edgeName=e=>{const [a,b]=[e.u,e.v].sort();return (a.length===1&&b.length===1&&/[A-Za-z]/.test(a+b))?a+b:a+'–'+b};
const edgeMap=g=>{const m={};g.edges.forEach((e,i)=>{m[e.u+'|'+e.v]=i;m[e.v+'|'+e.u]=i});return m};
function randomGraph(n){
  const ids='abcdefghij'.slice(0,n).split('');
  const nodes=ring(ids,260,165,190,120);
  const edges=[],has=new Set();
  const add=(u,v,t)=>{const k=[u,v].sort().join('');if(u===v||has.has(k))return false;has.add(k);edges.push({u,v,w:1+Math.floor(Math.random()*9),t});return true};
  const skip=Math.floor(Math.random()*n);
  for(let i=0;i<n;i++){if(i!==skip)add(ids[i],ids[(i+1)%n])}
  let extra=2+Math.floor(Math.random()*2),tries=0;
  while(extra>0&&tries++<60){const a=Math.floor(Math.random()*n),b=Math.floor(Math.random()*n);if(add(ids[a],ids[b],Math.random()<.5?.32:.68))extra--}
  return {nodes,edges};
}

/* ---------- Prim ---------- */
function primSteps(g,s){
  const V=g.nodes.map(n=>n.id),n=V.length;
  const inT=new Set([s]),key={},par={},parE={};
  V.forEach(v=>{key[v]=INF;par[v]=null;parE[v]=-1});
  const ET=[],rows=[],steps=[],order=[];let total=0;
  const enm=i=>edgeName(g.edges[i]);
  const remaining=()=>V.filter(v=>!inT.has(v));
  const pick=()=>{let b=null;for(const v of remaining()){if(key[v]<INF&&(b===null||key[v]<key[b]))b=v}return b};
  const fringe=()=>g.edges.map((e,i)=>i).filter(i=>inT.has(g.edges[i].u)!==inT.has(g.edges[i].v));
  const relax=u=>{const ch={};g.edges.forEach((e,i)=>{let v=null;if(e.u===u)v=e.v;else if(e.v===u)v=e.u;if(v===null||inT.has(v))return;if(e.w<key[v]){if(!ch[v])ch[v]={p:par[v],k:key[v]};key[v]=e.w;par[v]=u;parE[v]=i}});return ch};
  const mkRow=(tv,ch)=>{const m=pick();return {tree:tv===s?`${tv}(−, −)`:`${tv}(${par[tv]}, ${key[tv]})`,rem:remaining().map(v=>({v,p:par[v],txt:fmtD(key[v]),bold:v===m,ch:!!ch[v]}))}};
  const snap=({text,hl,minV=null,minE=-1,changed={}})=>{
    const nodes={},edges={};
    V.forEach(v=>{
      let cls=inT.has(v)?'n-tree':key[v]<INF?'n-fr':'';
      if(v===minV)cls='n-cand';
      let sub=v===s?'(−, −)':`(${par[v]??'−'}, ${fmtD(key[v])})`;
      if(changed[v])sub={old:`(${changed[v].p??'−'}, ${fmtD(changed[v].k)})`,now:sub};
      nodes[v]={cls,sub};
    });
    fringe().forEach(i=>edges[i]='e-fringe');
    ET.forEach(i=>edges[i]='e-tree');
    if(minE>=0)edges[minE]='e-cand';
    return {nodes,edges,text,hl,
      meta:`<span>VT = {${[...inT].join(', ')}}</span><span>ET = {${ET.map(enm).join(', ')||'∅'}}</span><span>น้ำหนักรวม = <b>${total}</b></span>`,
      chipsTitle:'เส้นที่ข้ามจากต้นไม้ไปยังโหนดที่เหลือ (fringe edges)',
      chips:fringe().map(i=>({t:`${enm(i)} ${g.edges[i].w}`,cls:i===minE?'hot':''})),
      rows:rows.slice()};
  };
  const ch0=relax(s);
  rows.push(mkRow(s,ch0));
  steps.push(snap({hl:[1,2],changed:ch0,text:`<b>เริ่มต้น:</b> ใส่โหนด <b>${s}</b> เข้า VT (โหนดไหนก็ได้เป็นจุดเริ่ม) และให้ ET ว่าง. จากนั้นทุกโหนดที่เหลือเก็บค่า <code>v(parent, weight)</code> คือ "เส้นที่เบาที่สุดที่ต่อเข้าต้นไม้ได้ตอนนี้". โหนดที่ยังไม่ติดกับต้นไม้ยังเป็น (−, ∞)`}));
  for(let i=1;i<n;i++){
    const m=pick();
    if(m===null)break;
    const e=parE[m],fr=fringe();
    const ties=remaining().filter(v=>key[v]===key[m]).length>1;
    steps.push(snap({hl:[3,4,5],minV:m,minE:e,text:`<b>รอบที่ ${i}:</b> เส้นที่ข้ามจากต้นไม้ไปยังโหนดที่เหลือมี ${fr.map(j=>`<b>${enm(j)}</b> (${g.edges[j].w})`).join(', ')}. เส้นที่น้ำหนัก<b>น้อยที่สุด</b>คือ <b>${enm(e)} (${g.edges[e].w})</b> จึงเลือกโหนด <b>${m}</b>${ties?' (มีหลายเส้นน้ำหนักเท่ากัน เลือกตามลำดับโหนด)':''}.<br>เหตุผล: เส้นที่เบาที่สุดที่ออกจากต้นไม้ปลอดภัยที่จะเลือกเสมอ เพราะโหนดนี้ต้องต่อเข้ามาอยู่แล้ว และการต่อด้วยเส้นเบาสุดไม่มีทางทำให้น้ำหนักรวมแย่ลง จึงตัดสินใจได้เลยโดยไม่ต้องย้อนกลับมาแก้`}));
    inT.add(m);ET.push(e);total+=g.edges[e].w;order.push(m);
    const ch=relax(m);
    rows.push(mkRow(m,ch));
    const chs=Object.keys(ch).map(v=>`${v}: ${fmtD(ch[v].k)} → ${key[v]} (ผ่าน ${m})`);
    steps.push(snap({hl:[6,7],changed:ch,text:`เพิ่ม <b>${m}</b> เข้า VT และเส้น <b>${enm(e)}</b> เข้า ET. จากนั้นอัปเดต <code>(parent, weight)</code> ของโหนดที่ติดกับ ${m}: ${chs.length?chs.join(', ')+' (เปลี่ยนเมื่อเส้นใหม่<b>เบากว่า</b>ค่าเดิมเท่านั้น ค่าเดิมจะถูกขีดฆ่า)':'ไม่มีค่าใดเปลี่ยน'}.`}));
  }
  const fin=snap({hl:[8],text:`<b>เสร็จ:</b> ET มี ${ET.length} เส้น = |V| − 1 = ${n-1} เส้น คือ {${ET.map(enm).join(', ')}} น้ำหนักรวม = <b>${total}</b> ลำดับโหนดที่ถูกเลือก: ${order.join(', ')}`});
  steps.push(fin);
  steps.result={order,total,edges:ET.map(enm)};
  return steps;
}

/* ---------- Kruskal ---------- */
const PAL=[210,150,32,280,340,58,190,100];
function kruskalSteps(g){
  const V=g.nodes.map(n=>n.id),n=V.length;
  const sorted=g.edges.map((e,i)=>({i,w:e.w,name:edgeName(e),u:e.u,v:e.v})).sort((a,b)=>a.w-b.w||a.i-b.i);
  const par={};V.forEach(v=>par[v]=v);
  const find=x=>{while(par[x]!==x)x=par[x];return x};
  const status=sorted.map(()=> '');
  const ET=[],rows=[],steps=[];let ec=0,total=0;
  const comps=()=>{const m={};V.forEach(v=>{const r=find(v);(m[r]||(m[r]=[])).push(v)});return Object.values(m)};
  const compOf=v=>V.filter(x=>find(x)===find(v));
  const setStr=a=>'{'+a.join(', ')+'}';
  const hue=c=>PAL[V.indexOf(c[0])%PAL.length];
  const pathBetween=(a,b)=>{const adj={};V.forEach(v=>adj[v]=[]);ET.forEach(i=>{const e=g.edges[i];adj[e.u].push(e.v);adj[e.v].push(e.u)});const prev={[a]:null},q=[a];while(q.length){const x=q.shift();if(x===b)break;adj[x].forEach(y=>{if(!(y in prev)){prev[y]=x;q.push(y)}})}const p=[];let c=b;while(c!==null&&c!==undefined){p.unshift(c);c=prev[c]}return p};
  const snap=({text,hl,ptr=-1,cur=-1,rejE=-1,cycle=null,final=false})=>{
    const nodes={},edges={};
    comps().forEach(c=>{if(c.length>1){const col=`hsl(${hue(c)} 70% 50%)`;c.forEach(v=>nodes[v]={color:col})}});
    if(cycle)cycle.forEach(v=>nodes[v]={...(nodes[v]||{}),cls:'n-rej'});
    ET.forEach(i=>edges[i]='e-tree');
    if(cur>=0)edges[sorted[cur].i]='e-cand';
    if(rejE>=0)edges[sorted[rejE].i]='e-rej flash';
    const chips=sorted.map((s,p)=>({t:`${s.name} ${s.w}`,cls:(status[p]==='ok'?'ok':status[p]==='rej'?'bad':(final&&!status[p]?'skip':''))+(p===ptr?' ptr':'')}));
    const cs=comps().map(c=>`<i class="grp" style="--c:${c.length>1?`hsl(${hue(c)} 70% 50%)`:'var(--idle)'}">${setStr(c)}</i>`).join(' ');
    return {nodes,edges,text,hl,chips,chipsTitle:'Sorted list of edges (น้ำหนักน้อย → มาก)',
      meta:`<span>ecounter = <b>${ec}</b> / ${n-1}</span><span>กลุ่ม (Union-Find): ${cs}</span><span>น้ำหนักรวม = <b>${total}</b></span>`,
      rows:rows.slice()};
  };
  steps.push(snap({hl:[1,2,3],text:`<b>เริ่มต้น:</b> เรียงเส้นทั้งหมดจากน้ำหนักน้อยไปมาก (ถ้าเท่ากันคงลำดับตามข้อมูลเดิม) ให้ ET ว่าง และ ecounter = 0. ตอนแรกทุกโหนดเป็นกลุ่มของตัวเอง (ยังไม่มีเส้นใดในต้นไม้) เป้าหมายคือรับให้ครบ ${n-1} เส้น`}));
  for(let k=0;k<sorted.length&&ec<n-1;k++){
    const s=sorted[k],cu=compOf(s.u),cv=compOf(s.v),same=find(s.u)===find(s.v);
    steps.push(snap({hl:[4,5,6],ptr:k,cur:k,text:`<b>เส้นที่ ${k+1}:</b> <b>${s.name}</b> (น้ำหนัก ${s.w}) เป็นเส้นที่เบาที่สุดในบรรดาเส้นที่ยังไม่ได้พิจารณา. ตรวจว่าเกิดวงจรไหม: ${s.u} อยู่ในกลุ่ม ${setStr(cu)} และ ${s.v} อยู่ในกลุ่ม ${setStr(cv)} → ${same?'<b>กลุ่มเดียวกัน</b> มีทางเชื่อมกันอยู่แล้ว ถ้าเพิ่มเส้นนี้จะเกิดวงจร':'<b>คนละกลุ่ม</b> เชื่อมกันแล้วไม่เกิดวงจร'}`}));
    if(!same){
      par[find(s.u)]=find(s.v);ET.push(s.i);ec++;total+=s.w;status[k]='ok';
      rows.push({tree:`${s.name} ${s.w}`,list:sorted.map((x,p)=>({t:`${x.name} ${x.w}`,cls:p===k?'b':status[p]==='rej'?'x':''}))});
      steps.push(snap({hl:[6,7],ptr:k,text:`✅ <b>รับเส้น ${s.name}</b> เข้า ET และรวมสองกลุ่มเป็น ${setStr(compOf(s.u))} (สีของกลุ่มกลืนกัน). ecounter = ${ec} / ${n-1}.<br>เหตุผล: เส้นนี้เบาที่สุดในบรรดาเส้นที่เหลือ และไม่ทำให้เกิดวงจร จึงปลอดภัยที่จะเลือกโดยไม่ต้องกลับมาแก้`}));
    }else{
      const p=pathBetween(s.u,s.v);status[k]='rej';
      steps.push(snap({hl:[6],ptr:k,rejE:k,cycle:p,text:`❌ <b>ปฏิเสธเส้น ${s.name}</b> เพราะเกิดวงจร: <b>${p.concat(p[0]).join('–')}</b>.<br>เหตุผล: ${s.u} กับ ${s.v} ถูกเชื่อมกันด้วยเส้นที่เบากว่า (หรือเท่ากัน) ที่รับไปแล้ว การเพิ่มเส้นนี้ไม่ช่วยให้ต่อโหนดเพิ่ม มีแต่ทำให้น้ำหนักรวมมากขึ้น`}));
    }
  }
  steps.push(snap({hl:[8],final:true,text:`<b>เสร็จ:</b> ecounter = ${ec} = |V| − 1 จึงหยุด${sorted.some((s,p)=>!status[p])?' (เส้นที่เหลือไม่ต้องพิจารณาอีก)':''}. ET = {${ET.map(i=>edgeName(g.edges[i])).join(', ')}} น้ำหนักรวม = <b>${total}</b>`}));
  steps.result={total,edges:ET.map(i=>edgeName(g.edges[i])),sorted:sorted.map(s=>s.name+s.w)};
  return steps;
}

/* ---------- Dijkstra ---------- */
function dijkstraSteps(g,s){
  const V=g.nodes.map(n=>n.id),n=V.length,idx=edgeMap(g);
  const d={},p={},pE={},VT=new Set();
  V.forEach(v=>{d[v]=INF;p[v]=null;pE[v]=-1});d[s]=0;
  const rows=[],steps=[];let upd={},cur=null;
  const cmp=(a,b)=>(d[a]<d[b]?-1:d[a]>d[b]?1:0)||V.indexOf(a)-V.indexOf(b);
  const PQ=()=>V.filter(v=>!VT.has(v)).sort(cmp);
  const refresh=()=>{if(!rows.length)return;const q=PQ(),m=q.length&&d[q[0]]<INF?q[0]:null;
    rows[rows.length-1].rem=V.filter(v=>!VT.has(v)).map(v=>({v,p:p[v],txt:(upd[v]!==undefined&&d[cur]!==0)?`${d[cur]}+${upd[v]}`:fmtD(d[v]),bold:v===m,ch:upd[v]!==undefined}))};
  const pathTo=v=>{const a=[];let c=v;while(c!==null){a.unshift(c);c=p[c]}return a};
  const snap=o=>{
    refresh();
    const nodes={},edges={};
    V.forEach(v=>{
      let cls=VT.has(v)?'n-tree':d[v]<INF?'n-fr':'';
      if(o.tv===v)cls='n-cand';
      let sub=`d=${fmtD(d[v])}`;
      if(o.tween&&o.tween[v])sub={tween:o.tween[v],prefix:'d='};
      nodes[v]={cls,sub};
    });
    V.forEach(v=>{if(v!==s&&pE[v]>=0)edges[pE[v]]=VT.has(v)?'e-tree':'e-fringe'});
    if(o.relaxE>=0)edges[o.relaxE]=o.relaxCls;
    const q=o.pq||PQ();
    return {nodes,edges,text:o.text,hl:o.hl,
      chipsTitle:'Priority Queue Q (โหนดที่ยังไม่อยู่ใน VT เรียง d จากน้อยไปมาก)',
      chips:q.map(v=>({t:`${v}: ${fmtD(d[v])}`,cls:o.hot===v?'hot lv':''})),
      meta:`<span>VT = {${[...VT].join(', ')}}</span>`,
      rows:rows.map(r=>({tree:r.tree,rem:r.rem.map(x=>({...x}))})),
      final:o.final?{p:{...p},pE:{...pE},d:{...d}}:null};
  };
  steps.push(snap({hl:[1,2,3,4,5,6],hot:s,text:`<b>เริ่มต้น:</b> ทุกโหนดตั้ง <code>d = ∞</code>, <code>p = null</code> แล้วใส่เข้า priority queue. ตั้ง <b>d(${s}) = 0</b> เพราะระยะจากต้นทางถึงตัวเองคือ 0 ${s} จึงอยู่หน้าสุดของคิว`}));
  for(let i=0;i<n;i++){
    const q0=PQ(),u=q0[0];
    if(u===undefined||d[u]===INF)break;
    VT.add(u);cur=u;upd={};
    rows.push({tree:`${u}(${p[u]??'−'}, ${d[u]})`,rem:[]});
    steps.push(snap({pq:q0,hot:u,hl:[7,8,9],text:`<b>รอบที่ ${i+1}:</b> DeleteMin(Q) ได้ <b>${u}</b> ที่ d = <b>${d[u]}</b> ซึ่งน้อยที่สุดในคิว จึงย้ายเข้า VT (ค่านี้ถือว่าสุดท้ายแล้ว)${p[u]?` และเส้น ${p[u]}–${u} เข้าต้นไม้เส้นทางสั้นสุด`:''}.<br>เหตุผล: เส้นทางอื่นไปโหนดนี้ต้องผ่านโหนดที่ยังอยู่ในคิวซึ่ง d ไม่น้อยกว่านี้ แล้วยังต้องบวกน้ำหนักที่ไม่ติดลบอีก จึงสั้นกว่านี้ไม่ได้`}));
    V.forEach(v=>{
      if(VT.has(v))return;
      const ei=idx[u+'|'+v];if(ei===undefined)return;
      const w=g.edges[ei].w,cand=d[u]+w,old=d[v],better=cand<old;
      const eq=`d(${u}) + w(${u},${v}) = ${d[u]} + ${w} = ${cand}  ${better?'<':'≮'}  d(${v}) = ${fmtD(old)}`;
      if(better){d[v]=cand;p[v]=u;pE[v]=ei;upd[v]=w}
      steps.push(snap({hl:better?[10,11,12,13]:[10,11],tv:better?v:null,relaxE:better?ei:ei,relaxCls:better?'e-cand':'e-rej',tween:better?{[v]:[old,cand]}:null,
        text:`ขยายจาก <b>${u}</b> ไปยัง <b>${v}</b> (เส้น ${u}–${v} น้ำหนัก ${w}):<span class="eq ${better?'yes':'no'}">${eq}</span>${better?`✓ ทางผ่าน ${u} <b>สั้นกว่า</b> จึงอัปเดต d(${v}) = ${cand}, p(${v}) = ${u} และ Decrease ในคิว`:`✗ ไม่ได้ทางที่สั้นกว่า จึงคงค่าเดิม d(${v}) = ${fmtD(old)}`}`}));
    });
  }
  const lines=V.filter(v=>v!==s&&d[v]<INF).map(v=>`<span>${s} → ${v}: <b>${d[v]}</b> (${pathTo(v).join('–')})</span>`).join('');
  steps.push(snap({final:true,hl:[],text:`<b>เสร็จ:</b> โหนดทุกตัวอยู่ใน VT แล้ว ได้ระยะสั้นที่สุดจาก ${s} ไปทุกโหนด:<div class="pathlist">${lines}</div><br><span class="muted">คลิกที่โหนดบนกราฟเพื่อไฮไลต์เส้นทางนั้น</span>`}));
  steps.result={d:{...d},p:{...p}};
  return steps;
}

/* ---------- Coin ---------- */
function coinDP(coins,amount){
  const dp=[0],from=[-1];
  for(let a=1;a<=amount;a++){dp[a]=INF;from[a]=-1;for(const c of coins){if(c<=a&&dp[a-c]+1<dp[a]){dp[a]=dp[a-c]+1;from[a]=c}}}
  if(dp[amount]===INF)return null;
  const list=[];let a=amount;while(a>0){list.push(from[a]);a-=from[a]}
  return {count:dp[amount],list:list.sort((x,y)=>y-x)};
}
function coinSteps(coins,amount){
  const cs=[...new Set(coins)].sort((a,b)=>b-a);
  const steps=[],lines=[],taken=[];let r=amount;
  const snap=(o)=>({coins:cs,active:o.active??null,r,taken:taken.slice(),lines:lines.slice(),text:o.text,hl:o.hl,newCoin:!!o.newCoin,final:!!o.final});
  steps.push(snap({hl:[1],text:`<b>เริ่มต้น:</b> ต้องทอน <b>${amount}</b> บาท ด้วยเหรียญ {${cs.slice().reverse().join(', ')}}. เรียงเหรียญจากค่ามากไปน้อย แล้วใช้เหรียญใหญ่ที่สุดที่ยังไม่เกินยอดคงเหลือเสมอ เพื่อให้ยอดที่เหลือน้อยที่สุดในทุกก้าว (ไม่ย้อนกลับมาแก้)`}));
  for(const c of cs){
    if(r===0)break;
    const k=Math.floor(r/c);
    steps.push(snap({active:c,hl:[2,3],text:k>0?`พิจารณาเหรียญ <b>${c}</b>: ยอดคงเหลือ ${r} ≥ ${c} จึงใช้ได้ ${k} เหรียญ (${r} ÷ ${c} ปัดลง = ${k})`:`พิจารณาเหรียญ <b>${c}</b>: ${c} มากกว่ายอดคงเหลือ ${r} ใช้ไม่ได้ จึงข้ามไปเหรียญที่เล็กกว่า`}));
    const before=r;
    for(let j=1;j<=k;j++){
      r-=c;taken.push(c);
      if(j===k)lines.push(`${before} − (${c}×${k}) = ${r}`);
      steps.push(snap({active:c,hl:[3,4],newCoin:true,text:`หยิบเหรียญ <b>${c}</b> ใส่ถาด (เหรียญที่ ${taken.length}) ยอดคงเหลือ ${r+c} − ${c} = <b>${r}</b>${j===k&&r>0?`. ใช้เหรียญ ${c} ต่อไม่ได้แล้ว (${r} < ${c})`:''}`}));
    }
  }
  steps.push(snap({final:true,hl:[5],text:r===0?`<b>เสร็จ:</b> ยอดคงเหลือ 0 ใช้ทั้งหมด <b>${taken.length} เหรียญ</b>: ${taken.join(' + ')} = ${amount}`:`<b>ทอนไม่ได้:</b> ยอดคงเหลือ ${r} แต่ไม่มีเหรียญที่เล็กพอ (Greedy ไม่ย้อนกลับไปเปลี่ยนเหรียญที่หยิบไปแล้ว)`}));
  steps.result={taken:taken.slice(),left:r};
  return steps;
}

/* ---------- Huffman ---------- */
const hfmt=w=>String(+(w/10000).toFixed(4));
function huffSteps(items){
  let seq=0;
  const leaves=items.map(it=>({id:'n'+seq,seq:seq++,sym:it.sym,w:it.w,l:null,r:null}));
  const sortQ=q=>q.slice().sort((a,b)=>a.w-b.w||a.seq-b.seq);
  const syms=nd=>nd.sym!==null&&nd.sym!==undefined?nd.sym:syms(nd.l)+syms(nd.r);
  const lab=nd=>nd.l?`${hfmt(nd.w)}`:`${nd.sym} ${hfmt(nd.w)}`;
  let Q=sortQ(leaves);
  const rows=[Q.map(lab)],steps=[];
  const codes={};
  const base=o=>({q:Q.slice(),picked:o.picked||[],newId:o.newId||null,bits:!!o.bits,path:o.path||null,codes:{...(o.codes||{})},text:o.text,hl:o.hl,rows:rows.map(r=>r.slice()),chips:Q.map(x=>({t:lab(x),sub:x.l?syms(x):'',cls:(o.picked||[]).includes(x.id)?'hot':(x.id===o.newId?'ok':'')})),chipsTitle:'คิวของก้อนความถี่ (น้อย → มาก)',roots:Q.slice(),final:!!o.final});
  steps.push(base({hl:[1],text:`<b>เริ่มต้น:</b> ตัวอักษรแต่ละตัวเป็นต้นไม้ 1 โหนด น้ำหนัก = ความถี่ เรียงคิวจากน้อยไปมาก: ${Q.map(lab).join(' · ')}`}));
  let k=0;
  while(Q.length>1){
    k++;
    const a=Q[0],b=Q[1];
    steps.push(base({picked:[a.id,b.id],hl:[2,3],text:`<b>รอบที่ ${k}:</b> หยิบสองก้อนที่น้อยที่สุดจากหน้าคิว: <b>${lab(a)}</b> และ <b>${lab(b)}</b>.<br>เหตุผล: ตัวที่ความถี่ต่ำที่สุดควรได้รหัสยาวที่สุด จึงรวมมันไว้ก่อนเพื่อให้อยู่ลึกที่สุดในต้นไม้ ส่วนตัวที่ถี่มากจะถูกรวมทีหลังและอยู่ตื้น (รหัสสั้น)`}));
    const nd={id:'n'+seq,seq:seq++,sym:null,w:a.w+b.w,l:a,r:b};
    Q=sortQ([...Q.slice(2),nd]);
    rows.push(Q.map(lab));
    steps.push(base({newId:nd.id,hl:[4,5,6],text:`รวมเป็นโหนดใหม่ น้ำหนัก ${hfmt(a.w)} + ${hfmt(b.w)} = <b>${hfmt(nd.w)}</b> โดยก้อนที่เล็กกว่าอยู่ซ้าย (${syms(a)}) และอีกก้อนอยู่ขวา (${syms(b)}). แล้วแทรกกลับเข้าคิวตามตำแหน่งที่เรียงถูกต้อง (ถ้าค่าเท่ากัน ก้อนที่เข้าคิวก่อนอยู่ก่อน)`}));
  }
  const root=Q[0];
  const walk=(nd,c)=>{if(!nd.l){codes[nd.sym]=c||'0';return}walk(nd.l,c+'0');walk(nd.r,c+'1')};
  walk(root,'');
  steps.push(base({bits:true,hl:[7],text:`เหลือต้นไม้เดียว (รากมีน้ำหนัก ${hfmt(root.w)}). ติดเลข <b>0</b> ที่กิ่งซ้าย และ <b>1</b> ที่กิ่งขวาทุกกิ่ง`}));
  const pathTo=(nd,sym,acc)=>{if(!nd.l)return nd.sym===sym?[...acc,nd.id]:null;return pathTo(nd.l,sym,[...acc,nd.id])||pathTo(nd.r,sym,[...acc,nd.id])};
  const shown={};
  items.forEach(it=>{
    shown[it.sym]=codes[it.sym];
    steps.push(base({bits:true,path:new Set(pathTo(root,it.sym,[])),codes:shown,hl:[8],text:`ไล่จากรากไปถึงใบ <b>${it.sym}</b> ตามกิ่ง ${codes[it.sym].split('').join(' → ')} ได้ codeword = <b>${codes[it.sym]}</b> (ยาว ${codes[it.sym].length} บิต)`}));
  });
  const tot=items.reduce((s,x)=>s+x.w,0);
  const avg=items.reduce((s,x)=>s+codes[x.sym].length*x.w,0)/tot;
  const fixed=Math.max(1,Math.ceil(Math.log2(items.length)));
  const ratio=(fixed-avg)/fixed*100;
  steps.push(base({bits:true,codes,final:true,hl:[],text:`<b>เสร็จ:</b> ได้รหัส ${items.map(x=>`${x.sym}=${codes[x.sym]}`).join(', ')}. ไม่มี codeword ใดเป็น prefix ของอีกตัว (เพราะทุกตัวอยู่ที่ใบ) จึงถอดรหัสได้ไม่กำกวม. จำนวนบิตเฉลี่ย ${+avg.toFixed(4)} เทียบกับรหัสความยาวคงที่ ${fixed} บิต ลดได้ ${+ratio.toFixed(2)}%`}));
  steps.result={codes,avg,fixed,ratio,root,tot};
  return steps;
}
const huffEncode=(codes,text)=>{let o='';for(const ch of text){if(!(ch in codes))return {err:`ไม่มีตัวอักษร "${ch}" ในตาราง`};o+=codes[ch]}return {bits:o}};
function huffDecodeSteps(root,bits){
  const steps=[];let node=root,path=[root.id],out='',buf='';
  steps.push({path:new Set(path),out,i:-1,text:'เริ่มที่ราก ยังไม่ได้อ่านบิต'});
  for(let i=0;i<bits.length;i++){
    const b=bits[i];node=b==='0'?node.l:node.r;path.push(node.id);buf+=b;
    if(!node.l){out+=node.sym;steps.push({path:new Set(path),out,i,text:`อ่านบิต ${b} ถึงใบ <b>${node.sym}</b> (รหัส ${buf}) จึงถอดได้ ${node.sym} แล้วกลับไปเริ่มที่ราก`});node=root;path=[root.id];buf=''}
    else steps.push({path:new Set(path),out,i,text:`อ่านบิต ${b} เดินไปทาง${b==='0'?'ซ้าย (0)':'ขวา (1)'} ยังไม่ถึงใบ`});
  }
  if(buf)steps.push({path:new Set(path),out,i:bits.length-1,text:`<span class="warn">บิตหมดก่อนถึงใบ: "${buf}" ยังไม่ครบ codeword</span>`});
  return steps;
}
// ==LOGIC-END==
