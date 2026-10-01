var Core=(function(){
'use strict';
const P='عشار',E='فاضي',AB='أجهضت';
const DEF={FirstTestDays:10,SecondTestDays:21,GestationDays:31,WeaningAge:35,BacterialVaccineCycle:90,ViralVaccineCycle:180,AlertWindow:3,TargetSaleWeight:2,FirstMatingAge:150,MinAttempts:2,GoodRatePct:.75,PoorRatePct:.5};
const CH=250;
const SRC=['','من المزرعة','من الخارج'];
const AN=(s,l)=>[['c',l,'txt',1],['bd','تاريخ الميلاد/الإدخال','date'],['sl','السلالة','txt'],['s','الحالة',s],['src','المصدر',SRC],['gm','كود الأم الوالدة (الجدة)','txt'],['gf','كود الأب الوالد (الجد)','txt'],['vb','آخر تحصين بكتيري','date'],['vv','آخر تحصين فيروسي','date'],['nt','ملاحظات','txt']];
const SCHEMA={
br:[['m','كود الأم','ref',1],['b','كود الذكر','ref',1],['d','تاريخ التلقيح','date',1],['r1','نتيجة الجسة الأولى',['',P,E]],['r2','نتيجة الجسة الثانية',['','لسه عشار',AB]],['bd','الولادة (الفعلي)','date'],['al','مواليد أحياء','int'],['dd','مواليد ميتة','int'],['wd','الفطام (الفعلي)','date'],['wc','عدد المفطومين','int'],['nt','ملاحظات','txt']],
does:AN(['نشطة','مستبعدة','نافقة'],'كود الأم'),
bucks:AN(['نشط','مستبعد','نافق'],'كود الذكر'),
sales:[['d','تاريخ البيع','date',1],['n','عدد الأرانب المباعة','int',1],['w','الوزن الإجمالي (كجم)','dec',1],['p','سعر الكيلو','dec',1],['cu','الزبون/الجهة','cu'],['bt','مرتبط بدفعة (اختياري)','txt'],['nt','ملاحظات','txt']],
exp:[['d','التاريخ','date',1],['ty','النوع',['علف','فيتامينات ومكمّلات','مضادات حيوية وأدوية','تحصينات','أخرى'],1],['dt','البيان/التفاصيل','txt'],['a','المبلغ','dec',1],['nt','ملاحظات','txt']],
cust:[['c','اسم الزبون/الجهة','txt',1],['ty','نوع الزبون',['','جزار','مطعم','تاجر','فرد','أخرى']],['ph','رقم التواصل','tel'],['nt','ملاحظات','txt']]};
const num=v=>{if(v===''||v==null)return null;const n=Number(v);return isFinite(n)?n:null};
const D=s=>{if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return null;const[y,m,d]=s.split('-').map(Number);if(y<1990||y>2100)return null;const t=Date.UTC(y,m-1,d),c=new Date(t);return c.getUTCMonth()===m-1&&c.getUTCDate()===d?t/864e5:null};
const F=n=>n==null?'':new Date(n*864e5).toISOString().slice(0,10);
const p2=n=>String(n).padStart(2,'0');
const todayS=()=>{const t=new Date();return t.getFullYear()+'-'+p2(t.getMonth()+1)+'-'+p2(t.getDate())};
let ctr=0;const uid=()=>Date.now().toString(36)+(ctr++).toString(36)+Math.random().toString(36).slice(2,5);
const act=a=>!a.s||a.s.startsWith('نشط');
const saleTotal=s=>(num(s.w)||0)*(num(s.p)||0);
function clean(t,o){const r={id:typeof o.id==='string'&&o.id?o.id.slice(0,40):uid()};
for(const f of SCHEMA[t]){const k=f[0],ty=f[2];let v=o[k];if(v==null||v==='')continue;
if(ty==='int'||ty==='dec'){v=Number(v);if(!isFinite(v)||v<0)continue;v=ty==='int'?Math.round(v):Math.round(v*1000)/1000}
else{v=String(v).trim();if(!v)continue;if(ty==='date'){if(D(v)==null)continue}else if(Array.isArray(ty)){if(!ty.includes(v))continue}else v=v.slice(0,k==='nt'?200:60)}
r[k]=v}return r}
function status(r,o,bd,wd,c,T){const A=c.AlertWindow;
if(wd!=null)return['✅ اكتملت الدورة - تم الفطام','ok'];
if(bd!=null){if(T>=o.wean)return['🔴 موعد الفطام اليوم أو فات','r'];if(T>=o.wean-A)return['🟡 قرب موعد الفطام','y'];if(T===bd||T===bd+1)return['💉 تأكد من حقنة المضاد الحيوي/الفيتامين اليوم','b'];return['🟢 ترضع - في انتظار الفطام','g']}
if(r.r2===AB)return['⚠️ أجهضت بعد تأكيد الحمل - راجع الحالة','o'];
if(r.r1===P){if(T>=o.exp)return['🔴 موعد الولادة اليوم أو فات - تابع الأم','r'];
if(!r.r2){if(T>=o.t2)return['🔴 موعد الجسة الثانية اليوم أو فات','r'];if(T>=o.t2-A)return['🟡 قرب موعد الجسة الثانية','y']}
return['🟢 حامل - سليمة','g']}
if(r.r1===E)return['⚪ فاضية - سجّل تلقيح جديد','n'];
if(T>=o.t1)return['🔴 موعد الجسة الأولى اليوم أو فات - جسّها','r'];
if(T>=o.t1-A)return['🟡 قرب موعد الجسة الأولى','y'];
return['⏳ في انتظار موعد الجسة الأولى','n']}
function calc(r,c,T){const d=D(r.d),o={};if(d==null)return o;const bd=D(r.bd),wd=D(r.wd),al=num(r.al),dd=num(r.dd),wc=num(r.wc);
o.t1=d+c.FirstTestDays;if(r.r1===P){o.t2=d+c.SecondTestDays;o.exp=d+c.GestationDays}
if(al!=null||dd!=null)o.tot=(al||0)+(dd||0);
if(bd!=null){o.ab=bd;o.vit=bd+1;o.wean=bd+c.WeaningAge}
if(al!=null&&wc!=null){o.died=al-wc;o.wp=al>0?wc/al:null}
o.st=status(r,o,bd,wd,c,T);return o}
function rate(a,c){if(a.n<Math.max(1,c.MinAttempts))return['⏳ بيانات غير كافية بعد','n'];const sr=a.sr,wp=a.wp;
if(sr<c.PoorRatePct||(wp!=null&&wp<c.PoorRatePct))return['⚠️ ضعيفة - تحتاج مراجعة','o'];
if(sr>=c.GoodRatePct&&(wp==null||wp>=c.GoodRatePct))return['✅ ممتازة','ok'];return['🟡 متوسطة','y']}
const empty=c=>({n:0,s:0,b:0,sr:null,wp:null,avgAl:null,avgWc:null,last:null,rate:rate({n:0},c)});
function stats(br,c){const M=Object.create(null),B=Object.create(null);
const add=(m,k,r,d,al,wc)=>{if(!k)return;const a=m[k]||(m[k]={n:0,s:0,b:0,aS:0,aN:0,wS:0,wN:0,wA:0,last:null});a.n++;if(r.r1===P)a.s++;if(D(r.bd)!=null)a.b++;if(al!=null){a.aS+=al;a.aN++}if(wc!=null){a.wS+=wc;a.wN++;a.wA+=al||0}if(d!=null&&(a.last==null||d>a.last))a.last=d};
for(const r of br){const d=D(r.d),al=num(r.al),wc=num(r.wc);add(M,r.m,r,d,al,wc);add(B,r.b,r,d,al,wc)}
for(const m of[M,B])for(const k in m){const a=m[k];a.sr=a.n?a.s/a.n:null;a.avgAl=a.aN?a.aS/a.aN:null;a.avgWc=a.wN?a.wS/a.wN:null;a.wp=a.wA>0?a.wS/a.wA:null;a.rate=rate(a,c)}
return{M,B}}
function vac(last,cycle,c,T){const l=D(last);if(l==null)return{next:null,st:['⚪ لم يُسجَّل تحصين بعد','n']};const nx=l+cycle;
if(T>=nx)return{next:nx,st:['🔴 متأخر - حصّن الآن','r']};if(T>=nx-c.AlertWindow)return{next:nx,st:['🟡 قرب موعده','y']};return{next:nx,st:['🟢 لسه بدري','g']}}
function kin(r,M,B){const d=M[r.m],b=B[r.b];if(!d||!b)return'';const X=d.gf||'',Y=d.gm||'',Z=b.gf||'',A=b.gm||'';
if((X&&X===r.b)||(A&&A===r.m)||(X&&X===Z)||(Y&&Y===A))return'w';return X||Y||Z||A?'ok':'n'}
function idx(list,k){const m=Object.create(null);for(const x of list)if(x[k]!=null&&!(x[k] in m))m[x[k]]=x;return m}
function alerts(S,c,T){const Md=idx(S.does,'c'),Bd=idx(S.bucks,'c'),{M}=stats(S.br,c);const urgent=[],soon=[],kins=[];
for(const r of S.br){const o=calc(r,c,T);if(!o.st)continue;const k=o.st[1];
if(k==='r'||k==='b')urgent.push({r,o});else if(k==='y')soon.push({r,o});
if((k==='r'||k==='y'||k==='g'||k==='b')&&kin(r,Md,Bd)==='w')kins.push({r,o})}
const byD=(a,b)=>a.r.d<b.r.d?-1:a.r.d>b.r.d?1:0;
urgent.sort((a,b)=>(a.o.st[1]==='r'?0:1)-(b.o.st[1]==='r'?0:1)||byD(a,b));soon.sort(byD);kins.sort(byD);
const PR={r:0,y:1,n:2,g:3},vacs=[];
for(const [t,list] of[['does',S.does],['bucks',S.bucks]])for(const a of list){if(!act(a))continue;const b=vac(a.vb,c.BacterialVaccineCycle,c,T),v=vac(a.vv,c.ViralVaccineCycle,c,T),p=Math.min(PR[b.st[1]],PR[v.st[1]]);if(p<=1)vacs.push({a,t,b,v,p})}
vacs.sort((x,y)=>x.p-y.p||(x.a.c<y.a.c?-1:1));
const ready=[];for(const a of S.does){if(!act(a)||(M[a.c]&&M[a.c].n>0))continue;const bd=D(a.bd);if(bd!=null&&T>=bd+c.FirstMatingAge)ready.push({a,from:bd+c.FirstMatingAge})}
ready.sort((x,y)=>x.from-y.from);
return{urgent,soon,vacs,kins,ready,late:vacs.filter(x=>x.p===0).length}}
function custAgg(sales){const m=Object.create(null);for(const s of sales){if(!s.cu)continue;const a=m[s.cu]||(m[s.cu]={n:0,rab:0,kg:0,paid:0,last:''});a.n++;a.rab+=num(s.n)||0;a.kg+=num(s.w)||0;a.paid+=saleTotal(s);if(s.d>a.last)a.last=s.d}return m}
function dash(S,c,T){const ts=todayS(),Y=ts.slice(0,4),mo=+ts.slice(5,7);let rev=0,exp=0,kg=0,ry=0,ey=0,wS=0,wA=0;const yr=Object.create(null);const yy=k=>yr[k]||(yr[k]={rev:0,exp:0,kg:0});
for(const s of S.sales){const t=saleTotal(s),w=num(s.w)||0,k=(s.d||'').slice(0,4);rev+=t;kg+=w;const o=yy(k);o.rev+=t;o.kg+=w;if(k===Y)ry+=t}
for(const e of S.exp){const a=num(e.a)||0,k=(e.d||'').slice(0,4);exp+=a;yy(k).exp+=a;if(k===Y)ey+=a}
for(const r of S.br){const wc=num(r.wc);if(wc!=null){wS+=wc;wA+=num(r.al)||0}}
const{M,B}=stats(S.br,c);const bad=(L,X)=>L.filter(a=>act(a)&&X[a.c]&&X[a.c].rate[1]==='o').length;
return{rev,exp,net:rev-exp,ry,ey,ny:ry-ey,avgM:(ry-ey)/mo,cpk:kg>0?exp/kg:null,wp:wA>0?wS/wA:null,weaned:wS,kg,matings:S.br.length,activeDoes:S.does.filter(act).length,activeBucks:S.bucks.filter(act).length,badDoes:bad(S.does,M),badBucks:bad(S.bucks,B),years:Object.keys(yr).filter(k=>k).sort().reverse().map(k=>({y:k,...yr[k],net:yr[k].rev-yr[k].exp}))}}
function pack(rows){const o=[];for(let i=0;i<rows.length;i+=CH)o.push(rows.slice(i,i+CH));return o.length?o:[[]]}
function importCheck(o){if(!o||typeof o!=='object'||o.v!==1||!o.t||typeof o.t!=='object')throw new Error('الملف ليس نسخة احتياطية صالحة');
const t={};let total=0,dropped=0;
for(const k in SCHEMA){const src=o.t[k];t[k]=[];if(src==null)continue;if(!Array.isArray(src))throw new Error('بيانات «'+k+'» تالفة');
const ids=new Set(),codes=new Set(),keyed=k==='does'||k==='bucks'||k==='cust';
for(const x of src){if(!x||typeof x!=='object'){dropped++;continue}const r=clean(k,x);if(SCHEMA[k].some(f=>f[3]&&r[f[0]]==null)){dropped++;continue}
if(keyed){if(codes.has(r.c)){dropped++;continue}codes.add(r.c)}if(ids.has(r.id))r.id=uid();ids.add(r.id);t[k].push(r)}
total+=t[k].length}
const cfg={...DEF};if(o.cfg&&typeof o.cfg==='object')for(const k in DEF){const v=Number(o.cfg[k]);if(isFinite(v)&&v>=0)cfg[k]=v}
return{cfg,t,total,dropped}}

function dueText(A){const p=[];if(A.urgent.length)p.push('🔴 '+A.urgent.length+' حالة تحتاج إجراء اليوم');if(A.soon.length)p.push('🟡 '+A.soon.length+' قريبة من موعدها');if(A.late)p.push('💉 '+A.late+' تحصين متأخر');return p.join('\n')}
function ics(S,c,T){const H=45,g=Object.create(null),p2=n=>String(n).padStart(2,'0'),dt=n=>{const d=new Date(n*864e5);return d.getUTCFullYear()+p2(d.getUTCMonth()+1)+p2(d.getUTCDate())},tx=s=>String(s).replace(/[\\;,]/g,'\\$&').replace(/\n/g,'\\n');
const add=(ty,title,day,who,all)=>{if(day==null||(!all&&day<T-30)||day>T+H)return;day=Math.max(day,T);const k=ty+day,e=g[k]||(g[k]={ty,title,day,w:[]});e.w.push(who)};
for(const r of S.br){const o=calc(r,c,T);if(!o.st)continue;const w=r.m+'×'+r.b;
if(!r.r1)add('t1','🐇 جس أول',o.t1,w);
if(r.r1===P&&!r.r2)add('t2','🐇 جس ثاني',o.t2,w);
if(r.r1===P&&r.r2!==AB&&r.bd==null)add('ex','🍼 ولادة متوقعة',o.exp,r.m);
if(r.bd!=null&&r.wd==null){if(o.vit>=T)add('ab','💉 حقنة مضاد حيوي وفيتامين',o.ab,r.m);add('wn','✂️ فطام',o.wean,r.m)}}
for(const[t,L]of[['does',S.does],['bucks',S.bucks]])for(const a of L){if(!act(a))continue;const b=vac(a.vb,c.BacterialVaccineCycle,c,T),v=vac(a.vv,c.ViralVaccineCycle,c,T);if(b.next!=null)add('vb','💉 تحصين بكتيري',b.next,a.c,1);if(v.next!=null)add('vv','💉 تحصين فيروسي',v.next,a.c,1)}
const z=new Date().toISOString().replace(/[-:]|\.\d+/g,'');
const ev=Object.values(g).map(e=>{const s=e.title+' ('+e.w.length+')';return['BEGIN:VEVENT','UID:rf-'+e.ty+'-'+e.day+'@rabbitfarm','DTSTAMP:'+z,'DTSTART:'+dt(e.day)+'T090000','DTEND:'+dt(e.day)+'T093000','SUMMARY:'+tx(s),'DESCRIPTION:'+tx(e.w.join('، ')),'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+tx(s),'TRIGGER:PT0S','END:VALARM','END:VEVENT'].join('\r\n')});
if(!ev.length)return null;
return['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//RabbitFarm//AR','CALSCALE:GREGORIAN',...ev,'END:VCALENDAR'].join('\r\n')}
return{DEF,CH,SCHEMA,num,D,F,todayS,uid,act,saleTotal,clean,calc,rate,empty,stats,vac,kin,alerts,custAgg,dash,pack,importCheck,dueText,ics}})();
