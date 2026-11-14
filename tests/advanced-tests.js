'use strict';
// 高度な設定・Markdown出力・HEXカラー指定のテスト。run-tests.js から読み込む。
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
let n=0;function ok(x,m){assert.ok(x,m);n++;}function eq(a,b,m){assert.deepEqual(a,b,m);n++;}
const G=CAW.generator,S=CAW.state,N=CAW.normalizer,F=CAW.face,H=CAW.hex,A=CAW.advanced,ST=CAW.storage,D=CAW.data;
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),readme=fs.readFileSync(path.join(root,'README.md'),'utf8');
const LEGACY=['short','detailed','bodyPrompt','summaryJa','basicJa','arrangeJa','faceVerify','bodyVerify'];
function legacy(s){const o={};LEGACY.forEach(k=>o[k]=G[k](s));['fixed','variable','excluded'].forEach(l=>o['block_'+l]=F.block(s,l));o.pixai=F.pixai(s);o.negative=F.negative(s);Object.keys(F.views).forEach(v=>o['view_'+v]=F.positive(s,v));return o;}
let seed=20261114;function rnd(){seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff;}
function randomState(){const a={};D.fields.forEach(f=>{if(rnd()<0.4){const pick=()=>f.options[Math.floor(rnd()*f.options.length)].id;a[f.id]=f.selectionMode==='multi'?[pick()].concat(rnd()<0.4?[pick()]:[]):pick();}});
  let s=N.normalize({appearance:a,customTags:{face:rnd()<0.3?['sharp gaze']:[],hair:rnd()<0.3?['ahoge','straight hair']:[],general:rnd()<0.3?['calm aura']:[]},faceProfile:{leftRightBasis:rnd()<0.3?'screen':'character'}});
  F.entries(s).forEach(e=>{if(rnd()<0.1)s=F.setLayer(s,e.key,'excluded');});return s;}
const randoms=Array.from({length:150},randomState);

// ---- 高度な設定（端末側のUI設定）----
eq(ST.loadUi(),{advanced:false,markdown:false,hex:false,format:null,scope:'detailed'},'初期値は高度な設定OFF');
eq(ST.normalizeUi({advanced:'yes',markdown:1,hex:null,format:'x',scope:'y'}),{advanced:false,markdown:false,hex:false,format:null,scope:'detailed'},'不正なUI設定はOFFへ');
ok(ST.keys.ui==='caw_ui_settings_v1'&&ST.keys.draft==='caw_draft_v01'&&ST.keys.library==='caw_library_v01'&&F.key==='caw_face_library_v1','既存のlocalStorageキーは不変、UI設定は別キー');
ST.saveUi({advanced:true,markdown:true,hex:false,format:'markdown',scope:'short'});eq(ST.loadUi(),{advanced:true,markdown:true,hex:false,format:'markdown',scope:'short'},'UI設定を保存・復元');
ST.saveUi({advanced:false,markdown:true,hex:true});eq(ST.loadUi().markdown&&ST.loadUi().hex&&!ST.loadUi().advanced,true,'OFFにしても下位設定を保持');
ok(!('advanced' in S.initial())&&!('advanced' in S.initial().preferences),'表示設定は外見データに含めない');
[[{advanced:false,markdown:true,hex:true},[]],[{advanced:true,markdown:false,hex:false},[]],[{advanced:true,markdown:true,hex:false},['markdown']],[{advanced:true,markdown:false,hex:true},['tagsHex']],[{advanced:true,markdown:true,hex:true},['tagsHex','markdown','markdownHex']]].forEach(([ui,expected])=>eq(A.available(ui).map(f=>f.id),expected,'表示条件 '+JSON.stringify(ui)));
ok(/id="advanced-toggle" type="checkbox" role="switch"/.test(html)&&!/id="advanced-toggle"[^>]*checked/.test(html),'高度な設定スイッチは初期OFF');
ok(html.includes('Markdown形式のプロンプト出力や、HEXコードを使った細かな配色指定ができます。')&&html.includes('Markdown形式の出力を有効にする')&&html.includes('HEXコードによる色指定を有効にする'),'高度な設定の文言');
ok(/id="advanced-options"[^>]*hidden/.test(html)&&/id="advanced-outputs"[^>]*hidden/.test(html),'下位設定と高度な出力は初期非表示');
ok(html.indexOf('id="advanced-settings"')>html.indexOf('id="design-title"')&&html.indexOf('id="advanced-settings"')<html.indexOf('id="accordions"'),'外見設計セクションの冒頭に配置');
ok(html.indexOf('hex-color.js')>html.indexOf('color-details.js')&&html.indexOf('advanced-output.js')>html.indexOf('generator.js')&&html.indexOf('advanced-ui.js')<html.indexOf('"app.js"'),'スクリプトの読込順');

// ---- HEXの入力仕様 ----
eq(H.normalizeHex('#c8ccd6'),'#C8CCD6','小文字を大文字へ');eq(H.normalizeHex('c8ccd6'),'#C8CCD6','#なし6桁');eq(H.normalizeHex(' #abc '),'#AABBCC','3桁');eq(H.normalizeHex('＃ｃ８ｃｃｄ６'),'#C8CCD6','全角');
['','#','#12','#1234','#12345','#1234567','#GGGGGG','red','rgb(1,2,3)',null,undefined,123456,{},[]].forEach(v=>eq(H.normalizeHex(v),null,'不正値を拒否 '+JSON.stringify(v)));
eq(H.fields.length,17,'対応部位 瞳7・髪9・肌1');ok(H.fields.every(id=>D.byField(id)&&H.neutral[id]),'対応部位は既存フィールドIDと中立表現を持つ');
let s=S.patch(S.initial(),{hairColor:'silver',irisColor:'blue_gray',skinTone:'fair',faceShape:'oval'});
eq(s.hexColors,{},'HEXは初期未設定');const noHex=legacy(s);
ok(A.tags(s,{hex:true})===G.detailed(s),'HEX未設定ならHEX付きタグは従来の詳細と同じ（自動割り当てなし）');
s=H.set(s,'hairColor','c8ccd6');s=H.set(s,'irisColor','#748da8');s=H.set(s,'skinTone','#F4DED8');
eq(s.hexColors,{hairColor:'#C8CCD6',irisColor:'#748DA8',skinTone:'#F4DED8'},'HEXを設定');
eq(H.set(s,'hairColor','nope').hexColors.hairColor,'#C8CCD6','不正値では既存値を変えない');eq(H.set(s,'faceShape','#123456').hexColors,s.hexColors,'対象外フィールドは無視');eq(H.set(s,'hairColor',null).hexColors.hairColor,undefined,'HEXを初期化');eq(H.clearAll(s).hexColors,{},'全解除');
eq(legacy(s),noHex,'HEXを設定しても従来の出力・顔ID・LoRA出力は不変');
const b=A.tags(s,{hex:true});ok(b.includes('silver hair (#C8CCD6)')&&b.includes('blue-gray eyes (#748DA8)')&&b.includes('fair skin (#F4DED8)'),'B 色名とHEXを併記 '+b);
ok(!/(^|, )\(?#[0-9A-F]{6}\)?(,|$)/.test(b),'色名をHEXへ置換しない');eq(b.replace(/ \(#[0-9A-F]{6}\)/g,'').replace(/\(#[0-9A-F]{6}, /g,'('),G.detailed(s),'HEXを除けば従来の詳細と一致');
eq(A.tags(s,{hex:true,scope:'short'}).replace(/ \(#[0-9A-F]{6}\)/g,'').replace(/\(#[0-9A-F]{6}, /g,'('),G.short(s),'短縮＋HEX');eq(A.tags(s,{hex:true,scope:'base'}).replace(/ \(#[0-9A-F]{6}\)/g,'').replace(/\(#[0-9A-F]{6}, /g,'('),G.bodyPrompt(s),'素体＋HEX');
randoms.forEach((r,i)=>{eq(A.tags(r,{hex:false}),G.detailed(r),'HEX無効のタグ＝詳細 '+i);eq(A.tags(r,{hex:false,scope:'short'}),G.short(r),'HEX無効のタグ＝短縮 '+i);eq(A.tags(r,{hex:false,scope:'base'}),G.bodyPrompt(r),'HEX無効のタグ＝素体 '+i);eq(A.tags(r,{hex:true}),G.detailed(r),'HEX未設定で従来出力が変化しない '+i);
  H.fields.forEach(id=>{if(r.appearance[id]&&!(F.isFace(id,r.appearance[id])&&F.layer(r,id+':'+r.appearance[id])==='excluded'))eq(H.tag(r,id),CAW.colors.tag(r,id,r.appearance[id]),'HEXなしの優先順位は color-details と一致 '+id);});});
// 色名なし・HEXのみ
let only=H.set(S.initial(),'hairColor','#C8CCD6');eq(A.tags(only,{hex:true}),'hair color (#C8CCD6)','HEXのみは部位名付きの中立表現');eq(G.detailed(only),'','HEXのみでも従来出力は空のまま');eq(A.tags(only,{hex:false}),'','HEX無効ならHEXのみの部位は出さない');
only=H.set(only,'skinTone','#F4DED8');only=H.set(only,'irisColor','#748DA8');ok(A.tags(only,{hex:true}).includes('eye color (#748DA8)')&&A.tags(only,{hex:true}).includes('skin color (#F4DED8)'),'瞳・肌のHEXのみ');

// ---- 既存の色指定ロジックとの整合性（指示書の例①〜④）----
let eye=S.patch(S.initial(),{irisColor:'gray',irisLeftColor:'blue',irisRightColor:'red'});eye=H.set(eye,'irisColor','#808080');eye=H.set(eye,'irisLeftColor','#3366CC');eye=H.set(eye,'irisRightColor','#CC2233');
let out=A.tags(eye,{hex:true});ok(out.includes('blue left eye (#3366CC, ')&&out.includes('red right eye (#CC2233, ')&&!out.includes('gray')&&!out.includes('#808080'),'例① 左右の瞳色を優先し基本色とそのHEXを重複させない '+out);
ok(out.includes("blue left eye (#3366CC, character's own left/right)")&&!/\) \(/.test(out),'左右は本人基準を維持し、括弧は1つにまとめる');eq(out.replace(/\(#[0-9A-F]{6}, /g,'('),G.detailed(eye),'HEXを除けば従来の左右指定と同じ文字列');eye.faceProfile.leftRightBasis='screen';ok(A.tags(eye,{hex:true}).includes('(#3366CC, image-space left/right)')&&A.markdown(eye,{hex:true}).includes('(#3366CC, image-space left/right)')&&G.detailed(eye).includes('blue left eye (image-space left/right)'),'画面基準を維持');eye.faceProfile.leftRightBasis='character';
let one=S.remove(eye,'irisRightColor','red');one=H.set(one,'irisRightColor',null);ok(A.tags(one,{hex:true}).includes("gray right eye (#808080, character's own left/right)"),'片目だけ指定なら基本色とそのHEXを反対の目へ');
one=H.set(one,'irisRightColor','#CC2233');out=A.tags(one,{hex:true});ok(out.includes("right eye color (#CC2233, character's own left/right)")&&!out.includes('#808080'),'HEXのみの右目も指定済みとして基本色を重ねない '+out);eq(G.detailed(one),G.detailed(H.clearAll(one)),'その場合も従来出力は不変');
let ex=F.setLayer(eye,'irisLeftColor:blue','excluded');out=A.tags(ex,{hex:true});ok(!out.includes('#3366CC')&&!out.includes('blue left eye'),'除外タグのHEXはポジティブへ漏れない '+out);ok(!A.markdown(ex,{hex:true}).includes('#3366CC'),'Markdownにも漏れない');ok(out.includes("gray left eye (#808080, character's own left/right)"),'除外した側は基本色を継承');eq(F.block(ex,'excluded'),F.block(H.clearAll(ex),'excluded'),'ネガティブブロックは不変');
let ring=S.patch(S.initial(),{irisColor:'gray_green',irisInnerColor:'teal',irisOuterColor:'violet',irisRingColor:'gold',irisSectorColor:'amber'});['irisColor','irisInnerColor','irisOuterColor','irisRingColor','irisSectorColor'].forEach((id,i)=>ring=H.set(ring,id,'#11223'+i));out=A.tags(ring,{hex:true});
ok(['teal inner irises (#112231)','violet outer irises (#112232)','golden central iris rings (#112233)','amber iris sectors (#112234)'].every(t=>out.includes(t))&&!out.includes('#112230'),'虹彩の内外・リング・部分異色 '+out);
let hetero=H.set(S.patch(S.initial(),{irisColor:'heterochromatic'}),'irisColor','#123456');eq(A.tags(hetero,{hex:true}),'heterochromatic eyes','オッドアイの基本色にはHEXを付けない');ok(!H.status(hetero)[0].active,'その場合は保持のみ');
let hair=S.patch(S.initial(),{hairColor:'black',hairMulticolor:['gradient'],hairRootColor:'blue',hairTipColor:'pink'});hair=H.set(hair,'hairColor','#111111');hair=H.set(hair,'hairRootColor','#2244AA');hair=H.set(hair,'hairTipColor','#FF66AA');
out=A.tags(hair,{hex:true});ok(out.includes('blue hair roots (#2244AA)')&&out.includes('pink hair tips (#FF66AA)')&&!out.includes('black hair')&&!out.includes('#111111'),'例② グラデーションは根元と毛先を優先 '+out);
let single=S.patch(hair,{hairMulticolor:['none']});out=A.tags(single,{hex:true});ok(out.includes('black hair (#111111)')&&!out.includes('#FF66AA')&&!out.includes('#2244AA'),'例③ 単色では毛先のHEXを出さない '+out);eq(single.hexColors.hairTipColor,'#FF66AA','例③ 毛先のHEX設定値は保持');
eq(H.status(single).filter(x=>!x.active).map(x=>x.field),['hairRootColor','hairTipColor'],'保持のみの部位を判別');ok(A.tags(S.patch(single,{hairMulticolor:['gradient']}),{hex:true}).includes('pink hair tips (#FF66AA)'),'例③ グラデーションへ戻すと復元');
let tipOnly=H.set(S.patch(S.initial(),{hairColor:'black',hairMulticolor:['none']}),'hairTipColor','#FF66AA');eq(A.tags(tipOnly,{hex:true}),G.detailed(tipOnly),'単色ではHEXのみの毛先も出さない');
let split=S.patch(S.initial(),{hairColor:'white',hairMulticolor:['split'],hairLeftColor:'black'});split=H.set(split,'hairColor','#FFFFFF');split=H.set(split,'hairLeftColor','#000000');ok(A.tags(split,{hex:true}).includes("white hair on the character's right side (#FFFFFF)")&&A.tags(split,{hex:true}).includes("black hair on the character's left side (#000000)"),'左右別色＋HEX');
split=H.set(split,'hairRightColor','#CC0000');out=A.tags(split,{hex:true});ok(out.includes("hair color on the character's right side (#CC0000)")&&!out.includes('white hair'),'HEXのみの右側も指定済みとして扱う '+out);
let mis=H.set(S.patch(S.initial(),{hairColor:'blue'}),'hairColor','#CC2222');ok(H.mismatch(mis,'hairColor'),'例④ 青髪に赤系HEXは不一致');eq(mis.appearance.hairColor,'blue','例④ 選択色を書き換えない');eq(mis.hexColors.hairColor,'#CC2222','例④ HEXを書き換えない');ok(A.tags(mis,{hex:true}).includes('blue hair (#CC2222)'),'例④ 警告のみでそのまま出力');
ok(!H.mismatch(H.set(mis,'hairColor','#3A6FB0'),'hairColor'),'近い色は不一致としない');ok(H.mismatch(H.set(S.patch(S.initial(),{hairColor:'black'}),'hairColor','#FFFFFF'),'hairColor'),'明暗の極端な違い');ok(!H.mismatch(H.set(S.initial(),'hairColor','#FFFFFF'),'hairColor'),'色名未選択は判定しない');
D.byField('hairColor').options.forEach(o=>ok(!H.mismatch(H.set(S.patch(S.initial(),{hairColor:o.id}),'hairColor',o.colorValue),'hairColor'),'辞書の色見本と同じHEXは不一致にしない '+o.id));
D.byField('skinTone').options.forEach(o=>{const x=S.patch(S.initial(),{skinTone:o.id});ok(H.normalizeHex(H.reference(x,'skinTone')),'肌色の目安 '+o.id);eq(x.hexColors,{},'目安は自動で割り当てない');});
eq(H.toHsv('#FF0000'),{h:0,s:1,v:1},'HEX→HSV');['#C8CCD6','#748DA8','#000000','#FFFFFF','#123456'].forEach(h=>eq(H.fromHsv(H.toHsv(h)),h,'HSV往復 '+h));

// ---- Markdown ----
let md=S.patch(S.initial(),{genderPresentation:'masculine',faceShape:'oval',jawline:'soft',eyeShape:['almond','narrow'],irisColor:'blue_gray',hairLength:'long',hairColor:'silver',skinTone:'fair',silhouette:'slender',shoulders:'narrow',molePosition:['below_left_eye'],browShape:'straight',noseTip:'small',lipFullness:'thin',impression:['delicate']});
md.customTags.hair=['ahoge','silver hair'];md.customTags.general=['calm aura'];md.customTags.face=['sharp gaze'];md=N.normalize(md);
const c=A.markdown(md);
eq(c.split('\n').filter(l=>l.startsWith('## ')),['## Character','## Face','## Eyes','## Eyebrows','## Nose','## Mouth','## Hair','## Skin','## Body','## Identifying Features','## Overall Impression'],'C 見出しは固定順で選択したカテゴリだけ');
ok(c.split('\n').every(l=>/^## [A-Z]/.test(l)||/^- [A-Z][^:]*: \S/.test(l)),'見出しは##、項目は「- ラベル: 値」');
ok(c.includes('## Eyes\n- Eye shape: almond-shaped eyes, narrow eyes\n- Iris color: blue-gray eyes\n## Eyebrows'),'複数選択は1行にまとめる');ok(c.includes('- Hair color: silver hair\n- Additional: ahoge\n## Skin')&&c.match(/silver hair/g).length===1,'自由入力は該当カテゴリへ、重複は出さない');ok(c.includes('- Additional: sharp gaze\n## Eyes')&&c.endsWith('- Additional: calm aura'),'自由入力の配置');
ok(!/glass|piercing|Accessories/i.test(c)&&!c.includes('Jawline: \n'),'未選択の項目・空の見出しは出さない');ok(!c.includes('#C8')&&!/\(#/.test(c),'CはHEXなし');
let mdHex=H.set(H.set(H.set(md,'hairColor','#C8CCD6'),'irisColor','#748DA8'),'skinTone','#F4DED8');const d=A.markdown(mdHex,{hex:true});
ok(d.includes('- Hair color: silver hair (#C8CCD6)')&&d.includes('- Iris color: blue-gray eyes (#748DA8)')&&d.includes('- Skin tone: fair skin (#F4DED8)'),'D Markdown＋HEX');eq(d.replace(/ \(#[0-9A-F]{6}\)/g,'').replace(/\(#[0-9A-F]{6}, /g,'('),c,'DからHEXを除くとCと一致');eq(A.markdown(mdHex),c,'HEX設定済みでもCは色名のみ');
eq(A.render(mdHex,'markdown','detailed'),c,'render: Markdown');eq(A.render(mdHex,'markdownHex','detailed'),d,'render: Markdown＋HEX');eq(A.render(mdHex,'tagsHex','detailed'),A.tags(mdHex,{hex:true}),'render: タグ＋HEX');
eq(A.markdown(S.initial()),'','未選択なら空');eq(A.markdown(H.set(S.initial(),'hairColor','#C8CCD6'),{hex:true}),'## Hair\n- Hair color: hair color (#C8CCD6)','HEXのみのMarkdown');
let mdEx=F.setLayer(F.setLayer(md,'eyeShape:narrow','excluded'),'custom:face:sharp gaze','excluded');ok(!A.markdown(mdEx).includes('narrow eyes')&&!A.markdown(mdEx).includes('sharp gaze')&&A.markdown(mdEx).includes('almond-shaped eyes'),'顔IDの除外タグ・除外した自由入力は含めない');
let lr=S.patch(S.initial(),{irisColor:'gray',irisLeftColor:'blue',molePosition:['below_left_eye']});ok(A.markdown(lr).includes("- Iris color: gray right eye (character's own left/right)\n- Left eye color: blue left eye (character's own left/right)"),'左右指定と基本色直後の並び '+A.markdown(lr));
let gl=S.patch(S.initial(),{glassesUsage:'optional',glassesShape:'round',piercingUsage:'none',piercingPosition:['earlobe']});ok(A.markdown(gl).includes('## Accessories\n- Glasses: round glasses')&&!A.markdown(gl).includes('piercing'),'メガネ・ピアスの扱いは従来の詳細と同じ');eq(A.markdown(gl,{scope:'short'}),'','短縮・素体では任意のメガネを出さない（従来どおり）');
eq(A.markdown(S.patch(S.initial(),{ageImpression:'adult'})),'## Character\n- Age impression: grown person','年齢語句の置換を維持');
D.fields.forEach(f=>{ok(f.id==='glassesUsage'||f.id==='piercingUsage'||!!A.labels[f.id],'Markdownの項目ラベル '+f.id);ok(A.sections.some(x=>x[0]===A.sectionOf(f)),'Markdownのカテゴリ '+f.id);});
const order=A.sections.map(x=>'## '+x[1]);
randoms.forEach((r,i)=>{const m=A.markdown(r),lines=m?m.split('\n'):[],heads=lines.filter(l=>l.startsWith('## ')),values=lines.filter(l=>l.startsWith('- ')).flatMap(l=>l.slice(l.indexOf(': ')+2).split(', '));
  eq(heads.slice().sort((x,y)=>order.indexOf(x)-order.indexOf(y)),heads,'カテゴリ順が一定 '+i);eq(new Set(heads).size,heads.length,'見出しの重複なし '+i);ok(lines.every((l,j)=>!l.startsWith('## ')||(lines[j+1]||'').startsWith('- ')),'空の見出しなし '+i);
  eq(values.slice().sort(),(G.detailed(r)?G.detailed(r).split(', '):[]).sort(),'Markdownの内容は詳細プロンプトと同じタグ集合（重複・除外なし） '+i);
  const sm=A.markdown(r,{scope:'short'});eq((sm?sm.split('\n'):[]).filter(l=>l.startsWith('- ')).flatMap(l=>l.slice(l.indexOf(': ')+2).split(', ')).sort(),(G.short(r)?G.short(r).split(', '):[]).sort(),'短縮Markdown＝短縮プロンプトのタグ集合 '+i);
  const bm=A.markdown(r,{scope:'base'});eq((bm?bm.split('\n'):[]).filter(l=>l.startsWith('- ')).flatMap(l=>l.slice(l.indexOf(': ')+2).split(', ')).sort(),(G.bodyPrompt(r)?G.bodyPrompt(r).split(', '):[]).sort(),'素体Markdown＝素体プロンプトのタグ集合 '+i);});
const evil=N.normalize({appearance:{},customTags:{general:['<img src=x onerror=alert(1)>','## Fake']}});ok(A.markdown(evil).split('\n').filter(l=>l.startsWith('## ')).length===1,'自由入力は見出しにならない');ok(/escapeHtml|esc\(text/.test(fs.readFileSync(path.join(root,'advanced-ui.js'),'utf8')),'高度な出力はエスケープして表示');

// ---- 保存形式・JSON互換性 ----
eq(S.initial().schemaVersion,'0.3','スキーマ0.3');
const oldJson=JSON.stringify({type:'character-appearance-design',schemaVersion:'0.2',appearance:{hairColor:'silver',irisColor:'gray'},faceProfile:{name:'旧顔'}});const migrated=N.parseJson(oldJson).design;eq(migrated.hexColors,{},'旧JSONはHEXなしで移行');eq(migrated.schemaVersion,'0.3','旧JSONを0.3へ');eq(migrated.appearance.hairColor,'silver','旧JSONの選択を維持');eq(N.parseJson(JSON.stringify({selections:{hairColor:'black'}})).design.hexColors,{},'0.1のselections形式も移行');
const round=N.parseJson(JSON.stringify(mdHex)).design;eq(round.hexColors,mdHex.hexColors,'新JSONでHEXを復元');eq(A.markdown(round,{hex:true}),d,'復元後の出力も一致');
const dirty=N.normalize({appearance:{hairColor:'black',skinTone:'fair'},customTags:{hair:['ahoge']},hexColors:{hairColor:'zzz',skinTone:'abc',irisColor:12,unknownField:'#123456',__proto__:'#000000',faceShape:'#FFFFFF'}});eq(dirty.hexColors,{skinTone:'#AABBCC'},'未知のフィールドIDと不正なHEXを捨てる');eq(dirty.appearance.hairColor,'black','不正データが他の内容を壊さない');eq(dirty.customTags.hair,['ahoge'],'自由入力も維持');
['x',42,[],['#FFFFFF'],null].forEach(v=>eq(N.normalize({appearance:{hairColor:'black'},hexColors:v}).hexColors,{},'hexColorsの型が不正でも安全 '+JSON.stringify(v)));
ST.saveDraft(mdHex);eq(ST.loadDraft().hexColors,mdHex.hexColors,'自動保存でHEXを保持');
const named=ST.save(mdHex,'HEXテスト');eq(ST.list().find(x=>x.id===named.id).hexColors,mdHex.hexColors,'名前付き保存でHEXを保持');const dup=ST.duplicate(named.id);ok(dup.id!==named.id,'複製は別ID');eq(dup.hexColors,mdHex.hexColors,'複製でHEXを保持');
const lib=N.parseJson(ST.libraryJson());ok(lib.designs.some(x=>x.hexColors.hairColor==='#C8CCD6'),'全バックアップにHEX');ok(JSON.parse(ST.libraryJson()).schemaVersion==='0.3','バックアップのスキーマ');
ST.saveUi({advanced:false});eq(ST.loadDraft().hexColors,mdHex.hexColors,'高度な設定OFFでも保存済みHEXは失われない');
eq(S.patch(mdHex,{hairColor:'black'}).hexColors,mdHex.hexColors,'色名を変えてもHEXは保持');eq(S.set(mdHex,'hairColor','silver').hexColors.hairColor,'#C8CCD6','色名を解除してもHEXは保持');eq(S.remove(mdHex,'irisColor','blue_gray').hexColors,mdHex.hexColors,'タグ解除でもHEXは保持');

// ---- 顔ID・LoRA ----
let fs1=S.patch(S.initial(),{faceShape:'oval',irisColor:'gray',irisLeftColor:'blue',irisRingColor:'gold',hairColor:'silver',skinTone:'fair'});[['irisColor','#808080'],['irisLeftColor','#3366CC'],['irisRightColor','#CC2233'],['irisInnerColor','#101010'],['irisOuterColor','#202020'],['irisRingColor','#D4AF37'],['irisSectorColor','#303030'],['hairColor','#C8CCD6'],['hairTipColor','#FF66AA'],['skinTone','#F4DED8']].forEach(p=>fs1=H.set(fs1,p[0],p[1]));fs1.faceProfile.name='HEXの顔';
const snap=F.snapshot(fs1);eq(Object.keys(snap.hexColors).sort(),['irisColor','irisInnerColor','irisLeftColor','irisOuterColor','irisRightColor','irisRingColor','irisSectorColor'],'顔IDには瞳のHEXだけを含める');ok(!snap.hexColors.hairColor&&!snap.hexColors.skinTone&&!snap.hexColors.hairTipColor,'髪・肌のHEXは顔IDに含めない');
const savedFace=F.save(fs1,true);eq(F.list().find(p=>p.id===savedFace.id).hexColors,snap.hexColors,'顔ID保存で瞳のHEXを保存');
let target=S.patch(S.initial(),{faceShape:'square',irisColor:'red',hairColor:'black',skinTone:'tan'});target=H.set(H.set(H.set(H.set(target,'irisColor','#AA0000'),'irisSectorColor','#00FF00'),'hairColor','#111111'),'skinTone','#BF8A5E');
const applied=F.apply(target,savedFace);eq(Object.fromEntries(Object.entries(applied.hexColors).filter(([k])=>k.startsWith('iris'))),snap.hexColors,'顔ID適用で瞳のHEXを復元（適用前の瞳HEXは置換）');eq(applied.hexColors.hairColor,'#111111','顔ID適用で髪のHEXは残る');eq(applied.hexColors.skinTone,'#BF8A5E','顔ID適用で肌のHEXは残る');eq(applied.appearance.hairColor,'black','髪の選択も残る');ok(!applied.faceProfile.hexColors,'編集中の顔メタにはHEXを重複保存しない');
const cleared=F.clear(applied);eq(cleared.hexColors,{hairColor:'#111111',skinTone:'#BF8A5E'},'顔だけリセットで瞳のHEXだけ消える');
const oldFace={id:'old-face',name:'旧顔ID',appearance:{faceShape:'oval',irisColor:'gray'},customTags:{face:[],eyes:[]},fixedTags:['faceShape:oval','irisColor:gray'],variableTags:[],excludedTags:[]};eq(F.validate(oldFace).hexColors,{},'HEXのない旧顔IDも読み込める');
const oldApplied=F.apply(applied,oldFace);ok(!Object.keys(oldApplied.hexColors).some(k=>k.startsWith('iris')),'旧顔IDの適用では瞳のHEXを未設定に');eq(oldApplied.hexColors.hairColor,'#111111','旧顔ID適用でも髪のHEXは残る');eq(oldApplied.appearance.irisColor,'gray','旧顔IDの選択を適用');
eq(F.importJson(JSON.stringify({type:'character-face-profile',schemaVersion:'0.2',faceProfile:oldFace}))[0].hexColors,{},'旧形式の顔JSON取込');eq(F.importJson(JSON.stringify({type:'character-face-profile',schemaVersion:'0.3',faceProfile:Object.assign({},snap,{id:'hex-face',hexColors:Object.assign({hairColor:'#C8CCD6'},snap.hexColors,{irisRingColor:'nope'})})}))[0].hexColors,Object.fromEntries(Object.entries(snap.hexColors).filter(([k])=>k!=='irisRingColor')),'顔JSONの髪HEX・不正HEXは取り込まない');
const diff=F.diff(F.snapshot(target),savedFace);ok(diff.hexChanges.some(x=>x.field==='irisColor'&&x.from==='#AA0000'&&x.to==='#808080')&&diff.hexChanges.some(x=>x.field==='irisSectorColor'&&x.from==='#00FF00'&&x.to==='#303030')&&diff.hexChanges.some(x=>x.field==='irisLeftColor'&&x.from===null),'顔IDの比較でHEXの差異を確認');eq(F.diff(savedFace,savedFace).hexChanges,[],'同じ顔はHEX差異なし');eq(F.diff(oldFace,oldFace).hexChanges,[],'旧顔ID同士の比較');ok(fs.readFileSync(path.join(root,'face-ui.js'),'utf8').includes('hexChanges'),'比較画面にHEX差分を表示');
eq(legacy(fs1),legacy(H.clearAll(fs1)),'LoRA学習用・顔ID・確認用の既存出力はHEXの有無で変わらない');

// ---- 回帰：高度な設定OFF相当（HEXなし）の出力は改修前と同一 ----
JSON.parse(fs.readFileSync(path.join(__dirname,'legacy-fixtures.json'),'utf8')).forEach((f,i)=>{const base=N.parseJson(JSON.stringify(f.input)).design;let withHex=base;H.fields.forEach((id,j)=>withHex=H.set(withHex,id,'#'+('00000'+(j*1234567%0xffffff).toString(16)).slice(-6)));
  Object.keys(f.expected).forEach(mode=>eq(G[mode](withHex),G.safePrompt(f.expected[mode]),'HEXを全部位に設定しても旧版の出力と一致 '+i+' '+mode));eq(base.hexColors,{},'旧フィクスチャはHEXなし '+i);});

// ---- ドキュメント ----
['高度な設定','Markdown','HEX','実験的','hexColors','silver hair (#C8CCD6)'].forEach(w=>ok(readme.includes(w),'READMEに記載 '+w));ok(!/必ず(?:精度|品質)が(?:上が|向上)/.test(readme),'効果を断定しない');
console.log('PASS '+n+' advanced settings, Markdown, and HEX assertions');
