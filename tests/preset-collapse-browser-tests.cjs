'use strict';
// Optional development check for the collapsible 「部分プリセット」 section. Same setup as browser-tests.cjs.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.CAW_PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..'),mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.ico':'image/x-icon','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!p.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}fs.readFile(p,(err,body)=>{res.writeHead(err?404:200,{'Content-Type':mime[path.extname(p)]||'application/octet-stream'});res.end(err?'Not found':body);});});
(async()=>{let browser;try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext({acceptDownloads:true,hasTouch:true});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  const qa=process.env.CAW_QA_DIR||path.join(root,'..','qa');fs.mkdirSync(qa,{recursive:true});
  const saved=()=>page.waitForFunction(()=>document.getElementById('save-status').textContent==='自動保存済み');
  const draft=()=>page.evaluate(()=>localStorage.getItem('caw_draft_v01'));
  const toggle=page.locator('#preset-toggle');
  const state=()=>page.evaluate(()=>{const b=document.getElementById('preset-toggle');return [b.getAttribute('aria-expanded'),b.querySelector('.preset-toggle-label').textContent,document.getElementById('preset-body').hidden];});
  await page.setViewportSize({width:390,height:844});await page.goto(url);await saved();

  // 初回は閉じた状態：見出しと開閉ボタンだけ。カテゴリのタブとカードは出さない。
  assert.deepEqual(await state(),['false','開く',true],'Closed on first use');
  assert.equal(await page.evaluate(()=>localStorage.getItem('caw_ui_presets_v1')),null,'Nothing stored until the user toggles');
  assert(await page.locator('#preset-title').isVisible());assert.equal(await page.locator('#preset-title').evaluate(h=>h.tagName+'>'+h.firstElementChild.id),'H2>preset-toggle','Heading contains the toggle button');
  assert.equal(await toggle.getAttribute('aria-controls'),'preset-body');assert.equal(await page.locator('#preset-body').getAttribute('id'),'preset-body');
  for(const sel of ['#preset-groups','[data-preset-group]','[data-preset]','.preset-lead'])assert.equal(await page.locator(sel).first().isVisible(),false,'Hidden while closed: '+sel);
  const tb=await toggle.boundingBox(),ab=await page.locator('.preset-toggle-action').boundingBox();assert(tb.height>=44&&ab.height>=44,'Tap size');assert(tb.width>300,'Whole heading row is tappable');
  const arrowClosed=await page.locator('.preset-chevron').evaluate(e=>getComputedStyle(e).transform);assert.notEqual(arrowClosed,'none','Arrow drawn');
  // 既存の描画は閉じていても行われている（開いた瞬間に再初期化しない）。
  assert.equal(await page.locator('[data-preset-group]').count(),6,'Six categories rendered');
  const before=await draft(),keysBefore=await page.evaluate(()=>Object.keys(localStorage).sort());

  // 開く（見出しのどこをタップしても）。開閉だけではプリセットを適用しない。
  await page.locator('.preset-toggle-title').tap();await page.waitForTimeout(250);
  assert.deepEqual(await state(),['true','閉じる',false],'Opened by tapping the heading');
  await page.waitForTimeout(250);assert.notEqual(await page.locator('.preset-chevron').evaluate(e=>getComputedStyle(e).transform),arrowClosed,'Arrow flips when open');
  assert(await page.locator('#preset-groups').isVisible()&&await page.locator('.preset-lead').isVisible());assert.equal(await page.locator('[data-preset-group]:visible').count(),6);
  assert(await page.locator('[data-preset]:visible').count()>0,'Preset cards visible');
  assert.equal(await page.locator('#preset-dialog').evaluate(d=>d.open),false,'Opening does not start a preset');await saved();assert.equal(await draft(),before,'Opening does not change appearance data');
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('caw_ui_presets_v1'))),{open:true},'Open state stored as a device UI setting');
  assert.deepEqual(await page.evaluate(()=>Object.keys(localStorage).sort()),keysBefore.concat(['caw_ui_presets_v1']).sort(),'Only the preset UI key is added');
  await page.screenshot({path:path.join(qa,'presets-open-390.png')});

  // 既存のプリセット操作：6カテゴリの切り替え・もっと見る／表示を減らす・確認ダイアログ・差分・適用。
  const groups=await page.locator('[data-preset-group]').evaluateAll(els=>els.map(e=>e.dataset.presetGroup));assert.equal(groups.length,6);
  for(const g of groups){await page.locator('[data-preset-group="'+g+'"]').click();assert.equal(await page.locator('[data-preset-group="'+g+'"]').getAttribute('aria-selected'),'true','Category switches: '+g);assert(await page.locator('[data-preset]:visible').count()>0);}
  assert.deepEqual(await state(),['true','閉じる',false],'Category switching keeps it open');
  await page.locator('[data-preset-group="'+groups[0]+'"]').click();
  const more=page.locator('[data-preset-more]');if(await more.count()){const n0=await page.locator('[data-preset]').count();await more.click();assert(await page.locator('[data-preset]').count()>n0,'More shows more');assert.equal(await more.textContent(),'表示を減らす');await more.click();assert.equal(await page.locator('[data-preset]').count(),n0,'Less restores');}
  const card=page.locator('[data-preset]').first(),pid=await card.getAttribute('data-preset');await card.click();
  assert(await page.locator('#preset-dialog').evaluate(d=>d.open),'Confirmation dialog');assert(Number(await page.locator('#preset-total-count').textContent())>0,'Diff counts shown');assert(await page.locator('#preset-impact-list li').count()>0,'Diff list shown');
  await page.locator('#preset-dialog [data-close-preset-dialog]').last().click();assert.equal(await draft(),before,'Cancel changes nothing');
  await card.click();await page.locator('[data-confirm-preset]').click();await saved();
  const expected=await page.evaluate(id=>{const p=CAW.data.presets.find(x=>x.id===id);return CAW.state.patch(CAW.normalizer.normalize(JSON.parse(localStorage.getItem('caw_draft_v01'))),{}).appearance&&Object.keys(p.patch);},pid);
  const after=JSON.parse(await draft());assert.notEqual(JSON.stringify(after.appearance),JSON.stringify(JSON.parse(before).appearance),'Applying a preset updates appearance data');
  assert(expected.every(k=>after.appearance[k]!==undefined),'Preset fields are set');assert.equal(JSON.stringify(after).includes('presetsOpen')||JSON.stringify(after).includes('caw_ui_presets'),false,'Appearance data has no preset UI state');

  // 閉じる。データはそのまま。キーボード（Enter／Space）でも開閉できる。
  const applied=await draft();await toggle.click();assert.deepEqual(await state(),['false','開く',true]);assert.equal(await draft(),applied,'Closing keeps data');
  await toggle.focus();await page.keyboard.press('Enter');assert.deepEqual(await state(),['true','閉じる',false],'Enter opens');await page.keyboard.press('Space');assert.deepEqual(await state(),['false','開く',true],'Space closes');

  // 再読込で開閉状態を復元。高度な設定（別キー）とは干渉しない。
  await page.locator('label[for="advanced-toggle"]').click();await toggle.click();await saved();await page.reload();await saved();
  assert.deepEqual(await state(),['true','閉じる',false],'Open state restored after reload');assert(await page.locator('#advanced-toggle').isChecked(),'Advanced setting kept');
  await page.locator('label[for="advanced-toggle"]').click();await page.reload();await saved();assert.deepEqual(await state(),['true','閉じる',false],'Changing advanced settings does not reset the preset state');assert.equal(await page.locator('#advanced-toggle').isChecked(),false);
  await toggle.click();await page.reload();await saved();assert.deepEqual(await state(),['false','開く',true],'Closed state restored after reload');
  // JSON書き出しに開閉状態は含まれない。
  const wait=page.waitForEvent('download');await page.locator('[data-export-current]').first().click();const json=fs.readFileSync(await (await wait).path(),'utf8');assert(!/presets?Open|caw_ui_presets/.test(json),'Export has no preset UI state');
  // 壊れた設定値は閉じた状態として扱う。
  await page.evaluate(()=>localStorage.setItem('caw_ui_presets_v1','not json'));await page.reload();await saved();assert.deepEqual(await state(),['false','開く',true],'Broken value falls back to closed');

  // 画面幅：閉じた／開いた状態の両方で横はみ出しなし。
  for(const width of [320,375,390,768,1280]){await page.setViewportSize({width,height:width<700?740:900});await page.waitForTimeout(150);
    for(const open of [false,true]){if((await toggle.getAttribute('aria-expanded'))!==String(open))await toggle.click();await page.locator('#preset-title').scrollIntoViewIfNeeded();
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Overflow at '+width+' open='+open);
      const t=await toggle.boundingBox(),a=await page.locator('.preset-toggle-action').boundingBox();assert(t.x>=0&&t.x+t.width<=width+0.5&&a.x+a.width<=width+0.5&&a.height>=44,'Toggle fits at '+width);
      assert(await page.locator('.preset-toggle-title').evaluate(e=>e.getBoundingClientRect().height<40),'Title stays on one line at '+width);
      if(width<=390){await page.waitForTimeout(250);await page.screenshot({path:path.join(qa,'presets-'+(open?'open':'closed')+'-'+width+'.png')});}}}
  assert.deepEqual(errors,[],'No browser runtime errors');console.log('PASS preset collapse: closed on first use, heading/arrow/aria-expanded, open/close by tap and keyboard, no apply or data change on toggle, 6 categories / more-less / confirm dialog / diff / apply work when open, state kept per device (separate key, not in JSON), 320/375/390/768/1280 no overflow; no page errors');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}})().catch(err=>{console.error(err);process.exitCode=1;});
