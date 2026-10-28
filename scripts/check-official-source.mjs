import {createHash} from "node:crypto";
import {readFileSync,appendFileSync} from "node:fs";
const doc=JSON.parse(readFileSync(new URL("../data/years/1405.json",import.meta.url),"utf8"));
const url=doc.source.url;
let result;
try {
 const response=await fetch(url,{signal:AbortSignal.timeout(20000),headers:{"User-Agent":"Karen-Rooznama-source-probe/0.3"}});
 if(!response.ok)throw Error("HTTP "+response.status);
 const payload=new Uint8Array(await response.arrayBuffer());
 if(payload.byteLength>15000000)throw Error("PDF too large");
 if(new TextDecoder().decode(payload.slice(0,5))!=="%PDF-")throw Error("Response is not PDF");
 const digest=createHash("sha256").update(payload).digest("hex");
 const unchanged=digest===doc.source.sha256;
 result={source:url,status:unchanged?"verified":"changed",bytes:payload.byteLength,sha256:digest,expectedSha256:doc.source.sha256,year:doc.year,importStatus:doc.status};
 if(!unchanged)process.exitCode=2;
 console.log(JSON.stringify(result,null,2));
}catch(e){
 result={source:url,status:"unreachable",reason:String(e.message||e),year:doc.year,importStatus:doc.status};
 console.warn(JSON.stringify(result,null,2));
 process.exitCode=1;
}
if(process.env.GITHUB_STEP_SUMMARY){
 const status=result.status==="verified"?"دریافت شد؛ اثرانگشت مطابق نسخه بازبینی‌شده":result.status==="changed"?"فایل دانشگاه تغییر کرده؛ بازبینی لازم است":"عدم دسترسی";
 appendFileSync(process.env.GITHUB_STEP_SUMMARY,[
  "## پایش سند رسمی تقویم",
  "- سال: "+doc.year,
  "- دریافت PDF: "+status,
  "- نشانی: "+url,
  "- وضعیت ورود رویدادها: "+doc.status,
  "- SHA-256: "+(result.sha256||"نامشخص"),
  "- این روند هیچ مناسبت جدیدی را بدون بازبینی منتشر نمی‌کند."
 ].join("\n")+"\n");
}
