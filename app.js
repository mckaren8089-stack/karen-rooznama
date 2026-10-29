import {months,weekdays,fa,jalali,gregorian,toMs,shift,weekday,tehran,compare,dateKey,eventsOn,isHoliday,loadYear} from "./core.mjs";
import {normalizeNotes,noteCount,sortedDays,exportNotes,importNotes} from "./notes.mjs";
import {NOTES_KEY,readNotes,commitNotes,restorePrevious,savedRawForRescue} from "./notes-store.mjs";
const root=document.getElementById("app");
const today=()=>tehran().day;
let selected=today(),month={y:selected.y,m:selected.m},view="month";
let converterMode="j2g",conversion=null,convertError="",feedback="",editing=null;
const requestedYears=new Set();
let noteState;
try{noteState=readNotes(window.localStorage);}
catch{noteState={notes:Object.create(null),raw:null,previousAvailable:false,fault:"مرورگر اجازه دسترسی به حافظه یادداشت‌ها را نمی‌دهد."};}
let notes=noteState.notes;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const gdate=ms=>new Intl.DateTimeFormat("en-GB",{timeZone:"UTC",year:"numeric",month:"long",day:"numeric"}).format(new Date(ms));
const formatJ=a=>fa(a.d)+" "+months[a.m-1]+" "+fa(a.y);
function showFeedback(message){
 feedback=message;
 const container=root.querySelector(".wrap");
 if(!container)return;
 let node=container.querySelector(".message");
 if(!node){
  node=document.createElement("div");
  node.className="message";node.setAttribute("role","status");
  container.querySelector(".tabs")?.after(node);
 }
 if(node)node.textContent=message;
}
async function changeNotes(modify,success,afterSuccess){
 try{
  const run=()=>{
   if(noteState.fault)throw Error(noteState.fault);
   const draft=normalizeNotes(notes);
   if(modify(draft)===false)return false;
   const committed=commitNotes(window.localStorage,noteState,draft);
   noteState=committed;notes=committed.notes;
   return true;
  };
  const ok=navigator.locks&&typeof navigator.locks.request==="function"
    ?await navigator.locks.request(NOTES_KEY,{mode:"exclusive"},run)
    :run();
  if(ok===false)return false;
  if(afterSuccess)afterSuccess();
  feedback=typeof success==="function"?success():success;
  render();
  return true;
 }catch(err){
  showFeedback("تغییر ذخیره نشد: "+(err?.message||"خطای حافظه دستگاه. از داده‌های فعلی پشتیبان تهیه کن."));
  return false;
 }
}
function downloadText(text,filename,type="application/json;charset=utf-8"){
 const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),30000);
}
function notesWarning(){
 if(!noteState.fault)return "";
 return '<section class="card" role="alert"><h2>حفاظت از یادداشت‌ها</h2><p>'+escape(noteState.fault)+'</p><p>برای جلوگیری از پاک‌شدن یادداشت‌های قبلی، ثبت و ویرایش موقتاً غیرفعال است. داده خام را برای بررسی ذخیره کن.</p>'
 +(noteState.raw!==null?'<button class="btn" data-act="export-raw" type="button">دریافت داده خام برای نجات</button>':'')
 +(noteState.previousAvailable?'<button class="btn" data-act="restore-previous" type="button">بازیابی آخرین نسخه سالم</button>':'')
 +'</section>';
}
function header(){
 const now=tehran();
 const tabs=[["month","ماه"],["year","سال"],["convert","تبدیل تاریخ"],["notes","یادداشت‌ها"]];
 return '<div class="wrap"><header class="top"><div class="brand"><span class="logo" aria-hidden="true"><img src="./assets/faravahar.svg" alt="" width="64" height="64"></span><div><h1>روزنمای کارن</h1><div class="muted">تقویم شمسی و میلادی · ساعت ایران</div></div></div><div><span class="clock">'+now.time+'</span> <button data-act="today" class="btn primary">امروز</button></div></header><nav class="tabs" aria-label="ابزارهای روزنما">'+tabs.map(([id,label])=>'<button type="button" data-act="view" data-view="'+id+'" class="'+(view===id?"active":"")+'" aria-current="'+(view===id?"page":"false")+'">'+label+(id==="notes"&&noteCount(notes)?' <span class="tabcount">'+fa(noteCount(notes))+'</span>':'')+'</button>').join("")+'</nav>';
}
function nav(title){return '<div class="head"><div class="arrows"><button class="btn" data-act="prev" aria-label="قبلی">❯</button><button class="btn" data-act="next" aria-label="بعدی">❮</button></div><h2>'+title+'</h2></div>';}
function grid(){
 const start=toMs(month.y,month.m,1),offset=weekday(start),n=shift(month.y,month.m,1),len=(toMs(n.y,n.m,1)-start)/86400000,total=Math.ceil((offset+len)/7)*7;
 let html='<div class="week">'+["ش","ی","د","س","چ","پ","ج"].map(x=>'<span>'+x+'</span>').join("")+'</div><div class="days">';
 for(let i=0;i<total;i++){
  const ms=start+(i-offset)*86400000,d=jalali(ms),g=gregorian(ms),inside=d.y===month.y&&d.m===month.m,chosen=compare(d,selected)===0,now=compare(d,today())===0,holiday=isHoliday(d,ms),count=(notes[dateKey(d)]||[]).length;
  html+='<button type="button" data-act="pick" data-ms="'+ms+'" class="day'+(inside?"":" out")+(chosen?" chosen":"")+(now?" now":"")+(holiday?" holiday":"")+'" aria-label="'+formatJ(d)+(count?"، "+fa(count)+" یادداشت":"")+'" aria-pressed="'+chosen+'"><span class="num">'+fa(d.d)+'</span><span class="gr">'+g.d+'</span>'+(count?'<span class="daynote" title="تعداد یادداشت">'+fa(count)+'</span>':'')+'</button>';
 }
 return html+'</div><p class="muted calendarhint">روز دلخواه را لمس کن تا جزئیات و یادداشت‌های همان روز را ببینی. عدد کوچک کنار روز، تعداد یادداشت‌هاست.</p>';
}
function noteItems(day,items){
 return items.map((x,i)=>{
  if(editing&&editing.key===day&&editing.index===i){
   return '<form class="noteedit" id="editform" data-key="'+day+'" data-index="'+i+'"><input name="content" maxlength="140" required aria-label="ویرایش یادداشت" value="'+escape(x)+'"><button type="submit" class="btn primary">ذخیره</button><button type="button" class="btn" data-act="cancel-edit">لغو</button></form>';
  }
  return '<div class="noteitem"><span>'+escape(x)+'</span><button type="button" class="noteeditbtn" data-act="edit" data-key="'+day+'" data-index="'+i+'" aria-label="ویرایش یادداشت">ویرایش</button><button type="button" class="remove" data-act="delete" data-key="'+day+'" data-index="'+i+'" aria-label="حذف یادداشت">×</button></div>';
 }).join("");
}
function details(){
 const ms=toMs(selected.y,selected.m,selected.d),day=dateKey(selected),list=notes[day]||[],events=eventsOn(selected);
 const displayed=(weekday(ms)===6?'<div class="event h">جمعه · تعطیلی هفتگی</div>':'')+events.map(x=>'<div class="event'+(x.holiday?' h':'')+'">'+escape(x.title)+'</div>').join("");
 return '<aside class="card details" id="details"><div class="muted">'+weekdays[weekday(ms)]+'</div><div class="datebig">'+fa(selected.d)+'</div><h2>'+months[selected.m-1]+' '+fa(selected.y)+'</h2><div class="muted" dir="ltr">'+escape(gdate(ms))+'</div><div class="rule"></div><h3>مناسبت‌های این روز</h3>'+(displayed||'<p class="muted">مناسبتی ثبت نشده است.</p>')+'<div class="rule"></div><h3>یادداشت‌های '+formatJ(selected)+' <span class="countpill">'+fa(list.length)+'</span></h3><form id="noteform" class="noteform"><input maxlength="140" required aria-label="یادداشت روز" placeholder="یادداشت جدید برای همین روز…"><button type="submit" class="btn primary" '+(noteState.fault?'disabled':'')+'>ثبت</button></form>'+(list.length?noteItems(day,list):'<p class="muted">هنوز یادداشتی برای این روز ثبت نشده است.</p>')+'<button type="button" data-act="viewnotes" class="btn allnotes">دیدن همه یادداشت‌ها ('+fa(noteCount(notes))+')</button></aside>';
}
function monthPage(){return '<main class="layout"><section class="card">'+nav(months[month.m-1]+' '+fa(month.y))+grid()+'</section>'+details()+'</main>';}
function yearPage(){return '<main class="layout"><section class="card">'+nav('سال '+fa(month.y))+'<div class="yeargrid">'+months.map((m,i)=>'<button class="monthbtn" data-act="openmonth" data-m="'+(i+1)+'">'+m+'</button>').join("")+'</div></section>'+details()+'</main>';}
function dateInputs(d){
 return '<div class="converter"><label>سال<input name="y" type="number" inputmode="numeric" min="'+(converterMode==="j2g"?"1200":"1822")+'" max="'+(converterMode==="j2g"?"1600":"2200")+'" required value="'+d.y+'"></label><label>ماه<input name="m" type="number" inputmode="numeric" min="1" max="12" required value="'+d.m+'"></label><label>روز<input name="d" type="number" inputmode="numeric" min="1" max="31" required value="'+d.d+'"></label><button class="btn primary" type="submit">تبدیل تاریخ</button></div>';
}
function convertPage(){
 const isJ=converterMode==="j2g",g=gregorian(toMs(selected.y,selected.m,selected.d)),defaultDate=isJ?selected:g;
 return '<main class="card"><h2>تبدیل تاریخ دوطرفه</h2><div class="convertmodes"><button type="button" class="btn'+(isJ?' primary':'')+'" data-act="direction" data-dir="j2g">شمسی به میلادی</button><button type="button" class="btn'+(!isJ?' primary':'')+'" data-act="direction" data-dir="g2j">میلادی به شمسی</button></div><p class="muted">تاریخ '+(isJ?'شمسی':'میلادی')+' را وارد کن تا معادل '+(isJ?'میلادی':'شمسی')+' آن نمایش داده شود.</p><form id="convertform">'+dateInputs(defaultDate)+'</form>'+(conversion?'<div class="result" role="status"><span class="muted">نتیجه تبدیل</span><strong>'+escape(conversion.label)+'</strong><button class="btn" type="button" data-act="jump">نمایش این روز در تقویم</button></div>':'')+(convertError?'<p class="error" role="alert">'+escape(convertError)+'</p>':'')+'</main>';
}
function notesPage(){
 const count=noteCount(notes),days=sortedDays(notes);
 return '<main class="card"><div class="head"><h2>همه یادداشت‌های من</h2><span class="countpill">'+fa(count)+' یادداشت</span></div><p class="muted">یادداشت‌ها به روز مربوط وصل‌اند. با لمس تاریخ، همان روز در تقویم باز می‌شود. اطلاعات فقط روی همین مرورگر ذخیره می‌شوند.</p><div class="backuptools"><button class="btn" type="button" data-act="export" '+(count?'':'disabled')+'>دریافت پشتیبان JSON</button><button class="btn" type="button" data-act="import" '+(noteState.fault?'disabled':'')+'>بازیابی از JSON</button>'+(noteState.previousAvailable?'<button class="btn" type="button" data-act="restore-previous">بازیابی نسخه ذخیره‌شده قبلی</button>':'')+'<input type="file" id="backupfile" accept=".json,application/json" hidden aria-label="انتخاب فایل پشتیبان JSON"></div>'+(!count?'<div class="empty">هنوز یادداشتی ثبت نشده است. از نمای ماه، یک روز را انتخاب کن و یادداشت بنویس.</div>':'<div class="notehistory">'+days.map(day=>{const bits=day.split("-").map(Number),j={y:bits[0],m:bits[1],d:bits[2]};return '<section class="historyday"><div class="historyhead"><button type="button" class="btn" data-act="open-noted-day" data-key="'+day+'">'+formatJ(j)+' · مشاهده در تقویم</button><span class="muted">'+fa(notes[day].length)+' یادداشت</span></div>'+noteItems(day,notes[day])+'</section>';}).join("")+'</div>')+'<p class="muted">بازیابی با یادداشت‌های موجود ادغام می‌شود و نسخه تکراری یک متن را دوباره وارد نمی‌کند. برای انتقال به دستگاه دیگر، فایل JSON را خودت منتقل کن.</p></main>';
}
function render(){
 const years=[month.y,selected.y];
 for(const y of years){
  if(!requestedYears.has(y)){requestedYears.add(y);loadYear(y).then(ok=>{if(ok)render();});}
 }
 root.innerHTML=header()+(feedback?'<div class="message" role="status">'+escape(feedback)+'</div>':'')+notesWarning()+(view==="month"?monthPage():view==="year"?yearPage():view==="convert"?convertPage():notesPage())+'</div>';
}
function showDay(){render();if(window.matchMedia&&matchMedia("(max-width:760px)").matches)requestAnimationFrame(()=>document.getElementById("details")?.scrollIntoView({behavior:"smooth",block:"start"}));}
function changeMonth(step){
 if(view==="year"){month.y+=step;return;}
 month=shift(month.y,month.m,step);
 const next=shift(month.y,month.m,1);
 const max=(toMs(next.y,next.m,1)-toMs(month.y,month.m,1))/86400000;
 selected={y:month.y,m:month.m,d:Math.min(selected.d,max)};
}
document.addEventListener("click",async e=>{
 const b=e.target.closest("button[data-act]");if(!b)return;
 const act=b.dataset.act;
 if(act!=="delete")feedback="";
 switch(act){
 case "today":selected=today();month={y:selected.y,m:selected.m};view="month";break;
 case "view":view=b.dataset.view;conversion=null;convertError="";break;
 case "viewnotes":view="notes";break;
 case "direction":converterMode=b.dataset.dir;conversion=null;convertError="";break;
 case "prev":changeMonth(-1);break;
 case "next":changeMonth(1);break;
 case "pick":selected=jalali(Number(b.dataset.ms));month={y:selected.y,m:selected.m};showDay();return;
 case "openmonth":month.m=Number(b.dataset.m);selected={y:month.y,m:month.m,d:1};view="month";break;
 case "open-noted-day":{const d=b.dataset.key.split("-").map(Number);selected={y:d[0],m:d[1],d:d[2]};month={y:selected.y,m:selected.m};view="month";showDay();return;}
 case "edit":editing={key:b.dataset.key,index:Number(b.dataset.index)};break;
 case "cancel-edit":editing=null;break;
 case "delete":{if(!confirm("این یادداشت حذف شود؟"))return;const k=b.dataset.key,index=Number(b.dataset.index),expected=notes[k]?.[index];await changeNotes(draft=>{const items=draft[k];if(!items||items[index]!==expected)throw Error("یادداشت تغییر کرده است؛ صفحه را تازه‌سازی کن.");items.splice(index,1);if(!items.length)delete draft[k];return true;},"یادداشت حذف شد.",()=>{editing=null;});return;}
 case "jump":if(conversion){selected=jalali(conversion.ms);month={y:selected.y,m:selected.m};view="month";showDay();return;}break;
 case "export":downloadText(exportNotes(notes),"karen-rooznama-notes.json");feedback="درخواست دریافت پشتیبان ارسال شد؛ وجود فایل را در پوشه دانلود بررسی کن.";break;
 case "export-raw":downloadText(savedRawForRescue(noteState),"karen-rooznama-recovery-raw.txt","text/plain;charset=utf-8");showFeedback("داده خام برای بررسی دریافت شد؛ فایل را حذف نکن.");return;
 case "restore-previous":{
  if(!confirm("این کار یادداشت‌های فعلی را با نسخه ذخیره‌شده قبلی جایگزین می‌کند. پیش از ادامه، از وضعیت فعلی پشتیبان JSON یا فایل خام گرفته‌ای؟"))return;
  try{
   const run=()=>restorePrevious(window.localStorage,noteState);
   const restored=navigator.locks&&typeof navigator.locks.request==="function"
     ?await navigator.locks.request(NOTES_KEY,{mode:"exclusive"},run):run();
   noteState=restored;notes=restored.notes;editing=null;
   feedback="نسخه قبلی بازیابی شد. از یادداشت‌های بازیابی‌شده یک پشتیبان JSON بگیر.";render();
  }catch(err){showFeedback("بازیابی انجام نشد: "+(err?.message||"خطای حافظه دستگاه"));}
  return;
 }
 case "import":document.getElementById("backupfile")?.click();return;
 default:return;
 }
 render();
});
document.addEventListener("submit",async e=>{
 if(e.target.id==="editform"){
  e.preventDefault();
  const key=e.target.dataset.key,index=Number(e.target.dataset.index),value=e.target.elements.content.value.trim();
  if(value&&notes[key]&&index>=0&&index<notes[key].length){
   const expected=notes[key][index];
   await changeNotes(draft=>{if(!draft[key]||draft[key][index]!==expected)throw Error("یادداشت در جای دیگری تغییر کرده است.");draft[key][index]=value.slice(0,140);return true;},"ویرایش یادداشت ذخیره شد.",()=>{editing=null;});
  }
 }
 if(e.target.id==="noteform"){
  e.preventDefault();const value=e.target.querySelector("input").value.trim();if(!value)return;
  const k=dateKey(selected);await changeNotes(draft=>{const list=draft[k]||[];if(list.length>=200)throw Error("حداکثر تعداد یادداشت برای این روز ثبت شده است.");list.push(value.slice(0,140));draft[k]=list;return true;},"یادداشت برای "+formatJ(selected)+" ثبت شد.");
 }
 if(e.target.id==="convertform"){
  e.preventDefault();const data=new FormData(e.target),y=Number(data.get("y")),m=Number(data.get("m")),d=Number(data.get("d"));
  try{
   let ms;
   if(converterMode==="j2g")ms=toMs(y,m,d);
   else{
    if(![y,m,d].every(Number.isInteger)||y<1822||y>2200||m<1||m>12||d<1||d>31)throw Error("invalid");
    ms=Date.UTC(y,m-1,d);
    const back=gregorian(ms);if(back.y!==y||back.m!==m||back.d!==d)throw Error("invalid");
   }
   conversion={ms,label:converterMode==="j2g"?gdate(ms):formatJ(jalali(ms))};
   convertError="";
  }catch{conversion=null;convertError="تاریخ واردشده معتبر نیست. سال، ماه و روز را بررسی کن.";}
  render();
 }
});
document.addEventListener("change",async e=>{
 if(e.target.id!=="backupfile")return;
 const file=e.target.files?.[0];if(!file)return;
 try{
  if(file.size>2_000_000)throw Error("حجم فایل پشتیبان بیش از حد مجاز است.");
  const text=await file.text();let added=0;
  await changeNotes(draft=>{const result=importNotes(text,draft);added=result.added;for(const k of Object.keys(draft))delete draft[k];Object.assign(draft,result.notes);return true;},()=>fa(added)+" یادداشت جدید از فایل JSON بازیابی شد.");
  e.target.value="";return;
 }catch(err){feedback="بازیابی انجام نشد: "+(err?.message||"فایل نامعتبر است.");}
 render();
});
window.addEventListener("storage",event=>{
 if(event.key!==NOTES_KEY&&event.key!==null)return;
 const focused=document.activeElement?.closest?.("#noteform,#editform");
 if(focused){showFeedback("یادداشت‌ها در زبانه دیگری تغییر کرده‌اند. برای دیدن نسخه جدید، صفحه را تازه‌سازی کن.");return;}
 try{
  noteState=readNotes(window.localStorage);notes=noteState.notes;editing=null;
  feedback="یادداشت‌ها با تغییرات زبانه دیگر هماهنگ شدند.";render();
 }catch{showFeedback("ارتباط با حافظه یادداشت‌ها قطع شده است.");}
});
render();
setInterval(()=>{const c=document.querySelector(".clock");if(c)c.textContent=tehran().time;},30000);
if("serviceWorker" in navigator&&location.protocol==="https:")addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
