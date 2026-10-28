/* Versioned annual source adapter. No invented "live API" calls. */
const SUPPORTED_YEARS=new Set([1405]);
const cache=new Map();
const loading=new Map();
function validEvent(e){
 return !!(e&&Number.isInteger(e.month)&&e.month>=1&&e.month<=12&&Number.isInteger(e.day)&&e.day>=1&&e.day<=31&&typeof e.title==="string"&&e.title.trim()&&typeof e.holiday==="boolean"&&typeof e.category==="string");
}
export function filterReligious(records){
 return records.filter(x=>x.category!=="religious"&&x.category!=="mixed-religious");
}
export function validateYearFile(year,file){
 if(!file||file.year!==year||file.schema!==1||!file.source||file.source.type!=="official-annual-pdf"||!Array.isArray(file.events))throw Error("Year data schema invalid");
 const allowed=["national","cultural","professional","historical","international","religious","mixed-religious"];
 for(const e of file.events){if(!validEvent(e)||!allowed.includes(e.category))throw Error("Invalid event record");}
 return filterReligious(file.events).map(e=>({y:year,m:e.month,d:e.day,title:e.title,holiday:e.holiday,category:e.category,source:file.source.url}));
}
export function installYearSnapshot(year,json){cache.set(year,validateYearFile(year,json));}
export async function loadYear(year){
 if(cache.has(year))return true;
 if(!SUPPORTED_YEARS.has(year)){cache.set(year,[]);return true;}
 if(loading.has(year))return loading.get(year);
 const pending=fetch("./data/years/"+year+".json").then(r=>{
  if(!r.ok)throw Error("Unable to load calendar source");
  return r.json();
 }).then(json=>{cache.set(year,validateYearFile(year,json));return true;}).catch(()=>false).finally(()=>loading.delete(year));
 loading.set(year,pending);return pending;
}
export function eventsOn(a){
 return (cache.get(a.y)||[]).filter(e=>e.m===a.m&&e.d===a.d);
}
export function isHoliday(a,ms,weekdayIndex){
 return weekdayIndex(ms)===6||eventsOn(a).some(e=>e.holiday);
}
export function yearCoverage(year){
 if(!SUPPORTED_YEARS.has(year))return "not-imported";
 return cache.has(year)?"partial-reviewed":"pending-load";
}
