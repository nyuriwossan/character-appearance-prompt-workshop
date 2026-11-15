'use strict';
// Optional development check: serves the app under the GitHub Pages subpath and confirms every icon/manifest URL loads (no 404).
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.CAW_PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..'),BASE='/character-appearance-prompt-workshop/';
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.ico':'image/x-icon','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{const u=decodeURIComponent(req.url.split('?')[0]);if(!u.startsWith(BASE)){res.writeHead(404);res.end();return;}const p=path.resolve(root,'.'+(u===BASE?'/index.html':'/'+u.slice(BASE.length)));if(!p.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}fs.readFile(p,(err,body)=>{res.writeHead(err?404:200,{'Content-Type':mime[path.extname(p)]||'application/octet-stream'});res.end(err?'Not found':body);});});
(async()=>{let browser;try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url='http://127.0.0.1:'+server.address().port+BASE;
  browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage(),bad=[],errors=[];
  page.on('response',r=>{if(r.status()>=400)bad.push(r.status()+' '+r.url());});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);await page.waitForFunction(()=>document.getElementById('save-status').textContent==='自動保存済み');
  const refs=await page.evaluate(()=>Array.from(document.querySelectorAll('link[rel~="icon"],link[rel="apple-touch-icon"],link[rel="manifest"]')).map(l=>l.href));
  assert.equal(refs.length,5,'Icon and manifest links');
  const manifest=await (await page.request.get(refs.find(h=>h.endsWith('.webmanifest')))).json();
  const all=refs.concat(manifest.icons.map(i=>new URL(i.src,refs.find(h=>h.endsWith('.webmanifest'))).href));
  for(const href of new Set(all)){assert(href.startsWith(url),'Resolves under the site path: '+href);const r=await page.request.get(href);assert.equal(r.status(),200,'Loads: '+href);assert((await r.body()).length>0);}
  // ブラウザが実際にアイコン画像として読めるか（デコードできて、宣言どおりの大きさか）。
  for(const href of new Set(all.filter(h=>h.endsWith('.png')))){const size=await page.evaluate(h=>new Promise((ok,ng)=>{const i=new Image();i.onload=()=>ok([i.naturalWidth,i.naturalHeight]);i.onerror=()=>ng(new Error('decode '+h));i.src=h;}),href);assert.equal(size[0],size[1],'Square: '+href);}
  // Chrome 自身の manifest 解析でエラーがないこと。
  const cdp=await page.context().newCDPSession(page);const m=await cdp.send('Page.getAppManifest');assert.deepEqual(m.errors,[],'Manifest parses without errors');assert(m.url.endsWith(BASE+'site.webmanifest'));
  assert.deepEqual(bad,[],'No 404 while loading the page');assert.deepEqual(errors,[],'No page errors');
  console.log('PASS icons: '+new Set(all).size+' icon/manifest URLs load with 200 under '+BASE+', PNGs decode as square images, manifest parses cleanly, no 404 on page load');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}})().catch(err=>{console.error(err);process.exitCode=1;});
