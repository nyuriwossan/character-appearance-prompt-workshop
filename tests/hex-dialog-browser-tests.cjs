'use strict';
// Optional development check for the HEX color picker dialog layout (header / scrollable body / always-visible actions).
// Same setup as browser-tests.cjs. Chrome emulation cannot reproduce iPhone Safari's toolbars or keyboard exactly:
// the keyboard is simulated by shrinking a stand-in visualViewport.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.CAW_PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..'),mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'};
const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));if(!p.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}fs.readFile(p,(err,body)=>{res.writeHead(err?404:200,{'Content-Type':mime[path.extname(p)]||'application/octet-stream'});res.end(err?'Not found':body);});});
// 幅×高さ。390×664 は iPhone 12〜15 の Safari で上下ツールバーが出ている時の見える範囲の目安。低い画面と横向きも含める。
const SIZES=[[320,568],[320,480],[375,667],[375,553],[390,844],[390,664],[390,420],[667,375]];
// 色名未選択・色名選択済み（色見本ボタンあり）・HEX設定済み（色見本＋HEX解除あり）。
const CASES=[{id:'no-name',field:'irisColor',draft:{}},{id:'named',field:'hairColor',draft:{appearance:{hairColor:'olive'}}},{id:'hex-set',field:'hairColor',draft:{appearance:{hairColor:'olive'},hexColors:{hairColor:'#283718'}}}];
(async()=>{let browser;try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext({hasTouch:true});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  const qa=process.env.CAW_QA_DIR||path.join(root,'..','qa');fs.mkdirSync(qa,{recursive:true});
  const saved=()=>page.waitForFunction(()=>document.getElementById('save-status').textContent==='自動保存済み');
  const settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  await page.goto(url);await saved();
  assert.equal(await page.evaluate(()=>CAW.data.byOption('hairColor','olive').labelJa),'オリーブ色の髪');
  async function open(c,size){
    // 直前の変更の自動保存（再読込時の即時保存を含む）が終わってから、次の条件の保存データを書き込む。
    await saved();await page.setViewportSize({width:size[0],height:size[1]});
    await page.evaluate(d=>{localStorage.setItem('caw_ui_settings_v1',JSON.stringify({advanced:true,markdown:false,hex:true}));localStorage.setItem('caw_draft_v01',JSON.stringify(Object.assign({schemaVersion:'0.3'},d)));},c.draft);
    await page.reload();await saved();
    await page.evaluate(f=>document.querySelector('.hex-control [data-hex-open="'+f+'"]').click(),c.field);await settle();await page.waitForTimeout(80);
    assert(await page.locator('#hex-dialog').evaluate(d=>d.open),'Dialog opens');
  }
  // 見える範囲（visualViewport の代わりに渡した範囲）に、ヘッダー・下部ボタンが収まり、実際に押せるか。
  async function layout(label,band){
    const r=await page.evaluate(()=>{const q=s=>{const e=document.querySelector(s);return e&&e.offsetParent?e.getBoundingClientRect().toJSON():null;};const dlg=document.getElementById('hex-dialog'),body=document.getElementById('hex-dialog-body');
      const hit=s=>{const e=document.querySelector(s);if(!e||!e.offsetParent)return null;const b=e.getBoundingClientRect(),t=document.elementFromPoint(b.left+b.width/2,b.top+b.height/2);return !!t&&(t===e||e.contains(t));};
      return {dlg:dlg.getBoundingClientRect().toJSON(),head:q('.hex-dialog-head'),actions:q('.hex-dialog-actions'),apply:q('#hex-apply'),cancel:q('.hex-dialog-actions [data-hex-cancel]'),unset:q('#hex-unset'),ref:q('#hex-reference'),hits:{apply:hit('#hex-apply'),cancel:hit('.hex-dialog-actions [data-hex-cancel]'),unset:hit('#hex-unset'),close:hit('.hex-dialog-head [data-hex-cancel]')},bodyScroll:[body.scrollHeight,body.clientHeight],dlgScroll:dlg.scrollHeight-dlg.clientHeight,docOverflow:document.documentElement.scrollWidth>innerWidth};});
    const top=band.top,bottom=band.top+band.height;
    assert(r.dlg.top>=top-0.5&&r.dlg.bottom<=bottom+0.5,label+': dialog inside visible area '+JSON.stringify([r.dlg.top,r.dlg.bottom,top,bottom]));
    assert(r.dlg.left>=-0.5&&r.dlg.right<=band.width+0.5,label+': dialog inside width');
    assert(r.head.top>=top-0.5&&r.head.top<r.dlg.top+2,label+': header at the top');
    for(const k of ['apply','cancel'].concat(r.unset?['unset']:[])){const b=r[k];assert(b&&b.top>=top-0.5&&b.bottom<=bottom+0.5&&b.height>=43.5&&b.left>=r.dlg.left&&b.right<=r.dlg.right+0.5,label+': '+k+' visible '+JSON.stringify(b));assert.equal(r.hits[k],true,label+': '+k+' is not covered');}
    assert.equal(r.hits.close,true,label+': close button reachable');assert(r.dlgScroll<=1,label+': only the settings area scrolls, not the dialog');assert(!r.docOverflow,label+': no horizontal overflow');
    return r;
  }
  async function scrollBodyToEnd(label){const s=await page.evaluate(()=>{const b=document.getElementById('hex-dialog-body');b.scrollTop=b.scrollHeight;return [b.scrollTop,b.scrollHeight-b.clientHeight];});assert(Math.abs(s[0]-s[1])<=1,label+': settings area scrolls to the end');await settle();
    assert(await page.evaluate(()=>{const e=document.querySelector('.hex-dialog-body .face-hint'),b=document.getElementById('hex-dialog-body').getBoundingClientRect(),r=e.getBoundingClientRect();return r.bottom<=b.bottom+1;}),label+': last line reachable by scrolling');}

  for(const c of CASES)for(const size of SIZES){
    const label=c.id+' '+size.join('x');await open(c,size);
    const r=await layout(label,{top:0,height:size[1],width:size[0]});
    assert.equal(!!r.ref,c.id!=='no-name',label+': reference swatch button as expected');assert.equal(!!r.unset,c.id==='hex-set',label+': unset button as expected');
    await scrollBodyToEnd(label);await layout(label+' scrolled',{top:0,height:size[1],width:size[0]});
    if(['320x568','390x664','390x420'].includes(size.join('x')))await page.screenshot({path:path.join(qa,'hex-dialog-'+c.id+'-'+size.join('x')+'.png')});
    // 実際にタップして確定できる（スライダーで値を変えてから）。
    await page.evaluate(()=>{document.getElementById('hex-dialog-body').scrollTop=0;});await page.locator('#hex-h').fill('200');await page.locator('#hex-s').fill('60');await page.locator('#hex-v').fill('70');
    const expected=await page.locator('#hex-dialog-input').inputValue();await page.locator('#hex-apply').tap();
    assert(!(await page.locator('#hex-dialog').evaluate(d=>d.open)),label+': apply closes the dialog');
    assert.equal(await page.evaluate(f=>JSON.parse(localStorage.getItem('caw_draft_v01')||'{}').hexColors&&document.querySelector('[data-hex-input="'+f+'"]').value,c.field),expected,label+': tapped value is set');
  }

  // HEX解除ボタンもタップで動く（HEX設定済み・低い画面）。
  await open(CASES[2],[320,480]);await page.locator('#hex-unset').tap();assert.equal(await page.locator('[data-hex-input="hairColor"]').inputValue(),'','Unset works by tap on a short screen');
  await open(CASES[1],[320,480]);await page.locator('.hex-dialog-actions [data-hex-cancel]').tap();assert.equal(await page.locator('[data-hex-input="hairColor"]').inputValue(),'','Cancel works by tap');

  // ドラッグとスライダー：設定エリア内のスクロールと干渉しない。
  await open(CASES[1],[390,664]);const sv=await page.locator('#hex-sv').boundingBox();const scroll0=await page.evaluate(()=>document.getElementById('hex-dialog-body').scrollTop);
  await page.mouse.move(sv.x+sv.width*0.2,sv.y+sv.height*0.8);await page.mouse.down();await page.mouse.move(sv.x+sv.width*0.6,sv.y+sv.height*0.4,{steps:6});await page.mouse.move(sv.x+sv.width*0.9,sv.y+sv.height*0.1,{steps:6});await page.mouse.up();
  assert.equal(await page.locator('#hex-s').inputValue(),String(Math.round(Math.min(1,Math.max(0,(sv.width*0.9-14)/(sv.width-28)))*100)),'Drag updates saturation');assert.equal(await page.evaluate(()=>document.getElementById('hex-dialog-body').scrollTop),scroll0,'Dragging does not scroll the settings area');
  assert.equal(await page.evaluate(()=>getComputedStyle(document.getElementById('hex-sv')).touchAction),'none','Touch drag keeps touch-action:none');
  const hue=page.locator('#hex-h'),hb=await hue.boundingBox();await page.mouse.click(hb.x+hb.width*0.75,hb.y+hb.height/2);assert(Math.abs(Number(await hue.inputValue())-269)<=12,'Hue slider follows the pointer: '+await hue.inputValue());
  await page.locator('#hex-apply').tap();assert(!(await page.locator('#hex-dialog').evaluate(d=>d.open)));

  // キーボード表示：見える範囲を縮めた visualViewport の代役を渡し、HEX入力→確定まで操作できるか。
  for(const size of [[320,568],[375,667],[390,844],[390,664]])for(const c of CASES){
    const label='keyboard '+c.id+' '+size.join('x');await open(c,size);
    const kb=Math.round(size[1]*0.45),band={top:size[1]>700?60:0,height:size[1]-kb-(size[1]>700?60:0),width:size[0]};
    await page.locator('#hex-dialog-input').focus();
    await page.evaluate(b=>{const vv=new EventTarget();vv.width=b.width;vv.height=b.height;vv.offsetTop=b.top;vv.offsetLeft=0;vv.scale=1;Object.defineProperty(window,'visualViewport',{configurable:true,get:()=>vv});window.__vv=vv;vv.dispatchEvent(new Event('resize'));},band);
    await settle();await page.waitForTimeout(400);await settle();
    const r=await layout(label,band);
    assert(await page.evaluate(b=>{const i=document.getElementById('hex-dialog-input').getBoundingClientRect(),bd=document.getElementById('hex-dialog-body').getBoundingClientRect();return i.top>=bd.top-1&&i.bottom<=bd.bottom+1&&i.bottom<=b.top+b.height;},band),label+': HEX field stays visible above the keyboard');
    assert(await page.evaluate(()=>document.activeElement.id==='hex-dialog-input'),label+': focus stays in the HEX field');
    if(size.join('x')==='390x664')await page.screenshot({path:path.join(qa,'hex-dialog-keyboard-'+c.id+'-390x664.png'),clip:{x:0,y:band.top,width:band.width,height:band.height}});
    await page.locator('#hex-dialog-input').fill('#3A6FB0');await page.locator('#hex-apply').tap();
    assert(!(await page.locator('#hex-dialog').evaluate(d=>d.open)),label+': apply closes the dialog');assert.equal(await page.locator('[data-hex-input="'+c.field+'"]').inputValue(),'#3A6FB0',label+': typed HEX is set');
    await page.evaluate(()=>{delete window.visualViewport;});
    assert(r.actions.bottom<=band.top+band.height+0.5);
  }
  // キーボードが閉じたら元の位置へ戻る。
  await open(CASES[0],[390,664]);await page.evaluate(()=>{const vv=new EventTarget();Object.assign(vv,{width:390,height:330,offsetTop:0,offsetLeft:0,scale:1});Object.defineProperty(window,'visualViewport',{configurable:true,get:()=>vv});window.__vv=vv;vv.dispatchEvent(new Event('resize'));});await settle();
  await page.evaluate(()=>{window.__vv.height=664;window.__vv.dispatchEvent(new Event('resize'));});await settle();await layout('keyboard closed',{top:0,height:664,width:390});
  const big=await page.locator('#hex-dialog').boundingBox();assert(big.height>400,'Dialog grows back after the keyboard closes');await page.evaluate(()=>{delete window.visualViewport;});await page.locator('#hex-dialog [data-hex-cancel]').first().click();

  // 保存・出力は従来どおり（HEX付き出力に反映）。
  await open(CASES[1],[390,664]);await page.locator('#hex-dialog-input').fill('#3A6FB0');await page.locator('#hex-apply').tap();await saved();
  await page.evaluate(()=>{localStorage.setItem('caw_ui_settings_v1',JSON.stringify({advanced:true,markdown:true,hex:true,format:'markdownHex'}));});await page.reload();await saved();
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('caw_draft_v01')).hexColors.hairColor),'#3A6FB0','Value set from the dialog is saved');
  assert((await page.locator('#output-advanced').textContent()).includes('- Hair color: '+(await page.evaluate(()=>CAW.data.byOption('hairColor','olive').promptEn))+' (#3A6FB0)'),'Value set from the dialog appears in the Markdown+HEX output');
  assert.deepEqual(errors,[],'No browser runtime errors');console.log('PASS hex dialog: header/scrollable body/actions stay inside the visible area for no-name, named and HEX-set cases at '+SIZES.map(s=>s.join('x')).join(', ')+'; apply/unset/cancel tappable; drag and sliders intact; simulated keyboard; no page errors');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}})().catch(err=>{console.error(err);process.exitCode=1;});
