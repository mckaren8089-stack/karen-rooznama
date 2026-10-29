import test from "node:test";
import assert from "node:assert/strict";
import {NOTES_KEY,PREVIOUS_KEY,readNotes,commitNotes,restorePrevious,recoverFromExternalFile,savedRawForRescue} from "../notes-store.mjs";
import {importNotes,exportNotes} from "../notes.mjs";

class MemoryStorage{
 constructor(init={}){this.values=new Map(Object.entries(init));this.failKey=null;this.failRead=false;}
 getItem(key){if(this.failRead)throw Error("SecurityError");return this.values.has(key)?this.values.get(key):null;}
 setItem(key,value){if(key===this.failKey)throw Error("QuotaExceededError");this.values.set(key,String(value));}
}

test("legacy 0.3 note key still loads without migration or touching stored bytes",()=>{
 const raw=JSON.stringify({"1405-8-7":["کار مهم","کار مهم"]});
 const store=new MemoryStorage({[NOTES_KEY]:raw});
 const state=readNotes(store);
 assert.equal(state.fault,null);
 assert.deepEqual(state.notes["1405-8-7"],["کار مهم","کار مهم"]);
 assert.equal(store.getItem(NOTES_KEY),raw);
});
test("commit succeeds and preserves immediately previous saved snapshot",()=>{
 const old=JSON.stringify({"1405-8-7":["قبلی"]});
 const st=new MemoryStorage({[NOTES_KEY]:old});
 const first=readNotes(st);
 const next=commitNotes(st,first,{"1405-8-7":["قبلی","جدید"]});
 assert.deepEqual(next.notes["1405-8-7"],["قبلی","جدید"]);
 assert.equal(st.getItem(PREVIOUS_KEY),old);
 assert.deepEqual(readNotes(st).notes["1405-8-7"],["قبلی","جدید"]);
});
test("failed primary write keeps previous saved notes and never declares success",()=>{
 const original=JSON.stringify({"1405-8-7":["قبلی"]});
 const st=new MemoryStorage({[NOTES_KEY]:original});st.failKey=NOTES_KEY;
 const snapshot=readNotes(st);
 const future={"1405-8-7":["قبلی","نوشتن ناموفق"]};
 assert.throws(()=>commitNotes(st,snapshot,future),/QuotaExceededError/);
 assert.equal(st.getItem(NOTES_KEY),original);
 assert.deepEqual(snapshot.notes["1405-8-7"],["قبلی"]);
});
test("failed safety snapshot blocks overwrite of existing notes",()=>{
 const old=JSON.stringify({"1405-8-7":["مهم"]}),st=new MemoryStorage({[NOTES_KEY]:old});
 st.failKey=PREVIOUS_KEY;
 assert.throws(()=>commitNotes(st,readNotes(st),{"1405-8-7":["مهم","جدید"]}));
 assert.equal(st.getItem(NOTES_KEY),old);
});
test("stale tab refuses to overwrite newer saved changes",()=>{
 const st=new MemoryStorage({[NOTES_KEY]:JSON.stringify({"1405-8-7":["قدیمی"]})});
 const a=readNotes(st),b=readNotes(st);
 commitNotes(st,a,{"1405-8-7":["قدیمی","از تب اول"]});
 const current=st.getItem(NOTES_KEY);
 assert.throws(()=>commitNotes(st,b,{"1405-8-7":["از تب دوم"]}),/پنجره دیگری/);
 assert.equal(st.getItem(NOTES_KEY),current);
});
test("bad JSON never loads as empty notes and is preserved for manual rescue",()=>{
 const st=new MemoryStorage({[NOTES_KEY]:'{"1405-8-7":["ناتمام"'});
 const state=readNotes(st);
 assert.ok(state.fault);
 assert.equal(savedRawForRescue(state),st.getItem(NOTES_KEY));
 assert.throws(()=>commitNotes(st,state,{"1405-8-7":["جدید"]}));
});
test("unrecognized stored legacy rows are not silently dropped on next save",()=>{
 const bad=JSON.stringify({"1405-8-7":["واقعی"],"1405-12-31":["نباید حذف بی صدا شود"]});
 const st=new MemoryStorage({[NOTES_KEY]:bad});
 assert.ok(readNotes(st).fault);
 assert.equal(st.getItem(NOTES_KEY),bad);
});
test("explicit recovery restores valid previous snapshot from corrupt primary",()=>{
 const healthy=JSON.stringify({"1405-8-7":["نسخه سالم"]});
 const corrupt='{"something":"broken"';
 const st=new MemoryStorage({[NOTES_KEY]:corrupt,[PREVIOUS_KEY]:healthy});
 const state=readNotes(st);
 assert.ok(state.fault);
 assert.equal(state.previousAvailable,true);
 const restored=restorePrevious(st,state);
 assert.equal(restored.fault,null);
 assert.deepEqual(restored.notes["1405-8-7"],["نسخه سالم"]);
 assert.equal(st.getItem(PREVIOUS_KEY),healthy);
});
test("restore refuses stale data and refuses invalid backup",()=>{
 const st=new MemoryStorage({[NOTES_KEY]:JSON.stringify({"1405-8-7":["a"]}),[PREVIOUS_KEY]:"corrupt"});
 const snapshot=readNotes(st);
 assert.equal(snapshot.previousAvailable,false);
 assert.throws(()=>restorePrevious(st,snapshot));
 st.setItem(PREVIOUS_KEY,JSON.stringify({"1405-8-7":["b"]}));
 st.setItem(NOTES_KEY,JSON.stringify({"1405-8-7":["c"]}));
 assert.throws(()=>restorePrevious(st,snapshot),/پنجره دیگری/);
});
test("disabled storage locks editing rather than pretending notes are empty",()=>{
 const st=new MemoryStorage();st.failRead=true;
 const state=readNotes(st);
 assert.ok(state.fault);
 assert.throws(()=>commitNotes(st,state,{}));
});
test("old JSON backups still import and can be durably saved",()=>{
 const initial={"1405-8-7":["قبلی"]};
 const st=new MemoryStorage({[NOTES_KEY]:JSON.stringify(initial)});
 const backup=exportNotes({"1405-8-7":["قبلی","جدید"]});
 const merged=importNotes(backup,readNotes(st).notes);
 const persisted=commitNotes(st,readNotes(st),merged.notes);
 assert.equal(merged.added,1);
 assert.deepEqual(persisted.notes["1405-8-7"],["قبلی","جدید"]);
});

test("emergency JSON recovery is explicit and never changes storage for invalid backup",()=>{
 const corrupt='{"1405-8-7":["broken"';
 const st=new MemoryStorage({[NOTES_KEY]:corrupt});
 const snapshot=readNotes(st);
 assert.ok(snapshot.fault);
 assert.throws(()=>recoverFromExternalFile(st,snapshot,"not json"));
 assert.equal(st.getItem(NOTES_KEY),corrupt);
 const recovered=recoverFromExternalFile(st,snapshot,exportNotes({"1405-8-7":["نجات"]}));
 assert.equal(recovered.fault,null);
 assert.deepEqual(recovered.notes["1405-8-7"],["نجات"]);
});
test("recovery snapshot survives a failed attempt to recover corrupt storage",()=>{
 const previous=JSON.stringify({"1405-8-7":["قابل بازیابی"]});
 const corrupt='[';
 const st=new MemoryStorage({[NOTES_KEY]:corrupt,[PREVIOUS_KEY]:previous});st.failKey=NOTES_KEY;
 assert.throws(()=>restorePrevious(st,readNotes(st)),/QuotaExceededError/);
 assert.equal(st.getItem(NOTES_KEY),corrupt);
 assert.equal(st.getItem(PREVIOUS_KEY),previous);
});
