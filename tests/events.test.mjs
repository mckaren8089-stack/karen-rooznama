import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateYearFile,filterReligious} from "../events.mjs";
import {toMs} from "../core.mjs";
const doc=JSON.parse(readFileSync(new URL("../data/years/1405.json",import.meta.url),"utf8"));
test("year 1405 has source provenance, valid dates and partial coverage label",()=>{
 assert.equal(doc.year,1405);
 assert.equal(doc.status,"partial-review");
 assert.equal(doc.source.url,"https://calendar.ut.ac.ir/documents/2139738/7092644/Calendar-1405.pdf");
 const arr=validateYearFile(1405,doc);
 assert.ok(arr.length>=10);
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
