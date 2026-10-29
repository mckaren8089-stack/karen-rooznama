/* Durable local-only note storage, compatible with the original v1 key. */
import {normalizeNotes} from "./notes.mjs";
export const NOTES_KEY="karen-rooznama-notes-v1";
export const PREVIOUS_KEY="karen-rooznama-notes-previous-v1";

function decode(raw){
 const data=JSON.parse(raw);
 if(!data||typeof data!=="object"||Array.isArray(data))throw Error("ساختار داده‌های یادداشت معتبر نیست.");
 const entries=Object.entries(data);
 const normalized=normalizeNotes(data);
 // Never silently discard unrecognized legacy records.
 for(const [key,value] of entries){
  if(!Object.hasOwn(normalized,key)||!Array.isArray(value)||
    normalized[key].length!==value.length||
    value.some((s,i)=>typeof s!=="string"||s!==normalized[key][i])){
   throw Error("بخشی از یادداشت‌های ذخیره‌شده نیاز به بررسی و بازیابی دارد.");
  }
 }
 return normalized;
}
export function readNotes(storage){
 let raw=null,previousRaw=null;
 try{
  raw=storage.getItem(NOTES_KEY);
  previousRaw=storage.getItem(PREVIOUS_KEY);
  const notes=raw===null?Object.create(null):decode(raw);
  // A bad historical snapshot must not prevent use of a valid primary.
  let previousAvailable=false;
  if(previousRaw!==null){try{decode(previousRaw);previousAvailable=true;}catch{}}
  return {notes,raw,previousAvailable,fault:null};
 }catch(err){
  return {notes:Object.create(null),raw,previousAvailable:false,
   fault:"یادداشت‌های موجود قابل خواندن نیستند. برای جلوگیری از حذف اطلاعات، ذخیره‌سازی متوقف شده است."};
 }
}
export function commitNotes(storage,baseline,next){
 if(baseline.fault)throw Error("ابتدا وضعیت یادداشت‌های قبلی را بررسی کن.");
 const current=storage.getItem(NOTES_KEY);
 if(current!==baseline.raw)throw Error("یادداشت‌ها در پنجره دیگری تغییر کرده‌اند. صفحه را تازه‌سازی کن و دوباره تلاش کن.");
 const normalized=normalizeNotes(next);
 const value=JSON.stringify(normalized);
 if(value===current)return {...baseline,notes:normalized};
 // Save the last committed data first. If this fails, do NOT alter primary.
 if(current!==null)storage.setItem(PREVIOUS_KEY,current);
 storage.setItem(NOTES_KEY,value);
 return {notes:normalized,raw:value,previousAvailable:current!==null,fault:null};
}
export function restorePrevious(storage,baseline){
 if(baseline.fault)throw Error("ابتدا از داده‌های فعلی نسخه خام دریافت و بررسی کن.");
 const current=storage.getItem(NOTES_KEY);
 if(current!==baseline.raw)throw Error("داده‌ها در پنجره دیگری تغییر کرده‌اند؛ صفحه را تازه‌سازی کن.");
 const previousRaw=storage.getItem(PREVIOUS_KEY);
 if(previousRaw===null)throw Error("نسخه قبلی وجود ندارد.");
 const previous=decode(previousRaw);
 // Make an undo of the restore operation possible.
 if(current!==null)storage.setItem(PREVIOUS_KEY,current);
 storage.setItem(NOTES_KEY,previousRaw);
 return {notes:previous,raw:previousRaw,previousAvailable:current!==null,fault:null};
}
export function savedRawForRescue(state){return state.raw===null?"":state.raw;}
