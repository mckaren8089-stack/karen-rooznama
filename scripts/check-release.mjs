import assert from "node:assert/strict";
import {readFileSync,existsSync,readdirSync} from "node:fs";
import {join} from "node:path";

const worker=readFileSync("sw.js","utf8");
const manifest=JSON.parse(readFileSync("manifest.webmanifest","utf8"));
const index=readFileSync("index.html","utf8");
const match=worker.match(/^const VERSION="(karen-rooznama-v(\d+\.\d+\.\d+))";$/m);
assert.ok(match,"Service Worker must own a valid, single semantic cache version");
const version=match[2],cache=match[1];
assert.equal((worker.match(/^const VERSION=/gm)||[]).length,1,"single runtime version authority");
assert.equal(manifest.id,"./","Never silently change installed PWA identity");
assert.equal(manifest.scope,"./","PWA must stay scoped to Rooznama and not Karen Fuse");
assert.equal(manifest.start_url,"./","PWA offline entry must match scope");
assert.equal(manifest.display,"standalone");
assert.match(index,/manifest\.webmanifest/);
const shell=worker.match(/const SHELL=\[([\s\S]*?)\];/);
assert.ok(shell,"Service Worker offline shell array is required");
const assets=[...shell[1].matchAll(/"(\.\/[^"]*)"/g)].map(x=>x[1]);
assert.equal(new Set(assets).size,assets.length,"Offline shell duplicates are forbidden");
for(const path of [
 "./","./index.html","./app.js","./style.css","./core.mjs","./events.mjs",
 "./notes.mjs","./notes-store.mjs","./manifest.webmanifest","./data/years/1405.json",
 "./assets/faravahar.svg"
]){
 assert.ok(assets.includes(path),"Missing offline-critical resource "+path);
 assert.ok(existsSync(path),"Missing offline-critical file "+path);
}
for(const icon of manifest.icons){
 assert.ok(assets.includes(icon.src),"PWA icon not in offline shell: "+icon.src);
 assert.ok(icon.src.startsWith("./icons/"),"PWA icon not scoped: "+icon.src);
 if(process.argv.includes("--built")){
  assert.ok(existsSync(icon.src),"Generated install icon missing: "+icon.src);
  const b=readFileSync(icon.src);
  assert.equal(b.subarray(0,8).toString("hex"),"89504e470d0a1a0a","Invalid PNG "+icon.src);
  assert.equal(b.readUInt32BE(16),Number(icon.sizes.split("x")[0]),"Bad PNG width "+icon.src);
  assert.equal(b.readUInt32BE(20),Number(icon.sizes.split("x")[1]),"Bad PNG height "+icon.src);
 }
}
const offlineTest=readFileSync("tests/sw-offline.test.mjs","utf8");
assert.ok(offlineTest.includes('const CACHE_VERSION='),"Offline tests must derive release version from Service Worker");
const workflows=readdirSync(".github/workflows").filter(x=>x.endsWith(".yml"));
for(const name of workflows){
 const w=readFileSync(join(".github/workflows",name),"utf8");
 assert.ok(!w.includes("ubuntu-latest"),"Unpinned Ubuntu runner: "+name);
 assert.ok(!/actions\/(checkout@v4|setup-node@v4|setup-python@v5|upload-artifact@v4|upload-pages-artifact@v3|configure-pages@v5|deploy-pages@v4)/.test(w),"Legacy Node20 action: "+name);
}
console.log("Release contract passed:",version,"| PWA identity preserved |",assets.length,"offline resources |",workflows.length,"workflows");
