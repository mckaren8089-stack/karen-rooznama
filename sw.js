/* Offline-first app shell for Karen Rooznama. No cache access to sibling apps. */
const VERSION="karen-rooznama-v0.4.1";
const SHELL=[
 "./","./index.html","./app.js","./style.css","./core.mjs","./events.mjs",
 "./notes.mjs","./notes-store.mjs","./data/years/1405.json",
 "./assets/faravahar.svg","./icons/faravahar-192.png",
 "./icons/faravahar-512.png","./icons/faravahar-maskable-512.png",
 "./manifest.webmanifest"
];
const scope=new URL(self.registration.scope);
const shellURLs=new Set(SHELL.map(path=>new URL(path,scope).href));
self.addEventListener("install",event=>{
 event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
 event.waitUntil(Promise.all([
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("karen-rooznama-v")&&k!==VERSION).map(k=>caches.delete(k)))),
  self.clients.claim()
 ]));
});
self.addEventListener("fetch",event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=="GET"||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
 const navigation=request.mode==="navigate";
 event.respondWith((async()=>{
  const cache=await caches.open(VERSION);
  // Navigation uses network first to discover fresh releases, but works offline.
  if(navigation){
   try{
    const response=await fetch(request);
    if(response.ok&&shellURLs.has(url.href))event.waitUntil(cache.put(request,response.clone()));
    return response;
   }catch{
    return await cache.match(request)||await cache.match(new URL("./index.html",scope).href)||Response.error();
   }
  }
  // Core modules + annual source load instantly from their installed offline copy.
  // New versions are prepared atomically during the next service-worker install.
  if(shellURLs.has(url.href)){
   const hit=await cache.match(request);
   if(hit)return hit;
  }
  try{
   const response=await fetch(request);
   if(response.ok&&shellURLs.has(url.href))event.waitUntil(cache.put(request,response.clone()));
   return response;
  }catch{
   return await cache.match(request)||Response.error();
  }
 })());
});
