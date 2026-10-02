const APP_VERSION="kitchen-cats-static-v5";
const CACHE=`${APP_VERSION}-precache`;
const ASSETS=[
 "./","./index.html","./style.css","./app.js","./game-core.js","./multiplayer-session.js","./experimental-multiplayer.js","./webrtc-transport.js","./manifest.json",
 "./assets/cat-tabby.png","./assets/title-illustration.png","./assets/cat-gray.png","./assets/cat-tuxedo.png","./assets/cat-cream.png",
 "./assets/icon-192.png","./assets/icon-512.png"
];
self.addEventListener("install",event=>{
 event.waitUntil((async()=>{
  try { const c=await caches.open(CACHE); await c.addAll(ASSETS); }
  catch(e){ self.registration.active?.postMessage({type:"CACHE_FAILED",error:String(e)}); throw e; }
 })());
});
self.addEventListener("activate",event=>event.waitUntil((async()=>{for(const k of await caches.keys()) if(!k.startsWith(APP_VERSION)) await caches.delete(k); await self.clients.claim(); for (const c of await self.clients.matchAll()) c.postMessage({type:"CACHE_UPDATED"});})()));
self.addEventListener("message",event=>{if(event.data?.type==="SKIP_WAITING") self.skipWaiting();});
self.addEventListener("fetch",event=>{
 const u=new URL(event.request.url);
 if(u.origin!==location.origin)return;
 event.respondWith(caches.match(event.request).then(r=>r||fetch(event.request)));
});
