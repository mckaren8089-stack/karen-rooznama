import {execFileSync} from "node:child_process";
import {mkdtempSync,readFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
const dir=mkdtempSync(join(tmpdir(),"rooznama-pdf-")), pdf=join(dir,"1405.pdf");
const url="https://calendar.ut.ac.ir/documents/2139738/7092644/Calendar-1405.pdf";
execFileSync("curl",["-fLsS","--retry","2","--max-time","30",url,"-o",pdf],{timeout:40000});
const data=readFileSync(pdf);
console.log("PDF bytes:",data.length,"header:",data.subarray(0,5).toString());
try{console.log("PDF INFO:",execFileSync("pdfinfo",[pdf],{encoding:"utf8"}).split("\n").filter(l=>/Pages:|Creator:|Producer:|Page size:/.test(l)).join("; "));}catch(e){console.log("pdfinfo error",String(e.message));}
for(const mode of ["-layout","-raw"]){
 const text=execFileSync("pdftotext",[mode,pdf,"-"],{encoding:"utf8",maxBuffer:15*1024*1024});
 const pages=text.split("\f");
 console.log("\nMODE",mode,"PAGES",pages.length,"TEXT LENGTH",text.length,"NONEMPTY",pages.map((x,i)=>x.trim()?i+1:null).filter(Boolean));
 for(let i=0;i<Math.min(4,pages.length);i++){
  console.log("--- PAGE",i+1,mode,"---\n"+pages[i].split("\n").filter(Boolean).slice(0,115).map((s,j)=>String(j+1).padStart(3)+": "+s).join("\n").slice(0,12500));
 }
}
