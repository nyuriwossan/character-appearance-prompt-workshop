(function (root) {
  'use strict';
  // 高度な出力（実験的）：英語タグ＋HEX、Markdown、Markdown＋HEX。
  // 既存の generator.js の出力は一切変更せず、同じ選択・除外・並び順のロジックを再利用して別形式を作る。
  var CAW=root.CAW,D=CAW.data,G=CAW.generator,H=CAW.hex;
  var SECTIONS=[['character','Character'],['face','Face'],['eyes','Eyes'],['eyebrows','Eyebrows'],['nose','Nose'],['mouth','Mouth'],['hair','Hair'],['skin','Skin'],['body','Body'],['identifying','Identifying Features'],['accessories','Accessories'],['impression','Overall Impression']];
  var CATEGORY_SECTION={basic:'character',face:'face',eyes:'eyes',hairStyle:'hair',hairColor:'hair',skin:'skin',body:'body',marks:'identifying',impression:'impression'};
  var CUSTOM_SECTION={face:'face',eyes:'eyes',hair:'hair',skin:'skin',body:'body',marks:'identifying',general:'impression'};
  var LABELS={genderPresentation:'Gender presentation',ageImpression:'Age impression',overallDirection:'Overall direction',faceShape:'Face shape',jawShape:'Chin',jawline:'Jawline',cheeks:'Cheeks',cheekbones:'Cheekbones',forehead:'Forehead',faceExtra:'Face details',
    eyeShape:'Eye shape',eyeSize:'Eye size',eyeHeight:'Eye height',eyeWidth:'Eye width',outerCorner:'Outer corners',upperEyelid:'Upper eyelids',eyelidFold:'Eyelid fold',lowerEyelid:'Lower eyelids',tearBags:'Under-eye',irisSize:'Iris size',upperLashes:'Upper lashes',lowerLashes:'Lower lashes',eyeAsymmetry:'Eye symmetry',
    irisColor:'Iris color',irisLeftColor:'Left eye color',irisRightColor:'Right eye color',irisInnerColor:'Inner iris color',irisOuterColor:'Outer iris color',irisRingColor:'Central iris ring',irisSectorColor:'Iris sector',irisPattern:'Iris pattern',irisBrightness:'Iris brightness',irisSaturation:'Iris saturation',eyeHighlights:'Eye highlights',eyeImpression:'Eye impression',
    browShape:'Eyebrow shape',browThickness:'Eyebrow thickness',browLength:'Eyebrow length',browDensity:'Eyebrow density',browDetail:'Eyebrow details',noseBridge:'Nose bridge',noseWidth:'Nose width',noseLength:'Nose length',noseTip:'Nose tip',
    mouthWidth:'Mouth width',lipFullness:'Lip fullness',lipRatio:'Lip ratio',lipContour:'Lip contour',restingCorners:'Resting mouth corners',restingMouth:'Resting mouth',lipGloss:'Lip sheen',teeth:'Teeth',
    hairLength:'Hair length',bangs:'Bangs',parting:'Parting',sideHair:'Side hair',nape:'Nape',baseCut:'Hairstyle',hairTexture:'Hair texture',hairVolume:'Hair volume',hairGloss:'Hair sheen',hairColor:'Hair color',hairMulticolor:'Color pattern',
    hairRootColor:'Hair roots',hairTipColor:'Hair tips',hairStreakColor:'Hair streaks',hairInnerColor:'Inner hair color',hairUnderlayerColor:'Hair underlayer',hairLeftColor:'Left side hair color',hairRightColor:'Right side hair color',hairBangsColor:'Bangs color',hairSaturation:'Hair saturation',hairTemperature:'Hair color temperature',
    skinTone:'Skin tone',undertone:'Undertone',complexion:'Complexion',skinTexture:'Skin texture',height:'Height',silhouette:'Build',muscle:'Musculature',shoulders:'Shoulders',neckLength:'Neck length',neckThickness:'Neck thickness',chest:'Chest',torso:'Torso',arms:'Arms',legs:'Legs',hands:'Hands',
    molePosition:'Mole',moleSize:'Mole size',moleVisibility:'Mole visibility',scarPosition:'Scar',scarType:'Scar type',scarVisibility:'Scar visibility',glassesShape:'Glasses',frameThickness:'Frame thickness',frameColor:'Frame color',lenses:'Lenses',piercingPosition:'Piercing position',piercingCount:'Piercing count',piercingStyle:'Piercing style',impression:'Impression'};
  // 色の詳細項目は辞書の末尾に登録されているため、Markdownでは基本色の直後に並べる。
  var AFTER={irisLeftColor:'irisColor',irisRightColor:'irisColor',irisInnerColor:'irisColor',irisOuterColor:'irisColor',irisRingColor:'irisColor',irisSectorColor:'irisColor',hairRootColor:'hairColor',hairTipColor:'hairColor',hairStreakColor:'hairColor',hairInnerColor:'hairColor',hairUnderlayerColor:'hairColor',hairLeftColor:'hairColor',hairRightColor:'hairColor',hairBangsColor:'hairColor'};
  function fieldIndex(id){return D.fields.findIndex(function(f){return f.id===id;});}
  function rank(id){return AFTER[id]?fieldIndex(AFTER[id])+(fieldIndex(id)+1)/(D.fields.length+2):fieldIndex(id);}
  function sectionOf(f){
    var id=f.id;
    if(/^brow/.test(id))return 'eyebrows';if(/^nose/.test(id))return 'nose';if(f.category==='features')return 'mouth';
    if(/^(glasses|frame|lenses|piercing)/.test(id))return 'accessories';
    return CATEGORY_SECTION[f.category]||'impression';
  }
  function label(f){return LABELS[f.id]||f.id.replace(/([A-Z])/g,' $1').replace(/^./,function(c){return c.toUpperCase();});}
  function key(text){return String(text).trim().toLowerCase().replace(/\s+/g,' ');}
  function mode(scope){return scope==='short'?'short':scope==='base'?'base':'detailed';}
  // generator.js の outputItems（除外・メガネ・ピアス・印象の条件を含む）に、HEXだけ設定された部位を仮想項目として加える。
  function items(s,scope,hex){
    var m=mode(scope),list=G.outputItems(s,m).map(function(x){return {field:x.field,option:x.option};});
    if(hex)H.fields.forEach(function(id){var f=D.byField(id);if(!f||!H.hexOnly(s,id))return;if(m==='base'&&f.category==='impression')return;list.push({field:f,option:{id:null,priority:f.priority,sortOrder:0,includeInShort:f.includeInShort},virtual:true});});
    list=G.sorted(list);
    list.forEach(function(x){x.text=G.safePrompt(hex&&H.isField(x.field.id)?H.tag(s,x.field.id):x.virtual?'':CAW.colors.tag(s,x.field.id,x.option.id));});
    if(m==='short'){var seen={};list=list.filter(function(x){if(!x.option.includeInShort)return false;var k=x.field.id;if(seen[k]&&['molePosition','scarPosition','piercingPosition'].indexOf(k)<0)return false;seen[k]=1;return true;});}
    var used={};list=list.filter(function(x){var k=key(x.text);if(!k||used[k])return false;used[k]=1;return true;});
    return m==='short'?list.slice(0,18):list;
  }
  // 自由入力タグが「HEXを併記した選択タグ」と同じ語の場合も、従来どおり重複として整理する。
  function bare(text){return key(String(text).replace(/ \(#[0-9A-F]{6}\)/g,''));}
  function customs(s,scope,list){var taken={};(list||[]).forEach(function(x){taken[bare(x.text)]=1;});return mode(scope)==='short'?[]:G.customTags(s).map(G.safePrompt).filter(function(t){return !taken[key(t)];});}
  function options(o){return {scope:o&&o.scope||'detailed',hex:!!(o&&o.hex)};}
  // B：英語タグ＋HEX。hex:false の場合は従来の短縮・詳細・素体プロンプトと同じ文字列になる。
  function tags(raw,o){var s=CAW.normalizer.normalize(raw),opt=options(o),list=items(s,opt.scope,opt.hex);return G.dedupe(list.map(function(x){return x.text;}).concat(customs(s,opt.scope,list))).join(', ');}
  // C・D：意味単位で見出しを分けたMarkdown。選択されていない項目・空の見出しは出さない。
  function markdown(raw,o){
    var s=CAW.normalizer.normalize(raw),opt=options(o),bySection={},used={};
    items(s,opt.scope,opt.hex).forEach(function(x){var sec=sectionOf(x.field),lines=bySection[sec]=bySection[sec]||[],line=lines.find(function(l){return l.field===x.field.id;});used[key(x.text)]=1;used[bare(x.text)]=1;
      if(line)line.values.push(x.text);else lines.push({field:x.field.id,rank:rank(x.field.id),label:label(x.field),values:[x.text]});});
    var extra={};if(mode(opt.scope)!=='short')Object.keys(s.customTags).forEach(function(group){s.customTags[group].forEach(function(tag){if(CAW.face.layer(s,'custom:'+group+':'+tag)==='excluded')return;var text=G.safePrompt(tag).replace(/\s+/g,' ').trim(),k=key(text);if(!k||used[k])return;used[k]=1;var sec=CUSTOM_SECTION[group]||'impression';(extra[sec]=extra[sec]||[]).push(text);});});
    return SECTIONS.filter(function(sec){return bySection[sec[0]]||extra[sec[0]];}).map(function(sec){
      var lines=(bySection[sec[0]]||[]).slice().sort(function(a,b){return a.rank-b.rank;}).map(function(l){return '- '+l.label+': '+l.values.join(', ');});
      if(extra[sec[0]])lines.push('- Additional: '+extra[sec[0]].join(', '));
      return '## '+sec[1]+'\n'+lines.join('\n');
    }).join('\n');
  }
  var FORMATS=[{id:'tagsHex',labelJa:'タグ＋HEX',needs:['hex']},{id:'markdown',labelJa:'Markdown',needs:['markdown']},{id:'markdownHex',labelJa:'Markdown＋HEX',needs:['markdown','hex']}];
  var SCOPES=[{id:'detailed',labelJa:'詳細'},{id:'short',labelJa:'短縮'},{id:'base',labelJa:'素体'}];
  // 高度な設定の3つのトグルから、いま使える出力形式を決める（OFFなら空＝従来機能のみ）。
  function available(ui){var on={markdown:!!(ui&&ui.advanced&&ui.markdown),hex:!!(ui&&ui.advanced&&ui.hex)};return FORMATS.filter(function(f){return f.needs.every(function(n){return on[n];});});}
  function render(raw,format,scope){var o={scope:scope,hex:format!=='markdown'};return format==='tagsHex'?tags(raw,o):markdown(raw,o);}
  CAW.advanced={tags:tags,markdown:markdown,render:render,available:available,formats:FORMATS,scopes:SCOPES,sections:SECTIONS,labels:LABELS,sectionOf:sectionOf,label:label};
})(typeof window !== 'undefined' ? window : globalThis);
