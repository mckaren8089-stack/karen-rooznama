import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {loadYear,yearCoverage,eventsOn} from "../events.mjs";
const official=JSON.parse(readFileSync(new URL("../data/years/1405.json",import.meta.url),"utf8"));
test("unimported year is not a no-occasion year",async()=>{
 assert.equal(yearCoverage(1404),"not-imported");
 assert.equal(await loadYear(1404),true);
 assert.equal(yearCoverage(1404),"not-imported");
 assert.deepEqual(eventsOn({y:1404,m:1,d:13}),[]);
});
test("official 1405 distinguishes loading, network failure and retry success",async()=>{
 const before=globalThis.fetch;
 let calls=0;
 globalThis.fetch=async()=>{calls++;if(calls===1)throw Error("offline");return {ok:true,json:async()=>official};};
 try{
  assert.equal(yearCoverage(1405),"pending-load");
  const first=loadYear(1405);
  assert.equal(yearCoverage(1405),"pending-load");
  assert.equal(await first,false);
  assert.equal(yearCoverage(1405),"unavailable");
  const second=loadYear(1405);
  assert.equal(yearCoverage(1405),"pending-load");
  assert.equal(await second,true);
  assert.equal(yearCoverage(1405),"reviewed-nonreligious");
  assert.ok(eventsOn({y:1405,m:1,d:13}).some(x=>x.title==="روز طبیعت"));
  assert.equal(calls,2);
 }finally{globalThis.fetch=before;}
});
