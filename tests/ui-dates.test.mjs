import test from 'node:test';
import assert from 'node:assert/strict';
import {gregorianMonthRange,tehran,todayLabel,toMs,gregorian,shift} from '../core.mjs';

test('Aban shows its actual October and November endpoints',()=>{
 assert.equal(gregorianMonthRange(1405,8),'اکتبر ۲۰۲۶ – نوامبر ۲۰۲۶');
});
test('Dey carries both Gregorian years across New Year',()=>{
 assert.equal(gregorianMonthRange(1405,10),'دسامبر ۲۰۲۶ – ژانویهٔ ۲۰۲۷');
});
test('all months, including leap Esfand, use the first and last actual days',()=>{
 const fmt=new Intl.DateTimeFormat('fa-IR-u-ca-gregory',{timeZone:'UTC',month:'long',year:'numeric'});
 for(const y of [1399,1400,1403,1404,1405])for(let m=1;m<=12;m++){
  const next=shift(y,m,1),start=toMs(y,m,1),end=toMs(next.y,next.m,1)-86400000;
  assert.equal(gregorianMonthRange(y,m),fmt.format(new Date(start))+' – '+fmt.format(new Date(end)));
 }
 assert.deepEqual(gregorian(toMs(1399,12,30)),{y:2021,m:3,d:20});
});
test('Tehran today rolls over at Tehran midnight, regardless of host zone',()=>{
 const before=tehran(new Date('2026-11-01T20:29:59Z'));
 const after=tehran(new Date('2026-11-01T20:30:00Z'));
 assert.deepEqual(before,{day:{y:1405,m:8,d:10},time:'۲۳:۵۹'});
 assert.deepEqual(after,{day:{y:1405,m:8,d:11},time:'۰۰:۰۰'});
 assert.equal(todayLabel(before.day),'یکشنبه، ۱۰ آبان ۱۴۰۵');
 assert.equal(todayLabel(after.day),'دوشنبه، ۱۱ آبان ۱۴۰۵');
});
