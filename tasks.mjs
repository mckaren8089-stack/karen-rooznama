import {toMs} from "./core.mjs";

export const MAX_TASKS_PER_DAY=100;
export const MAX_TASK_TEXT=160;

export function validTaskDay(key){
 const m=/^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(key);
 if(!m)return false;
 try{toMs(Number(m[1]),Number(m[2]),Number(m[3]));return true;}catch{return false;}
}
export function validateTasks(source){
 if(!source||typeof source!=="object"||Array.isArray(source))throw Error("ساختار کارهای روزانه معتبر نیست.");
 const result=Object.create(null);
 for(const [day,items] of Object.entries(source)){
  if(!validTaskDay(day)||!Array.isArray(items)||items.length>MAX_TASKS_PER_DAY)throw Error("تاریخ یا تعداد کارهای ذخیره‌شده معتبر نیست.");
  const ids=new Set();
  result[day]=items.map(item=>{
   if(!item||typeof item!=="object"||Array.isArray(item)||
      Object.keys(item).some(k=>!["id","text","done"].includes(k))||
      typeof item.id!=="string"||!(/^[A-Za-z0-9_-]{1,80}$/).test(item.id)||
      ids.has(item.id)||typeof item.text!=="string"||
      item.text!==item.text.trim()||!item.text||item.text.length>MAX_TASK_TEXT||
      typeof item.done!=="boolean")throw Error("یکی از کارهای ذخیره‌شده نیاز به بررسی دارد.");
   ids.add(item.id);
   return {id:item.id,text:item.text,done:item.done};
  });
  if(!result[day].length)delete result[day];
 }
 return result;
}
export function taskCount(tasks){return Object.values(tasks).reduce((n,items)=>n+items.length,0);}
export function exportTasks(tasks){
 return JSON.stringify({app:"karen-rooznama",kind:"tasks",version:1,exportedAt:new Date().toISOString(),tasks:validateTasks(tasks)},null,2);
}
export function importTasks(json,current=Object.create(null)){
 if(typeof json!=="string"||json.length>2_000_000)throw Error("فایل پشتیبان کارها بیش از حد مجاز است.");
 let data;
 try{data=JSON.parse(json);}catch{throw Error("فایل JSON معتبر نیست.");}
 if(!data||typeof data!=="object"||Array.isArray(data)||data.app!=="karen-rooznama"||
    data.kind!=="tasks"||data.version!==1)throw Error("این فایل پشتیبان کارهای روزنمای کارن نیست.");
 const imported=validateTasks(data.tasks),merged=validateTasks(current);
 let added=0;
 for(const [day,items] of Object.entries(imported)){
  const dest=merged[day]||[];
  const have=new Set(dest.map(x=>x.id));
  for(const item of items){
   if(have.has(item.id))continue;
   if(dest.length>=MAX_TASKS_PER_DAY)throw Error("ظرفیت کارهای یک روز برای بازیابی کافی نیست.");
   dest.push({...item});have.add(item.id);added++;
  }
  if(dest.length)merged[day]=dest;
 }
 return {tasks:merged,added};
}
