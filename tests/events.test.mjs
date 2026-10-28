import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateYearFile,filterReligious} from "../events.mjs";
import {toMs} from "../core.mjs";
const doc=JSON.parse(readFileSync(new URL("../data/years/1405.json",import.meta.url),"utf8"));
test("year 1405 has source provenance, valid dates and completed nonreligious audit",()=>{
 assert.equal(doc.year,1405);
 assert.equal(doc.status,"reviewed-nonreligious");
 assert.equal(doc.audit.sourceDays,365);
 assert.equal(doc.audit.daysWithAtLeastOnePrintedOccasion,189);
 assert.equal(doc.audit.nonreligiousEventRecords,210);
 assert.equal(doc.audit.daysWithNonreligiousOccasion,144);
 assert.equal(doc.source.sha256,"8e32b520d5da058414b9378d62a01117273336a4c074591f4e84d59ab32a963c");
 assert.equal(doc.source.url,"https://calendar.ut.ac.ir/documents/2139738/7092644/Calendar-1405.pdf");
 const arr=validateYearFile(1405,doc);
 assert.equal(arr.length,210);
 const seen=new Set();
 for(const e of arr){
  assert.ok(typeof toMs(e.y,e.m,e.d)==="number");
  assert.ok(!["religious","mixed-religious"].includes(e.category));
  const key=e.y+"/"+e.m+"/"+e.d+"/"+e.title;
  assert.ok(!seen.has(key));seen.add(key);
 }
});
test("reject malformed source data and religious entries from public output",()=>{
 assert.throws(()=>validateYearFile(1406,doc));
 assert.deepEqual(filterReligious([
  {category:"religious",title:"x"},
  {category:"mixed-religious",title:"y"},
  {category:"cultural",title:"z"}
 ]).map(e=>e.title),["z"]);
});

test("all twelve months covered and holidays are independently classified",()=>{
 const e=validateYearFile(1405,doc);
 assert.equal(new Set(e.map(x=>x.m)).size,12);
 const find=(m,d)=>e.filter(x=>x.m===m&&x.d===d);
 assert.deepEqual(find(1,25).map(x=>x.title),["روز بزرگداشت عطار نیشابوری"]);
 assert.ok(find(1,25).every(x=>!x.holiday));
 assert.ok(find(1,1).some(x=>x.title==="آغاز نوروز"&&x.holiday));
 assert.equal(find(8,22).length,0); // religious occasion only, intentionally excluded
 assert.equal(find(12,19).length,0); // Eid al-Fitr excluded
 assert.ok(find(12,29).some(x=>x.holiday));
});
