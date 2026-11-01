import test from "node:test";
import assert from "node:assert/strict";
import {validateTasks,taskCount,exportTasks,importTasks} from "../tasks.mjs";
import {TASKS_KEY,TASKS_PREVIOUS_KEY,readTasks,commitTasks,restorePreviousTasks,recoverTasks} from "../tasks-store.mjs";
class Storage{
 constructor(init={}){this.map=new Map(Object.entries(init));this.fail=null;}
 getItem(k){return this.map.has(k)?this.map.get(k):null;}
 setItem(k,v){if(k===this.fail)throw Error("QuotaExceededError");this.map.set(k,v);}
}
const date="1405-8-10",t=(id,text="کار",done=false)=>({id,text,done});
test("valid task persists, reloads, and toggles completion",()=>{
 const store=new Storage(),start=readTasks(store);
 const one=commitTasks(store,start,{[date]:[t("a")]});
 assert.equal(readTasks(store).tasks[date][0].done,false);
 commitTasks(store,one,{[date]:[t("a","کار",true)]});
 assert.equal(readTasks(store).tasks[date][0].done,true);
});
test("note keys are never read or changed",()=>{
 const note='{"1405-8-10":["یادداشت خصوصی"]}',store=new Storage({"karen-rooznama-notes-v1":note});
 commitTasks(store,readTasks(store),{[date]:[t("a")]});
 assert.equal(store.getItem("karen-rooznama-notes-v1"),note);
 assert.equal(store.getItem("karen-rooznama-notes-previous-v1"),null);
});
test("previous snapshot protects from partial storage failure",()=>{
 const old=JSON.stringify({[date]:[t("a")]}),store=new Storage({[TASKS_KEY]:old});
 store.fail=TASKS_KEY;
 assert.throws(()=>commitTasks(store,readTasks(store),{[date]:[t("b")]}),/QuotaExceededError/);
 assert.equal(store.getItem(TASKS_KEY),old);
 assert.equal(store.getItem(TASKS_PREVIOUS_KEY),old);
 store.fail=TASKS_PREVIOUS_KEY;
 assert.throws(()=>commitTasks(store,readTasks(store),{[date]:[t("c")]}),/QuotaExceededError/);
 assert.equal(store.getItem(TASKS_KEY),old);
});
test("stale tab may not overwrite newer tasks",()=>{
 const store=new Storage({[TASKS_KEY]:JSON.stringify({[date]:[t("a")]})}),a=readTasks(store),b=readTasks(store);
 commitTasks(store,a,{[date]:[t("a"),t("b")]});
 assert.throws(()=>commitTasks(store,b,{[date]:[t("c")]}),/زبانه دیگری/);
});
test("bad JSON and bad records block writes without destruction",()=>{
 for(const raw of ['{bad',JSON.stringify({[date]:[{id:"a",text:"کار",done:"no"}]})]){
  const store=new Storage({[TASKS_KEY]:raw}),state=readTasks(store);
  assert.ok(state.fault);
  assert.throws(()=>commitTasks(store,state,{}));
  assert.equal(store.getItem(TASKS_KEY),raw);
 }
});
test("backup round trip, duplicate prevention, and unrelated file rejection",()=>{
 const obj={[date]:[t("a"),t("b","پایان",true)]},json=exportTasks(obj);
 assert.equal(importTasks(json).added,2);
 assert.equal(importTasks(json,obj).added,0);
 assert.deepEqual(validateTasks(importTasks(json).tasks)[date],obj[date]);
 assert.throws(()=>importTasks('{"app":"karen-rooznama","version":1,"notes":{}}'),/پشتیبان کارهای/);
});
test("corrupt state has explicit recovery and previous restore",()=>{
 const previous=JSON.stringify({[date]:[t("ok")]}),store=new Storage({[TASKS_KEY]:'{bad',[TASKS_PREVIOUS_KEY]:previous});
 const broken=readTasks(store);assert.ok(broken.fault&&broken.previousAvailable);
 const good=restorePreviousTasks(store,broken);assert.equal(good.tasks[date][0].id,"ok");
 const second=new Storage({[TASKS_KEY]:'{bad'});
 const healed=recoverTasks(second,readTasks(second),exportTasks({[date]:[t("safe")]}));
 assert.equal(healed.tasks[date][0].id,"safe");
});
test("rejects invalid dates, duplicate IDs, unknown fields, oversize tasks and malformed backups",()=>{
 for(const x of [
  {"1405-12-31":[t("a")]},
  {[date]:[t("a"),t("a")]},
  {[date]:[{...t("a"),mystery:true}]},
  {[date]:[t("a","x".repeat(161))]}
 ])assert.throws(()=>validateTasks(x));
 assert.throws(()=>importTasks(exportTasks({[date]:[t("a")]}),{[date]:Array.from({length:100},(_,i)=>t("z"+i))}),/ظرفیت/);
});
