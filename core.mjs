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
// Provisional seed, not verified or sourced from University of Tehran.
const events=[
 [1,1,"نوروز",1],[1,2,"نوروز",1],[1,3,"نوروز",1],[1,4,"نوروز",1],
 [1,12,"روز جمهوری اسلامی",1],[1,13,"روز طبیعت",1],[1,25,"بزرگداشت عطار",0],
 [2,1,"بزرگداشت سعدی",0],[2,10,"روز ملی خلیج فارس",0],[2,25,"بزرگداشت فردوسی",0],
 [7,20,"بزرگداشت حافظ",0],[9,30,"شب یلدا",0],[12,5,"روز مهندس",0],[12,15,"روز درختکاری",0],[12,29,"ملی شدن صنعت نفت",1]
].map(([m,d,title,holiday])=>({m,d,title,holiday:!!holiday,category:"nonreligious"}));
export const filterEvents=list=>list.filter(x=>x.category!=="religious");
export const eventsOn=a=>filterEvents(events.filter(x=>x.m===a.m&&x.d===a.d));
export const isHoliday=(a,ms)=>weekday(ms)===6||eventsOn(a).some(x=>x.holiday);
