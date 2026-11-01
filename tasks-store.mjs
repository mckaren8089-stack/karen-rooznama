import {validateTasks,importTasks} from "./tasks.mjs";

export const TASKS_KEY="karen-rooznama-tasks-v1";
export const TASKS_PREVIOUS_KEY="karen-rooznama-tasks-previous-v1";

export function readTasks(storage){
 let raw=null,previousAvailable=false;
 try{
  const previous=storage.getItem(TASKS_PREVIOUS_KEY);
  if(previous!==null){try{validateTasks(JSON.parse(previous));previousAvailable=true;}catch{}}
  raw=storage.getItem(TASKS_KEY);
  return {tasks:raw===null?Object.create(null):validateTasks(JSON.parse(raw)),raw,previousAvailable,fault:null};
 }catch{
  return {tasks:Object.create(null),raw,previousAvailable,
   fault:"کارهای ذخیره‌شده قابل خواندن نیستند؛ برای حفاظت از آن‌ها ثبت و ویرایش متوقف شده است."};
 }
}
export function commitTasks(storage,baseline,next){
 if(baseline.fault)throw Error("ابتدا کارهای ذخیره‌شده را بازیابی کن.");
 const current=storage.getItem(TASKS_KEY);
 if(current!==baseline.raw)throw Error("کارها در زبانه دیگری تغییر کرده‌اند؛ صفحه را تازه‌سازی کن.");
 const value=JSON.stringify(validateTasks(next));
 if(value===current)return {...baseline,tasks:validateTasks(next)};
 if(current!==null)storage.setItem(TASKS_PREVIOUS_KEY,current);
 storage.setItem(TASKS_KEY,value);
 return {tasks:validateTasks(next),raw:value,previousAvailable:current!==null,fault:null};
}
export function restorePreviousTasks(storage,baseline){
 if(storage.getItem(TASKS_KEY)!==baseline.raw)throw Error("کارها در زبانه دیگری تغییر کرده‌اند.");
 const raw=storage.getItem(TASKS_PREVIOUS_KEY);
 if(raw===null)throw Error("نسخهٔ قبلی کارها وجود ندارد.");
 validateTasks(JSON.parse(raw));
 storage.setItem(TASKS_KEY,raw);
 return readTasks(storage);
}
export function recoverTasks(storage,baseline,jsonText){
 if(!baseline.fault)throw Error("بازیابی اضطراری فقط برای دادهٔ خراب مجاز است.");
 if(storage.getItem(TASKS_KEY)!==baseline.raw)throw Error("کارها در زبانه دیگری تغییر کرده‌اند.");
 const imported=importTasks(jsonText);
 if(!Object.keys(imported.tasks).length)throw Error("فایل پشتیبان کار معتبر ندارد.");
 storage.setItem(TASKS_KEY,JSON.stringify(imported.tasks));
 return readTasks(storage);
}
