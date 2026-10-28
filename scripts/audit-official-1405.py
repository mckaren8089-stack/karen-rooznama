#!/usr/bin/env python3
"""Audit the manually curated 1405 nonreligious calendar against the exact official PDF."""
import hashlib
import json
import pathlib
import re
import sys
import fitz

ROOT = pathlib.Path(__file__).resolve().parents[1]
PDF = pathlib.Path(sys.argv[1])
SOURCE = ROOT / "data/years/1405.json"
QUARTERS = ("01-03", "04-06", "07-09", "10-12")
EXPECTED_DAYS = [31] * 6 + [30] * 5 + [29]
BANNED_OBSERVANCES = ("عید سعید فطر", "عید قربان", "عید غدیر", "عاشورای حسینی", "تاسوعای حسینی", "شهادت حضرت امام", "ولادت حضرت امام", "شب قدر", "مبعث رسول")
def check(condition, message):
    if not condition: raise AssertionError(message)

def normalized_date(cell):
    text = " ".join(part[::-1] for part in (cell or "").splitlines())
    text = re.sub(r"\d+", lambda m: m.group()[::-1], text)
    m = re.search(r"(?<!\d)(\d{1,2})(?!\d)", text)
    return int(m.group(1)) if m else None

def load_curated():
    out=[]
    for q in QUARTERS:
        path=ROOT / f"data/curation/1405-{q}.tsv"
        for n,line in enumerate(path.read_text(encoding="utf-8").splitlines(),1):
            if not line.strip() or line.startswith("#"):continue
            bits=line.split("|")
            check(len(bits)==5, f"bad curation row {path.name}:{n}")
            month,day,title,category,holiday=bits
            out.append({"month":int(month),"day":int(day),"title":title.strip(),"category":category,"holiday":holiday=="1","sourcePage":int(month)+2})
    return out

pdf_bytes=PDF.read_bytes()
actual_sha=hashlib.sha256(pdf_bytes).hexdigest()
book=json.loads(SOURCE.read_text(encoding="utf-8"))
check(pdf_bytes.startswith(b"%PDF-"),"official source not PDF")
check(actual_sha==book["source"]["sha256"],"official PDF has CHANGED: hold publication and review new source")
doc=fitz.open(stream=pdf_bytes,filetype="pdf")
check(doc.page_count==17,f"expected 17 pages, got {doc.page_count}")
cell_count=0
source_occasion_days=0
source_cells={}
for m in range(1,13):
    tables=doc[m+1].find_tables()
    check(len(tables.tables)>=1,f"no calendar table, month {m}")
    t=max(tables.tables,key=lambda x:x.row_count)
    rows=t.extract()[1:]
    check(len(rows)==EXPECTED_DAYS[m-1],f"incorrect day count, month {m}: {len(rows)}")
    for d,row in enumerate(rows,1):
        check(len(row)==4, f"incorrect column count {m}/{d}")
        parsed=normalized_date(row[3])
        check(parsed==d,f"date alignment mismatch {m}/{d}: PDF said {parsed}")
        text=(row[0] or "").strip()
        source_cells[(m,d)]=text
        source_occasion_days+=bool(text)
        cell_count+=1

check(cell_count==365,"all 365 official days were not audited")
check(source_occasion_days==189,f"official occasion-cell count changed: {source_occasion_days}")
candidates=load_curated()
check(candidates==book["events"],"reviewed public JSON differs from curated source rows")
check(len(candidates)==210,"expected 210 reviewed nonreligious records")
day_keys={(e["month"],e["day"]) for e in candidates}
check(len(day_keys)==144,"expected 144 nonreligious occasion dates")
check(all(source_cells[(e["month"],e["day"])] for e in candidates),"public event assigned to empty source day")
check(len({(e["month"],e["day"],e["title"]) for e in candidates})==len(candidates),"duplicate event")
check(all(not any(bad in e["title"] for bad in BANNED_OBSERVANCES) for e in candidates),"religious observance leaked into public dataset")
check(book["audit"]["sourceDays"]==cell_count,"audit sourceDays drift")
check(book["audit"]["daysWithAtLeastOnePrintedOccasion"]==source_occasion_days,"audit occasion count drift")
check(book["status"]=="reviewed-nonreligious","source review status incorrect")
holidays={(e["month"],e["day"]) for e in candidates if e["holiday"]}
check(holidays=={(1,1),(1,2),(1,3),(1,4),(1,12),(1,13),(3,14),(3,15),(11,22),(12,29)},"nonreligious holiday calendar drift")
report={"officialPDFSha256":actual_sha,"pages":doc.page_count,"daysAudited":cell_count,
        "sourceDaysWithOccasions":source_occasion_days,"nonreligiousEvents":len(candidates),
        "nonreligiousDates":len(day_keys),"excludedReligiousOnlyDates":source_occasion_days-len(day_keys),
        "nonreligiousHolidayDates":len(holidays),"status":"PASSED"}
print(json.dumps(report,ensure_ascii=False,indent=2))
out=ROOT / "audit-1405.json"
out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
