'use strict';
// Optional development check for the hairstyle reference page (hair-reference.html). Served under the GitHub Pages subpath.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.CAW_PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..'),BASE='/character-appearance-prompt-workshop/';
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.ico':'image/x-icon','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{const u=decodeURIComponent(req.url.split('?')[0]);if(!u.startsWith(BASE)){res.writeHead(404);res.end();return;}const p=path.resolve(root,'.'+(u===BASE?'/index.html':'/'+u.slice(BASE.length)));if(!p.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}fs.readFile(p,(err,body)=>{res.writeHead(err?404:200,{'Content-Type':mime[path.extname(p)]||'application/octet-stream'});res.end(err?'Not found':body);});});
// 表示順は外見設計の選択ボタンと同じ辞書の順。
const ORDER=['crop','pixie','mushroom','layered_short','bob','lob','wolf','shag','straight','undercut','ponytail','low_ponytail','high_ponytail','side_ponytail','twin_tails','low_twin_tails','twin_braids','double_buns','half_up','half_up_bun','side_braid','fishtail','french_braid','dutch_braid','crown_braid','braided_bun','messy_bun','chignon','two_block','hime','jellyfish','butterfly','asym_bob','a_line_bob','inverted_bob','french_bob'];
const NAMES=['クロップ','ピクシーカット','マッシュ','レイヤーショート','ボブ','ロングボブ','ウルフカット','シャギーカット','ストレートロング','アンダーカット','ポニーテール','低いポニーテール','高いポニーテール','サイドポニーテール','ツインテール','低いツインテール','ツイン三つ編み','ツインお団子','ハーフアップ','ハーフアップお団子','サイド三つ編み','フィッシュボーン','フレンチブレイド','ダッチブレイド','編み込みの冠','編み込みお団子','無造作なお団子','低いシニヨン','ツーブロック','姫カット','クラゲカット','バタフライカット','アシンメトリーボブ','前下がりボブ','後ろ短めのボブ','フレンチボブ'];
const DESCS=['短く整えた髪','短い毛束と軽い動き','丸いシルエット','短髪に段差を入れた形','あご付近の長さ','肩に近い長めのボブ','上は短め・襟足は長め','毛先を軽く散らした形','まっすぐな長髪','側面・後頭部を短く刈り、上の髪を残す','後頭部の中ほどで一つに結ぶ','襟足付近の低い位置で一つに結ぶ','頭の高い位置で一つに結ぶ','左右どちらかに寄せて一つに結ぶ','左右の高めの位置で二つに結ぶ','左右の低い位置で二つに結ぶ','左右二本の三つ編みにする','左右二つのお団子にまとめる','上半分だけを後ろで結び、下半分は下ろす','上半分だけをお団子にし、残りは下ろす','髪を片側へ寄せて三つ編みにする','細かな毛束を交差させる魚の骨状の編み目','髪を内側へ重ねながら頭皮に沿って編む','髪を下へくぐらせ編み目を立体的に浮かせる','頭の周囲を冠状に編み込む','編んだ毛束をお団子状にまとめる','毛束をラフにまとめ、後れ毛を残す','襟足付近で髪をすっきりまとめる','上の髪と短い側面を段差で分ける','長髪と直線的な前髪・顔横の短い毛束','丸い上段と長く伸びた下段の二層','顔周りに大きな段を入れた長髪','左右の長さが異なるボブ','後ろから前へ向かって長くなるボブ','後頭部に段差と丸みをつけたボブ','顎あたりの短めのボブと前髪'];
(async()=>{let browser;try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const app='http://127.0.0.1:'+server.address().port+BASE,ref=app+'hair-reference.html';
  browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext({hasTouch:true});
  const page=await context.newPage(),errors=[],bad=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());page.on('response',r=>{if(r.status()>=400)bad.push(r.status()+' '+r.url());});
  const qa=process.env.CAW_QA_DIR||path.join(root,'..','qa');fs.mkdirSync(qa,{recursive:true});
  const saved=()=>page.waitForFunction(()=>document.getElementById('save-status').textContent==='自動保存済み');
  const draft=()=>page.evaluate(()=>localStorage.getItem('caw_draft_v01'));
  const noOverflow=async l=>assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow: '+l);
  await page.setViewportSize({width:390,height:844});await page.goto(app);await saved();

  // 外見設計側：「髪型・カットの基本形」の見出しの下にだけ、補助リンクが出る。高度な設定と無関係。
  await page.locator('[data-category="hairStyle"]').click();
  const link=page.locator('[data-reference-link="baseCut"]');assert.equal(await link.count(),1);assert.equal(await page.locator('[data-reference-link]').count(),1,'Only on baseCut');
  assert.equal(await link.textContent(),'▦髪型の参考画像を見る');assert.equal(await link.getAttribute('href'),'hair-reference.html');
  assert(await link.evaluate(a=>a.closest('.field').querySelector('h3').textContent==='髪型・カットの基本形'),'Placed in the baseCut field');
  assert(await link.evaluate(a=>a.previousElementSibling.classList.contains('field-title')&&a.nextElementSibling.classList.contains('chip-grid')),'Between heading and chips');
  const lb=await link.boundingBox();assert(lb.height>=44,'Tap size');assert.equal(await page.locator('[data-field="baseCut"]').count(),47,'Selection buttons unchanged');
  await page.locator('label[for="advanced-toggle"]').click();assert.equal(await link.isVisible(),true,'Visible with advanced ON');await page.locator('label[for="advanced-toggle"]').click();assert.equal(await link.isVisible(),true,'Visible with advanced OFF');

  // 外見データを入れておく（髪型・顔・HEXなど）。
  await page.locator('[data-field="baseCut"][data-option="wolf"]').click();await page.locator('[data-field="hairLength"][data-option="medium"]').click();
  await page.locator('[data-category="face"]').click();await page.locator('[data-field="faceShape"][data-option="oval"]').click();await page.locator('#design-name').fill('参考画像確認');await page.locator('#design-name').blur();await saved();
  const before=await draft(),detailed=await page.locator('#output-detailed').textContent();
  await link.scrollIntoViewIfNeeded();await page.evaluate(()=>scrollBy(0,-180));const anchorTop=Math.round((await link.boundingBox()).y);await page.waitForTimeout(100);

  // 参考一覧へ。
  await link.click();await page.waitForURL(ref);await page.waitForFunction(()=>document.querySelectorAll('.reference-card').length===36);
  assert.equal(await page.locator('#reference-title').textContent(),'髪型参考一覧');assert((await page.title()).startsWith('髪型参考一覧'));
  assert.equal(await page.locator('#reference-count').textContent(),'現在36種類の参考画像を掲載しています（「髪型・カットの基本形」全47種類のうち）。今後追加していく予定です。');
  assert((await page.locator('.reference-note').textContent()).includes('模式的なイラスト'));
  assert.deepEqual(await page.locator('.reference-card').evaluateAll(els=>els.map(e=>e.dataset.optionId)),ORDER,'Display order');
  assert.deepEqual(await page.locator('.reference-name').allTextContents(),NAMES,'Names');
  assert.deepEqual(await page.locator('.reference-desc').allTextContents(),DESCS,'Descriptions');
  assert.deepEqual(await page.locator('.reference-card img').evaluateAll(els=>els.map(i=>[i.dataset.optionId,new URL(i.src).pathname.split('/').pop(),i.alt,i.loading])),ORDER.map((id,k)=>[id,id+'.webp',NAMES[k]+'の参考イラスト','lazy']),'Image ↔ name mapping, lazy loading');
  assert.equal(await page.locator('img').count(),36,'Only the 36 prepared images are shown');
  // 画像準備中の38種類は名前だけ（画像なし）。
  const pending=page.locator('.reference-pending');assert.equal(await pending.locator('summary').textContent(),'画像準備中の髪型（11種類）');assert.equal(await pending.evaluate(d=>d.open),false,'Collapsed by default');
  const restIds=await pending.locator('li').evaluateAll(els=>els.map(e=>e.dataset.optionId));assert.equal(restIds.length,11);assert(restIds.every(id=>!ORDER.includes(id)));assert.equal(await pending.locator('img').count(),0);
  // 9枚すべて読み込まれ、正方形・同じ大きさで並ぶ（遅延読み込みなので順に表示させる）。
  for(const id of ORDER){const c=page.locator('.reference-card[data-option-id="'+id+'"] img');await c.scrollIntoViewIfNeeded();await c.evaluate(i=>i.complete&&i.naturalWidth?0:new Promise((ok,ng)=>{i.onload=ok;i.onerror=()=>ng(new Error('load '+i.src));}));assert.deepEqual(await c.evaluate(i=>[i.naturalWidth,i.naturalHeight]),[418,418],'Loaded: '+id);}
  const qaW={};
  for(const width of [320,375,390,768,1280]){await page.setViewportSize({width,height:width<700?740:900});await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(150);await noOverflow('reference '+width);
    const boxes=await page.locator('.reference-image').evaluateAll(els=>els.map(e=>{const r=e.getBoundingClientRect();return [Math.round(r.width),Math.round(r.height),Math.round(r.left)];}));
    assert(boxes.every(b=>b[0]===boxes[0][0]&&Math.abs(b[0]-b[1])<=1),'Square, same size at '+width+': '+JSON.stringify(boxes.slice(0,3)));
    const cols=new Set(boxes.map(b=>b[2])).size;assert.equal(cols,width<600?2:width<960?3:4,'Columns at '+width);qaW[width]=cols;
    assert(await page.locator('.reference-image img').evaluateAll(els=>els.every(i=>getComputedStyle(i).objectFit==='contain')),'Aspect ratio kept (no crop)');
    const small=await page.evaluate(()=>Array.from(document.querySelectorAll('.reference-name')).filter(e=>parseFloat(getComputedStyle(e).fontSize)<13||e.scrollWidth>e.clientWidth+1).map(e=>e.textContent));assert.deepEqual(small,[],'Names readable at '+width);
    const back=await page.locator('.reference-bar .reference-back').boundingBox();assert(back.height>=44&&back.x+back.width<=width);
    if(width<=390||width===1280){await page.screenshot({path:path.join(qa,'hair-reference-'+width+'.png')});await page.screenshot({path:path.join(qa,'hair-reference-'+width+'-full.png'),fullPage:true});}}
  await page.setViewportSize({width:390,height:844});
  // 一覧の上部の「戻る」は、スクロール中も上に残る。
  await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));await page.waitForTimeout(100);const bar=await page.locator('.reference-bar').boundingBox();assert(bar.y>=-0.5&&bar.y<2,'Back bar stays on top');
  assert.equal(await draft(),before,'Viewing the list does not change saved data');

  // 「外見設計に戻る」：外見データ・選択中の髪型・開いていたアコーディオン・位置を保つ。
  await page.locator('.reference-bar [data-reference-back]').click();await page.waitForURL(app);await saved();
  async function checkBack(label){
    assert.equal(await draft(),before,label+': saved data unchanged');assert.equal(await page.locator('#output-detailed').textContent(),detailed,label+': outputs unchanged');
    assert.equal(await page.locator('[data-field="baseCut"][data-option="wolf"]').getAttribute('aria-pressed'),'true',label+': selected hairstyle kept');assert.equal(await page.locator('#design-name').inputValue(),'参考画像確認');
    for(const c of ['hairStyle','face'])assert.equal(await page.locator('[data-category="'+c+'"]').getAttribute('aria-expanded'),'true',label+': accordion '+c+' still open');
    const top=(await page.locator('[data-reference-link="baseCut"]').boundingBox()).y;assert(Math.abs(top-anchorTop)<=40,label+': position restored ('+top+' vs '+anchorTop+')');
    assert.equal(await page.evaluate(()=>sessionStorage.getItem('caw_reference_return_v1')),null,label+': return marker cleared');
  }
  await checkBack('back link');
  // ブラウザの「戻る」（iPhone Safari のスワイプ・戻るボタン）。
  await page.locator('[data-reference-link="baseCut"]').click();await page.waitForURL(ref);await page.waitForFunction(()=>document.querySelectorAll('.reference-card').length===36);await page.goBack();await page.waitForURL(app);await saved();await checkBack('browser back');
  // 戻るキャッシュが使われず、読み込み直しになった場合（Safari が戻るキャッシュを捨てた時など）。
  await page.locator('[data-reference-link="baseCut"]').click();await page.waitForURL(ref);await page.goto(app);await saved();await checkBack('reload on return');
  // 普通に開き直した時は位置を復元しない（印が残らない）。
  await page.evaluate(()=>scrollTo(0,0));await page.reload();await saved();assert(await page.evaluate(()=>scrollY)<50,'Normal reload does not jump');

  // 参考一覧を直接開いた場合も「外見設計に戻る」で外見設計へ。データは初期化しない。
  const direct=await context.newPage();direct.on('pageerror',e=>errors.push(e.message));await direct.setViewportSize({width:375,height:700});await direct.goto(ref);await direct.waitForFunction(()=>document.querySelectorAll('.reference-card').length===36);
  await direct.locator('.reference-bottom [data-reference-back]').click();await direct.waitForURL(app);await direct.waitForFunction(()=>document.getElementById('save-status').textContent==='自動保存済み');
  assert.equal(await direct.evaluate(()=>localStorage.getItem('caw_draft_v01')),before,'Direct visit then back keeps saved data');assert.equal(await direct.locator('#design-name').inputValue(),'参考画像確認');await direct.close();

  // 画像が読み込めない場合の代替表示／manifest が読めない場合の案内。
  const broken=await context.newPage();await broken.route('**/images/wolf.webp',r=>r.fulfill({status:404,body:''}));await broken.setViewportSize({width:320,height:700});await broken.goto(ref);await broken.waitForFunction(()=>document.querySelectorAll('.reference-card').length===36);
  const w=broken.locator('.reference-card[data-option-id="wolf"]');await w.scrollIntoViewIfNeeded();await broken.waitForFunction(()=>document.querySelector('.reference-card[data-option-id="wolf"]').dataset.failed==='true');
  assert.equal(await w.locator('.reference-fallback').textContent(),'画像を読み込めませんでした');assert.equal(await w.locator('.reference-name').textContent(),'ウルフカット','Name still shown');assert(await broken.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const fb=await w.locator('.reference-image').boundingBox(),ob=await broken.locator('.reference-card[data-option-id="shag"] .reference-image').boundingBox();assert(Math.abs(fb.width-ob.width)<=1&&Math.abs(fb.height-ob.height)<=1,'Fallback keeps the square');await broken.close();
  const nomf=await context.newPage();await nomf.route('**/manifest.json',r=>r.fulfill({status:500,body:''}));await nomf.goto(ref);await nomf.waitForFunction(()=>!document.getElementById('reference-error').hidden);
  assert.equal(await nomf.locator('#reference-count').textContent(),'参考画像の一覧を読み込めませんでした。');assert.equal(await nomf.locator('img').count(),0);await nomf.close();

  assert.deepEqual(bad.filter(u=>!/wolf\.webp|manifest\.json/.test(u)),[],'No 404 in the normal flow');assert.deepEqual(errors,[],'No page errors');
  console.log('PASS hair reference: link under baseCut only (advanced ON/OFF), 36 images load in order with correct names, 11 pending names without images, square tiles 2/3/4 columns, 320/375/390/768/1280 no overflow, back link / browser back / reload-on-return keep data, hairstyle, accordions and position, fallbacks for missing image and manifest; no page errors');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}})().catch(err=>{console.error(err);process.exitCode=1;});
