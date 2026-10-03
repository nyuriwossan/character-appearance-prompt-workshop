'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
global.window=global;
const memory={};
global.localStorage={getItem:k=>Object.prototype.hasOwnProperty.call(memory,k)?memory[k]:null,setItem:(k,v)=>{memory[k]=String(v);},removeItem:k=>{delete memory[k];}};
[
  'data/core.js','data/basic-face.js','data/eyes.js','data/features.js','data/hair.js','data/skin-body.js','data/marks.js','data/presets.js','data/appearance-details.js','data/rules.js',
  'state.js','color-details.js','face-profile.js','normalizer.js','generator.js','advisor.js','storage.js','preset-ui.js'
].forEach(file=>vm.runInThisContext(fs.readFileSync(path.join(root,file),'utf8'),{filename:file}));
let passed=0;
function ok(value,message){if(!value)throw new Error(message);passed++;}
function eq(a,b,message){ok(JSON.stringify(a)===JSON.stringify(b),message+` (actual ${JSON.stringify(a)})`);}
function no(text,re,message){ok(!re.test(text),message);}
function select(s,patch){return CAW.state.patch(s,patch);}

const options=CAW.data.fields.flatMap(f=>f.options);
ok(options.length>=300,'候補が300件以上');
ok(CAW.data.fields.length>=70,'主要フィールドを網羅');
ok(!!CAW.data.byOption('browShape','parallel'),'平行眉を収録');
eq(CAW.data.byOption('browShape','worried').promptEn,'slightly drooping eyebrows','困り眉を造形表現で収録');
ok(!!CAW.data.byOption('eyeHighlights','minimal'),'ハイライト少なめを収録');
ok(!!CAW.data.byOption('eyeHighlights','none'),'ハイライトなしを収録');
ok(!!CAW.data.byOption('eyeImpression','vacant'),'虚ろな目を収録');
ok(!!CAW.data.byOption('eyeImpression','lifeless'),'生気のない目を収録');
ok(['piercingUsage','piercingPosition','piercingCount','piercingStyle'].every(id=>!!CAW.data.byField(id)),'ピアス4軸を収録');
const ids=new Set();
CAW.data.fields.forEach(field=>{
  ok(field.id&&field.labelJa&&field.category,'フィールド必須値');
  ok(['single','multi'].includes(field.selectionMode),'選択方式');
  ok(field.allowEmpty===true,'未選択可能');
  field.options.forEach(option=>{
    ok(option.id&&option.labelJa&&option.promptEn,'候補必須値');
    const key=field.id+':'+option.id;ok(!ids.has(key),'候補ID重複なし '+key);ids.add(key);
    ok(option.category===field.category&&option.field===field.id,'候補の所属');
    ok(Number.isFinite(option.priority),'優先度');
    if(option.colorValue)ok(/^#[0-9A-Fa-f]{6}$/.test(option.colorValue),'色形式');
  });
});
CAW.data.presets.forEach(p=>{
  ok(p.id&&p.group&&p.labelJa&&p.patch,'プリセット必須値');
  Object.entries(p.patch).forEach(([field,value])=>{
    const f=CAW.data.byField(field);ok(f,'プリセット参照フィールド '+field);
    (Array.isArray(value)?value:[value]).forEach(id=>ok(!!CAW.data.byOption(field,id),'プリセット参照候補 '+field+':'+id));
  });
});
const expectedPresetCounts={'顔立ち':13,'目元':20,'眉':12,'髪型':37,'体格':15,'配色':17};
eq(Object.fromEntries(CAW.presetUi.groups().map(group=>[group,CAW.presetUi.list(group).length])),expectedPresetCounts,'カテゴリ別プリセット件数');
ok(CAW.data.presets.length===114,'既存98件＋髪型16件');
const presetIds=new Set(),patchSignatures=new Set();
CAW.data.presets.forEach(p=>{
  ok(!presetIds.has(p.id),'プリセットID重複なし '+p.id);presetIds.add(p.id);
  const signature=JSON.stringify(Object.keys(p.patch).sort().map(key=>[key,p.patch[key]]));
  ok(!patchSignatures.has(signature),'同一パッチ重複なし '+p.id);patchSignatures.add(signature);
  const applied=CAW.state.patch(CAW.state.initial(),p.patch);
  ok(!CAW.advisor.check(applied).some(x=>x.level==='hard'),'プリセット単独適用でhardなし '+p.id);
  const restoredPreset=CAW.normalizer.parseJson(JSON.stringify(applied)).design;
  Object.keys(p.patch).forEach(field=>eq(restoredPreset.appearance[field],applied.appearance[field],'プリセットJSON往復 '+p.id+':'+field));
  no(CAW.generator.detailed(applied),new RegExp(p.labelJa),'プリセット名を英語出力へ混入しない '+p.id);
});
const previewPreset=CAW.data.presets.find(p=>p.id==='eyes_heavy_half');
let previewState=CAW.state.patch(CAW.state.initial(),{eyeShape:['almond'],upperEyelid:['heavy']});
const preview=CAW.presetUi.analyze(previewPreset,previewState);
eq([preview.added,preview.changed,preview.total],[1,1,2],'適用前確認の新規・変更・合計');
ok(preview.items.some(item=>item.beforeJa==='アーモンド型の目'&&item.afterJa==='半目がち'),'適用前確認の変更前後ラベル');
previewState=CAW.state.patch(previewState,previewPreset.patch);
eq(CAW.presetUi.analyze(previewPreset,previewState).total,0,'同一プリセット再適用は変更なし');
previewState=CAW.state.remove(previewState,'eyeShape','half_lidded');
eq(previewState.appearance.eyeShape,[],'プリセット適用後に個別解除');
CAW.data.rules.forEach(r=>ok(r.id&&['hard','warning','info','suggestion'].includes(r.level),'ルール必須値'));

let s=CAW.state.initial();
ok(s.type==='character-appearance-design'&&s.schemaVersion==='0.2','初期状態');
ok(Object.keys(s.appearance).length===CAW.data.fields.length,'全フィールド初期化');
s=CAW.state.set(s,'faceShape','oval');eq(s.appearance.faceShape,'oval','単一選択追加');
s=CAW.state.set(s,'faceShape','round');eq(s.appearance.faceShape,'round','単一選択置換');
s=CAW.state.set(s,'faceShape','round');eq(s.appearance.faceShape,null,'単一選択解除');
s=CAW.state.set(s,'eyeShape','round');s=CAW.state.set(s,'eyeShape','half_lidded');eq(s.appearance.eyeShape,['round','half_lidded'],'複数選択保持');
s=CAW.state.remove(s,'eyeShape','round');eq(s.appearance.eyeShape,['half_lidded'],'複数選択解除');
const bad=CAW.normalizer.normalize({appearance:{faceShape:'missing',eyeShape:['round','missing','round']},customTags:{face:[' x ','x','']}});
eq(bad.appearance.faceShape,null,'不正単一値除去');eq(bad.appearance.eyeShape,['round'],'不正複数値除去');eq(bad.customTags.face,['x'],'追加タグ正規化');
const old=CAW.normalizer.normalize({selections:{faceShape:'oval'}});eq(old.appearance.faceShape,'oval','旧形式読込');
const round=CAW.normalizer.parseJson(JSON.stringify(s));ok(round.kind==='design','JSON往復');
let rejected=false;try{CAW.normalizer.parseJson('{bad');}catch(e){rejected=true;}ok(rejected,'壊れたJSON拒否');

s=select(CAW.state.initial(),{genderPresentation:'androgynous',ageImpression:'young_adult',faceShape:'oval',jawShape:'narrow',eyeShape:['half_lidded'],upperEyelid:['heavy'],irisColor:'gray',browShape:'straight',hairLength:'short',parting:'center',baseCut:['layered_short'],hairColor:'blue_black',height:'tall',silhouette:'petite',shoulders:'narrow'});
const compact=CAW.generator.short(s),detail=CAW.generator.detailed(s),ja=CAW.generator.summaryJa(s);
ok(compact.includes('androgynous appearance')&&compact.includes('gray eyes')&&compact.includes('blue-black hair'),'短縮プロンプト主要要素');
ok(detail.includes('heavy upper eyelids')&&detail.includes('narrow shoulders'),'詳細プロンプト');
ok(ja.includes('基本：')&&ja.includes('目・瞳：')&&ja.includes('身体つき：'),'日本語まとめ');
ok(CAW.generator.basicJa(s).includes('卵型'),'基本の外見一覧');
eq(CAW.generator.arrangeJa(s),'','アレンジ空');
ok(CAW.generator.faceVerify(s).includes('neutral expression'),'顔確認用');
ok(CAW.generator.bodyVerify(s).includes('entire body visible'),'身体確認用');
ok(CAW.generator.faceVerify(s).includes('head-and-shoulders portrait'),'顔確認用の安全な画角');
no(CAW.generator.faceVerify(s),/bust up|bust portrait/i,'顔確認用にbust表現なし');
['full body','full-body character reference','head to toe','feet visible','centered composition','plain white background'].forEach(tag=>ok(CAW.generator.bodyVerify(s).includes(tag),'身体確認用の全身補助 '+tag));
const basePrompt=CAW.generator.bodyPrompt(s);ok(basePrompt.includes('oval face')&&basePrompt.includes('petite build'),'素体プロンプト');
no(basePrompt,/plain|background|standing|full body|portrait|shirt|clothing|neutral expression/i,'素体へ確認用要素を混入しない');
ok(detail.indexOf('androgynous appearance')<detail.indexOf('oval face'),'出力意味順');
eq(CAW.generator.dedupe(['Gray Eyes',' gray eyes ','x']),['Gray Eyes','x'],'大文字空白重複除去');
no(detail,/[ぁ-んァ-ヶ一-龠]/,'日本語が英語出力へ混入しない');
no(detail,/\([^)]*:\d|wings?|tails?|horns?|halo|smiling|angry|background|camera/i,'禁止要素・強調構文なし');
no(compact,/iris brightness|hair sheen|lip sheen/,'短縮版が微細タグを省略');
const custom=CAW.normalizer.normalize(s);custom.customTags.face=['custom detail','gray eyes'];ok(CAW.generator.detailed(custom).endsWith('custom detail'),'追加タグ末尾・重複整理');

let conflict=select(CAW.state.initial(),{hairLength:'short',baseCut:['straight'],bangs:['none','long'],irisPattern:['solid','heterochromia'],hairMulticolor:['none','split'],glassesUsage:'none',glassesShape:'round'});
let diagnostics=CAW.advisor.check(conflict);ok(diagnostics.filter(x=>x.level==='hard').length===5,'hard診断');
ok(diagnostics.every((x,i,a)=>a.findIndex(y=>y.id===x.id)===i),'診断重複なし');
ok(CAW.generator.detailed(conflict).length>0,'診断があっても出力');
eq(conflict.appearance.bangs,['none','long'],'提案を勝手に適用しない');
conflict=CAW.state.patch(conflict,diagnostics.find(x=>x.id==='bangs_conflict').patch);eq(conflict.appearance.bangs,['none'],'提案patchのみ適用');
let warn=select(CAW.state.initial(),{silhouette:'petite',muscle:'very_high',molePosition:['below_left_eye','below_right_eye','left_cheek'],scarPosition:['left_brow','right_brow']});
diagnostics=CAW.advisor.check(warn);ok(diagnostics.some(x=>x.level==='warning'),'warning診断');ok(diagnostics.some(x=>x.level==='info'),'info診断');
ok(CAW.advisor.check(CAW.state.initial()).some(x=>x.level==='suggestion'),'suggestion診断');
const piercing=select(CAW.state.initial(),{piercingUsage:'usual',piercingPosition:['earlobe','lip'],piercingCount:'multiple',piercingStyle:['small_stud','hoop']});
ok(CAW.generator.detailed(piercing).includes('earlobe piercing')&&CAW.generator.bodyPrompt(piercing).includes('lip piercing'),'ピアスを詳細・素体へ出力');
diagnostics=CAW.advisor.check(piercing);
ok(diagnostics.some(x=>x.id==='too_many_piercings'),'多数ピアスwarning');
ok(diagnostics.some(x=>x.id==='small_piercing'),'小さいピアスinfo');
ok(diagnostics.some(x=>x.id==='mouth_piercing'),'口元ピアスinfo');
const piercingRound=CAW.normalizer.parseJson(JSON.stringify(piercing)).design;
eq(piercingRound.appearance.piercingPosition,['earlobe','lip'],'ピアス位置JSON往復');
eq(piercingRound.appearance.piercingCount,'multiple','ピアス数JSON往復');
eq(piercingRound.appearance.piercingUsage,'usual','ピアス扱いJSON往復');
const optionalPiercing=select(CAW.state.initial(),{piercingUsage:'optional',piercingPosition:['ear'],piercingStyle:['hoop']});
no(CAW.generator.bodyPrompt(optionalPiercing),/piercing|earring/i,'必要な時だけのピアスは素体から除外');
ok(CAW.generator.arrangeJa(optionalPiercing).includes('ピアス'),'必要な時だけのピアスはアレンジへ分類');

CAW.storage.saveDraft(s);eq(CAW.storage.loadDraft().appearance.faceShape,'oval','自動保存復元');
const saved=CAW.storage.save(s,'テスト人物');ok(CAW.storage.list().length===1&&saved.name==='テスト人物','名前付き保存');
const dup=CAW.storage.duplicate(saved.id);ok(dup&&CAW.storage.list().length===2,'複製');
ok(CAW.storage.libraryJson().includes('character-appearance-library'),'全保存バックアップ');
CAW.storage.remove(saved.id);ok(CAW.storage.list().length===1,'削除');

const cases=[
  {name:'中性的で華奢な美青年',patch:{genderPresentation:'androgynous',ageImpression:'young_adult',faceShape:'oval',jawShape:'narrow',eyeShape:['half_lidded'],upperEyelid:['heavy'],irisColor:'gray',browShape:'straight',hairLength:'short',parting:'center',baseCut:['layered_short'],hairColor:'black',height:'tall',silhouette:'petite',shoulders:'narrow'}},
  {name:'がっしりした成人男性',patch:{genderPresentation:'masculine',ageImpression:'adult',overallDirection:'defined',jawShape:'broad',browThickness:'thick',hairLength:'short',baseCut:['crop'],shoulders:'broad',chest:'thick',silhouette:'muscular',neckThickness:'thick'}},
  {name:'柔らかい顔立ちの女性',patch:{genderPresentation:'feminine',ageImpression:'adult',faceShape:'oval',cheeks:'soft',eyeShape:['downturned'],eyeSize:'large',upperLashes:['natural'],browShape:'soft_arch',hairLength:'long',silhouette:'average'}},
  {name:'幼い印象の少女',patch:{genderPresentation:'girlish',ageImpression:'child',faceShape:'round',eyeShape:['round'],eyeSize:'large',jawShape:'short',noseTip:'small',hairLength:'chin',baseCut:['bob'],height:'short'}},
  {name:'固有特徴のある人物',patch:{molePosition:['below_left_eye'],moleSize:'small',scarPosition:['left_brow'],scarType:['thin'],glassesUsage:'usual',glassesShape:'round',frameThickness:'thin'}}
];
cases.forEach(c=>{const x=select(CAW.state.initial(),c.patch),d=CAW.generator.detailed(x);ok(CAW.generator.short(x).length>0,c.name+'短縮');ok(d.length>0,c.name+'詳細');ok(CAW.generator.summaryJa(x).length>0,c.name+'日本語');ok(Array.isArray(CAW.advisor.check(x)),c.name+'診断');if(c.name.includes('少女'))no(d,/adult|mature|full lips|plump/i,'少女へ成人的タグなし');});

const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),css=fs.readFileSync(path.join(root,'styles.css'),'utf8');
const appSource=fs.readFileSync(path.join(root,'app.js'),'utf8');
ok(/aria-expanded/.test(html)&&/aria-live/.test(html),'ARIA構造');
ok(/viewport-fit=cover/.test(html)&&/safe-area-inset-bottom/.test(css),'スマホセーフエリア');
ok(/min-height:44px/.test(css),'44pxタップ領域');
ok(/max-width:360px/.test(css),'320px級レイアウト');
ok(/全項目リセット/.test(html)&&/data-reset/.test(html)&&/confirm\('現在の編集内容を初期化/.test(appSource),'全項目リセットと確認');
ok(/data-back-to-top/.test(html)&&/scrollY<500/.test(appSource)&&/behavior:'smooth'/.test(appSource),'上へ戻る表示とスムーズスクロール');
ok(/role="tablist"/.test(appSource)&&/aria-selected/.test(appSource)&&/data-preset-group/.test(appSource),'6カテゴリのタブARIA');
ok(/data-preset-more/.test(appSource)&&/表示を減らす/.test(appSource)&&/initialVisible/.test(appSource),'もっと見ると表示を減らす');
ok(/preset-count/.test(appSource)&&/summaryJa/.test(appSource)&&/項目を設定/.test(appSource),'プリセットカードの説明と項目数');
ok(/data-confirm-preset/.test(html)&&/preset-impact-list/.test(html)&&/presetUi\.analyze/.test(appSource),'適用前の変更内容確認');
ok(/\.preset-grid\{[^}]*repeat\(4/.test(css)&&/@media\(max-width:700px\)[\s\S]*?\.preset-grid\{grid-template-columns:repeat\(2/.test(css)&&/@media\(max-width:300px\)[\s\S]*?\.preset-grid\{grid-template-columns:1fr/.test(css),'プリセットグリッド4列・2列・1列');
ok(/word-break:keep-all/.test(css)&&/brand h1 span/.test(css)&&/intro h2 span/.test(css),'タイトルと導入見出しの意味単位改行');
ok(['face_ethereal','eyes_cold_elongated','brow_thick_parallel','hair_low_ponytail','body_sports','color_deep_jewel'].every(id=>CAW.data.presets.some(p=>p.id===id)),'Phase 2A代表プリセット');
console.log(`PASS ${passed} assertions | ${options.length} options | ${CAW.data.presets.length} presets | ${CAW.data.rules.length} rules`);
require('./face-tests.js');
require('./color-tests.js');
