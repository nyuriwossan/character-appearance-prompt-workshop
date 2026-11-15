'use strict';
// 髪型参考一覧：manifest.json と既存の baseCut の対応、画像ファイル、未作成画像を出さないことを確認する。run-tests.js から読み込む。
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
let n=0;function ok(x,m){assert.ok(x,m);n++;}function eq(a,b,m){assert.deepEqual(a,b,m);n++;}
const root=path.resolve(__dirname,'..'),dir=path.join(root,'assets','hair-reference'),D=CAW.data,R=CAW.hairReference;
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8')),field=D.byField('baseCut');
const FIRST=[['crop','クロップ'],['pixie','ピクシーカット'],['mushroom','マッシュ'],['layered_short','レイヤーショート'],['bob','ボブ'],['lob','ロングボブ'],['wolf','ウルフカット'],['shag','シャギーカット'],['straight','ストレートロング']];
// webp のヘッダーから幅・高さを読む（VP8 / VP8L / VP8X）。
function webp(file){const b=fs.readFileSync(file);eq([b.slice(0,4).toString(),b.slice(8,12).toString()],['RIFF','WEBP'],'WebP: '+path.basename(file));const t=b.slice(12,16).toString();
  if(t==='VP8 ')return [b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];if(t==='VP8L'){const v=b.readUInt32LE(21);return [(v&0x3fff)+1,((v>>14)&0x3fff)+1];}return [b.readUIntLE(24,3)+1,b.readUIntLE(27,3)+1];}
eq(field.labelJa,'髪型・カットの基本形');eq(field.options.length,47,'baseCut has 47 options (unchanged)');
eq(manifest.length,9,'First batch: 9 images');
eq(manifest.map(x=>[x.optionId,x.labelJa]),FIRST,'Manifest optionIds and names');
manifest.forEach(x=>{const o=D.byOption(x.fieldId,x.optionId);eq(x.fieldId,'baseCut','fieldId is baseCut: '+x.optionId);ok(o,'optionId exists in baseCut: '+x.optionId);eq(x.labelJa,o.labelJa,'Name matches the selection button: '+x.optionId);eq(x.image,'images/'+x.optionId+'.webp','Image file is named by optionId: '+x.optionId);ok(typeof x.descriptionJa==='string'&&x.descriptionJa.length>0&&x.descriptionJa.length<=30,'Short description: '+x.optionId);
  const file=path.join(dir,x.image);ok(fs.existsSync(file),'Image exists: '+x.image);eq(webp(file),[418,418],'Square 418px image: '+x.image);});
eq(fs.readdirSync(path.join(dir,'images')).sort(),manifest.map(x=>path.basename(x.image)).sort(),'No unlisted images in the folder');
const entries=R.validEntries(manifest);eq(entries.map(e=>[e.option.id,e.option.labelJa,e.image]),FIRST.map(([id,label])=>[id,label,'assets/hair-reference/images/'+id+'.webp']),'Entries map image ↔ option exactly');
eq(entries.map(e=>field.options.indexOf(e.option)),[0,1,2,3,4,5,6,7,8],'Listed in the selection order');
const rest=field.options.filter(o=>!entries.some(e=>e.option===o));eq(rest.length,38,'38 options still have no image');ok(rest.every(o=>!fs.existsSync(path.join(dir,'images',o.id+'.webp'))),'No image is shown for options without one');
// 不正な対応は推測で補わずに捨てる。
const quiet=console.warn;console.warn=()=>{};
eq(R.validEntries([{fieldId:'baseCut',optionId:'not_a_cut',image:'images/x.webp'},{fieldId:'hairColor',optionId:'black',image:'images/black.webp'},{fieldId:'baseCut',optionId:'bob',image:'../bob.webp'},{fieldId:'baseCut',optionId:'bob',image:'https://example.com/bob.webp'},{fieldId:'baseCut',optionId:'bob'},null,'x']),[],'Unknown ids, other fields and unsafe paths are dropped');
eq(R.validEntries([{fieldId:'baseCut',optionId:'bob',image:'images/bob.webp'},{fieldId:'baseCut',optionId:'bob',image:'images/bob2.webp'}]).length,1,'Duplicates are dropped');
eq(R.validEntries([{fieldId:'baseCut',optionId:'bob',labelJa:'ボブカット',image:'images/bob.webp'}])[0].option.labelJa,'ボブ','Dictionary name wins over a mismatched manifest name');
eq(R.validEntries({}),[],'Non-array manifest');console.warn=quiet;
// 追加しやすさ：将来の1件は manifest に足すだけで有効になる。
eq(R.validEntries(manifest.concat([{fieldId:'baseCut',optionId:'hime',labelJa:'姫カット',descriptionJa:'例',image:'images/hime.webp'}])).length,10,'A new entry only needs a manifest line and an image');
const html=fs.readFileSync(path.join(root,'hair-reference.html'),'utf8'),idx=fs.readFileSync(path.join(root,'index.html'),'utf8');
ok(html.includes('<title>髪型参考一覧')&&html.includes('id="reference-title">髪型参考一覧<'),'Page title');ok((html.match(/data-reference-back/g)||[]).length===2&&html.includes('href="./" data-reference-back'),'Back links');
eq((idx.match(/<script src="data\/[^"]+"><\/script>/g)||[]),(html.match(/<script src="data\/[^"]+"><\/script>/g)||[]),'Same dictionary scripts as the app');
ok(html.includes('模式的なイラスト')&&html.includes('保証するものではありません'),'Illustration disclaimer');
console.log('PASS '+n+' hair reference assertions');
