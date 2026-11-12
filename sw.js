importScripts('core.js');
/* v31 — opens instantly from the phone's own copy (no waiting for the internet), checks for a newer version quietly in the background,
   and never leaves the app half-updated. Bump V whenever ANY file changes so every phone re-downloads the full set once. */
const V='rf-v31',FONTS='rf-fonts',CORE=['index.html','core.js'],FILES=['./','index.html','core.js','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png','badge-96.png'];
const tmo=(ms)=>{const c=new AbortController();setTimeout(()=>c.abort(),ms);return c.signal};
/* install: download the whole set once; index.html + core.js are mandatory (if they fail the old version simply stays), icons are best-effort */
self.addEventListener('install',e=>{e.waitUntil((async()=>{const c=await caches.open(V);
await Promise.all(FILES.map(async f=>{try{const r=await fetch(new Request(f,{cache:'reload'}));if(r.ok)await c.put(f,r);else if(CORE.includes(f))throw new Error(f+' '+r.status)}catch(err){if(CORE.includes(f))throw err}}));
await self.skipWaiting()})())});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V&&x!==FONTS).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
/* quiet background check (at most every 10 min, only when the app is opened): if the server has a different index.html/core.js, both are replaced together, then the app is told */
let lastCheck=0;
async function refresh(force){const now=Date.now();if(!force&&now-lastCheck<6e5)return;lastCheck=now;
try{const c=await caches.open(V),sig=tmo(20000);
const fresh=await Promise.all(CORE.map(f=>fetch(new Request(f,{cache:'no-cache',signal:sig}))));if(!fresh.every(x=>x.ok))return;
const old=await Promise.all(CORE.map(f=>c.match(f)));let same=true;
for(let i=0;i<CORE.length;i++)if(!old[i]||(await old[i].clone().text())!==(await fresh[i].clone().text()))same=false;
if(same)return;
for(let i=0;i<CORE.length;i++)await c.put(CORE[i],fresh[i].clone());await c.put('./',fresh[0].clone());
for(const w of await self.clients.matchAll({includeUncontrolled:true}))w.postMessage({t:'rf-updated'})}
catch(err){lastCheck=0}}
async function local(r){/* the update button marks its downloads with x-rf-fresh: those must really go to the internet, never to the saved copy. (A normal browser reload is NOT such a request: it still opens from the saved copy.) */
if(r.headers.get('x-rf-fresh')){try{return await fetch(r)}catch(err){return Response.error()}}
const m=await caches.match(r,{ignoreSearch:true});if(m)return m;
try{return await fetch(r)}catch(err){if(r.mode==='navigate'){const i=await caches.match('index.html');if(i)return i}return Response.error()}}
async function font(r){const c=await caches.open(FONTS),m=await c.match(r);if(m)return m;
try{const x=await fetch(r);if(x.ok||x.type==='opaque')c.put(r,x.clone());return x}catch(err){return Response.error()}}
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);if(r.method!=='GET')return;
if(u.origin===location.origin){if(r.mode==='navigate')e.waitUntil(refresh(r.cache==='reload'||r.cache==='no-cache'));e.respondWith(local(r))}
else if(/^fonts\.(googleapis|gstatic)\.com$/.test(u.hostname))e.respondWith(font(r))});
function docs(){return new Promise((ok,no)=>{const q=indexedDB.open('rabbitfarm',1);q.onupgradeneeded=()=>q.result.createObjectStore('kv',{keyPath:'id'});q.onerror=()=>no(q.error);q.onsuccess=()=>{const g=q.result.transaction('kv').objectStore('kv').getAll();g.onsuccess=()=>ok(g.result);g.onerror=()=>no(g.error)}})}
async function check(){const L=(await docs()).sort((a,b)=>(a.n||0)-(b.n||0)),S={does:[],bucks:[],br:[]};let c={...Core.DEF};
for(const d of L){if(d.id==='cfg')c={...Core.DEF,...d.cfg};else if(S[d.k]&&Array.isArray(d.rows))S[d.k]=S[d.k].concat(d.rows)}
const nt=Core.dueNote(Core.alerts(S,c,Core.D(Core.todayS())));if(!nt.body)return;
return self.registration.showNotification(nt.title,{body:nt.body,tag:'rf-daily',icon:'icon-192.png',badge:'badge-96.png',vibrate:[200,100,200],lang:'ar',dir:'rtl'})}
self.addEventListener('periodicsync',e=>{if(e.tag==='rf-daily')e.waitUntil(check().catch(()=>0))});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>l.length?l[0].focus():clients.openWindow('./')))});
