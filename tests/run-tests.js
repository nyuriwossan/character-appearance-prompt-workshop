'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
global.window=global;
const memory={};
global.localStorage={getItem:k=>Object.prototype.hasOwnProperty.call(memory,k)?memory[k]:null,setItem:(k,v)=>{memory[k]=String(v);},removeItem:k=>{delete memory[k];}};
[
  'data/core.js','data/basic-face.js','data/eyes.js','data/features.js','data/hair.js','data/skin-body.js','data/marks.js','data/presets.js','data/rules.js',
  'state.js','normalizer.js','generator.js','advisor.js','storage.js'
].forEach(file=>vm.runInThisContext(fs.readFileSync(path.join(root,file),'utf8'),{filename:file}));
let passed=0;
function ok(value,message){if(!value)throw new Error(message);passed++;}
function eq(a,b,message){ok(JSON.stringify(a)===JSON.stringify(b),message+` (actual ${JSON.stringify(a)})`);}
function no(text,re,message){ok(!re.test(text),message);}
function select(s,patch){return CAW.state.patch(s,patch);}

const options=CAW.data.fields.flatMap(f=>f.options);
ok(options.length>=300,'候補が300件以上');
ok(CAW.data.fields.length>=70,'主要フィールドを網羅');
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
CAW.data.rules.forEach(r=>ok(r.id&&['hard','warning','info','suggestion'].includes(r.level),'ルール必須値'));

let s=CAW.state.initial();
ok(s.type==='character-appearance-design'&&s.schemaVersion==='0.1','初期状態');
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
ok(detail.indexOf('androgynous appearance')<detail.indexOf('oval face'),'出力意味順');
eq(CAW.generator.dedupe(['Gray Eyes',' gray eyes ','x']),['Gray Eyes','x'],'大文字空白重複除去');
no(detail,/[ぁ-んァ-ヶ一-龠]/,'日本語が英語出力へ混入しない');
no(detail,/\([^)]*:\d|wings?|tails?|horns?|halo|smiling|angry|background|camera/i,'禁止要素・強調構文なし');
no(compact,/iris brightness|hair sheen|lip sheen/,'短縮版が微細タグを省略');
const custom=CAW.normalizer.normalize(s);custom.customTags.face=['custom detail','gray eyes'];ok(CAW.generator.detailed(custom).endsWith('custom detail'),'追加タグ末尾・重複整理');

let conflict=select(CAW.state.initial(),{hairLength:'short',baseCut:['straight'],bangs:['none','long'],irisPattern:['solid','heterochromia'],hairMulticolor:['none','split']});
let diagnostics=CAW.advisor.check(conflict);ok(diagnostics.filter(x=>x.level==='hard').length===4,'hard診断');
ok(diagnostics.every((x,i,a)=>a.findIndex(y=>y.id===x.id)===i),'診断重複なし');
ok(CAW.generator.detailed(conflict).length>0,'診断があっても出力');
eq(conflict.appearance.bangs,['none','long'],'提案を勝手に適用しない');
conflict=CAW.state.patch(conflict,diagnostics.find(x=>x.id==='bangs_conflict').patch);eq(conflict.appearance.bangs,['none'],'提案patchのみ適用');
let warn=select(CAW.state.initial(),{silhouette:'petite',muscle:'very_high',molePosition:['below_left_eye','below_right_eye','left_cheek'],scarPosition:['left_brow','right_brow']});
diagnostics=CAW.advisor.check(warn);ok(diagnostics.some(x=>x.level==='warning'),'warning診断');ok(diagnostics.some(x=>x.level==='info'),'info診断');
ok(CAW.advisor.check(CAW.state.initial()).some(x=>x.level==='suggestion'),'suggestion診断');

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
ok(/aria-expanded/.test(html)&&/aria-live/.test(html),'ARIA構造');
ok(/viewport-fit=cover/.test(html)&&/safe-area-inset-bottom/.test(css),'スマホセーフエリア');
ok(/min-height:44px/.test(css),'44pxタップ領域');
ok(/max-width:360px/.test(css),'320px級レイアウト');
console.log(`PASS ${passed} assertions | ${options.length} options | ${CAW.data.presets.length} presets | ${CAW.data.rules.length} rules`);
