import {execFileSync} from "node:child_process";
import {mkdtempSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
const d=mkdtempSync(join(tmpdir(),"rooznama-")),pdf=join(d,"source.pdf");
execFileSync("curl",["-fLsS","--max-time","40","https://calendar.ut.ac.ir/documents/2139738/7092644/Calendar-1405.pdf","-o",pdf]);
const pages=execFileSync("pdftotext",["-raw",pdf,"-"],{encoding:"utf8",maxBuffer:20e6}).split("\f");
const norm=s=>s.replace(/[\u202a-\u202e\u2066-\u2069\u200c\u200d]/g,"").replace(/[۰-۹]/g,x=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(x))).replace(/[٠-٩]/g,x=>String("٠١٢٣٤٥٦٧٨٩".indexOf(x))).replace(/\s+/g," ").trim();
const re=/^(?:شنبه|یك\s*شنبه|یک\s*شنبه|دو\s*شنبه|سه\s*شنبه|چهار\s*شنبه|پنج\s*شنبه|جمعه)\s+(\d{1,2})(?:\s|$)/;
const ms=["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
const groups=[];
for(let i=2;i<14;i++){
 const page=pages[i]||"";
 let month=i-1;
 let lines=page.split("\n").map(norm).filter(Boolean),rows=[],active=null;
 for(const line of lines){
  const m=line.match(re);
  if(m){
   if(active)rows.push(active);
   active={day:+m[1],text:line,continuation:[]};
  }else if(active){active.continuation.push(line);}
 }
 if(active)rows.push(active);
 const days=rows.map(x=>x.day);
 console.log("PAGE",i+1,ms[month-1], "rows",rows.length,"days",days.join(","));
 console.log("SAMPLES",JSON.stringify(rows.filter(x=>x.continuation.length||x.text.length>90).slice(0,8)).slice(0,4500));
 groups.push({month,days,rows});
}
console.log("TOTAL ROWS",groups.reduce((n,x)=>n+x.rows.length,0));
