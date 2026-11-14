'use strict';
// Optional development check for the advanced settings (Markdown / HEX). Same setup as browser-tests.cjs.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.CAW_PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..'),mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'};
const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!p.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}fs.readFile(p,(err,body)=>{res.writeHead(err?404:200,{'Content-Type':mime[path.extname(p)]||'application/octet-stream'});res.end(err?'Not found':body);});});
(async()=>{let browser;try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext({acceptDownloads:true,hasTouch:true});await context.grantPermissions(['clipboard-read','clipboard-write'],{origin:url});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  const saved=()=>page.waitForFunction(()=>document.getElementById('save-status').textContent==='自動保存済み');
  const text=id=>page.locator('#output-'+id).textContent();
  const noOverflow=async label=>assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow: '+label);
  await page.setViewportSize({width:390,height:844});await page.goto(url);await saved();

  // 高度な設定：初期値OFF。OFFの間は新しいUIを一切出さない。
  assert.equal(await page.locator('#advanced-toggle').isChecked(),false);assert.equal(await page.locator('#advanced-state').textContent(),'OFF');
  assert(await page.locator('#advanced-options').isHidden());assert(await page.locator('#advanced-outputs').isHidden());
  await page.evaluate(()=>localStorage.setItem('caw_draft_v01',JSON.stringify({schemaVersion:'0.2',appearance:{faceShape:'oval',eyeShape:['almond'],irisColor:'blue_gray',hairColor:'silver',hairLength:'long',skinTone:'fair',silhouette:'slender'}})));await page.reload();await saved();
  const legacyDetailed=await text('detailed'),legacyShort=await text('short'),legacyBody=await text('bodyPrompt');
  for(const id of ['eyes','hairColor','skin'])await page.locator('[data-category="'+id+'"]').click();
  assert.equal(await page.locator('.hex-control').count(),0,'No HEX controls while OFF');assert.equal(await page.locator('.output-card').count(),await page.locator('#outputs .output-card,#face-outputs .output-card,#face-verification .output-card,#face-dataset .output-card').count());

  // ON：2つの下位設定が出る。独立して切り替えられる。
  await page.locator('label[for="advanced-toggle"]').click();assert.equal(await page.locator('#advanced-state').textContent(),'ON');assert(await page.locator('#advanced-options').isVisible());
  assert(await page.locator('#advanced-outputs').isHidden(),'ON with both sub-settings off shows legacy features only');assert.equal(await page.locator('.hex-control').count(),0);
  await page.locator('#advanced-markdown').check();assert(await page.locator('#advanced-outputs').isVisible());assert.deepEqual(await page.locator('[data-adv-format]').evaluateAll(els=>els.map(e=>e.dataset.advFormat)),['markdown']);assert.equal(await page.locator('.hex-control').count(),0,'Markdown only: no HEX inputs');
  let md=await text('advanced');assert(md.startsWith('## Face\n- Face shape: oval face\n## Eyes\n'),md);assert(md.includes('## Hair\n- Hair length: waist-length hair\n- Hair color: silver hair\n## Skin\n- Skin tone: fair skin'),md);assert(!md.includes('#C8'));
  await page.locator('#advanced-markdown').uncheck();await page.locator('#advanced-hex').check();assert.deepEqual(await page.locator('[data-adv-format]').evaluateAll(els=>els.map(e=>e.dataset.advFormat)),['tagsHex']);assert.equal(await page.locator('.hex-control').count(),17,'HEX controls for iris(7) hair(9) skin(1)');
  assert.equal(await text('advanced'),legacyDetailed,'Enabling HEX assigns no colors by itself');
  await page.locator('#advanced-markdown').check();assert.deepEqual(await page.locator('[data-adv-format]').evaluateAll(els=>els.map(e=>e.dataset.advFormat)),['tagsHex','markdown','markdownHex']);

  // HEX直接入力：正規化、入力途中は反映しない、不正値は保存しない。
  const hair=page.locator('[data-hex-input="hairColor"]');await hair.focus();await hair.pressSequentially('c8cc');assert.equal(await text('advanced'),legacyDetailed,'Partial input changes nothing');await hair.pressSequentially('d6');
  assert((await text('advanced')).includes('silver hair (#C8CCD6)'));assert(await hair.evaluate(el=>document.activeElement===el&&el.isConnected),'Typing keeps focus on the same input');await hair.press('Enter');assert.equal(await hair.inputValue(),'#C8CCD6');
  assert.equal(await text('detailed'),legacyDetailed,'Legacy detailed output unchanged with HEX set');assert.equal(await text('short'),legacyShort);assert.equal(await text('bodyPrompt'),legacyBody);
  const skin=page.locator('[data-hex-input="skinTone"]');await skin.fill('#zzz');await skin.blur();assert((await page.locator('#hex-msg-skinTone').textContent()).includes('#RRGGBB'));assert.equal(await skin.getAttribute('aria-invalid'),'true');assert(!(await text('advanced')).includes('zzz'));
  await saved();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('caw_draft_v01')).hexColors.skinTone),undefined,'Invalid HEX is not saved');
  await skin.fill('f4d');await skin.blur();assert.equal(await skin.inputValue(),'#FF44DD','3-digit HEX expands');await skin.fill('＃f4ded8');await skin.blur();assert.equal(await skin.inputValue(),'#F4DED8');assert((await text('advanced')).includes('fair skin (#F4DED8)'));

  // カラーピッカー：スライダー・HEX入力・SVエリアが双方向に同期する。
  await page.locator('.hex-control [data-hex-open="irisColor"]').click();assert(await page.locator('#hex-dialog').evaluate(d=>d.open));assert((await page.locator('#hex-dialog-title').textContent()).includes('瞳の基本色'));
  assert.equal(await page.locator('#hex-dialog-input').inputValue(),'#667F96','Starts from the dictionary swatch of the selected name');assert(await page.locator('#hex-unset').isHidden());
  await page.locator('#hex-dialog-input').fill('#748DA8');assert.equal(await page.locator('#hex-h').inputValue(),'211');assert.equal(await page.locator('#hex-s').inputValue(),'31');assert.equal(await page.locator('#hex-v').inputValue(),'66');
  await page.locator('#hex-dialog-input').fill('#748D');assert.equal(await page.locator('#hex-h').inputValue(),'211','Partial typing does not move the picker');await page.locator('#hex-dialog-input').fill('#748DA8');
  await page.locator('#hex-h').fill('0');await page.locator('#hex-s').fill('100');await page.locator('#hex-v').fill('100');assert.equal(await page.locator('#hex-dialog-input').inputValue(),'#FF0000','Sliders update the HEX field');
  const box=await page.locator('#hex-sv').boundingBox();await page.mouse.click(box.x+4,box.y+4);assert.equal(await page.locator('#hex-dialog-input').inputValue(),'#FFFFFF','SV area updates the HEX field');assert.equal(await page.locator('#hex-h').inputValue(),'0','Hue is kept on achromatic colors');
  await page.locator('#hex-sv').press('ArrowRight');assert.notEqual(await page.locator('#hex-dialog-input').inputValue(),'#FFFFFF','SV area is keyboard operable');
  await noOverflow('picker 390');const dlg=await page.locator('#hex-dialog').boundingBox();assert(dlg.x>=0&&dlg.x+dlg.width<=390,'Picker stays inside the viewport');
  await page.locator('#hex-dialog-input').fill('#748DA8');await page.locator('#hex-apply').click();assert(!(await page.locator('#hex-dialog').evaluate(d=>d.open)));assert((await text('advanced')).includes('blue-gray eyes (#748DA8)'));
  assert(await page.evaluate(()=>document.activeElement&&document.activeElement.dataset.hexOpen==='irisColor'),'Focus returns to the opener');
  await page.locator('[data-color-details="hairColor"]').evaluate(el=>el.open=true);await page.locator('.hex-control [data-hex-open="hairTipColor"]').click();await page.locator('[data-hex-cancel]').last().click();assert.equal(await page.locator('[data-hex-input="hairTipColor"]').inputValue(),'','Cancel sets nothing');

  // 出力形式の切り替えとコピー（改行と#を保持）。
  await page.locator('[data-adv-format="markdownHex"]').click();md=await text('advanced');assert(md.includes('- Hair color: silver hair (#C8CCD6)')&&md.includes('- Iris color: blue-gray eyes (#748DA8)')&&md.includes('- Skin tone: fair skin (#F4DED8)'),md);
  await page.locator('[data-copy="advanced"]').click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),md,'Copy keeps newlines and # characters');assert(md.includes('\n## Hair\n'));
  await page.locator('[data-adv-scope="short"]').click();assert(!(await text('advanced')).includes('Additional'));await page.locator('[data-adv-format="markdown"]').click();assert(!(await text('advanced')).includes('(#'));
  await page.locator('[data-adv-format="tagsHex"]').click();await page.locator('[data-adv-scope="detailed"]').click();

  // 色名との不一致は警告のみ。優先順位：単色では毛先を出さず、設定は保持する。
  await page.locator('[data-hex-input="hairColor"]').fill('#FF0000');await page.locator('[data-hex-input="hairColor"]').blur();assert((await page.locator('#hex-msg-hairColor').textContent()).includes('色味が離れています'));assert((await text('advanced')).includes('silver hair (#FF0000)'),'Mismatch never rewrites the value');
  await page.locator('[data-hex-input="hairColor"]').fill('#C8CCD6');await page.locator('[data-hex-input="hairColor"]').blur();assert.equal(await page.locator('#hex-msg-hairColor').textContent(),'');
  await page.locator('[data-field="hairMulticolor"][data-option="gradient"]').click();await page.locator('#detail-hairRootColor').selectOption('blue');await page.locator('#detail-hairTipColor').selectOption('pink');
  await page.locator('[data-hex-input="hairTipColor"]').fill('#FF66AA');await page.locator('[data-hex-input="hairTipColor"]').blur();let out=await text('advanced');assert(out.includes('blue hair roots')&&out.includes('pink hair tips (#FF66AA)')&&!out.includes('silver hair'),out);
  await page.locator('[data-field="hairMulticolor"][data-option="gradient"]').click();await page.locator('[data-field="hairMulticolor"][data-option="none"]').click();out=await text('advanced');assert(out.includes('silver hair (#C8CCD6)')&&!out.includes('FF66AA'),out);
  assert.equal(await page.locator('[data-hex-input="hairTipColor"]').inputValue(),'#FF66AA','Tip HEX kept while single-color');assert((await page.locator('#hex-msg-hairTipColor').textContent()).includes('出力されません'));assert((await page.locator('#hex-overview').textContent()).includes('保持のみ'));
  await page.locator('[data-field="hairMulticolor"][data-option="none"]').click();await page.locator('[data-field="hairMulticolor"][data-option="gradient"]').click();assert((await text('advanced')).includes('pink hair tips (#FF66AA)'),'Restored when gradient returns');

  // 顔ID：瞳のHEXだけを保存・復元。髪と肌のHEXは残る。
  await page.locator('#face-name').fill('HEX確認の顔');await page.locator('[data-face-save]').click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('caw_face_library_v1')||'[]').length===1);
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('caw_face_library_v1'))[0].hexColors),{irisColor:'#748DA8'});
  await page.locator('[data-face-reset]').click();await page.waitForFunction(()=>document.getElementById('face-name').value==='');assert.equal(await page.locator('[data-hex-input="irisColor"]').inputValue(),'','Face reset clears eye HEX');assert.equal(await page.locator('[data-hex-input="hairColor"]').inputValue(),'#C8CCD6');assert.equal(await page.locator('[data-hex-input="skinTone"]').inputValue(),'#F4DED8');
  await page.locator('[data-face-library]').click();await page.locator('[data-face-diff]').click();assert((await page.locator('#face-comparison').textContent()).includes('瞳のHEX：瞳の基本色 未設定 → #748DA8'));
  await page.locator('[data-face-apply]').click();assert.equal(await page.locator('[data-hex-input="irisColor"]').inputValue(),'#748DA8','Face apply restores eye HEX');assert.equal(await page.locator('[data-hex-input="hairColor"]').inputValue(),'#C8CCD6');

  // 再読込：UI設定とHEXの両方を復元。OFFにしてもHEXは消えない。
  await saved();await page.reload();await saved();assert(await page.locator('#advanced-toggle').isChecked());assert(await page.locator('#advanced-markdown').isChecked());assert(await page.locator('#advanced-hex').isChecked());assert((await text('advanced')).includes('blue-gray eyes (#748DA8)'));
  await page.locator('label[for="advanced-toggle"]').scrollIntoViewIfNeeded();const before=await page.evaluate(()=>scrollY);await page.locator('label[for="advanced-toggle"]').click();assert(await page.locator('#advanced-options').isHidden());assert(await page.locator('#advanced-outputs').isHidden());assert.equal(await page.locator('.hex-control').count(),0);assert(Math.abs(await page.evaluate(()=>scrollY)-before)<4,'Toggling keeps the scroll position');
  assert.equal(await page.locator('#advanced-toggle').evaluate(el=>document.activeElement===el),true,'Toggle keeps focus');
  await saved();assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('caw_draft_v01')).hexColors),{irisColor:'#748DA8',hairColor:'#C8CCD6',hairTipColor:'#FF66AA',skinTone:'#F4DED8'},'HEX data kept while OFF');
  await page.reload();await saved();assert.equal(await page.locator('#advanced-toggle').isChecked(),false,'OFF state restored');await page.locator('label[for="advanced-toggle"]').click();assert(await page.locator('#advanced-hex').isChecked(),'Sub-settings restored after turning ON again');assert.equal(await page.locator('[data-hex-input="hairColor"]').inputValue(),'#C8CCD6');

  // JSON書き出し→全リセット→読込でHEXを復元。名前付き保存と複製でも保持。
  const wait=page.waitForEvent('download');await page.locator('[data-export-current]').first().click();const json=JSON.parse(fs.readFileSync(await (await wait).path(),'utf8'));assert.equal(json.schemaVersion,'0.3');assert.equal(json.hexColors.hairColor,'#C8CCD6');
  await page.locator('[data-save-named]').click();await page.locator('[data-open-library]').first().click();await page.locator('[data-duplicate]').first().click();await page.locator('[data-close-dialog]').click();assert(await page.evaluate(()=>JSON.parse(localStorage.getItem('caw_library_v01')).length===2&&JSON.parse(localStorage.getItem('caw_library_v01')).every(x=>x.hexColors.skinTone==='#F4DED8')),'Named save and duplicate keep HEX');
  await page.locator('[data-reset]').click();await saved();assert.equal(await page.locator('.hex-control').count(),17);assert.equal(await page.locator('[data-hex-input="hairColor"]').inputValue(),'');
  await page.locator('#json-import').setInputFiles({name:'hex.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(json))});await page.waitForFunction(()=>document.querySelector('[data-hex-input="hairColor"]').value==='#C8CCD6');
  await page.locator('#json-import').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({appearance:{hairColor:'black'},hexColors:{hairColor:'not-a-color',skinTone:'#abc',unknownField:'#123456'}}))});await page.waitForFunction(()=>document.querySelector('[data-hex-input="skinTone"]').value==='#AABBCC');assert.equal(await page.locator('[data-hex-input="hairColor"]').inputValue(),'','Invalid HEX in JSON is dropped safely');assert((await text('detailed')).includes('black hair'));
  await page.locator('#json-import').setInputFiles({name:'hex.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(json))});await page.waitForFunction(()=>document.querySelector('[data-hex-input="hairColor"]').value==='#C8CCD6');

  // レイアウト：各幅で横はみ出しなし、タップ領域44px以上、ピッカーが画面内。
  const qa=process.env.CAW_QA_DIR||path.join(root,'..','qa');fs.mkdirSync(qa,{recursive:true});
  for(const width of [320,375,390,768,1280]){await page.setViewportSize({width,height:width<700?700:900});await page.waitForTimeout(250);
    await page.locator('#advanced-settings').scrollIntoViewIfNeeded();await noOverflow('settings '+width);await page.screenshot({path:path.join(qa,'advanced-settings-'+width+'.png')});
    await page.locator('[data-color-details="hairColor"]').evaluate(el=>el.open=true);await page.locator('[data-hex-field="hairColor"]').scrollIntoViewIfNeeded();await noOverflow('hair '+width);await page.screenshot({path:path.join(qa,'advanced-hair-'+width+'.png')});
    const small=await page.evaluate(()=>Array.from(document.querySelectorAll('.hex-open,.hex-clear:not([hidden]),.hex-field input,.segmented button,.hex-chip,.check-row,.switch-row,#advanced-outputs .copy-button')).filter(el=>el.offsetParent).filter(el=>el.getBoundingClientRect().height<43.5).map(el=>el.className+':'+el.getBoundingClientRect().height));assert.deepEqual(small,[],'Tap targets at '+width);
    const outside=await page.evaluate(()=>Array.from(document.querySelectorAll('.hex-control,.hex-control *,.advanced-settings *,#advanced-outputs *')).filter(el=>el.offsetParent).filter(el=>{const r=el.getBoundingClientRect();return r.right>innerWidth+0.5||r.left<-0.5;}).map(el=>el.className));assert.deepEqual(outside,[],'Elements outside viewport at '+width);
    await page.locator('#advanced-outputs').scrollIntoViewIfNeeded();await noOverflow('outputs '+width);await page.screenshot({path:path.join(qa,'advanced-output-'+width+'.png')});
    await page.locator('.hex-control [data-hex-open="hairColor"]').click();await page.waitForTimeout(150);await noOverflow('picker '+width);const r=await page.locator('#hex-dialog').boundingBox(),vp=page.viewportSize();assert(r.x>=0&&r.x+r.width<=width+0.5&&r.y>=0&&r.y+r.height<=vp.height+0.5,'Picker inside viewport at '+width);
    assert(await page.evaluate(()=>Array.from(document.querySelectorAll('#hex-dialog button,#hex-dialog-input,.hex-native')).filter(el=>el.offsetParent).every(el=>el.getBoundingClientRect().height>=43.5)),'Picker tap targets at '+width);
    await page.screenshot({path:path.join(qa,'advanced-picker-'+width+'.png')});await page.locator('#hex-dialog [data-hex-cancel]').first().click();}
  // タッチ操作でSVエリアをドラッグできる。
  await page.setViewportSize({width:390,height:844});await page.locator('.hex-control [data-hex-open="hairColor"]').click();const sv=await page.locator('#hex-sv').boundingBox();await page.touchscreen.tap(sv.x+sv.width-15,sv.y+15);assert.notEqual(await page.locator('#hex-dialog-input').inputValue(),'#C8CCD6','Touch moves the picker');await page.locator('#hex-dialog [data-hex-cancel]').first().click();
  await page.locator('[data-hex-clear-all]').click();await saved();assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('caw_draft_v01')).hexColors),{});assert((await text('detailed')).length>0);
  assert.deepEqual(errors,[],'No browser runtime errors');console.log('PASS advanced browser: default OFF, independent toggles, HEX input and picker sync, tag/Markdown formats, copy, priority rules, face ID, reload, JSON round trip, 320/375/390/768/1280 layouts; no page errors');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}})().catch(err=>{console.error(err);process.exitCode=1;});
