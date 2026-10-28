import {eventsOn as sourcedEvents,filterReligious,isHoliday as holidayFromSource,loadYear,yearCoverage} from "./events.mjs";
const DAY=86400000;
const persian=new Intl.DateTimeFormat("en-US-u-ca-persian",{timeZone:"UTC",year:"numeric",month:"numeric",day:"numeric"});
const iran=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Tehran",year:"numeric",month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
export const months=["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
export const weekdays=["شنبه","یکشنبه","دوشنبه","سه‌شنبه","چهارشنبه","پنجشنبه","جمعه"];
export const fa=n=>String(n).replace(/[0-9]/g,d=>"۰۱۲۳۴۵۶۷۸۹"[+d]);
function fields(fmt,date){const out={};for(const x of fmt.formatToParts(date))if(x.type!=="literal")out[x.type]=x.value;return out;}
export function jalali(ms){const f=fields(persian,new Date(ms));return {y:+f.year,m:+f.month,d:+f.day};}
export function gregorian(ms){const x=new Date(ms);return {y:x.getUTCFullYear(),m:x.getUTCMonth()+1,d:x.getUTCDate()};}
export const compare=(a,b)=>a.y-b.y||a.m-b.m||a.d-b.d;
export function toMs(y,m,d){
 if(![y,m,d].every(Number.isInteger)||y<1200||y>1600||m<1||m>12||d<1||d>31)throw Error("Invalid date");
 const target={y,m,d};let lo=Math.floor(Date.UTC(y+620,0,1)/DAY),hi=Math.floor(Date.UTC(y+623,11,31)/DAY);
 while(lo<=hi){const mid=Math.floor((lo+hi)/2),c=compare(jalali(mid*DAY),target);if(!c)return mid*DAY;if(c<0)lo=mid+1;else hi=mid-1;}
 throw Error("Invalid date");
}
export function shift(y,m,n){const i=y*12+m-1+n;return {y:Math.floor(i/12),m:((i%12)+12)%12+1};}
export const weekday=ms=>(new Date(ms).getUTCDay()+1)%7;
export function tehran(){const p=fields(iran,new Date());return {day:jalali(Date.UTC(+p.year,+p.month-1,+p.day)),time:fa(p.hour+":"+p.minute)};}
export const dateKey=a=>a.y+"-"+a.m+"-"+a.d;
export const filterEvents=filterReligious;
export const eventsOn=sourcedEvents;
export const isHoliday=(a,ms)=>holidayFromSource(a,ms,weekday);
export {loadYear,yearCoverage};
