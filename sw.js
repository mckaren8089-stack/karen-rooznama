/* Karen Rooznama offline shell. Never return HTML for missing JS/CSS/image requests. */
const VERSION="karen-rooznama-v0.4.0";
const OFFLINE=[
 "./","./index.html","./app.js","./style.css","./core.mjs","./events.mjs",
 "./notes.mjs","./notes-store.mjs","./data/years/1405.json","./assets/faravahar.svg",
 "./icons/faravahar-192.png","./icons/faravahar-512.png",
 "./icons/faravahar-maskable-512.png","./manifest.webmanifest"
];
self.addEventListener("install",event=>{
 event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(OFFLINE)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
 event.waitUntil(Promise.all([
  caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("karen-rooznama-")&&key!==VERSION).map(key=>caches.delete(key)))),
  self.clients.claim()
 ]));
});
self.addEventListener("fetch",event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=="GET"||url.origin!==self.location.origin)return;
 if(!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
 event.respondWith(
  fetch(request).then(response=>{
   if(response.ok){
    const copy=response.clone();
    event.waitUntil(caches.open(VERSION).then(cache=>cache.put(request,copy)));
   }
   return response;
  }).catch(async()=>{
   const cached=await caches.match(request);
   if(cached)return cached;
   if(request.mode==="navigate")return (await caches.match("./index.html"))||Response.error();
   return Response.error();
  })
 );
});
