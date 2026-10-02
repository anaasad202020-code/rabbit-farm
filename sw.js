importScripts('core.js');
const V='rf-v18',FILES=['./','index.html','core.js','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png','badge-96.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(FILES.map(f=>fetch(new Request(f,{cache:'reload'})).then(r=>r.ok?c.put(f,r):0).catch(()=>0)))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V&&x!=='rf-fonts').map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);if(r.method!=='GET')return;
if(u.origin===location.origin){const fromCache=()=>caches.match(r,{ignoreSearch:true}).then(m=>m||(r.mode==='navigate'?caches.match('index.html'):undefined));
const net=fetch(new Request(r.url,{cache:'no-cache'})).then(x=>{if(x.ok){const y=x.clone();caches.open(V).then(c=>c.put(r.url,y))}return x});
const to=new Promise((_,no)=>setTimeout(no,4000));
e.respondWith(Promise.race([net,to]).then(x=>x.ok?x:fromCache().then(m=>m||x)).catch(()=>fromCache().then(m=>m||Response.error())));e.waitUntil(net.catch(()=>0))}
else if(/^fonts\.(googleapis|gstatic)\.com$/.test(u.hostname))e.respondWith(caches.open('rf-fonts').then(c=>c.match(r).then(m=>m||fetch(r).then(x=>{c.put(r,x.clone());return x}).catch(()=>m))))});
function docs(){return new Promise((ok,no)=>{const q=indexedDB.open('rabbitfarm',1);q.onupgradeneeded=()=>q.result.createObjectStore('kv',{keyPath:'id'});q.onerror=()=>no(q.error);q.onsuccess=()=>{const g=q.result.transaction('kv').objectStore('kv').getAll();g.onsuccess=()=>ok(g.result);g.onerror=()=>no(g.error)}})}
async function check(){const L=(await docs()).sort((a,b)=>(a.n||0)-(b.n||0)),S={does:[],bucks:[],br:[]};let c={...Core.DEF};
for(const d of L){if(d.id==='cfg')c={...Core.DEF,...d.cfg};else if(S[d.k]&&Array.isArray(d.rows))S[d.k]=S[d.k].concat(d.rows)}
const t=Core.dueText(Core.alerts(S,c,Core.D(Core.todayS())));if(!t)return;
return self.registration.showNotification('🐇 Rabbit Farm',{body:t,tag:'rf-daily',icon:'icon-192.png',badge:'badge-96.png',vibrate:[200,100,200],lang:'ar',dir:'rtl'})}
self.addEventListener('periodicsync',e=>{if(e.tag==='rf-daily')e.waitUntil(check().catch(()=>0))});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>l.length?l[0].focus():clients.openWindow('./')))});
