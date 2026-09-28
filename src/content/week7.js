/* week7.js — Week 7 Space & Time Trade-Offs: อนิเมชัน (พอร์ตจาก week7-game.html), หน้าเรียน, ควิซ
 * อนิเมชันเดิมคงตรรกะไว้ทั้งหมด เปลี่ยนแค่จุดเชื่อมกับเว็บรวม (host, toast, เก็บกวาดตัวจับเวลา) */
(function () {
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const toast=AP.toast, DEMOS={}, ACTIVE=[];
function Stepper(root,render,key){
  root.innerHTML='<div class="stage"></div><div class="msg"></div><div class="ctrl"><button data-a="reset">⏮ เริ่มใหม่</button><button data-a="prev">◀ ย้อน</button><button class="pri" data-a="next">ถัดไป ▶</button><button data-a="play">⏵ อัตโนมัติ</button><span class="cnt"></span></div>';
  let steps=[],i=0,timer=null;const stage=$('.stage',root),msg=$('.msg',root),cnt=$('.cnt',root),play=$('[data-a=play]',root);
  function draw(){const s=steps[i];stage.innerHTML='';render(stage,s,i);msg.innerHTML=s.msg||'';cnt.textContent=`ขั้นที่ ${i+1}/${steps.length}`;
    if(i===steps.length-1){stop();}}
  function stop(){clearInterval(timer);timer=null;play.textContent='⏵ อัตโนมัติ'}
  root.addEventListener('click',e=>{const a=e.target.dataset.a;if(!a)return;
    if(a==='next'){if(i<steps.length-1){i++;draw()}}
    else if(a==='prev'){if(i>0){i--;draw()}}
    else if(a==='reset'){stop();i=0;draw()}
    else if(a==='play'){if(timer){stop();return}if(i>=steps.length-1)i=0;draw();play.textContent='⏸ หยุด';timer=setInterval(()=>{if(i<steps.length-1){i++;draw()}else stop()},1100)}});
  const api={set(s){stop();steps=s;i=0;draw()},stop};ACTIVE.push(api);return api;
}
const cells=(arr,cls=()=>'',idx=true,sm=false)=>`<div class="row">${arr.map((v,k)=>`<div class="cellw"><div class="cell ${sm?'sm':''} ${cls(k,v)}">${v===null||v===undefined?'':v}</div>${idx?`<div class="idx">${k}</div>`:''}</div>`).join('')}</div>`;

/* ---------- 1 comparison counting ---------- */
DEMOS.cmp=function(host){
 const root=host;
 root.innerHTML='<div class="inp"><label>ชุดตัวเลข (คั่นด้วย ,)</label><input type="text" id="cmpin" value="62,31,84,96,19,47" size="24"><button class="b" id="cmpgo">ใช้ชุดนี้</button></div><div id="cmpst"></div>';
 const S=Stepper($('#cmpst'),(st,s)=>{
   st.innerHTML=`<div class="lab">A</div>`+cells(s.A,(k)=>k===s.i?'i':k===s.j?'j':s.placed&&k===s.pk?'win':'')+
    '<div class="lab">Count[]</div>'+cells(s.c,(k)=>k===s.pc?'pop':'')+
    '<div class="lab">S (ผลลัพธ์)</div>'+cells(s.S,(k)=>s.S[k]!==null&&k===s.ps?'ok pop':(s.S[k]===null?'empty':'ok'));
 },'cmp');
 function gen(A){const n=A.length,c=Array(n).fill(0),st=[];
  st.push({A,c:[...c],S:Array(n).fill(null),msg:'เริ่มต้น: Count[] ทุกช่อง = 0 &nbsp;(🔵 = A[i], 🟠 = A[j])'});
  for(let i=0;i<n-1;i++)for(let j=i+1;j<n;j++){let pc;if(A[i]<A[j]){c[j]++;pc=j}else{c[i]++;pc=i}
   st.push({A,i,j,pc,c:[...c],S:Array(n).fill(null),msg:`เทียบ A[${i}]=${A[i]} กับ A[${j}]=${A[j]} → ${A[i]<A[j]?`${A[i]} &lt; ${A[j]} ดังนั้น Count[${j}]++`:`${A[i]} ≥ ${A[j]} ดังนั้น Count[${i}]++`}`})}
  const Sx=Array(n).fill(null);
  for(let k=0;k<n;k++){Sx[c[k]]=A[k];st.push({A,pk:k,placed:1,c:[...c],S:[...Sx],ps:c[k],msg:`วางผล: S[Count[${k}]] = S[${c[k]}] ← A[${k}] = ${A[k]} (มีตัวน้อยกว่ามัน ${c[k]} ตัว)`})}
  st[st.length-1].msg+=' 🎉 เรียงเสร็จ! จำนวนการเทียบ = n(n−1)/2 = '+n*(n-1)/2;return st}
 const go=()=>{let A=$('#cmpin').value.split(',').map(x=>parseInt(x)).filter(x=>!isNaN(x)).slice(0,8);if(new Set(A).size!==A.length||A.length<2){toast('ใส่เลขไม่ซ้ำ 2-8 ตัว');return}S.set(gen(A))};
 $('#cmpgo').onclick=go;go();
};
/* ---------- 2 distribution counting ---------- */
DEMOS.dist=function(host){
 const root=host;
 root.innerHTML='<div class="inp"><label>ชุดตัวเลข (ช่วงแคบๆ, ซ้ำได้)</label><input type="text" id="disin" value="13,11,12,13,12,12" size="24"><button class="b" id="disgo">ใช้ชุดนี้</button></div><div id="disst"></div>';
 const S=Stepper($('#disst'),(st,s)=>{
   st.innerHTML='<div class="lab">A</div>'+cells(s.A,(k)=>k===s.ai?'i':'')+
   `<div class="lab">D[] (ค่า ${s.l}..${s.u})</div>`+`<div class="row">${s.D.map((v,k)=>`<div class="cellw"><div class="cell ${k===s.dj?'j pop':''}">${v}</div><div class="idx">${s.l+k}</div></div>`).join('')}</div>`+
   '<div class="lab">S</div>'+cells(s.S,(k)=>s.S[k]===null?'empty':k===s.ps?'ok pop':'ok');
 },'dist');
 function gen(A){const n=A.length,l=Math.min(...A),u=Math.max(...A),D=Array(u-l+1).fill(0),st=[],S=Array(n).fill(null);
  const push=(o,m)=>st.push({A,l,u,D:[...D],S:[...S],msg:m,...o});
  push({},`เริ่มต้น D[] = 0 ทุกช่อง (ช่วง ${l}..${u})`);
  for(let i=0;i<n;i++){D[A[i]-l]++;push({ai:i,dj:A[i]-l},`<b>① นับความถี่:</b> เจอ ${A[i]} → D[${A[i]}−${l}]++ เป็น ${D[A[i]-l]}`)}
  for(let j=1;j<D.length;j++){D[j]+=D[j-1];push({dj:j},`<b>② สะสม:</b> D[${j}] ← D[${j-1}] + D[${j}] = ${D[j]} (ค่า ${l+j} เรียงจบที่ตำแหน่ง ${D[j]})`)}
  for(let i=n-1;i>=0;i--){const j=A[i]-l,p=D[j]-1;S[p]=A[i];D[j]--;push({ai:i,dj:j,ps:p},`<b>③ วางจากขวา:</b> A[${i}]=${A[i]} → S[D[${j}]−1] = S[${p}] ← ${A[i]}, แล้ว D[${j}]−− เป็น ${D[j]}`)}
  st[st.length-1].msg+=' 🎉 เสร็จ! เวลา Θ(n) แต่ต้องใช้พื้นที่เพิ่ม';return st}
 const go=()=>{let A=$('#disin').value.split(',').map(x=>parseInt(x)).filter(x=>!isNaN(x)).slice(0,12);if(A.length<2||Math.max(...A)-Math.min(...A)>15){toast('ใส่เลข 2-12 ตัว ช่วงห่างไม่เกิน 15');return}S.set(gen(A))};
 $('#disgo').onclick=go;go();
};
/* ---------- 3/4 Horspool & Boyer-Moore ---------- */
function shiftTable(P){const m=P.length,t={};for(let j=0;j<m-1;j++)t[P[j]]=m-1-j;return t}
function goodSuffix(P){const m=P.length,d2=[];for(let k=1;k<m;k++){for(let d=1;d<=m;d++){let ok=true;for(let j=0;j<k;j++){const x=m-1-j-d;if(x>=0&&P[x]!==P[m-1-j]){ok=false;break}}
  if(ok){const b=m-k-1-d;if(b>=0&&P[b]===P[m-1-k])ok=false}if(ok){d2[k]=d;break}}}return d2}
function strSteps(T,P,bm){const n=T.length,m=P.length,t=shiftTable(P),d2=goodSuffix(P),st=[];let i=m-1;
 st.push({T,P,off:0,i:null,k:0,msg:`เริ่มวาง pattern ชิดซ้ายของข้อความ (m = ${m}) แล้วเทียบจาก<b>ตัวท้าย</b>ย้อนมาทางซ้าย`});
 while(i<=n-1){let k=0;while(k<m&&P[m-1-k]===T[i-k])k++;const off=i-m+1;
  if(k===m){st.push({T,P,off,i,k,found:1,msg:`✅ ตรงทั้ง ${m} ตัว! พบ pattern ที่ตำแหน่ง ${off}`});return st}
  const c=T[i-k];let d,ex;
  if(!bm){d=t[T[i]]||m;ex=`Horspool: ตัวในข้อความใต้ท้าย pattern = "<b>${T[i]}</b>" → Table = <b>${d}</b> → เลื่อน ${d}${t[T[i]]?'':' (ไม่อยู่ใน pattern → เลื่อนทั้ง pattern)'}`}
  else{const t1=t[c]||m,d1=Math.max(t1-k,1);if(k===0){d=d1;ex=`k=0, c="<b>${c}</b>", t₁(c)=${t1} → d = d₁ = max{${t1}−0,1} = <b>${d}</b>`}else{d=Math.max(d1,d2[k]);ex=`k=${k}, c="<b>${c}</b>", t₁(c)=${t1} → d₁=max{${t1}−${k},1}=${d1}; d₂[${k}]=${d2[k]} → d = max{${d1},${d2[k]}} = <b>${d}</b>`}}
  st.push({T,P,off,i,k,mis:i-k,d,msg:`ตรง ${k} ตัว แล้ว "${c}"≠"${P[m-1-k]}" ✗ &nbsp;→&nbsp; ${ex}`});i+=d}
 st.push({T,P,off:null,msg:'❌ เลื่อนจนสุดข้อความ ไม่พบ pattern'});return st}
function renderStr(stage,s){const{T,P,off}=s;
 const tc=[...T].map((ch,x)=>{let c='';if(off!==null&&x>=off&&x<off+P.length)c='win';if(s.i!=null&&x>s.i-s.k&&x<=s.i)c='ok';if(s.mis===x)c='bad';if(s.found&&x>=off&&x<off+P.length)c='ok';return`<div class="cellw"><div class="cell sm ${c}">${ch}</div><div class="idx">${x}</div></div>`}).join('');
 const pc=off===null?'':`<div class="row" style="padding-left:${Math.max(off,0)*32}px">${[...P].map((ch,x)=>{const fromR=P.length-1-x;let c='pat';if(s.i!=null&&fromR<s.k)c='ok';if(s.mis!=null&&fromR===s.k)c='bad';if(s.found)c='ok';return`<div class="cell sm ${c}">${ch}</div>`}).join('')}</div>`;
 stage.innerHTML=`<div class="scr" style="scroll-behavior:smooth"><div class="row" style="gap:4px;flex-wrap:nowrap">${tc}</div>${pc}</div>`;
 const sc=stage.firstChild;if(off!==null)sc.scrollLeft=Math.max(0,off*32-120);}
function tablesHTML(P,bm){const m=P.length,t=shiftTable(P),ks=[...new Set([...P])];
 let h=`<div class="chips"><span class="chip">Shift Table:</span>${ks.map(c=>`<span class="chip">${c} = <b>${t[c]||m}</b></span>`).join('')}<span class="chip">อื่นๆ = <b>${m}</b></span></div>`;
 if(bm){const d2=goodSuffix(P);h+=`<div class="chips"><span class="chip">Good-suffix d₂:</span>${d2.slice(1).map((v,k)=>`<span class="chip">k=${k+1} → <b>${v}</b></span>`).join('')}</div>`}return h}
function strDemo(root,pid,bm,T0,P0){
 root.innerHTML=`<div class="inp"><label>ข้อความ</label><input type="text" id="${pid}T" value="${T0}" size="30"><label>Pattern</label><input type="text" id="${pid}P" value="${P0}" size="10"><button class="b" id="${pid}go">เริ่มใหม่</button></div><div id="${pid}tb"></div><div id="${pid}st"></div>`;
 const S=Stepper($('#'+pid+'st'),renderStr,pid);
 const go=()=>{const T=$('#'+pid+'T').value.toUpperCase().replace(/ /g,'_'),P=$('#'+pid+'P').value.toUpperCase().replace(/ /g,'_');if(!P||P.length>T.length||T.length>60){toast('pattern ต้องสั้นกว่าข้อความ (ข้อความ ≤ 60 ตัว)');return}
  $('#'+pid+'tb').innerHTML=tablesHTML(P,bm);S.set(strSteps(T,P,bm))};
 $('#'+pid+'go').onclick=go;go();}
DEMOS.hor=(h)=>strDemo(h,'hor',false,'JIM_SAW_ME_IN_A_BARBERSHOP','BARBER');
DEMOS.bm=(h)=>strDemo(h,'bm',true,'BESS_KNEW_ABOUT_BAOBABS','BAOBAB');

/* ---------- 5 hashing ---------- */
DEMOS.hash=function(host){
 const K=[['A',1],['FOOL',9],['AND',6],['HIS',10],['MONEY',7],['ARE',11],['SOON',11],['PARTED',12]],M=13;
 const root=host;
 root.innerHTML=`<div class="inp"><div class="seg" id="hseg"><button data-m="open" class="on">Open (Chaining)</button><button data-m="closed">Closed (Probing)</button></div></div><div class="chips">${K.map(([k,h])=>`<span class="chip">${k} → <b>${h}</b></span>`).join('')}</div><div id="hst"></div>`;
 const S=Stepper($('#hst'),(st,s)=>{
   st.innerHTML=`<div class="scr"><div class="hash">${s.T.map((v,k)=>`<div class="hcol"><div class="idx" style="font-size:12px">${k}</div>${
     s.mode==='open'?(v.length?v.map((x,q)=>`<div class="cell ${k===s.hl&&q===v.length-1?(v.length>1?'bad pop':'ok pop'):'ok'}">${x}</div>`).join(''):'<div class="cell empty"></div>'):
     `<div class="cell ${v===null?'empty':(k===s.hl?(s.coll?'bad pop':'ok pop'):'ok')}">${v||''}</div>`}</div>`).join('')}</div></div>`;
 },'hash');
 let mode='open';
 function gen(){const st=[];const T=mode==='open'?Array.from({length:M},()=>[]):Array(M).fill(null);
  st.push({mode,T:JSON.parse(JSON.stringify(T)),msg:`ตารางขนาด ${M} ช่อง (0–12) กด "ถัดไป" เพื่อใส่ key ทีละตัว`});
  for(const[k,h]of K){let pos=h,coll=false,note=`ใส่ <b>${k}</b> → hash = ${h}`;
   if(mode==='open'){if(T[h].length){coll=true;note+=` ⚠ ชนกับ <b>${T[h][0]}</b> → ต่อท้ายโซ่ในช่อง ${h}`}else note+=` ช่องว่าง วางได้เลย`;T[h].push(k)}
   else{while(T[pos]!==null){coll=true;note+=` ⚠ ช่อง ${pos} ถูกจอง (${T[pos]}) → ลองช่อง ${(pos+1)%M}`;pos=(pos+1)%M}T[pos]=k;if(!coll)note+=' ช่องว่าง วางได้เลย';else if(pos<h)note+=' (วนกลับมาต้นตาราง)'}
   st.push({mode,T:JSON.parse(JSON.stringify(T)),hl:pos,coll,msg:note})}
  st[st.length-1].msg+=' 🎉 ค้นหาเฉลี่ย Θ(1)';return st}
 $('#hseg').onclick=e=>{if(!e.target.dataset.m)return;mode=e.target.dataset.m;[...$('#hseg').children].forEach(b=>b.classList.toggle('on',b===e.target));S.set(gen())};
 S.set(gen());
};

/* ---------- B-tree ---------- */

DEMOS.bt=function(host){
 const N=(keys,ch=[],f='')=>({keys,ch,f});
 const leaf=(...a)=>a;
 const mk=(mid,right)=>N([20,51],[N([11,15],[N([4,7,10]),N([11,14]),N([15,16,19])]),N([25,34,40],[N([20,24]),N([25,28]),N([34,38]),N([40,43,46])]),mid.f?mid:right]);
 const base=(rightMid)=>N([20,51],[N([11,15],[N([4,7,10]),N([11,14]),N([15,16,19])]),N([25,34,40],[N([20,24]),N([25,28]),N([34,38]),N([40,43,46])]),rightMid]);
 const steps=[
  {t:base(N([60],[N([51,55]),N([60,68,80])])),msg:'B-tree อันดับ 4 (แต่ละโหนดเก็บได้สูงสุด 3 ค่า) — ต้องการ <b>แทรก 65</b>'},
  {t:base(N([60],[N([51,55]),N([60,68,80])],'')) ,hlp:1,msg:'ค้นหาตำแหน่ง: 65 &gt; 51 → ไปลูกขวาสุด; 65 &gt; 60 → ไปลูกขวาของ 60 → โหนดใบ [60, 68, 80]'},
  {t:base(N([60],[N([51,55]),N([60,65,68,80],[],'full')])),msg:'แทรก 65 ลงใบ → [60, 65, 68, 80] มี 4 ค่า <b>เกินความจุ!</b> ต้อง split'},
  {t:base(N([60,68],[N([51,55]),N([60,65],[],'new'),N([68,80],[],'new')],'new')),msg:'🎉 split: ดันค่ากลาง <b>68</b> ขึ้นโหนดแม่ → ใบ [60,65] และ [68,80] — ต้นไม้ยังสมดุล ทุกใบอยู่ระดับเดียวกัน'}];
 function draw(n,hi){return`<div class="bt"><div class="bn ${n.f}">${n.keys.map(k=>`<span>${k}</span>`).join('|')}</div>${n.ch.length?`<div class="bch">${n.ch.map(c=>draw(c,hi)).join('')}</div>`:''}</div>`}
 const root=host;
 const S=Stepper(root,(st,s)=>{const t=JSON.parse(JSON.stringify(s.t));
   if(s.hlp){t.f='hl';t.ch[2].f='hl';t.ch[2].ch[1].f='hl'}
   st.innerHTML=`<div class="scr"><div style="min-width:820px;display:flex;justify-content:center">${draw(t)}</div></div>`},'bt');
 S.set(steps);
};

AP.w7 = { DEMOS, shiftTable, goodSuffix, mount(k, host) { ACTIVE.length = 0; DEMOS[k](host); const stops = ACTIVE.slice(); return { pause() { stops.forEach((s) => s.stop()); } }; } };
})();
