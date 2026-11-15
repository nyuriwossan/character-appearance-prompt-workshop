'use strict';
// 髪型参考一覧：manifest.json と既存の baseCut の対応、画像ファイル、未作成画像を出さないことを確認する。run-tests.js から読み込む。
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
let n=0;function ok(x,m){assert.ok(x,m);n++;}function eq(a,b,m){assert.deepEqual(a,b,m);n++;}
const root=path.resolve(__dirname,'..'),dir=path.join(root,'assets','hair-reference'),D=CAW.data,R=CAW.hairReference;
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8')),field=D.byField('baseCut');
const FIRST=[['crop','クロップ'],['pixie','ピクシーカット'],['mushroom','マッシュ'],['layered_short','レイヤーショート'],['bob','ボブ'],['lob','ロングボブ'],['wolf','ウルフカット'],['shag','シャギーカット'],['straight','ストレートロング']];
// 第2弾（結び髪）。manifest の末尾に追記した順。
const SECOND=[['ponytail','ポニーテール'],['high_ponytail','高いポニーテール'],['low_ponytail','低いポニーテール'],['side_ponytail','サイドポニーテール'],['twin_tails','ツインテール'],['low_twin_tails','低いツインテール'],['twin_braids','ツイン三つ編み'],['double_buns','ツインお団子'],['half_up','ハーフアップ']];
const ALL=FIRST.concat(SECOND);
// webp のヘッダーから幅・高さを読む（VP8 / VP8L / VP8X）。
function webp(file){const b=fs.readFileSync(file);eq([b.slice(0,4).toString(),b.slice(8,12).toString()],['RIFF','WEBP'],'WebP: '+path.basename(file));const t=b.slice(12,16).toString();
  if(t==='VP8 ')return [b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];if(t==='VP8L'){const v=b.readUInt32LE(21);return [(v&0x3fff)+1,((v>>14)&0x3fff)+1];}return [b.readUIntLE(24,3)+1,b.readUIntLE(27,3)+1];}
eq(field.labelJa,'髪型・カットの基本形');eq(field.options.length,47,'baseCut has 47 options (unchanged)');
eq(manifest.length,18,'First + second batch: 18 images');
eq(manifest.map(x=>[x.optionId,x.labelJa]),ALL,'Manifest optionIds and names (first batch kept, second appended)');
eq(manifest.slice(0,9).map(x=>[x.optionId,x.labelJa,x.descriptionJa,x.image]),[['crop','クロップ','短く整えた髪','images/crop.webp'],['pixie','ピクシーカット','短い毛束と軽い動き','images/pixie.webp'],['mushroom','マッシュ','丸いシルエット','images/mushroom.webp'],['layered_short','レイヤーショート','短髪に段差を入れた形','images/layered_short.webp'],['bob','ボブ','あご付近の長さ','images/bob.webp'],['lob','ロングボブ','肩に近い長めのボブ','images/lob.webp'],['wolf','ウルフカット','上は短め・襟足は長め','images/wolf.webp'],['shag','シャギーカット','毛先を軽く散らした形','images/shag.webp'],['straight','ストレートロング','まっすぐな長髪','images/straight.webp']],'First batch entries unchanged');
manifest.forEach(x=>{const o=D.byOption(x.fieldId,x.optionId);eq(x.fieldId,'baseCut','fieldId is baseCut: '+x.optionId);ok(o,'optionId exists in baseCut: '+x.optionId);eq(x.labelJa,o.labelJa,'Name matches the selection button: '+x.optionId);eq(x.image,'images/'+x.optionId+'.webp','Image file is named by optionId: '+x.optionId);ok(typeof x.descriptionJa==='string'&&x.descriptionJa.length>0&&x.descriptionJa.length<=30,'Short description: '+x.optionId);
  const file=path.join(dir,x.image);ok(fs.existsSync(file),'Image exists: '+x.image);eq(webp(file),[418,418],'Square 418px image: '+x.image);});
eq(fs.readdirSync(path.join(dir,'images')).sort(),manifest.map(x=>path.basename(x.image)).sort(),'No unlisted images in the folder');
const entries=R.validEntries(manifest);eq(entries.map(e=>[e.option.id,e.option.labelJa,e.image]),ALL.map(([id,label])=>[id,label,'assets/hair-reference/images/'+id+'.webp']),'Entries map image ↔ option exactly');
eq(entries.map(e=>field.options.indexOf(e.option)).slice().sort((a,b)=>a-b),[0,1,2,3,4,5,6,7,8,11,12,15,16,17,18,19,20,21],'All 18 map to existing baseCut options');
const rest=field.options.filter(o=>!entries.some(e=>e.option===o));eq(rest.length,29,'29 options still have no image');ok(rest.every(o=>!fs.existsSync(path.join(dir,'images',o.id+'.webp'))),'No image is shown for options without one');
// 不正な対応は推測で補わずに捨てる。
const quiet=console.warn;console.warn=()=>{};
eq(R.validEntries([{fieldId:'baseCut',optionId:'not_a_cut',image:'images/x.webp'},{fieldId:'hairColor',optionId:'black',image:'images/black.webp'},{fieldId:'baseCut',optionId:'bob',image:'../bob.webp'},{fieldId:'baseCut',optionId:'bob',image:'https://example.com/bob.webp'},{fieldId:'baseCut',optionId:'bob'},null,'x']),[],'Unknown ids, other fields and unsafe paths are dropped');
eq(R.validEntries([{fieldId:'baseCut',optionId:'bob',image:'images/bob.webp'},{fieldId:'baseCut',optionId:'bob',image:'images/bob2.webp'}]).length,1,'Duplicates are dropped');
eq(R.validEntries([{fieldId:'baseCut',optionId:'bob',labelJa:'ボブカット',image:'images/bob.webp'}])[0].option.labelJa,'ボブ','Dictionary name wins over a mismatched manifest name');
eq(R.validEntries({}),[],'Non-array manifest');console.warn=quiet;
// 追加しやすさ：将来の1件は manifest に足すだけで有効になる。
eq(R.validEntries(manifest.concat([{fieldId:'baseCut',optionId:'hime',labelJa:'姫カット',descriptionJa:'例',image:'images/hime.webp'}])).length,19,'A new entry only needs a manifest line and an image');
const html=fs.readFileSync(path.join(root,'hair-reference.html'),'utf8'),idx=fs.readFileSync(path.join(root,'index.html'),'utf8');
ok(html.includes('<title>髪型参考一覧')&&html.includes('id="reference-title">髪型参考一覧<'),'Page title');ok((html.match(/data-reference-back/g)||[]).length===2&&html.includes('href="./" data-reference-back'),'Back links');
eq((idx.match(/<script src="data\/[^"]+"><\/script>/g)||[]),(html.match(/<script src="data\/[^"]+"><\/script>/g)||[]),'Same dictionary scripts as the app');
ok(html.includes('模式的なイラスト')&&html.includes('保証するものではありません'),'Illustration disclaimer');
console.log('PASS '+n+' hair reference assertions');
