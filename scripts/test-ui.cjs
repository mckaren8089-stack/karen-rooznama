/* Run after: npm install --no-save --package-lock=false playwright@1.58.2
   npx playwright install --with-deps chromium
   python scripts/build-pwa-icons.py
   node scripts/test-ui.cjs
   Uses a fresh localhost browser context with synthetic data only. */
const assert=require('node:assert/strict');
const {spawn,execFileSync}=require('node:child_process');
const {mkdirSync,readFileSync}=require('node:fs');
const {chromium}=require('playwright');
const url='http://127.0.0.1:8766/';
const output=process.env.UI_OUTPUT_DIR||'/tmp/rooznama-ui';
const server=spawn('python3',['-m','http.server','8766','--bind','127.0.0.1'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 let browser;
 try{
  for(let i=0;i<50;i++){try{if((await fetch(url)).ok)break;}catch{}await sleep(100);}
  mkdirSync(output,{recursive:true});
  browser=await chromium.launch({headless:true});
  if(process.env.UI_BASE_SHA){
   const before=await browser.newPage({viewport:{width:360,height:800},serviceWorkers:'block'});
   for(const file of ['app.js','style.css','core.mjs']){
    const body=execFileSync('git',['show',process.env.UI_BASE_SHA+':'+file],{encoding:'utf8'});
    await before.route('**/'+file,route=>route.fulfill({body,contentType:file.endsWith('.css')?'text/css':'text/javascript'}));
   }
   await before.clock.install({time:new Date('2026-11-01T12:00:00Z')});
   await before.goto(url);await before.locator('.days .day').first().waitFor();
   await before.screenshot({path:output+'/before-360.png',fullPage:true});await before.close();
  }
  const context=await browser.newContext({viewport:{width:360,height:800},timezoneId:'America/Los_Angeles'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install({time:new Date('2026-11-01T20:29:58Z')});
  await page.clock.pauseAt(new Date('2026-11-01T20:29:58Z'));
  await page.goto(url);await page.locator('.days .day').first().waitFor();
  const date=()=>page.locator('.todaydate').innerText();
  assert.equal(await date(),'یکشنبه، ۱۰ آبان ۱۴۰۵');
  assert.equal(await page.locator('.gregorianrange').innerText(),'اکتبر ۲۰۲۶ – نوامبر ۲۰۲۶');
  await page.locator('[data-act="prev"]').click();
  assert.equal(await date(),'یکشنبه، ۱۰ آبان ۱۴۰۵');
  const chosen=await page.locator('.day.chosen').getAttribute('data-ms');
  await page.locator('#noteform input').fill('پیش‌نویس آزمایشی');
  await page.locator('#taskform input').fill('کار در حال نوشتن');
  await page.clock.runFor(3000);
  assert.equal(await date(),'دوشنبه، ۱۱ آبان ۱۴۰۵');
  assert.equal(await page.locator('.clock').innerText(),'۰۰:۰۰');
  assert.equal(await page.locator('.day.chosen').getAttribute('data-ms'),chosen);
  assert.equal(await page.locator('#noteform input').inputValue(),'پیش‌نویس آزمایشی');
  assert.equal(await page.locator('#taskform input').inputValue(),'کار در حال نوشتن');
  await page.locator('[data-act="today"]').click();
  assert.equal(await page.locator('.day.now').count(),1);
  assert.equal(await page.locator('.day.now').getAttribute('aria-pressed'),'true');
  // Add, edit, complete, backup and restore using ordinary UI controls.
  await page.locator('#noteform input').fill('یادداشت آزمایشی');
  await page.locator('#noteform button').click();
  await page.locator('.noteitem').waitFor();
  await page.locator('#taskform input').fill('کار آزمایشی');
  await page.locator('#taskform button').click();await page.locator('.taskitem').waitFor();
  await page.locator('[data-act="task-edit"]').click();
  await page.locator('#taskeditform input').fill('کار ویرایش‌شده');
  await page.locator('#taskeditform button[type="submit"]').click();
  await page.locator('[data-act="task-toggle"]').click();
  await page.locator('.taskitem.completed').waitFor();
  await page.reload();await page.locator('.taskitem.completed').waitFor();
  assert.equal(await page.locator('.noteitem span').innerText(),'یادداشت آزمایشی');
  assert.equal(await page.locator('.tasktext').innerText(),'کار ویرایش‌شده');
  // Import/export is exercised with synthetic files, in an isolated origin/context.
  const downloadPromise=page.waitForEvent('download');
  await page.locator('[data-act="task-export"]').click();
  const download=await downloadPromise;
  const taskBackup=readFileSync(await download.path(),'utf8');
  assert.equal(JSON.parse(taskBackup).kind,'tasks');
  page.on('dialog',d=>d.accept());
  await page.locator('[data-act="task-delete"]').click();
  await page.locator('.taskitem').waitFor({state:'detached'});
  await page.locator('#tasksbackupfile').setInputFiles({name:'tasks.json',mimeType:'application/json',buffer:Buffer.from(taskBackup)});
  await page.locator('.taskitem.completed').waitFor();
  await page.locator('[data-act="viewnotes"]').click();
  const noteDownloadPromise=page.waitForEvent('download');
  await page.locator('[data-act="export"]').click();
  const noteDownload=await noteDownloadPromise;
  const notesBackup=readFileSync(await noteDownload.path(),'utf8');
  assert.ok(JSON.parse(notesBackup).notes['1405-8-11']);
  await page.locator('#backupfile').setInputFiles({name:'notes.json',mimeType:'application/json',buffer:Buffer.from(notesBackup)});
  assert.equal(await page.locator('.noteitem').count(),1);
  await page.locator('[data-act="today"]').click();
  // Layout and badge overlap: show both pending-task and note badges.
  await page.locator('[data-act="task-toggle"]').click();
  for(const width of [320,360,390,1280]){
   await page.setViewportSize({width,height:800});
   const layout=await page.evaluate(()=>{
    const note=document.querySelector('.daynote').getBoundingClientRect(),task=document.querySelector('.daytask').getBoundingClientRect();
    return {rtl:getComputedStyle(document.documentElement).direction,overflow:document.documentElement.scrollWidth>innerWidth,
     clock:getComputedStyle(document.querySelector('.clock')).display,
     overlap:!(note.right<=task.left||task.right<=note.left||note.bottom<=task.top||task.bottom<=note.top)};
   });
   assert.equal(layout.rtl,'rtl');assert.equal(layout.overflow,false,'overflow at '+width);
   assert.notEqual(layout.clock,'none');assert.equal(layout.overlap,false,'badge overlap at '+width);
   await page.screenshot({path:output+'/after-'+width+'.png',fullPage:true});
  }
  assert.equal(await page.locator('footer').innerText(),'McKaren · نسخهٔ ۰.۵.۱');
  // localhost is a secure context. Explicit registration tests the same shell.
  await page.evaluate(async()=>{await navigator.serviceWorker.register('./sw.js');await navigator.serviceWorker.ready;});
  await page.reload();await page.locator('.taskitem').waitFor();
  await context.setOffline(true);
  await page.reload();await page.locator('.taskitem').waitFor();
  assert.equal(await page.locator('.noteitem span').innerText(),'یادداشت آزمایشی');
  await page.locator('[data-act="next"]').click();
  assert.ok(await page.locator('.days .day').count()>27);
  assert.deepEqual(errors,[]);
  console.log('UI passed: Tehran midnight, independent today, drafts, notes/tasks, JSON, RTL 320/360/390/1280, badges, offline reload.');
 }finally{if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
