(function (root) {
  'use strict';
  var CAW=root.CAW,D=CAW.data,LIB='caw_face_library_v1';
  var LAYERS=['fixed','variable','excluded'];
  var VARIABLE=['eyeHighlights','eyeImpression','lipGloss','restingMouth','restingCorners','glassesUsage','glassesShape','frameThickness','frameColor','lenses','piercingUsage','piercingPosition','piercingCount','piercingStyle'];
  var AUX={moleSize:'molePosition',moleVisibility:'molePosition',scarType:'scarPosition',scarVisibility:'scarPosition'};
  function clone(x){return JSON.parse(JSON.stringify(x));}
  function list(x){return Array.isArray(x)?x:[];}
  function text(x,max){return typeof x==='string'?x.trim().slice(0,max||200):'';}
  function isFace(field,option){
    var f=D.byField(field);if(!f)return false;
    if(['face','eyes','features'].indexOf(f.category)>=0)return true;
    if(f.category!=='marks')return false;
    return !(field==='molePosition'||field==='scarPosition')||['neck','collarbone'].indexOf(option)<0;
  }
  function entries(s){
    var out=[];D.fields.forEach(function(f){
      var values=f.selectionMode==='multi'?list(s.appearance[f.id]):[s.appearance[f.id]];
      values.filter(Boolean).forEach(function(id){var o=D.byOption(f.id,id),positions=AUX[f.id]&&list(s.appearance[AUX[f.id]]);if(o&&isFace(f.id,id)&&(!positions||!positions.length||positions.some(function(p){return isFace(AUX[f.id],p);})))out.push({key:f.id+':'+id,field:f.id,option:id,label:o.labelJa,en:o.promptEn});});
    });
    ['face','eyes'].forEach(function(group){list(s.customTags[group]).forEach(function(tag){out.push({key:'custom:'+group+':'+tag,custom:group,label:tag,en:tag});});});
    return out;
  }
  function normalizeProfile(raw){
    var p=raw&&typeof raw==='object'?raw:{},now=new Date().toISOString();
    var out={id:text(p.id,120),name:text(p.name,80),memo:text(p.memo,2000),triggerWord:text(p.triggerWord,120),fixedTags:[],variableTags:[],excludedTags:[],leftRightBasis:p.leftRightBasis==='screen'?'screen':'character',allowMirror:p.allowMirror===true,strength:['strict','standard','loose'].indexOf(p.strength)>=0?p.strength:'standard',createdAt:text(p.createdAt,40)||now,updatedAt:text(p.updatedAt,40)||now,version:Number.isInteger(p.version)&&p.version>0?p.version:1};
    var seen=new Set();LAYERS.forEach(function(layer){out[layer+'Tags']=list(p[layer+'Tags']).filter(function(key){if(typeof key!=='string'||seen.has(key))return false;seen.add(key);return true;});});
    out.notes={};['alias','model','baseModel','loraVersion','imageCount','reference','front','threeQuarter','profile','identity','unusedImages','loraName','loraWeight','sampler','steps','cfg','resolution','seed'].forEach(function(k){out.notes[k]=text(p.notes&&p.notes[k],k==='identity'||k==='unusedImages'?2000:300);});
    return out;
  }
  function sync(s,raw){
    var p=normalizeProfile(raw),selected=entries(s),old={};LAYERS.forEach(function(l){p[l+'Tags'].forEach(function(k){old[k]=l;});p[l+'Tags']=[];});
    selected.forEach(function(x){p[(old[x.key]||'fixed')+'Tags'].push(x.key);});
    return p;
  }
  function layer(s,key){var p=s.faceProfile;return p&&p.excludedTags.indexOf(key)>=0?'excluded':p&&p.variableTags.indexOf(key)>=0?'variable':'fixed';}
  function setLayer(raw,key,value){var s=CAW.normalizer.normalize(raw);if(LAYERS.indexOf(value)<0||!entries(s).some(function(x){return x.key===key;}))return s;
    LAYERS.forEach(function(l){s.faceProfile[l+'Tags']=s.faceProfile[l+'Tags'].filter(function(k){return k!==key;});});s.faceProfile[value+'Tags'].push(key);s.updatedAt=new Date().toISOString();return s;
  }
  function defaults(s,keys){keys.forEach(function(k){var f=k.split(':')[0];if(VARIABLE.indexOf(f)>=0)s=setLayer(s,k,'variable');});return s;}
  function snapshot(raw){var s=CAW.normalizer.normalize(raw),p=clone(s.faceProfile);p.appearance={};
    D.fields.forEach(function(f){if(!isFace(f.id))return;var v=s.appearance[f.id],positions=AUX[f.id]&&list(s.appearance[AUX[f.id]]);if(positions&&positions.length&&!positions.some(function(id){return isFace(AUX[f.id],id);}))v=f.selectionMode==='multi'?[]:null;p.appearance[f.id]=Array.isArray(v)?v.filter(function(id){return isFace(f.id,id);}):v;});
    p.customTags={face:s.customTags.face.slice(),eyes:s.customTags.eyes.slice()};return p;
  }
  function clear(raw){var s=CAW.normalizer.normalize(raw);
    D.fields.forEach(function(f){if(!isFace(f.id))return;if(AUX[f.id]&&list(s.appearance[AUX[f.id]]).some(function(id){return !isFace(AUX[f.id],id);}))return;
      s.appearance[f.id]=f.selectionMode==='multi'?s.appearance[f.id].filter(function(id){return !isFace(f.id,id);}):null;
    });s.customTags.face=[];s.customTags.eyes=[];s.faceProfile=normalizeProfile(null);s.updatedAt=new Date().toISOString();return CAW.normalizer.normalize(s);
  }
  function apply(raw,profile){var s=clear(raw),p=validate(profile);
    D.fields.forEach(function(f){if(!isFace(f.id))return;if(AUX[f.id]&&list(s.appearance[AUX[f.id]]).some(function(id){return !isFace(AUX[f.id],id);}))return;
      var v=p.appearance[f.id];s.appearance[f.id]=f.selectionMode==='multi'?s.appearance[f.id].concat(list(v)):v;
    });s.customTags.face=p.customTags.face.slice();s.customTags.eyes=p.customTags.eyes.slice();s.faceProfile=p;s=CAW.normalizer.normalize(s);[s.appearance.irisColor].concat(s.appearance.irisPattern).filter(Boolean).forEach(function(id){CAW.colors.autoOpen(s,id===s.appearance.irisColor?'irisColor':'irisPattern',id);});return s;
  }
  function validate(raw){if(!raw||typeof raw!=='object'||!raw.appearance)throw new Error('顔プロファイルの形式を確認してください。');
    var normalized=CAW.normalizer.normalize({appearance:raw.appearance,customTags:raw.customTags,faceProfile:raw});return snapshot(normalized);
  }
  function library(){try{var p=JSON.parse(root.localStorage.getItem(LIB)||'[]');return list(p).map(validate).sort(function(a,b){return b.updatedAt.localeCompare(a.updatedAt);});}catch(e){return [];}}
  function save(raw,asNew){var p=snapshot(raw),items=library(),i=items.findIndex(function(x){return x.id===p.id;}),now=new Date().toISOString();
    if(asNew||!p.id){p.id=CAW.state.uuid();p.createdAt=now;p.version=1;i=-1;}else if(i>=0){p.version=items[i].version+1;p.createdAt=items[i].createdAt;}
    p.name=p.name||'名称未設定の顔';p.updatedAt=now;if(i>=0)items[i]=p;else items.unshift(p);
    if(items.length>100)throw new Error('顔IDは100件まで保存できます。不要な顔IDを整理してください。');root.localStorage.setItem(LIB,JSON.stringify(items));return p;
  }
  function importJson(json){var data;try{data=JSON.parse(json);}catch(e){throw new Error('JSONの形式を確認してください。');}
    var source=data&&data.type==='character-face-library'?data.profiles:data&&data.type==='character-face-profile'?[data.faceProfile]:null;
    if(!Array.isArray(source)||!source.length)throw new Error('顔プロファイルが見つかりません。');
    var profiles=source.map(validate),items=library();profiles.forEach(function(p){if(!p.id)p.id=CAW.state.uuid();var i=items.findIndex(function(x){return x.id===p.id;});
      if(i>=0&&JSON.stringify(items[i])!==JSON.stringify(p)){p.id=CAW.state.uuid();p.name=(p.name+'（読み込み）').slice(0,80);i=-1;}if(i<0)items.push(p);
    });if(items.length>100)throw new Error('顔IDは100件まで保存できます。');root.localStorage.setItem(LIB,JSON.stringify(items));return profiles;
  }
  function importance(x){if(/molePosition|scarPosition|eyeAsymmetry|browDetail|irisPattern|teeth/.test(x.field)||x.field==='irisColor'&&x.option==='heterochromatic')return '高';if(/Highlights|Gloss|resting|Impression|Visibility/.test(x.field)||VARIABLE.indexOf(x.field)>=0)return '低';return '中';}
  function active(s){return entries(s).filter(function(x){return layer(s,x.key)!=='excluded';});}
  function conflicts(raw){var s=CAW.normalizer.normalize(raw),xs=active(s),out=[];
    function find(key){var parts=key.split(':'),o=D.byOption(parts[0],parts[1]);return xs.find(function(x){return x.key===key||o&&x.en.toLowerCase()===o.promptEn.toLowerCase();});}
    function pair(a,b){var first=find(a),second=find(b);if(first&&second&&first.key!==second.key){var id=[first.key,second.key].sort().join('|');if(!out.some(function(x){return x.id===id;}))out.push({id:id,tags:[first,second]});}}
    [['eyeShape:round','eyeShape:narrow'],['eyeShape:upturned','eyeShape:downturned'],['eyeShape:upturned','outerCorner:down'],['eyeShape:downturned','outerCorner:up'],['eyeSize:large','eyeSize:small'],['noseLength:short','noseLength:long'],['lipFullness:thin','lipFullness:full'],['lipFullness:very_thin','lipFullness:plump'],['outerCorner:down','outerCorner:up'],['eyeAsymmetry:left_narrower','eyeAsymmetry:right_narrower'],['faceExtra:symmetrical_face','faceExtra:subtle_asymmetry']].forEach(function(p){pair(p[0],p[1]);});
    ['inner_double','parallel_double','hidden_double'].forEach(function(id){pair('eyeShape:monolid','eyelidFold:'+id);});
    ['slight','left_narrower','right_narrower'].forEach(function(id){pair('eyeAsymmetry:even','eyeAsymmetry:'+id);});
    xs.filter(function(x){return /left|right|asymmetry|asymmetrical/.test(x.en);}).forEach(function(x){pair('faceExtra:symmetrical_face',x.key);if(x.field==='browDetail')pair('browDetail:even',x.key);});
    [['upperEyelid','light','heavy'],['tearBags','none','defined'],['teeth','not_emphasized','small_fang']].forEach(function(p){pair(p[0]+':'+p[1],p[0]+':'+p[2]);});
    return out;
  }
  function diagnosis(raw){var s=CAW.normalizer.normalize(raw),xs=entries(s).filter(function(x){return layer(s,x.key)==='fixed';});
    var groups=[['顔輪郭',['faceShape','jawShape','jawline','cheeks','cheekbones','forehead'],3],['目の形',['eyeShape','eyeSize','eyeHeight','eyeWidth','outerCorner','upperEyelid','eyelidFold'],4],['眉',['browShape','browThickness','browLength','browDensity'],3],['鼻',['noseBridge','noseWidth','noseLength','noseTip'],3],['口',['mouthWidth','lipFullness','lipRatio','lipContour'],3],['固有の識別点',['molePosition','scarPosition','browDetail','irisPattern','teeth'],2],['左右差',['eyeAsymmetry','browDetail','faceExtra'],1]];
    var results=groups.map(function(g){var n=xs.filter(function(x){return g[1].indexOf(x.field)>=0&&(g[0]!=='固有の識別点'||importance(x)==='高'&&!/even|solid|not_emphasized/.test(x.option))&&(g[0]!=='左右差'||/even|symmetr|left|right|slight/.test(x.option));}).length;return {label:g[0],count:n,target:g[2]};});
    var missing=results.slice(0,6).filter(function(g){return !g.count;}).map(function(g){return g.label;});
    return {groups:results,message:missing.length?'固定タグに「'+missing.join('・')+'」が未設定です。必要な部位を各1つ、固有の識別点を1つ追加すると比較しやすくなります。':'輪郭・目・眉・鼻・口と識別点が設定されています。角度や表情を変えた画像で同じ特徴が保たれるか確認しましょう。'};
  }
  function promptTag(s,x,l){var t=x.custom||l==='excluded'?x.en:CAW.colors.prompt(s,x.field,x.option);if(t&&/\b(left|right)\b/.test(t))t+=' ('+(s.faceProfile.leftRightBasis==='screen'?'image-space':'character\'s own')+' left/right)';return CAW.generator.safePrompt(t);}
  function block(raw,l){var s=CAW.normalizer.normalize(raw);return CAW.generator.dedupe(entries(s).filter(function(x){return layer(s,x.key)===l&&(l==='excluded'||x.field!=='glassesUsage'&&x.field!=='piercingUsage');}).filter(function(x){if(l==='excluded')return true;if(/glasses|frame|lenses/i.test(x.field))return s.appearance.glassesUsage!=='none';if(/piercing/i.test(x.field))return s.appearance.piercingUsage!=='none';return true;}).map(function(x){return promptTag(s,x,l);})).join(', ');}
  var VIEWS={front:'front view, looking at viewer, neutral expression',threeQuarter:'three-quarter view, 45-degree angle, neutral expression',profile:'side profile view, neutral expression',expression:'front view, gentle smile',eyes:'extreme close-up of both eyes and eyebrows, front view',marks:'close-up portrait, clearly visible facial marks',mirror:'front view, left-right orientation reference',turnaround:'three-view character turnaround, front view, three-quarter view, side profile view, same character'};
  function positive(raw,view){var s=CAW.normalizer.normalize(raw),p=s.faceProfile,parts=[p.triggerWord,block(s,'fixed'),block(s,'variable'),'solo','head-and-shoulders portrait','clear facial visibility','hair pulled away from face','even lighting','plain light background',VIEWS[view]||VIEWS.front];
    if(view==='mirror')parts.push(p.allowMirror?'mirrored orientation permitted':'preserve facial left-right placement, unmirrored reference');
    return CAW.generator.dedupe(parts).join(', ');
  }
  function negative(s){return CAW.generator.dedupe([block(s,'excluded'),'text','watermark','multiple people','obscured face','blurry face']).join(', ');}
  function pixai(s){return CAW.generator.dedupe([s.faceProfile.triggerWord,block(s,'fixed'),block(s,'variable'),'solo','clear face','clean background']).join(', ');}
  function diff(a,b){var sa=CAW.normalizer.normalize({appearance:a.appearance,customTags:a.customTags,faceProfile:a}),sb=CAW.normalizer.normalize({appearance:b.appearance,customTags:b.customTags,faceProfile:b}),aa=entries(sa),bb=entries(sb);
    return {removed:aa.filter(function(x){return !bb.some(function(y){return y.key===x.key;});}),added:bb.filter(function(x){return !aa.some(function(y){return y.key===x.key;});}),changed:aa.filter(function(x){return bb.some(function(y){return y.key===x.key;})&&layer(sa,x.key)!==layer(sb,x.key);}),promptA:block(sa,'fixed'),promptB:block(sb,'fixed')};
  }
  var PRESETS=[
    {id:'fixed',label:'顔固定の基本',patch:{faceShape:'oval',jawShape:'narrow',eyeShape:['narrow','almond'],noseTip:'small',lipRatio:'lower_thicker',browShape:'straight'}},
    {id:'adult',label:'大人っぽい構造',patch:{faceShape:'long',cheekbones:'high',noseBridge:'straight',lipFullness:'thin',eyeShape:['almond'],browShape:'angled'}},
    {id:'young',label:'幼い顔の構造',patch:{faceShape:'round',jawShape:'short',cheeks:'full',eyeShape:['round'],eyeSize:'large',noseTip:'small'}},
    {id:'neutral',label:'中性的な構造',patch:{faceShape:'inverted_triangle',jawline:'soft',browShape:'parallel',eyeShape:['narrow']}},
    {id:'identity',label:'識別点を加える',patch:{eyeAsymmetry:['left_narrower'],molePosition:['below_right_eye'],browDetail:['left_notch'],irisPattern:['central_ring']}}
  ];
  function presetPatch(raw,id){var p=PRESETS.find(function(x){return x.id===id;});if(!p)return {};var patch=clone(p.patch),s=CAW.normalizer.normalize(raw);['molePosition','scarPosition'].forEach(function(f){if(patch[f])patch[f]=s.appearance[f].filter(function(o){return !isFace(f,o);}).concat(patch[f]);});return patch;}
  function preset(raw,id){var patch=presetPatch(raw,id),s=CAW.state.patch(raw,patch);Object.keys(patch).forEach(function(f){entries(s).filter(function(x){return x.field===f;}).forEach(function(x){s=setLayer(s,x.key,VARIABLE.indexOf(f)>=0?'variable':'fixed');});});return s;}
  CAW.face={isFace:isFace,entries:entries,normalizeProfile:normalizeProfile,sync:sync,layer:layer,setLayer:setLayer,defaults:defaults,snapshot:snapshot,clear:clear,apply:apply,validate:validate,list:library,save:save,importJson:importJson,importance:importance,conflicts:conflicts,diagnosis:diagnosis,block:block,positive:positive,negative:negative,pixai:pixai,diff:diff,presets:PRESETS,preset:preset,presetPatch:presetPatch,views:VIEWS,key:LIB};
})(typeof window !== 'undefined' ? window : globalThis);
