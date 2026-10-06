var Core=(function(){
'use strict';
const P='عشار',E='فاضي',AB='أجهضت';
const DEF={FirstTestDays:10,SecondTestDays:21,GestationDays:31,MaxBirthDays:35,WeaningAge:35,MinWeanDays:28,RemateDays:10,BuckRestHours:48,BacterialVaccineCycle:90,ViralVaccineCycle:180,AlertWindow:3,TargetSaleWeight:2,FirstMatingAge:150,MinAttempts:2,GoodRatePct:.75,PoorRatePct:.5};
const CH=250;
const SRC=['','من المزرعة','من الخارج'];
const AN=(s,l)=>[['c',l,'txt',1],['bd','تاريخ الميلاد/الإدخال','date'],['sl','السلالة','txt'],['s','الحالة',s],['src','المصدر',SRC],['gm','كود الأم الوالدة (الجدة)','txt'],['gf','كود الأب الوالد (الجد)','txt'],['vb','آخر تحصين بكتيري','date'],['vv','آخر تحصين فيروسي','date'],['nt','ملاحظات','txt']];
const SCHEMA={
br:[['m','كود الأم','ref',1],['b','كود الذكر','ref',1],['d','تاريخ التلقيح','date',1],['tm','وقت التلقيح','time'],['r1','نتيجة الجسة الأولى',['',P,E]],['r2','نتيجة الجسة الثانية',['','لسه عشار',AB]],['bd','الولادة (الفعلي)','date'],['al','مواليد أحياء','int'],['dd','مواليد ميتة','int'],['wd','الفطام (الفعلي)','date'],['wc','عدد المفطومين','int'],['nt','ملاحظات','txt']],
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
for(const f of SCHEMA[t]){const k=f[0],ty=f[2];let v=o[k];if(v==null||v==='')continue;if(typeof v!=='string'&&typeof v!=='number')continue;
if(ty==='int'||ty==='dec'){v=Number(v);if(!isFinite(v)||v<0)continue;v=ty==='int'?Math.round(v):Math.round(v*1000)/1000}
else{v=String(v).trim();if(!v)continue;if(ty==='date'){if(D(v)==null)continue}else if(ty==='time'){if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(v))continue}else if(Array.isArray(ty)){if(!ty.includes(v))continue}else v=v.slice(0,k==='nt'?200:60)}
r[k]=v}return r}
function status(r,o,bd,wd,c,T){const A=c.AlertWindow;
if(wd!=null)return['✅ اكتملت الدورة - تم الفطام','ok','done'];
if(bd!=null){if(T>=o.wean)return['🔴 موعد الفطام اليوم أو فات','r','wean'];if(T>=o.wean-A)return['🟡 قرب موعد الفطام','y','wean-s'];if(T===bd||T===bd+1)return['💉 تأكد من حقنة المضاد الحيوي/الفيتامين اليوم','b','inj'];return['🟢 ترضع - في انتظار الفطام','g','nurse']}
if(r.r2===AB)return['⚠️ أجهضت بعد تأكيد الحمل - راجع الحالة','o','abort'];
if(r.r1===P){if(T>=o.exp)return['🔴 موعد الولادة اليوم أو فات - تابع الأم','r','birth'];
if(!r.r2){if(T>=o.t2)return['🔴 موعد الجسة الثانية اليوم أو فات','r','p2'];if(T>=o.t2-A)return['🟡 قرب موعد الجسة الثانية','y','p2-s']}
return['🟢 حامل - سليمة','g','preg']}
if(r.r1===E)return['⚪ فاضية - سجّل تلقيح جديد','n','empty'];
if(T>=o.t1)return['🔴 موعد الجسة الأولى اليوم أو فات - جسّها','r','p1'];
if(T>=o.t1-A)return['🟡 قرب موعد الجسة الأولى','y','p1-s'];
return['⏳ في انتظار موعد الجسة الأولى','n','wait']}
function calc(r,c,T){const d=D(r.d),o={};if(d==null)return o;const bd=D(r.bd),wd=D(r.wd),al=num(r.al),dd=num(r.dd),wc=num(r.wc);
o.t1=d+c.FirstTestDays;if(r.r1===P){o.t2=d+c.SecondTestDays;o.exp=d+c.GestationDays}
if(al!=null||dd!=null)o.tot=(al||0)+(dd||0);
if(bd!=null){o.ab=bd;o.vit=bd+1;o.wean=bd+c.WeaningAge}
if(al!=null&&wc!=null){o.died=al-wc;o.wp=al>0?wc/al:null}
o.st=status(r,o,bd,wd,c,T);return o}
function rate(a,c){if((a.nt||0)<Math.max(1,c.MinAttempts))return['⏳ بيانات غير كافية بعد','n'];const sr=a.sr,wp=a.wp;
if(sr<c.PoorRatePct||(wp!=null&&wp<c.PoorRatePct))return['⚠️ ضعيفة - تحتاج مراجعة','o'];
if(sr>=c.GoodRatePct&&(wp==null||wp>=c.GoodRatePct))return['✅ ممتازة','ok'];return['🟡 متوسطة','y']}
const empty=c=>({n:0,nt:0,s:0,b:0,sr:null,wp:null,avgAl:null,avgWc:null,last:null,rate:rate({nt:0},c)});
function stats(br,c){const M=Object.create(null),B=Object.create(null);
const add=(m,k,r,d,al,wc)=>{if(!k)return;const a=m[k]||(m[k]={n:0,nt:0,s:0,b:0,aS:0,aN:0,wS:0,wN:0,wA:0,last:null});a.n++;if(r.r1)a.nt++;if(r.r1===P)a.s++;if(D(r.bd)!=null)a.b++;if(al!=null){a.aS+=al;a.aN++}if(wc!=null){a.wS+=wc;a.wN++;a.wA+=al||0}if(d!=null&&(a.last==null||d>a.last))a.last=d};
for(const r of br){const d=D(r.d),al=num(r.al),wc=num(r.wc);add(M,r.m,r,d,al,wc);add(B,r.b,r,d,al,wc)}
for(const m of[M,B])for(const k in m){const a=m[k];a.sr=a.nt?a.s/a.nt:null;a.avgAl=a.aN?a.aS/a.aN:null;a.avgWc=a.wN?a.wS/a.wN:null;a.wp=a.wA>0?a.wS/a.wA:null;a.rate=rate(a,c)}
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
const again=doeAvail(S,c,T).ok.filter(x=>x.kind!=='first');
return{urgent,soon,vacs,kins,ready,again,late:vacs.filter(x=>x.p===0).length}}
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
return{cfg,t,total,dropped,at:typeof o.at==='string'?o.at.slice(0,10):''}}

const DACT={p1:['🔴','عليها الجسة الأولى'],p2:['🔴','عليها الجسة التانية'],birth:['🔴','موعد ولادتها'],wean:['🔴','موعد فطام صغارها'],inj:['💉','حقنة المضاد/الفيتامين النهاردة'],'p1-s':['🟡','الجسة الأولى قربت'],'p2-s':['🟡','الجسة التانية قربت'],'wean-s':['🟡','الفطام قرب']};
const DORD=['p1','p2','birth','wean','inj','p1-s','p2-s','wean-s'];
function dueNote(A){
const by=Object.create(null),kins=[],seenK=new Set(),nset=new Set();
const put=(bucket,ord,key,ico,text,pre,plur,who,ck)=>{nset.add(ck);const k=bucket+'|'+key;const g=by[k]||(by[k]={bucket,ord,ico,text,pre,plur,who:[]});if(!g.who.includes(who))g.who.push(who)};
for(const x of[...(A.urgent||[]),...(A.soon||[])]){const m=x&&x.r&&x.r.m;if(!has(m)||!x.o||!x.o.st)continue;const st=x.o.st,a=st[2],t=DACT[a]||[st[1]==='y'?'🟡':'🔴',String(st[0]).replace(/^\S+\s+/,'')];put('0',DACT[a]?DORD.indexOf(a):99,a||t[1],t[0],t[1],'الأم كود','الأمهات',String(m),'a|'+m+'|'+(a||t[1]))}
for(const v of(A.vacs||[])){const a=v&&v.a;if(!a||!has(a.c))continue;const doe=v.t==='does',late=[],soon=[];
for(const [nm,x] of[['البكتيري',v.b],['الفيروسي',v.v]]){const k=x&&x.st&&x.st[1];if(k==='r')late.push(nm);else if(k==='y')soon.push(nm)}
const poss=doe?'تحصينها':'تحصينه',pre=doe?'الأم كود':'الذكر كود',plur=doe?'الأمهات':'الذكور';
if(late.length)put('1',0,(doe?'d':'k')+'l'+late.join(),'💉',poss+' '+late.join(' و')+' متأخر',pre,plur,String(a.c),'v|'+(doe?'d':'k')+'|'+a.c);
if(soon.length)put('2',0,(doe?'d':'k')+'s'+soon.join(),'💉',poss+' '+soon.join(' و')+' قرب',pre,plur,String(a.c),'v|'+(doe?'d':'k')+'|'+a.c)}
for(const x of(A.kins||[])){const m=x&&x.r&&x.r.m;if(!has(m))continue;const b=has(x.r.b)?String(x.r.b):'',k=m+'|'+b;if(!seenK.has(k)){seenK.add(k);kins.push([String(m),b]);nset.add('k|'+k)}}
for(const x of(A.ready||[])){if(x&&x.a&&has(x.a.c))put('4',0,'r','🐰','جاهزة للتلقيح','الأم كود','الأمهات',String(x.a.c),'r|'+x.a.c)}
for(const x of(A.again||[])){if(x&&x.a&&has(x.a.c))put('5',0,'g','🐰','جاهزة للتلقيح من جديد','الأم كود','الأمهات',String(x.a.c),'g|'+x.a.c)}
const cmp=(a,b)=>String(a).localeCompare(String(b),'ar',{numeric:true});
const groups=Object.values(by).sort((a,b)=>a.bucket<b.bucket?-1:a.bucket>b.bucket?1:(a.ord-b.ord||cmp(a.text,b.text)));
const cmp2=(a,b)=>cmp(a[0],b[0])||cmp(a[1],b[1]);const SHOW=6,MAXL=12;kins.sort(cmp2);
const build=MAXN=>{const L=[];let n=0;
const push=(ico,text,pre,plur,who)=>{who=who.slice().sort(cmp);n+=who.length;if(who.length<=MAXN)for(const w of who)L.push(ico+' '+pre+' '+w+' — '+text);else L.push(ico+' '+text+' — '+plur+': '+who.slice(0,SHOW).join('، ')+(who.length>SHOW?' (+'+(who.length-SHOW)+' كمان)':''))};
for(const g of groups.filter(g=>g.bucket<'3'))push(g.ico,g.text,g.pre,g.plur,g.who);
if(kins.length){n+=kins.length;if(kins.length<=MAXN)for(const [m,b] of kins)L.push('⚠️ الأم كود '+m+' — قرابة قريبة'+(b?' مع الذكر كود '+b:''));else L.push('⚠️ قرابة قريبة — '+kins.slice(0,SHOW).map(([m,b])=>m+(b?' × '+b:'')).join('، ')+(kins.length>SHOW?' (+'+(kins.length-SHOW)+' كمان)':''))}
for(const g of groups.filter(g=>g.bucket>='4'))push(g.ico,g.text,g.pre,g.plur,g.who);
return{L,n}};
let R=build(3);if(R.L.length>MAXL)R=build(1);
const L=R.L,n=R.n;if(L.length>MAXL){const rest=L.length-(MAXL-1);L.length=MAXL-1;L.push('… و'+rest+' بند تاني — افتح التطبيق')}
const cnt=nset.size;return{title:cnt?'🐇 Rabbit Farm — '+cnt+' تنبيه':'🐇 Rabbit Farm',body:L.join('\n'),count:cnt}}
function dueText(A){return dueNote(A).body}
function fold(s){const enc=new TextEncoder();let out='',len=0;for(const ch of s){const n=enc.encode(ch).length;if(len+n>75){out+='\r\n ';len=1}out+=ch;len+=n}return out}
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
return['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//RabbitFarm//AR','CALSCALE:GREGORIAN',...ev,'END:VCALENDAR'].join('\r\n').split('\r\n').map(fold).join('\r\n')+'\r\n'}
/* ---------- mating cycle: ordered stages, locks and checks ---------- */
const L2='لسه عشار',has=v=>v!=null&&v!=='';
const stageOf=x=>(has(x.wd)||has(x.wc))?4:has(x.bd)?3:has(x.r2)?2:has(x.r1)?1:0;
const isDone=x=>!!x&&(x.r1===E||x.r2===AB||has(x.wd)||(has(x.bd)&&has(x.al)&&Number(x.al)===0));
const STG={m:0,b:0,d:0,tm:0,r1:1,r2:2,bd:3,wd:4};
function brFlow(r,old,c,T){
const d=D(r.d),bd=D(r.bd),wd=D(r.wd),al=has(r.al)?Number(r.al):null;
const st=stageOf(r),ost=old?stageOf(old):-1,odone=!!old&&isDone(old),done=isDone(r),left=n=>n-T;
const lockShort=odone?'🔒 مقفول — الدورة اكتملت':'🔒 مقفول — اتسجّلت مرحلة بعده',lockLong=odone?'مقفول — الدورة اكتملت ومينفعش تعدّل التواريخ والنتائج (الأعداد والملاحظات بس)':'مقفول — سجّلت المرحلة اللي بعده، امسحها الأول لو محتاج تعدّل';
const f={};
const fld=(k,gate,gw,counts)=>{const inS=!counts&&k in STG,s=STG[k],fo=inS&&(odone||(!!old&&ost>s)),fl=inS&&st>s;
f[k]={gate,gateWhy:gate?'':gw,lockWhy:lockLong,frozenOld:fo,frozenLive:fl,ok:gate&&!fo,on:gate&&!fo&&!fl,why:(fo||fl)?lockShort:(gate?'':gw),hint:''}};
const t1=d==null?null:d+c.FirstTestDays,t2=d==null?null:d+c.SecondTestDays,mw=c.MinWeanDays,tw=bd==null?null:bd+mw;
fld('m',true,'');fld('b',true,'');fld('d',true,'');fld('tm',true,'');
fld('r1',d!=null&&T>=t1,d==null?'سجّل تاريخ التلقيح الأول':`لسه ما عدّاش ${c.FirstTestDays} يوم من تاريخ التلقيح — تقدر تسجّل الجسة الأولى من ${F(t1)} (باقي ${left(t1)} يوم)`);
fld('r2',r.r1===P&&d!=null&&T>=t2,r.r1!==P?'الجسة الثانية تُسجَّل بعد أن تكون الأولى «عشار»'+(d!=null&&T<t2?` — ومش قبل يوم ${F(t2)}`:''):d==null?'سجّل تاريخ التلقيح الأول':`لسه ما عدّاش ${c.SecondTestDays} يوم من تاريخ التلقيح — تقدر تسجّل الجسة التانية من ${F(t2)} (باقي ${left(t2)} يوم)`);
fld('bd',r.r2===L2&&d!=null,r.r1===E?'لا يمكن تسجيل ولادة لتلقيح نتيجته «فاضي»':r.r2===AB?'لا يمكن تسجيل ولادة لحالة «أجهضت»':'سجّل الجسة التانية (لسه عشار) قبل تاريخ الولادة');
fld('al',bd!=null,'سجّل تاريخ الولادة أولًا',true);fld('dd',bd!=null,'سجّل تاريخ الولادة أولًا',true);
fld('wd',bd!=null&&al!=null&&al>0&&T>=tw,bd==null?'سجّل تاريخ الولادة أولًا':al==null?'سجّل عدد المواليد الأحياء الأول':al===0?'مفيش مواليد أحياء — مفيش فطام':`لسه ما عدّاش ${mw} يوم من الولادة — تقدر تسجّل الفطام من ${F(tw)} (باقي ${left(tw)} يوم)`);
fld('wc',wd!=null,'سجّل تاريخ الفطام أولًا',true);fld('nt',true,'',true);
const rng={bd:d==null?null:[d+c.SecondTestDays,Math.min(T,d+c.MaxBirthDays)],wd:bd==null?null:[bd+mw,T]};
if(rng.bd)f.bd.hint=`من ${F(rng.bd[0])} لحد ${F(rng.bd[1])} (المتوقع ${F(d+c.GestationDays)})`;
if(rng.wd)f.wd.hint=`من ${F(rng.wd[0])} لحد ${F(rng.wd[1])} (المتوقع ${F(bd+c.WeaningAge)})`;
const sk={};if(r.r1===E){sk[2]=sk[3]=sk[4]=1}if(r.r2===AB){sk[3]=sk[4]=1}if(has(r.bd)&&al===0)sk[4]=1;
const dn=[d!=null,has(r.r1),has(r.r2),has(r.bd),has(r.wd)];
const steps=['التلقيح','الجسة 1','الجسة 2','الولادة','الفطام'].map((n,i)=>({n,s:sk[i]?'skip':dn[i]?'done':'todo'}));
for(let i=0;i<5;i++)if(steps[i].s==='todo'){steps[i].s='cur';break}
let next;
if(done)next=(r.r1===E?'الجسة الأولى «فاضي» — الدورة انتهت':r.r2===AB?'الدورة انتهت بإجهاض':has(r.wd)?'الدورة اكتملت (تم الفطام)':'الدورة انتهت — مفيش مواليد أحياء')+(odone?' — لو في غلط في تاريخ أو نتيجة احذف السجل وسجّله من جديد':'');
else if(d==null)next='ابدأ بتاريخ التلقيح';
else if(st===0)next=T<t1?`الجسة الأولى هتتفتح يوم ${F(t1)} (باقي ${left(t1)} يوم)`:'دلوقتي سجّل نتيجة الجسة الأولى';
else if(st===1)next=T<t2?`الجسة التانية هتتفتح يوم ${F(t2)} (باقي ${left(t2)} يوم)`:'دلوقتي سجّل نتيجة الجسة التانية';
else if(st===2)next=`دلوقتي سجّل تاريخ الولادة (المتوقع ${F(d+c.GestationDays)})`;
else if(st===3)next=al==null?'سجّل عدد المواليد الأحياء':T<tw?`الفطام هيتفتح يوم ${F(tw)} (باقي ${left(tw)} يوم)`:'دلوقتي سجّل الفطام';
else next='سجّل عدد المفطومين';
if(!done&&st>=1)next+=' — المراحل اللي فاتت بتتقفل لما تسجّل اللي بعدها (امسح اللي بعدها لو محتاج تعدّل)';
return{f,stage:st,oldDone:odone,done,rng,steps,next}}
function brCheck(r,old,c,T){
const fl=brFlow(r,old,c,T),ov=k=>old?String(old[k]??''):'',chg=k=>ov(k)!==String(r[k]??'');
for(const k of['m','b','d','tm','r1','r2','bd','al','dd','wd','wc']){if(!chg(k))continue;const x=fl.f[k];if(x.frozenOld)return x.lockWhy;if(has(r[k])&&!x.gate)return x.gateWhy}
const d=D(r.d),bd=D(r.bd),wd=D(r.wd),al=has(r.al)?Number(r.al):null,dd=has(r.dd)?Number(r.dd):null,wc=has(r.wc)?Number(r.wc):null;
if(bd==null&&(has(r.al)||has(r.dd)||has(r.wd)||has(r.wc))&&chg('bd'))return 'سجّل تاريخ الولادة أولًا';
if(d!=null&&bd!=null&&(chg('bd')||chg('d'))){if(bd<d)return 'تاريخ الولادة قبل تاريخ التلقيح';if(bd<d+c.SecondTestDays)return `تاريخ الولادة لازم يكون بعد الجسة التانية (من ${F(d+c.SecondTestDays)})`;if(bd>d+c.MaxBirthDays)return `تاريخ الولادة بعد أكتر من ${c.MaxBirthDays} يوم من التلقيح — آخر تاريخ مقبول ${F(d+c.MaxBirthDays)}`}
if((chg('al')&&al!=null&&al>25)||(chg('dd')&&dd!=null&&dd>25))return 'عدد المواليد كبير جدًا (أقصى 25) — راجع الرقم';
if(bd!=null&&al==null&&(chg('bd')||chg('al')))return 'سجّل عدد المواليد الأحياء (ولو صفر)';
if((chg('wd')||chg('wc'))&&((wd!=null)!==(wc!=null)))return 'تاريخ الفطام وعدد المفطومين يُسجَّلان معًا';
if(wd!=null&&bd!=null&&(chg('wd')||chg('bd'))){if(wd<bd)return 'تاريخ الفطام قبل الولادة';if(wd<bd+c.MinWeanDays)return `الفطام لازم يكون بعد الولادة بـ ${c.MinWeanDays} يوم على الأقل (من ${F(bd+c.MinWeanDays)})`}
if(wc!=null&&(chg('wc')||chg('al'))&&(al==null||wc>al))return 'عدد المفطومين أكبر من المواليد الأحياء';
return ''}
/* ---------- who is free to mate: does (by cycle) and bucks (by hours) ---------- */
const hmOk=v=>typeof v==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(v);
function ms(r){const d=D(r&&r.d);if(d==null)return null;const[y,m,dd]=F(d).split('-').map(Number),[h,mi]=hmOk(r.tm)?r.tm.split(':').map(Number):[12,0];return new Date(y,m-1,dd,h,mi).getTime()}
function fmtDT(t){const x=new Date(t);return x.getFullYear()+'-'+p2(x.getMonth()+1)+'-'+p2(x.getDate())+' '+p2(x.getHours())+':'+p2(x.getMinutes())}
function remText(t){const m=Math.ceil(t/6e4);if(m<=0)return 'متاح';const h=Math.floor(m/60),mi=m%60;
const hh=h===0?'':h===1?'ساعة':h===2?'ساعتين':h<=10?h+' ساعات':h+' ساعة',mm=mi===0?'':mi===1?'دقيقة':mi===2?'دقيقتين':mi<=10?mi+' دقايق':mi+' دقيقة';
return 'متاح خلال '+[hh,mm].filter(Boolean).join(' و')}
function doeAvail(S,c,T){const last=new Map();
for(const r of S.br||[]){if(!r||!has(r.m))continue;const d=D(r.d);if(d==null)continue;const mm=ms(r),p=last.get(r.m);if(!p||mm>=p.ms)last.set(r.m,{ms:mm,d,r})}
const ok=[],hide=[];
for(const a of S.does||[]){if(!a||!act(a))continue;const L=last.get(a.c);let av=false,why='',kind='',since=T;
if(!L){const bd=D(a.bd);if(bd!=null&&T<bd+c.FirstMatingAge){why='لسه صغيرة — جاهزة بعد '+(bd+c.FirstMatingAge-T)+' يوم';kind='young'}else{av=true;why='جاهزة للتلقيح الأول';kind='first';since=bd!=null?bd+c.FirstMatingAge:T}}
else{const r=L.r,bd=D(r.bd);
if(r.r1===E){av=true;why='الجسة فاضي';kind='empty';since=L.d+c.FirstTestDays}
else if(r.r2===AB){av=true;why='بعد إجهاض';kind='abort';since=L.d+c.SecondTestDays}
else if(bd!=null){const from=bd+c.RemateDays;if(T>=from){av=true;why='بعد الولادة بـ '+(T-bd)+' يوم';kind='birth';since=from}else{why='بعد الولادة — متاحة بعد '+(from-T)+' يوم';kind='nursing'}}
else{why='في دورة شغالة';kind='cycle'}}
(av?ok:hide).push({a,why,kind,since})}
ok.sort((x,y)=>x.since-y.since||(String(x.a.c)<String(y.a.c)?-1:1));return{ok,hide}}
function buckAvail(S,c,now){const rest=(c.BuckRestHours||0)*36e5,last=new Map();
for(const r of S.br||[]){if(!r||!has(r.b))continue;const m=ms(r);if(m==null)continue;const p=last.get(r.b);if(p==null||m>=p)last.set(r.b,m)}
const out=[];for(const a of S.bucks||[]){if(!a||!act(a))continue;const l=last.has(a.c)?last.get(a.c):null,at=l!=null&&rest?l+rest:0,rem=Math.max(0,at-now);out.push({a,last:l,at,remMs:rem,ok:rem===0})}
out.sort((x,y)=>x.ok!==y.ok?(x.ok?-1:1):x.ok?((x.last==null?-Infinity:x.last)-(y.last==null?-Infinity:y.last)||(String(x.a.c)<String(y.a.c)?-1:1)):x.remMs-y.remMs);return out}
function buckRestErr(r,others,c){const H=c.BuckRestHours||0,rest=H*36e5;if(!rest||!has(r.b))return '';const m=ms(r);if(m==null)return '';
for(const o of others){if(!o||o===r||o.id===r.id||o.b!==r.b)continue;const om=ms(o);if(om==null)continue;
if(Math.abs(m-om)<rest)return om<=m?'الذكر '+r.b+' لقّح من أقل من '+H+' ساعة (آخر تلقيح: '+fmtDT(om)+') — متاح من '+fmtDT(om+rest):'الذكر '+r.b+' عنده تلقيح تاني قريب ('+fmtDT(om)+') — لازم يفصل بين أي تلقيحتين '+H+' ساعة'}
return ''}
/* ---------- search: digits, hamza and spacing are forgiven; short numbers only look at codes (never dates) ---------- */
const DIG1='٠١٢٣٤٥٦٧٨٩',DIG2='۰۱۲۳۴۵۶۷۸۹';
function digitsNorm(s){return String(s==null?'':s).replace(/[٠-٩]/g,d=>DIG1.indexOf(d)).replace(/[۰-۹]/g,d=>DIG2.indexOf(d))}
function normQ(s){return digitsNorm(s).toLowerCase().replace(/[\u064B-\u065F\u0670\u0640\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/[\-_\/.,:؛،()×*]+/g,' ').replace(/\s+/g,' ').trim()}
function searchTokens(q){const out=[];for(const raw of digitsNorm(q).split(/\s+/).filter(Boolean)){if(/^\d{1,4}-\d{1,2}(-\d{1,2})?$/.test(raw)){out.push({t:raw,date:true});continue}for(const t of normQ(raw).split(' '))if(t)out.push({t})}return out}
function nitem(x){let n=x._n;if(n)return n;const ids=normQ(x.ids||''),rest=normQ(x.rest||''),all=ids+' '+rest;return x._n={ids,idc:ids.replace(/ /g,''),all,allc:all.replace(/ /g,''),raw:digitsNorm(String(x.ids||'')+' '+String(x.rest||'')),prim:normQ(x.prim==null?(x.ids||''):x.prim)}}
function searchOk(x,tk){if(!tk.length)return true;const n=nitem(x);
for(const k of tk){if(k.date){if(!n.raw.includes(k.t))return false;continue}const t=k.t;
if(/^\d{1,3}$/.test(t)&&!x.numAll){if(!(n.ids.includes(t)||n.idc.includes(t)))return false;continue}
if(!(n.all.includes(t)||n.allc.includes(t)))return false}return true}
function searchScore(x,tk){const n=nitem(x),pw=n.prim.split(' ');let s=0;for(const k of tk){if(k.date){s+=1;continue}const t=k.t;if(pw.includes(t))s+=4;else if(pw.some(w=>w.startsWith(t)))s+=3;else if(n.prim.includes(t))s+=2;else s+=1}return s}
function searchRank(items,tk){if(!tk.length)return items;return items.map((x,i)=>({x,i,s:searchScore(x,tk)})).sort((a,b)=>b.s-a.s||a.i-b.i).map(o=>o.x)}
return{searchTokens,searchOk,searchRank,searchScore,normQ,doeAvail,buckAvail,buckRestErr,remText,ms,fmtDT,dueNote,brFlow,brCheck,isDone,stageOf,DEF,CH,SCHEMA,num,D,F,todayS,uid,act,saleTotal,clean,calc,rate,empty,stats,vac,kin,alerts,custAgg,dash,pack,importCheck,dueText,ics}})();
