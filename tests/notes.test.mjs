import test from "node:test";
import assert from "node:assert/strict";
import {normalizeNotes,noteCount,sortedDays,exportNotes,importNotes} from "../notes.mjs";
import {jalali,toMs,gregorian} from "../core.mjs";
test("Gregorian to Jalali October 29 2026",()=>{
 assert.deepEqual(jalali(Date.UTC(2026,9,29)),{y:1405,m:8,d:7});
});
test("Jalali and Gregorian invalid dates are rejected",()=>{
 assert.throws(()=>toMs(1405,12,31));
 const ms=Date.UTC(2026,1,30),date=gregorian(ms);
 assert.notDeepEqual(date,{y:2026,m:2,d:30});
});
test("Normalize notes, preserve date association and filter unsafe keys",()=>{
 const notes=normalizeNotes({"1405-8-7":["  یادداشت آزمایشی  ","","یادداشت دوم"],"__proto__":["bad"],"1405-12-31":["bad"]});
 assert.equal(noteCount(notes),2);
 assert.deepEqual(notes["1405-8-7"],["یادداشت آزمایشی","یادداشت دوم"]);
 assert.equal(Object.hasOwn(notes,"__proto__"),false);
});
test("Export/import JSON backup roundtrip",()=>{
 const notes={"1405-8-7":["آزمایش روزنما"],"1405-1-1":["نوروز"]};
 const json=exportNotes(notes);
 const parsed=importNotes(json,{});
 assert.equal(parsed.added,2);
 assert.deepEqual({...parsed.notes},notes);
 assert.deepEqual(sortedDays(parsed.notes),["1405-8-7","1405-1-1"]);
});
test("Import merges without duplicating existing notes",()=>{
 const x=importNotes(exportNotes({"1405-8-7":["قبلی","جدید"]}),{"1405-8-7":["قبلی"]});
 assert.deepEqual(x.notes["1405-8-7"],["قبلی","جدید"]);
 assert.equal(x.added,1);
});
test("Corrupt or unrelated backups are rejected",()=>{
 assert.throws(()=>importNotes("{not json}",{}));
 assert.throws(()=>importNotes(JSON.stringify({app:"unrelated",notes:{"1405-8-7":["x"]}}),{}));
 assert.throws(()=>importNotes(JSON.stringify({notes:{"random":["x"]}}),{}));
});

test("Backup restore preserves two identical notes on the same date without duplication on re-import",()=>{const input={"1405-8-7":["تکراری","تکراری"]};const once=importNotes(exportNotes(input),{});assert.equal(once.notes["1405-8-7"].length,2);const twice=importNotes(exportNotes(input),once.notes);assert.equal(twice.notes["1405-8-7"].length,2);assert.equal(twice.added,0);});
