'use strict';
// サイトアイコン・Web App Manifest の参照先と画像の形式を確認する。run-tests.js から読み込む。
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
let n=0;function ok(x,m){assert.ok(x,m);n++;}function eq(a,b,m){assert.deepEqual(a,b,m);n++;}
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),head=html.slice(0,html.indexOf('</head>'));
// PNG の幅・高さ・色の型（2=RGB：透明なし、6=RGBA）をヘッダーから読む。
function png(file){const b=fs.readFileSync(path.join(root,file));eq(b.slice(1,4).toString(),'PNG',file+' is PNG');return {w:b.readUInt32BE(16),h:b.readUInt32BE(20),colorType:b[25]};}
function exists(file){ok(fs.existsSync(path.join(root,file))&&fs.statSync(path.join(root,file)).size>0,'Referenced file exists: '+file);}
const links=[...head.matchAll(/<link\s+([^>]*)>/g)].map(m=>Object.fromEntries([...m[1].matchAll(/([a-z-]+)="([^"]*)"/g)].map(x=>[x[1],x[2]])));
const icons=links.filter(l=>/icon/.test(l.rel));
eq(icons.map(l=>[l.rel,l.href]),[['icon','favicon.ico'],['icon','icons/favicon-32.png'],['icon','icons/favicon-16.png'],['apple-touch-icon','apple-touch-icon.png']],'Icon links in <head>');
icons.forEach(l=>{exists(l.href);ok(!/^(\/|https?:)/.test(l.href),'Icon path is relative (works under the GitHub Pages subpath): '+l.href);});
icons.filter(l=>l.sizes&&l.sizes!=='any').forEach(l=>{const p=png(l.href),s=l.sizes.split('x').map(Number);eq([p.w,p.h],s,'Declared size matches: '+l.href);eq(p.colorType,2,'No transparency: '+l.href);});
const ico=fs.readFileSync(path.join(root,'favicon.ico'));eq([ico.readUInt16LE(0),ico.readUInt16LE(2)],[0,1],'favicon.ico header');ok(ico.readUInt16LE(4)>=2,'favicon.ico holds several sizes');
ok(/<meta name="apple-mobile-web-app-title" content="外見設計工房">/.test(head),'Home screen title');ok(!/apple-mobile-web-app-capable|mobile-web-app-capable/.test(head),'No standalone meta (opens in Safari as before)');
const mf=links.find(l=>l.rel==='manifest');ok(mf&&mf.href==='site.webmanifest','Manifest link');exists(mf.href);
const m=JSON.parse(fs.readFileSync(path.join(root,mf.href),'utf8'));
eq([m.name,m.short_name,m.start_url,m.scope,m.display],['キャラクター外見設計工房','外見設計工房','./','./','browser'],'Manifest basics (browser display keeps current behavior)');
ok(m.icons.length>=2,'Manifest icons');m.icons.forEach(i=>{exists(i.src);const p=png(i.src),s=i.sizes.split('x').map(Number);eq([p.w,p.h],s,'Manifest icon size: '+i.src);eq(p.colorType,2,'Manifest icon has no transparency: '+i.src);eq(i.type,'image/png');});
['192x192','512x512'].forEach(sz=>ok(m.icons.some(i=>i.sizes===sz&&i.purpose==='any'),'Manifest has '+sz));
const ap=png('apple-touch-icon.png');eq([ap.w,ap.h,ap.colorType],[180,180,2],'apple-touch-icon is 180x180, opaque');
ok(!fs.existsSync(path.join(root,'sw.js'))&&!fs.existsSync(path.join(root,'service-worker.js'))&&!/serviceWorker/.test(fs.readdirSync(root).filter(f=>f.endsWith('.js')).map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('')),'No service worker');
console.log('PASS '+n+' site icon and manifest assertions');
