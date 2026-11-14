'use strict';
// Optional development check for the 「外見設計」/「顔ID・LoRA」 tabs. Same setup as browser-tests.cjs.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.CAW_PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..'),mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'};
const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!p.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}fs.readFile(p,(err,body)=>{res.writeHead(err?404:200,{'Content-Type':mime[path.extname(p)]||'application/octet-stream'});res.end(err?'Not found':body);});});
(async()=>{let browser;try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext({acceptDownloads:true,hasTouch:true});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  const saved=()=>page.waitForFunction(()=>document.getElementById('save-status').textContent==='自動保存済み');
  const text=id=>page.locator('#output-'+id).textContent();
  const storage=()=>page.evaluate(()=>JSON.stringify(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])));
  const tabState=()=>page.evaluate(()=>['design','face'].map(id=>[document.getElementById('tab-'+id).getAttribute('aria-selected'),document.getElementById('tab-'+id).tabIndex,document.getElementById('view-'+id).hidden]));
  await page.setViewportSize({width:390,height:844});await page.goto(url);await saved();
  await page.evaluate(()=>localStorage.setItem('caw_draft_v01',JSON.stringify({schemaVersion:'0.2',appearance:{faceShape:'oval',eyeShape:['almond','narrow'],irisColor:'gray',hairColor:'red',hairLength:'long',height:'tall'},faceProfile:{name:'タブ確認の顔',triggerWord:'tab_face_x7'}})));await page.reload();await saved();

  // 初期表示は「外見設計」。ARIAのタブ構成と、id の重複がないこと。
  assert.deepEqual(await tabState(),[['true',0,false],['false',-1,true]],'Design tab is shown first');
  assert.equal(await page.locator('#view-tabs').getAttribute('role'),'tablist');assert.equal(await page.locator('#tab-face').getAttribute('aria-controls'),'view-face');assert.equal(await page.locator('#view-face').getAttribute('aria-labelledby'),'tab-face');
  assert.deepEqual(await page.evaluate(()=>{const ids=Array.from(document.querySelectorAll('[id]')).map(e=>e.id);return ids.filter((x,i)=>ids.indexOf(x)!==i);}),[],'No duplicate ids after rendering');
  for(const sel of ['#preset-groups','#advanced-settings','#accordions','#diagnostics','#outputs','#design-name'])assert(await page.locator(sel).isVisible(),'Design tab shows '+sel);
  for(const sel of ['#face-title','#face-layers','#face-outputs','[data-face-save]'])assert(await page.locator(sel).isHidden(),'Face area hidden on design tab: '+sel);
  const tabBox=await page.locator('#view-tabs').boundingBox();assert(tabBox.y<260,'Tabs are near the top of the page: '+tabBox.y);

  // タブ切り替えだけでは保存データも描画も変わらない（再初期化しない）。
  await page.locator('[data-category="face"]').click();await page.locator('#design-name').fill('タブ確認の設計');await page.locator('#design-name').blur();
  await page.evaluate(()=>{window.outputNode=document.querySelector('#outputs .output-card');window.accordionNode=document.querySelector('#accordions');});
  await saved();const before=await storage();
  await page.locator('#tab-face').click();assert.deepEqual(await tabState(),[['false',-1,true],['true',0,false]]);
  for(const sel of ['#face-title','#face-name','#face-outputs','[data-face-save]','[data-face-library]'])assert(await page.locator(sel).isVisible(),'Face tab shows '+sel);
  for(const sel of ['#accordions','#outputs','#design-name'])assert(await page.locator(sel).isHidden(),'Design area hidden on face tab: '+sel);
  assert.equal(await page.locator('#face-name').inputValue(),'タブ確認の顔');assert((await text('face-pixai')).startsWith('tab_face_x7,'));
  await page.locator('.face-workbench details').first().evaluate(el=>el.open=true);
  for(let i=0;i<3;i++){await page.locator('#tab-design').click();await page.locator('#tab-face').click();}
  assert.equal(await storage(),before,'Switching tabs does not touch saved data');assert.equal(await page.locator('#save-status').textContent(),'自動保存済み');
  assert(await page.evaluate(()=>window.outputNode.isConnected&&window.accordionNode.isConnected),'Switching tabs does not re-render');
  assert(await page.locator('.face-workbench details').first().evaluate(el=>el.open),'Open sections stay open');
  await page.locator('#tab-design').click();assert.equal(await page.locator('#design-name').inputValue(),'タブ確認の設計','Design name survives switching');assert(await page.locator('#panel-face').isVisible(),'Opened accordion stays open');

  // 両タブは同じデータを参照する：外見設計の変更が顔IDタブへ、顔IDタブの変更が外見設計へ。
  await page.locator('[data-field="faceShape"][data-option="heart"]').click();await page.locator('#tab-face').click();assert((await text('face-fixed')).includes('heart-shaped face'),'Design edits reach the face tab');
  await page.locator('[data-face-layer="eyeShape:narrow"]').selectOption('excluded');await page.locator('#tab-design').click();assert(!(await text('detailed')).includes('narrow eyes'),'Face layer edits reach the design outputs');assert((await text('detailed')).includes('almond-shaped eyes'));
  await saved();

  // 顔IDの保存→顔だけリセット→適用で、外見設計タブの選択と出力に反映される。
  await page.locator('#tab-face').click();await page.locator('[data-face-save]').click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('caw_face_library_v1')||'[]').length===1);
  await page.locator('[data-face-reset]').click();await page.waitForFunction(()=>document.getElementById('face-name').value==='');
  await page.locator('#tab-design').click();assert.equal(await page.locator('[data-field="faceShape"][data-option="heart"]').getAttribute('aria-pressed'),'false','Face reset is visible on the design tab');assert((await text('detailed')).includes('red hair'),'Hair is kept by face reset');
  await page.locator('#tab-face').click();await page.locator('[data-face-library]').click();await page.locator('[data-face-apply]').click();
  await page.locator('#tab-design').click();assert.equal(await page.locator('[data-field="faceShape"][data-option="heart"]').getAttribute('aria-pressed'),'true','Applied face is selected on the design tab');
  const detailed=await text('detailed');assert(detailed.includes('heart-shaped face')&&detailed.includes('red hair')&&!detailed.includes('narrow eyes'),detailed);

  // キーボード操作（WAI-ARIA タブ）。
  await page.locator('#tab-design').focus();await page.keyboard.press('ArrowRight');assert.deepEqual((await tabState())[1],['true',0,false]);assert(await page.evaluate(()=>document.activeElement.id==='tab-face'));
  await page.keyboard.press('ArrowRight');assert(await page.evaluate(()=>document.activeElement.id==='tab-design'),'Arrow keys wrap');await page.keyboard.press('End');assert(await page.evaluate(()=>document.activeElement.id==='tab-face'));await page.keyboard.press('Home');assert.deepEqual((await tabState())[0],['true',0,false]);

  // タブごとのスクロール位置を覚え、初めて開くタブは先頭から。タブバーは常に上部に残る。
  await saved();await page.reload();await saved();assert.deepEqual(await tabState(),[['true',0,false],['false',-1,true]],'Reload opens the design tab');
  assert.equal(await page.locator('#design-name').inputValue(),'タブ確認の設計','Data is intact after reload');
  await page.locator('#output-title').scrollIntoViewIfNeeded();const designY=await page.evaluate(()=>scrollY);assert(designY>400);
  const bar=await page.locator('#view-tabs').boundingBox();assert(bar.y>=-0.5&&bar.y<2,'Tab bar sticks to the top: '+bar.y);
  const dock=await page.locator('#selection-dock').boundingBox();assert(dock.y>=bar.y+bar.height-0.5,'Selection dock does not cover the tabs');
  await page.locator('#tab-face').click();const faceTop=await page.evaluate(()=>scrollY);assert(faceTop<designY,'New tab opens at its top');assert(Math.abs((await page.locator('.tab-note').boundingBox()).y-(bar.height+22))<40,'Face tab content starts under the tab bar');
  await page.locator('#face-outputs').scrollIntoViewIfNeeded();const faceY=await page.evaluate(()=>scrollY);
  await page.locator('#tab-design').click();assert(Math.abs(await page.evaluate(()=>scrollY)-designY)<2,'Design scroll position restored');
  await page.locator('#tab-face').click();assert(Math.abs(await page.evaluate(()=>scrollY)-faceY)<2,'Face scroll position restored');
  await page.locator('.tab-note [data-view-tab="design"]').click();assert.deepEqual((await tabState())[0],['true',0,false]);const head=await page.locator('#design-title').boundingBox();assert(head.y>=bar.height&&head.y<200,'Note link jumps to the design heading below the tab bar: '+head.y);

  // 顔IDタブからもヘッダーの保存一覧・JSON書き出し・上へ戻るが使える。
  await page.locator('#tab-face').click();await page.locator('header [data-open-library]').click();assert(await page.locator('#library-dialog').evaluate(d=>d.open));await page.locator('#library-dialog [data-close-dialog]').click();
  const wait=page.waitForEvent('download');await page.locator('header [data-export-current]').click();const json=JSON.parse(fs.readFileSync(await (await wait).path(),'utf8'));assert.equal(json.appearance.faceShape,'heart');
  await page.mouse.wheel(0,2000);await page.waitForFunction(()=>!document.getElementById('back-to-top').hidden);await page.locator('#back-to-top').click();await page.waitForFunction(()=>scrollY<5);assert.deepEqual((await tabState())[1],['true',0,false],'Back to top keeps the current tab');

  // 各画面幅：横はみ出しなし、タブは44px以上でタップで切り替わる。
  const qa=process.env.CAW_QA_DIR||path.join(root,'..','qa');fs.mkdirSync(qa,{recursive:true});
  for(const width of [320,375,390,768,1280]){await page.setViewportSize({width,height:width<700?740:900});await page.waitForTimeout(200);
    for(const id of ['design','face']){await page.locator('#tab-'+id).tap();await page.waitForTimeout(250);await page.evaluate(()=>scrollTo(0,0));assert.deepEqual((await tabState())[id==='design'?0:1],['true',0,false],'Tap switches at '+width);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow on '+id+' at '+width);
      for(const t of ['design','face']){const b=await page.locator('#tab-'+t).boundingBox();assert(b.height>=44&&b.x>=0&&b.x+b.width<=width,'Tab size at '+width);}
      assert(await page.locator('#tab-face .view-tab-label').evaluate(el=>el.scrollWidth<=el.clientWidth+1),'Tab label fits at '+width);
      await page.screenshot({path:path.join(qa,'tabs-'+id+'-'+width+'.png')});}
    await page.locator('.face-workbench details').first().evaluate(el=>el.open=true);await page.locator('#face-layers').scrollIntoViewIfNeeded();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Overflow in face layers at '+width);await page.screenshot({path:path.join(qa,'tabs-face-scrolled-'+width+'.png')});}
  assert.deepEqual(errors,[],'No browser runtime errors');console.log('PASS view tabs: default design tab, ARIA/keyboard, no re-render or storage change on switch, shared state both ways, face apply reflected, scroll memory, sticky bar, header actions, 320/375/390/768/1280 layouts; no page errors');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}})().catch(err=>{console.error(err);process.exitCode=1;});
