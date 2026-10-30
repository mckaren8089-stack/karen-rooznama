/* Versioned annual source adapter. No invented "live API" calls. */
const SUPPORTED_YEARS=new Set([1405]);
const cache=new Map();
const loading=new Map();
const status=new Map();
function validEvent(e){
 return !!(e&&Number.isInteger(e.month)&&e.month>=1&&e.month<=12&&Number.isInteger(e.day)&&e.day>=1&&e.day<=31&&typeof e.title==="string"&&e.title.trim()&&typeof e.holiday==="boolean"&&typeof e.category==="string");
}
export function filterReligious(records){
 return records.filter(x=>x.category!=="religious"&&x.category!=="mixed-religious");
}
export function validateYearFile(year,file){
 if(!file||file.year!==year||file.schema!==1||!file.source||file.source.type!=="official-annual-pdf"||!Array.isArray(file.events))throw Error("Year data schema invalid");
 const allowed=["national","cultural","professional","historical","international","religious","mixed-religious"];
 for(const e of file.events){if(!validEvent(e)||!allowed.includes(e.category)||(e.month===12&&e.day>29)||(e.month>=7&&e.month<=11&&e.day>30))throw Error("Invalid event record");}
 if(file.status==="reviewed-nonreligious"&&file.events.some(e=>["religious","mixed-religious"].includes(e.category)))throw Error("Reviewed file must exclude religious events");
 return filterReligious(file.events).map(e=>({y:year,m:e.month,d:e.day,title:e.title,holiday:e.holiday,category:e.category,source:file.source.url}));
}
export function installYearSnapshot(year,json){cache.set(year,validateYearFile(year,json));status.set(year,json.status||"unreviewed");}
export async function loadYear(year){
 if(cache.has(year))return true;
 if(!SUPPORTED_YEARS.has(year)){cache.set(year,[]);status.set(year,"not-imported");return true;}
 if(loading.has(year))return loading.get(year);
 status.set(year,"pending-load");
 const pending=fetch("./data/years/"+year+".json").then(r=>{
  if(!r.ok)throw Error("Unable to load calendar source");
  return r.json();
 }).then(json=>{cache.set(year,validateYearFile(year,json));status.set(year,json.status||"unreviewed");return true;}).catch(()=>{status.set(year,"unavailable");return false;}).finally(()=>loading.delete(year));
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
 return cache.has(year)?(status.get(year)||"unreviewed"):(status.get(year)==="unavailable"?"unavailable":"pending-load");
}
