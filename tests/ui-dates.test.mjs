import test from 'node:test';
import assert from 'node:assert/strict';
import {gregorianMonthRange,tehran,todayLabel,toMs,gregorian} from '../core.mjs';

test('Aban shows its actual October and November endpoints',()=>{
 assert.equal(gregorianMonthRange(1405,8),'اکتبر ۲۰۲۶ – نوامبر ۲۰۲۶');
});
test('Dey carries both Gregorian years across New Year',()=>{
 assert.equal(gregorianMonthRange(1405,10),'دسامبر ۲۰۲۶ – ژانویهٔ ۲۰۲۷');
});
test('leap and ordinary Esfand end in the correct Gregorian month/year',()=>{
 assert.equal(gregorianMonthRange(1399,12),'فوریهٔ ۲۰۲۱ – مارس ۲۰۲۱');
 assert.equal(gregorianMonthRange(1400,12),'فوریهٔ ۲۰۲۲ – مارس ۲۰۲۲');
 assert.equal(gregorianMonthRange(1403,12),'فوریهٔ ۲۰۲۵ – مارس ۲۰۲۵');
 assert.deepEqual(gregorian(toMs(1399,12,30)),{y:2021,m:3,d:20});
 assert.throws(()=>toMs(1400,12,30));
});
test('Tehran today rolls over at Tehran midnight, regardless of host zone',()=>{
 const before=tehran(new Date('2026-11-01T20:29:59Z'));
 const after=tehran(new Date('2026-11-01T20:30:00Z'));
 assert.deepEqual(before,{day:{y:1405,m:8,d:10},time:'۲۳:۵۹'});
 assert.deepEqual(after,{day:{y:1405,m:8,d:11},time:'۰۰:۰۰'});
 assert.equal(todayLabel(before.day),'یکشنبه، ۱۰ آبان ۱۴۰۵');
 assert.equal(todayLabel(after.day),'دوشنبه، ۱۱ آبان ۱۴۰۵');
});
