import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const worker=readFileSync(new URL("../sw.js",import.meta.url),"utf8");
const SCOPE="https://mckaren8089-stack.github.io/karen-rooznama/";

function harness(){
 const listeners={},stores=new Map(),report={online:true,requested:[]};
 const key=input=>new URL(typeof input==="string"?input:input.url,SCOPE).href;
 const network=async (input,options={})=>{
  const url=key(input);report.requested.push(url);
  if(!report.online)throw Error("offline");
  if(report.hang && url.endsWith("/karen-rooznama/")){
   return new Promise((_,reject)=>{
    if(options.signal?.aborted)return reject(Error("aborted"));
    options.signal?.addEventListener("abort",()=>reject(Error("aborted")),{once:true});
   });
  }
  if(url.endsWith("missing.mjs"))return new Response("missing",{status:404});
  return new Response("online:"+url,{status:200});
 };
 class Cache{
  constructor(){this.items=new Map();}
  async put(request,response){this.items.set(key(request),response.clone());}
  async match(request){const response=this.items.get(key(request));return response?.clone();}
  async addAll(paths){for(const path of paths){const response=await network(path);if(!response.ok)throw Error("bad asset");await this.put(path,response);}}
 }
 const caches={
  async open(name){if(!stores.has(name))stores.set(name,new Cache());return stores.get(name);},
  async keys(){return [...stores.keys()];},
  async delete(name){return stores.delete(name);}
 };
 const self={
  registration:{scope:SCOPE},
  addEventListener(name,callback){listeners[name]=callback;},
  async skipWaiting(){report.skipped=true;},
  clients:{async claim(){report.claimed=true;}}
 };
 // Lower timeout only inside the test harness; production timeout stays at 2500 ms.
 vm.runInNewContext(worker.replace("const NAVIGATION_TIMEOUT_MS=2500;","const NAVIGATION_TIMEOUT_MS=25;"),{
  self,caches,fetch:network,URL,Response,Promise,AbortController,setTimeout,clearTimeout
 });
 async function lifecycle(name){
  const waits=[];
  listeners[name]({waitUntil(p){waits.push(p);}});
  await Promise.all(waits);
 }
 async function request(path,mode="same-origin",method="GET"){
  const url=key(path),pending=[];
  let responsePromise;
  const input={url,method,mode};
  listeners.fetch({request:input,respondWith(p){responsePromise=p;},waitUntil(p){pending.push(p);}});
  if(!responsePromise)return null;
  const result=await responsePromise;await Promise.all(pending);
  return result;
 }
 return {report,stores,caches,lifecycle,request};
}

test("first online visit installs all app shell assets, including 1405 data",async()=>{
 const h=harness();
 await h.lifecycle("install");
 assert.equal(h.report.skipped,true);
 const keys=await h.caches.keys();
 assert.equal(keys.length,1);
 assert.equal(keys[0],"karen-rooznama-v0.4.2");
 const cache=await h.caches.open(keys[0]);
 for(const path of ["./","./index.html","./app.js","./core.mjs","./notes-store.mjs","./data/years/1405.json","./manifest.webmanifest"]){
  assert.ok(await cache.match(path),"offline cache missing "+path);
 }
});

test("offline navigation, date-converter code, and official year dataset all work after install",async()=>{
 const h=harness();await h.lifecycle("install");await h.lifecycle("activate");
 h.report.online=false;
 for(const path of ["./","./index.html","./app.js","./core.mjs","./events.mjs","./notes-store.mjs","./data/years/1405.json","./assets/faravahar.svg"]){
  const mode=path==="./"?"navigate":"same-origin";
  const response=await h.request(path,mode);
  assert.equal(response.status,200,"failed offline "+path);
  assert.ok((await response.text()).startsWith("online:"));
 }
 const fallback=await h.request("./deep-link","navigate");
 assert.equal(fallback.status,200);
 assert.ok((await fallback.text()).endsWith("/karen-rooznama/index.html"));
});

test("other app caches are never read or removed on activation and offline fallbacks",async()=>{
 const h=harness();
 const other=await h.caches.open("karen-fuse-v1");
 await other.put("./unknown.js",new Response("foreign-cache",{status:200}));
 const previous=await h.caches.open("karen-rooznama-v0.4.0");
 await previous.put("./obsolete",new Response("old",{status:200}));
 await h.lifecycle("install");
 await h.lifecycle("activate");
 const names=await h.caches.keys();
 assert.ok(names.includes("karen-fuse-v1"));
 assert.ok(!names.includes("karen-rooznama-v0.4.0"));
 h.report.online=false;
 const noLeak=await h.request("./unknown.js");
 assert.equal(noLeak.status,0,"unknown missing script must not be served from sibling cache or HTML shell");
});

test("online page navigation can fetch fresh root while static shell stays cached",async()=>{
 const h=harness();await h.lifecycle("install");
 h.report.online=false;
 const before=await h.request("./style.css");
 assert.equal(before.status,200);
 h.report.online=true;
 const after=await h.request("./","navigate");
 assert.equal(after.status,200);
 assert.ok((await after.text()).includes("online:"));
});

test("fetch interception never handles a sibling app or a different domain",async()=>{
 const h=harness();await h.lifecycle("install");
 assert.equal(await h.request("https://mckaren8089-stack.github.io/karen-fuse/"),null);
 assert.equal(await h.request("https://other.example.com/karen-rooznama/"),null);
});

test("a stalled network request yields cached navigation rather than spinning forever",async()=>{
 const h=harness();
 await h.lifecycle("install");
 h.report.hang=true;
 const started=Date.now();
 const response=await h.request("./","navigate");
 assert.equal(response.status,200);
 assert.ok((await response.text()).endsWith("/karen-rooznama/"));
 assert.ok(Date.now()-started<700,"cached app must be returned promptly");
});
