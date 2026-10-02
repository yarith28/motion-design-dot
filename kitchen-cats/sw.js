const APP_VERSION="kitchen-cats-20261002-0512";
const APP_CACHE_PREFIX="kitchen-cats-";
const CACHE=`${APP_VERSION}-precache`;
const ASSETS=[
 "./","./index.html","./style.css","./app.js","./game-core.js","./multiplayer-session.js","./experimental-multiplayer.js","./webrtc-transport.js","./manifest.json",
 "./assets/cat-tabby.png","./assets/title-illustration.png","./assets/cat-gray.png","./assets/cat-tuxedo.png","./assets/cat-cream.png",
 "./assets/icon-192.png","./assets/icon-512.png"
];
self.addEventListener("install",event=>{
 event.waitUntil((async()=>{
  const c=await caches.open(CACHE);
  await Promise.all(ASSETS.map(async asset=>{
    const response=await fetch(new Request(asset,{cache:"reload"}));
    if(!response.ok) throw new Error(`Failed ${asset}: ${response.status}`);
    await c.put(asset,response);
  }));
 })());
});
self.addEventListener("activate",event=>event.waitUntil((async()=>{
 for(const key of await caches.keys()){
   if(key.startsWith(APP_CACHE_PREFIX) && key!==CACHE) await caches.delete(key);
 }
 await self.clients.claim();
 for(const client of await self.clients.matchAll({type:"window"})) client.postMessage({type:"CACHE_UPDATED",version:APP_VERSION});
})()));
self.addEventListener("message",event=>{
 if(event.data?.type==="SKIP_WAITING") self.skipWaiting();
});
self.addEventListener("fetch",event=>{
 const u=new URL(event.request.url);
 if(event.request.method!=="GET" || !u.href.startsWith(self.registration.scope)) return;
 event.respondWith((async()=>{
   const cached=await caches.match(event.request);
   return cached || fetch(event.request);
 })());
});
