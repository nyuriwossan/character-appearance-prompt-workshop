'use strict';
// Optional development check for auto-save on page hide (visibilitychange / pagehide). Same setup as browser-tests.cjs.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.CAW_PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..'),mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'};
const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!p.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}fs.readFile(p,(err,body)=>{res.writeHead(err?404:200,{'Content-Type':mime[path.extname(p)]||'application/octet-stream'});res.end(err?'Not found':body);});});
const KEY='caw_draft_v01';
// テスト用：localStorage への書き込み回数を数え、必要なら下書きの保存だけ失敗させる。
const SPY=`(()=>{window.__writes=0;window.__failDraft=false;const orig=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='${KEY}'){if(window.__failDraft)throw new Error('QuotaExceededError');window.__writes++;}return orig.call(this,k,v);};})()`;
// iPhone Safari でアプリを切り替えた時の状態変化を再現する。
const HIDE=`(()=>{Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true});Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));})()`;
const SHOW=`(()=>{delete document.visibilityState;delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));})()`;
(async()=>{let browser;try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext({hasTouch:true});
  await context.addInitScript(SPY);
  let page=await context.newPage();const errors=[];const watch=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());};watch(page);
  const saved=()=>page.waitForFunction(()=>document.getElementById('save-status').textContent==='自動保存済み');
  const draft=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'null'),KEY);
  await page.setViewportSize({width:390,height:844});await page.goto(url);await saved();
  // 旧形式の下書きから開始（互換性の確認を兼ねる）。
  await page.evaluate(k=>localStorage.setItem(k,JSON.stringify({schemaVersion:'0.2',appearance:{faceShape:'oval',hairColor:'black'},faceProfile:{name:'保存確認の顔'}})),KEY);await page.reload();await saved();

  // 1. 通常の180ms遅延保存は維持：変更直後はまだ書かず、少し後にまとめて1回だけ書く。
  let r=await page.evaluate(k=>{const before=window.__writes;document.querySelector('[data-field="faceShape"][data-option="heart"]').click();document.querySelector('[data-field="hairColor"][data-option="silver"]').click();return {sync:window.__writes-before,status:document.getElementById('save-status').textContent,stored:JSON.parse(localStorage.getItem(k)).appearance.faceShape};},KEY);
  assert.deepEqual(r,{sync:0,status:'保存中…',stored:'oval'},'Changes are not written synchronously');
  const w0=await page.evaluate(()=>window.__writes);await saved();assert.equal(await page.evaluate(()=>window.__writes)-w0,1,'Two quick changes are written once after the delay');assert.equal((await draft()).appearance.hairColor,'silver');

  // 2. visibilitychange（ホーム画面・アプリ切り替え）で未保存分を即時保存。
  r=await page.evaluate(([k,hide])=>{document.querySelector('[data-field="hairColor"][data-option="red"]').click();const before=JSON.parse(localStorage.getItem(k)).appearance.hairColor;(0,eval)(hide);return {before,after:JSON.parse(localStorage.getItem(k)).appearance.hairColor,status:document.getElementById('save-status').textContent};},[KEY,HIDE]);
  assert.deepEqual(r,{before:'silver',after:'red',status:'自動保存済み'},'Hidden page saves immediately');
  let w=await page.evaluate(()=>window.__writes);await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>window.__writes),w,'The pending timer is cancelled after an immediate save');
  await page.evaluate(SHOW);

  // 3. 変更がなければ保存しない：アプリ切り替え・タブ切り替えだけでは書き込まない。
  w=await page.evaluate(()=>window.__writes);
  await page.evaluate(HIDE);await page.evaluate(SHOW);
  for(let i=0;i<3;i++){await page.locator('#tab-face').click();await page.evaluate(HIDE);await page.evaluate(SHOW);await page.locator('#tab-design').click();}
  await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>window.__writes),w,'No write without changes (hide/show and tab switches)');assert.equal(await page.locator('#save-status').textContent(),'自動保存済み');

  // 4. 変更直後に再読込（pagehide）しても失われない。
  await page.locator('[data-category="face"]').click();await page.locator('[data-field="faceShape"][data-option="square"]').click();await page.reload();await saved();
  assert.equal((await draft()).appearance.faceShape,'square','Reload right after a change keeps it');assert.equal(await page.locator('[data-field="faceShape"][data-option="square"]').getAttribute('aria-pressed'),'true');
  // 顔ID・LoRAタブでの入力（顔ID名）も同じ。
  await page.locator('#tab-face').click();await page.locator('#face-name').fill('すぐ閉じる顔');await page.reload();await saved();assert.equal((await draft()).faceProfile.name,'すぐ閉じる顔','Face tab input survives an immediate reload');

  // 5. 入力中（未確定）の設計名・自由入力タグも、隠れる・閉じる時に取り込む。描き直さないのでフォーカスは残る。
  await page.locator('#design-name').fill('入力途中の名前');assert.equal((await draft()).name==='入力途中の名前',false,'Not committed while typing');
  await page.evaluate(HIDE);assert.equal((await draft()).name,'入力途中の名前','Focused design name is saved on hide');assert(await page.evaluate(()=>document.activeElement.id==='design-name'),'Focus is kept');assert.equal(await page.locator('#design-name').inputValue(),'入力途中の名前');await page.evaluate(SHOW);
  await page.locator('[data-category="hairStyle"]').click();const hairTags=page.locator('[data-custom="hair"]');await hairTags.fill('ahoge, sidelocks');await page.reload();await saved();
  assert.deepEqual((await draft()).customTags.hair,['ahoge','sidelocks'],'Focused free tags are saved on reload');await page.locator('[data-category="hairStyle"]').click();assert.equal(await page.locator('[data-custom="hair"]').inputValue(),'ahoge, sidelocks');
  assert((await page.locator('#output-detailed').textContent()).includes('ahoge'),'Saved free tags appear in the output after reload');

  // 6. 変更直後にページを閉じても失われない（新しいページで確認）。
  await page.locator('[data-category="hairColor"]').click();await page.locator('[data-field="hairColor"][data-option="blue"]').click();await page.close({runBeforeUnload:true});
  page=await context.newPage();watch(page);await page.setViewportSize({width:390,height:844});await page.goto(url);await saved();assert.equal((await draft()).appearance.hairColor,'blue','Closing right after a change keeps it');

  // 7. 保存失敗時のエラー処理は従来どおり。失敗した分は次の機会に保存し直す。
  r=await page.evaluate(([k,hide])=>{window.__failDraft=true;document.querySelector('[data-field="hairColor"][data-option="black"]').click();(0,eval)(hide);return {status:document.getElementById('save-status').textContent,toast:document.getElementById('toast').textContent,stored:JSON.parse(localStorage.getItem(k)).appearance.hairColor};},[KEY,HIDE]);
  assert.deepEqual(r,{status:'保存できません',toast:'保存できません。JSONを書き出して保管してください。',stored:'blue'},'Save failure is reported and nothing is half-written');
  await page.evaluate(SHOW);await page.evaluate(()=>{window.__failDraft=false;});await page.evaluate(HIDE);assert.equal((await draft()).appearance.hairColor,'black','Unsaved data is retried on the next hide');assert.equal(await page.locator('#save-status').textContent(),'自動保存済み');await page.evaluate(SHOW);
  // 遅延保存側の失敗も従来どおり。
  await page.evaluate(()=>{window.__failDraft=true;document.querySelector('[data-field="hairColor"][data-option="silver"]').click();});await page.waitForFunction(()=>document.getElementById('save-status').textContent==='保存できません');await page.evaluate(()=>{window.__failDraft=false;});await page.reload();await saved();assert.equal((await draft()).appearance.hairColor,'silver','Reload after a failed timer save retries on pagehide');

  // 8. 保存データの形式は従来どおり（schema 0.3、既存キー）。読込済みの旧データの内容も保持。
  const d=await draft();assert.equal(d.schemaVersion,'0.3');assert.equal(d.faceProfile.name,'すぐ閉じる顔');assert.deepEqual(d.hexColors,{});
  assert(await page.evaluate(()=>Object.keys(localStorage).every(k=>['caw_draft_v01','caw_library_v01','caw_face_library_v1','caw_ui_settings_v1'].includes(k))),'No new storage keys');

  assert.deepEqual(errors,[],'No browser runtime errors');console.log('PASS auto-save: 180ms debounce kept, immediate save on visibilitychange/pagehide, reload/close right after a change, focused name and free tags, no write without changes or on tab switch, failure handling and retry, storage format unchanged; no page errors');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}})().catch(err=>{console.error(err);process.exitCode=1;});
