import {months,weekdays,fa,jalali,gregorian,toMs,shift,weekday,tehran,compare,dateKey,eventsOn,isHoliday} from "./core.mjs";
const root=document.getElementById("app"),today=()=>tehran().day;
let current=today(),month={y:current.y,m:current.m},selected={...current},view="month",error="";
let notes={};try{notes=JSON.parse(localStorage.getItem("karen-rooznama-notes-v1")||"{}")||{};}catch{notes={};}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const gdate=ms=>new Intl.DateTimeFormat("en-GB",{timeZone:"UTC",year:"numeric",month:"long",day:"numeric"}).format(new Date(ms));
function save(){try{localStorage.setItem("karen-rooznama-notes-v1",JSON.stringify(notes));}catch{alert("ذخیره روی این دستگاه انجام نشد.");}}
function header(){return '<div class="wrap"><header class="top"><div class="brand"><span class="logo">☀</span><div><h1>روزنمای کارن</h1><div class="muted">تقویم شمسی و میلادی · ساعت ایران</div></div></div><div><span class="clock">'+tehran().time+'</span> <button data-act="today" class="btn primary">امروز</button></div></header><nav class="tabs">'+[["month","ماه"],["year","سال"],["convert","تبدیل تاریخ"]].map(([id,label])=>'<button data-act="view" data-view="'+id+'" class="'+(view===id?"active":"")+'">'+label+'</button>').join("")+'</nav>';}
function nav(title){return '<div class="head"><div class="arrows"><button class="btn" data-act="prev" aria-label="قبلی">❯</button><button class="btn" data-act="next" aria-label="بعدی">❮</button></div><h2>'+title+'</h2></div>';}
function grid(){const start=toMs(month.y,month.m,1),offset=weekday(start),n=shift(month.y,month.m,1),len=(toMs(n.y,n.m,1)-start)/86400000,total=Math.ceil((offset+len)/7)*7;
let html='<div class="week">'+["ش","ی","د","س","چ","پ","ج"].map(x=>'<span>'+x+'</span>').join("")+'</div><div class="days">';
for(let i=0;i<total;i++){const ms=start+(i-offset)*86400000,d=jalali(ms),g=gregorian(ms),inside=d.y===month.y&&d.m===month.m,chosen=compare(d,selected)===0,now=compare(d,today())===0,holiday=isHoliday(d,ms);
html+='<button data-act="pick" data-ms="'+ms+'" class="day'+(inside?"":" out")+(chosen?" chosen":"")+(now?" now":"")+(holiday?" holiday":"")+'" aria-label="'+fa(d.d)+' '+months[d.m-1]+' '+fa(d.y)+'"><span class="num">'+fa(d.d)+'</span><span class="gr">'+g.d+'</span>'+(notes[dateKey(d)]?.length?'<small>•</small>':'')+'</button>';}
return html+'</div>';}
function details(){const ms=toMs(selected.y,selected.m,selected.d),list=notes[dateKey(selected)]||[],events=eventsOn(selected);
const displayed=(weekday(ms)===6?'<div class="event h">جمعه · تعطیلی هفتگی</div>':'')+events.map(x=>'<div class="event'+(x.holiday?' h':'')+'">'+esc(x.title)+'</div>').join("");
return '<aside class="card"><div class="muted">'+weekdays[weekday(ms)]+'</div><div class="datebig">'+fa(selected.d)+'</div><h2>'+months[selected.m-1]+' '+fa(selected.y)+'</h2><div class="muted" dir="ltr">'+esc(gdate(ms))+'</div><div class="rule"></div><h3>مناسبت‌های این روز</h3>'+(displayed||'<p class="muted">مناسبتی ثبت نشده است.</p>')+'<div class="rule"></div><h3>یادداشت‌های شخصی</h3><form id="noteform" class="noteform"><input maxlength="140" required aria-label="یادداشت روز" placeholder="یادداشت جدید…"><button type="submit" class="btn primary">ثبت</button></form>'+list.map((x,i)=>'<div class="noteitem"><span>'+esc(x)+'</span><button class="remove" data-act="delete" data-index="'+i+'" aria-label="حذف">×</button></div>').join("")+'<p class="muted">یادداشت‌ها فقط روی این مرورگر ذخیره می‌شوند.</p></aside>';}
function monthPage(){return '<main class="layout"><section class="card">'+nav(months[month.m-1]+' '+fa(month.y))+grid()+'</section>'+details()+'</main>';}
function yearPage(){return '<main class="layout"><section class="card">'+nav('سال '+fa(month.y))+'<div class="yeargrid">'+months.map((m,i)=>'<button class="monthbtn" data-act="openmonth" data-m="'+(i+1)+'">'+m+'</button>').join("")+'</div></section>'+details()+'</main>';}
function convertPage(){return '<main class="card"><h2>تبدیل تاریخ شمسی به میلادی</h2><p class="muted">تاریخ شمسی را وارد کن تا به همان روز در تقویم بروی.</p><form id="convertform" class="converter"><label>سال<input name="y" type="number" min="1200" max="1600" required value="'+selected.y+'"></label><label>ماه<input name="m" type="number" min="1" max="12" required value="'+selected.m+'"></label><label>روز<input name="d" type="number" min="1" max="31" required value="'+selected.d+'"></label><button class="btn primary" type="submit">تبدیل تاریخ</button></form><p class="muted" dir="ltr">'+gdate(toMs(selected.y,selected.m,selected.d))+'</p>'+(error?'<p role="alert">'+esc(error)+'</p>':'')+'</main>';}
function render(){root.innerHTML=header()+(view==="month"?monthPage():view==="year"?yearPage():convertPage())+'<footer class="foot">پیش‌نمایش ۰.۱ · مناسبت‌ها فعلاً نمونه و ناقص‌اند و هنوز با مرجع رسمی دانشگاه تهران تطبیق نشده‌اند. رویدادهای مذهبی نمایش داده نمی‌شوند.</footer></div>';}
document.addEventListener("click",e=>{const b=e.target.closest("button[data-act]");if(!b)return;switch(b.dataset.act){
case "today":selected=today();month={y:selected.y,m:selected.m};view="month";break;
case "view":view=b.dataset.view;break;
case "prev":case "next":if(view==="year")month.y+=b.dataset.act==="next"?1:-1;else month=shift(month.y,month.m,b.dataset.act==="next"?1:-1);break;
case "pick":selected=jalali(+b.dataset.ms);month={y:selected.y,m:selected.m};break;
case "openmonth":month.m=+b.dataset.m;selected={y:month.y,m:month.m,d:1};view="month";break;
case "delete":{const k=dateKey(selected),items=notes[k]||[];items.splice(+b.dataset.index,1);if(!items.length)delete notes[k];save();break;}
default:return;}render();});
document.addEventListener("submit",e=>{if(e.target.id==="noteform"){e.preventDefault();const v=e.target.querySelector("input").value.trim();if(v){const k=dateKey(selected);notes[k]=notes[k]||[];notes[k].push(v.slice(0,140));save();render();}}
if(e.target.id==="convertform"){e.preventDefault();const f=new FormData(e.target),y=+f.get("y"),m=+f.get("m"),d=+f.get("d");try{toMs(y,m,d);selected={y,m,d};month={y,m};view="month";error="";}catch{error="تاریخ نامعتبر است.";}render();}});
if("serviceWorker" in navigator&&location.protocol==="https:")addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
render();setInterval(()=>{const c=document.querySelector(".clock");if(c)c.textContent=tehran().time;},30000);
