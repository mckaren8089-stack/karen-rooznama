import {toMs} from "./core.mjs";
const MAX_PER_DAY=200;
function validKey(s){
  const m=/^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if(!m)return false;
  try{toMs(Number(m[1]),Number(m[2]),Number(m[3]));return true;}catch{return false;}
}
export function normalizeNotes(raw){
  const result=Object.create(null);
  if(!raw||typeof raw!=="object"||Array.isArray(raw))return result;
  for(const [day,entries] of Object.entries(raw)){
    if(!validKey(day)||!Array.isArray(entries))continue;
    const texts=entries.filter(x=>typeof x==="string").map(x=>x.trim().slice(0,140)).filter(Boolean).slice(0,MAX_PER_DAY);
    if(texts.length)result[day]=texts;
  }
  return result;
}
export function noteCount(notes){return Object.values(notes).reduce((n,arr)=>n+arr.length,0);}
export function sortedDays(notes){
  return Object.keys(notes).sort((a,b)=>{
    const x=a.split("-").map(Number),y=b.split("-").map(Number);
    return y[0]-x[0]||y[1]-x[1]||y[2]-x[2];
  });
}
export function exportNotes(notes){
  return JSON.stringify({app:"karen-rooznama",version:1,exportedAt:new Date().toISOString(),notes:normalizeNotes(notes)},null,2);
}
export function importNotes(json,current){
  if(typeof json!=="string"||json.length>2_000_000)throw Error("فایل پشتیبان بیش از حد بزرگ است.");
  let payload;
  try{payload=JSON.parse(json);}catch{throw Error("فایل JSON معتبر نیست.");}
  if(!payload||typeof payload!=="object"||Array.isArray(payload))throw Error("ساختار فایل پشتیبان معتبر نیست.");
  if("app" in payload&&payload.app!=="karen-rooznama")throw Error("این فایل متعلق به روزنمای کارن نیست.");
  const data="notes" in payload?payload.notes:payload;
  if(!data||typeof data!=="object"||Array.isArray(data))throw Error("بخش یادداشت‌ها در فایل معتبر نیست.");
  const imported=normalizeNotes(data);
  if(Object.keys(data).length>0&&Object.keys(imported).length===0)throw Error("یادداشت معتبری در فایل پیدا نشد.");
  const merged=normalizeNotes(current);
  let newNotes=0;
  for(const [day,items] of Object.entries(imported)){
    const existing=merged[day]||[];
    for(const item of items){
      if(!existing.includes(item)&&existing.length<MAX_PER_DAY){existing.push(item);newNotes++;}
    }
    if(existing.length)merged[day]=existing;
  }
  return {notes:merged,added:newNotes};
}
