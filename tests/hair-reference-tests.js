'use strict';
// 髪型参考一覧：manifest.json と既存の baseCut の対応、画像ファイル、未作成画像を出さないことを確認する。run-tests.js から読み込む。
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
let n=0;function ok(x,m){assert.ok(x,m);n++;}function eq(a,b,m){assert.deepEqual(a,b,m);n++;}
const root=path.resolve(__dirname,'..'),dir=path.join(root,'assets','hair-reference'),D=CAW.data,R=CAW.hairReference;
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8')),field=D.byField('baseCut');
const FIRST=[['crop','クロップ'],['pixie','ピクシーカット'],['mushroom','マッシュ'],['layered_short','レイヤーショート'],['bob','ボブ'],['lob','ロングボブ'],['wolf','ウルフカット'],['shag','シャギーカット'],['straight','ストレートロング']];
// 第2弾（結び髪）。manifest の末尾に追記した順。
const SECOND=[['ponytail','ポニーテール'],['high_ponytail','高いポニーテール'],['low_ponytail','低いポニーテール'],['side_ponytail','サイドポニーテール'],['twin_tails','ツインテール'],['low_twin_tails','低いツインテール'],['twin_braids','ツイン三つ編み'],['double_buns','ツインお団子'],['half_up','ハーフアップ']];
// 第3弾（編み込み・まとめ髪）。manifest の末尾に追記した順。
const THIRD=[['side_braid','サイド三つ編み'],['fishtail','フィッシュボーン'],['french_braid','フレンチブレイド'],['dutch_braid','ダッチブレイド'],['crown_braid','編み込みの冠'],['braided_bun','編み込みお団子'],['half_up_bun','ハーフアップお団子'],['messy_bun','無造作なお団子'],['chignon','低いシニヨン']];
// 第4弾（特徴的なカット）。manifest の末尾に追記した順。
const FOURTH=[['undercut','アンダーカット'],['two_block','ツーブロック'],['hime','姫カット'],['jellyfish','クラゲカット'],['butterfly','バタフライカット'],['asym_bob','アシンメトリーボブ'],['a_line_bob','前下がりボブ'],['inverted_bob','後ろ短めのボブ'],['french_bob','フレンチボブ']];
const ALL=FIRST.concat(SECOND,THIRD,FOURTH);
// webp のヘッダーから幅・高さを読む（VP8 / VP8L / VP8X）。
function webp(file){const b=fs.readFileSync(file);eq([b.slice(0,4).toString(),b.slice(8,12).toString()],['RIFF','WEBP'],'WebP: '+path.basename(file));const t=b.slice(12,16).toString();
  if(t==='VP8 ')return [b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];if(t==='VP8L'){const v=b.readUInt32LE(21);return [(v&0x3fff)+1,((v>>14)&0x3fff)+1];}return [b.readUIntLE(24,3)+1,b.readUIntLE(27,3)+1];}
eq(field.labelJa,'髪型・カットの基本形');eq(field.options.length,47,'baseCut has 47 options (unchanged)');
eq(manifest.length,36,'First to fourth batch: 36 images');
eq(manifest.map(x=>[x.optionId,x.labelJa]),ALL,'Manifest optionIds and names (earlier batches kept, new ones appended)');
eq(manifest.slice(9,18).map(x=>[x.optionId,x.descriptionJa]),[['ponytail','後頭部の中ほどで一つに結ぶ'],['high_ponytail','頭の高い位置で一つに結ぶ'],['low_ponytail','襟足付近の低い位置で一つに結ぶ'],['side_ponytail','左右どちらかに寄せて一つに結ぶ'],['twin_tails','左右の高めの位置で二つに結ぶ'],['low_twin_tails','左右の低い位置で二つに結ぶ'],['twin_braids','左右二本の三つ編みにする'],['double_buns','左右二つのお団子にまとめる'],['half_up','上半分だけを後ろで結び、下半分は下ろす']],'Second batch entries unchanged');
eq(manifest.slice(18,27).map(x=>[x.optionId,x.descriptionJa]),[['side_braid','髪を片側へ寄せて三つ編みにする'],['fishtail','細かな毛束を交差させる魚の骨状の編み目'],['french_braid','髪を内側へ重ねながら頭皮に沿って編む'],['dutch_braid','髪を下へくぐらせ編み目を立体的に浮かせる'],['crown_braid','頭の周囲を冠状に編み込む'],['braided_bun','編んだ毛束をお団子状にまとめる'],['half_up_bun','上半分だけをお団子にし、残りは下ろす'],['messy_bun','毛束をラフにまとめ、後れ毛を残す'],['chignon','襟足付近で髪をすっきりまとめる']],'Third batch entries unchanged');
eq(manifest.slice(0,9).map(x=>[x.optionId,x.labelJa,x.descriptionJa,x.image]),[['crop','クロップ','短く整えた髪','images/crop.webp'],['pixie','ピクシーカット','短い毛束と軽い動き','images/pixie.webp'],['mushroom','マッシュ','丸いシルエット','images/mushroom.webp'],['layered_short','レイヤーショート','短髪に段差を入れた形','images/layered_short.webp'],['bob','ボブ','あご付近の長さ','images/bob.webp'],['lob','ロングボブ','肩に近い長めのボブ','images/lob.webp'],['wolf','ウルフカット','上は短め・襟足は長め','images/wolf.webp'],['shag','シャギーカット','毛先を軽く散らした形','images/shag.webp'],['straight','ストレートロング','まっすぐな長髪','images/straight.webp']],'First batch entries unchanged');
manifest.forEach(x=>{const o=D.byOption(x.fieldId,x.optionId);eq(x.fieldId,'baseCut','fieldId is baseCut: '+x.optionId);ok(o,'optionId exists in baseCut: '+x.optionId);eq(x.labelJa,o.labelJa,'Name matches the selection button: '+x.optionId);eq(x.image,'images/'+x.optionId+'.webp','Image file is named by optionId: '+x.optionId);ok(typeof x.descriptionJa==='string'&&x.descriptionJa.length>0&&x.descriptionJa.length<=30,'Short description: '+x.optionId);
  const file=path.join(dir,x.image);ok(fs.existsSync(file),'Image exists: '+x.image);eq(webp(file),[418,418],'Square 418px image: '+x.image);});
eq(fs.readdirSync(path.join(dir,'images')).sort(),manifest.map(x=>path.basename(x.image)).sort(),'No unlisted images in the folder');
const entries=R.validEntries(manifest);eq(entries.map(e=>[e.option.id,e.option.labelJa,e.image]),ALL.map(([id,label])=>[id,label,'assets/hair-reference/images/'+id+'.webp']),'Entries map image ↔ option exactly');
eq(entries.map(e=>field.options.indexOf(e.option)).slice().sort((a,b)=>a-b),[0,1,2,3,4,5,6,7,8,10,11,12,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,32,33,34,35,36,37,38,39],'All 36 map to existing baseCut options');
const rest=field.options.filter(o=>!entries.some(e=>e.option===o));eq(rest.length,11,'11 options still have no image');
eq(rest.map(o=>o.id),['layered_long','bun','braid','slicked_back','pageboy','pompadour','quiff','dreadlocks','cornrows','afro','bowl'],'Remaining options without an image');ok(rest.every(o=>!fs.existsSync(path.join(dir,'images',o.id+'.webp'))),'No image is shown for options without one');
// 不正な対応は推測で補わずに捨てる。
const quiet=console.warn;console.warn=()=>{};
eq(R.validEntries([{fieldId:'baseCut',optionId:'not_a_cut',image:'images/x.webp'},{fieldId:'hairColor',optionId:'black',image:'images/black.webp'},{fieldId:'baseCut',optionId:'bob',image:'../bob.webp'},{fieldId:'baseCut',optionId:'bob',image:'https://example.com/bob.webp'},{fieldId:'baseCut',optionId:'bob'},null,'x']),[],'Unknown ids, other fields and unsafe paths are dropped');
eq(R.validEntries([{fieldId:'baseCut',optionId:'bob',image:'images/bob.webp'},{fieldId:'baseCut',optionId:'bob',image:'images/bob2.webp'}]).length,1,'Duplicates are dropped');
eq(R.validEntries([{fieldId:'baseCut',optionId:'bob',labelJa:'ボブカット',image:'images/bob.webp'}])[0].option.labelJa,'ボブ','Dictionary name wins over a mismatched manifest name');
eq(R.validEntries({}),[],'Non-array manifest');console.warn=quiet;
// 追加しやすさ：将来の1件は manifest に足すだけで有効になる。
eq(R.validEntries(manifest.concat([{fieldId:'baseCut',optionId:'bowl',labelJa:'ボウルカット',descriptionJa:'例',image:'images/bowl.webp'}])).length,37,'A new entry only needs a manifest line and an image');
const html=fs.readFileSync(path.join(root,'hair-reference.html'),'utf8'),idx=fs.readFileSync(path.join(root,'index.html'),'utf8');
ok(html.includes('<title>髪型参考一覧')&&html.includes('id="reference-title">髪型参考一覧<'),'Page title');ok((html.match(/data-reference-back/g)||[]).length===2&&html.includes('href="./" data-reference-back'),'Back links');
eq((idx.match(/<script src="data\/[^"]+"><\/script>/g)||[]),(html.match(/<script src="data\/[^"]+"><\/script>/g)||[]),'Same dictionary scripts as the app');
ok(html.includes('模式的なイラスト')&&html.includes('保証するものではありません'),'Illustration disclaimer');
console.log('PASS '+n+' hair reference assertions');
