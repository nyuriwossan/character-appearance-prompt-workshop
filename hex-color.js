(function (root) {
  'use strict';
  // HEXによる部位別カラー指定。色名（選択ID）とは独立した「ユーザーが明示的に設定した値」だけを state.hexColors に保持する。
  var CAW=root.CAW,D=CAW.data;
  var FIELDS=['irisColor','irisLeftColor','irisRightColor','irisInnerColor','irisOuterColor','irisRingColor','irisSectorColor','hairColor','hairRootColor','hairTipColor','hairStreakColor','hairInnerColor','hairUnderlayerColor','hairLeftColor','hairRightColor','hairBangsColor','skinTone'];
  // 色名が未選択でHEXだけ設定された場合に使う、近い色名を決めつけない中立的な表現。
  var NEUTRAL={irisColor:'eye color',irisLeftColor:'left eye color',irisRightColor:'right eye color',irisInnerColor:'inner iris color',irisOuterColor:'outer iris color',irisRingColor:'central iris ring color',irisSectorColor:'iris sector color',hairColor:'hair color',hairRootColor:'hair root color',hairTipColor:'hair tip color',hairStreakColor:'hair streak color',hairInnerColor:'inner hair color',hairUnderlayerColor:'hair underlayer color',hairLeftColor:'hair color on the character\'s left side',hairRightColor:'hair color on the character\'s right side',hairBangsColor:'bangs color',skinTone:'skin color'};
  // 肌色は辞書に色見本がないため、ピッカーの開始位置と不一致チェック用の目安だけをここに置く（出力には使わない）。
  var SKIN_REFERENCE={porcelain:'#F7E7DF',fair:'#F3DCCF',light:'#EBCFBC',light_beige:'#E3C3A6',beige:'#D4AC8A',olive:'#B99B6B',tan:'#BF8A5E',brown:'#8D5B3C',deep_brown:'#633C27',dark:'#4A2C1E',ebony:'#2E1C15',rosy_fair:'#F4D5CD'};
  var HAIR_DETAIL=/^hair(?:Root|Tip|Streak|Inner|Underlayer|Left|Right|Bangs)Color$/;
  function has(o,k){return Object.prototype.hasOwnProperty.call(o,k);}
  function isField(id){return FIELDS.indexOf(id)>=0;}
  function normalizeHex(input){
    if(typeof input!=='string')return null;
    var s=input.trim().replace(/[！-～]/g,function(c){return String.fromCharCode(c.charCodeAt(0)-0xfee0);}).replace(/^#/,'');
    if(/^[0-9a-fA-F]{3}$/.test(s))s=s.split('').map(function(c){return c+c;}).join('');
    return /^[0-9a-fA-F]{6}$/.test(s)?'#'+s.toUpperCase():null;
  }
  // 未知のフィールドIDや不正な値は黙って捨て、他の保存内容には触れない。
  function normalizeMap(raw){var out={};if(!raw||typeof raw!=='object'||Array.isArray(raw))return out;FIELDS.forEach(function(id){if(!has(raw,id))return;var hex=normalizeHex(raw[id]);if(hex)out[id]=hex;});return out;}
  function get(s,id){return s&&s.hexColors&&has(s.hexColors,id)?s.hexColors[id]:null;}
  function set(raw,id,value){
    var s=CAW.normalizer.normalize(raw);if(!isField(id))return s;
    if(value===null||value===undefined||value===''){delete s.hexColors[id];}
    else{var hex=normalizeHex(value);if(!hex)return s;s.hexColors[id]=hex;}
    s.updatedAt=new Date().toISOString();return s;
  }
  function clearAll(raw){var s=CAW.normalizer.normalize(raw);s.hexColors={};s.updatedAt=new Date().toISOString();return s;}
  function isFace(id){return isField(id)&&CAW.face.isFace(id);}
  function faceMap(map){var out={};Object.keys(normalizeMap(map)).forEach(function(id){if(isFace(id))out[id]=normalizeHex(map[id]);});return out;}

  function toRgb(hex){var n=normalizeHex(hex);return n?{r:parseInt(n.slice(1,3),16),g:parseInt(n.slice(3,5),16),b:parseInt(n.slice(5,7),16)}:null;}
  function fromRgb(c){function p(x){return ('0'+Math.min(255,Math.max(0,Math.round(x))).toString(16)).slice(-2);}return ('#'+p(c.r)+p(c.g)+p(c.b)).toUpperCase();}
  function toHsv(hex){var c=toRgb(hex);if(!c)return null;var r=c.r/255,g=c.g/255,b=c.b/255,max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,h=0;
    if(d!==0){if(max===r)h=((g-b)/d)%6;else if(max===g)h=(b-r)/d+2;else h=(r-g)/d+4;h*=60;if(h<0)h+=360;}
    return {h:h,s:max===0?0:d/max,v:max};
  }
  function fromHsv(c){var h=((c.h%360)+360)%360,s=Math.min(1,Math.max(0,c.s)),v=Math.min(1,Math.max(0,c.v)),k=v*s,x=k*(1-Math.abs((h/60)%2-1)),m=v-k,r=0,g=0,b=0;
    if(h<60){r=k;g=x;}else if(h<120){r=x;g=k;}else if(h<180){g=k;b=x;}else if(h<240){g=x;b=k;}else if(h<300){r=x;b=k;}else{r=k;b=x;}
    return fromRgb({r:(r+m)*255,g:(g+m)*255,b:(b+m)*255});
  }
  // 選択中の色名に対応する辞書の色見本（参考値）。ユーザーが設定したHEXとは別物として扱う。
  function reference(s,id){var o=isField(id)&&s.appearance[id]?D.byOption(id,s.appearance[id]):null;if(!o||id==='irisColor'&&o.id==='heterochromatic')return null;return o.colorValue||(id==='skinTone'?SKIN_REFERENCE[o.id]:null)||null;}
  // 色名とHEXの明らかな食い違いだけを拾う。意図的な配色もあるので警告のみで、値は書き換えない。
  function mismatch(s,id){var hex=get(s,id),ref=reference(s,id);if(!hex||!ref)return false;var a=toHsv(ref),b=toHsv(hex);
    var ca=a.s>=0.25&&a.v>=0.2,cb=b.s>=0.25&&b.v>=0.2;
    if(ca&&cb){var d=Math.abs(a.h-b.h);if(Math.min(d,360-d)>75)return true;}
    if(Math.abs(a.v-b.v)>0.6)return true;
    return ca!==cb&&Math.abs(a.s-b.s)>0.5;
  }

  function hexOnly(s,id){return !s.appearance[id]&&!!get(s,id);}
  function excluded(s,id){var v=s.appearance[id];return !!v&&CAW.face.isFace(id,v)&&CAW.face.layer(s,id+':'+v)==='excluded';}
  function eyePresent(s,id){return CAW.colors.selected(s,id)||hexOnly(s,id);}
  function hairPresent(s,id){return !!s.appearance[id]||hexOnly(s,id);}
  function suffix(s,id){var hex=get(s,id);return hex?' ('+hex+')':'';}
  function basis(s,text){return /\b(left|right)\b/.test(text)?text+' ('+(s.faceProfile.leftRightBasis==='screen'?'image-space':'character\'s own')+' left/right)':text;}
  // HEX有効時の1フィールド分のタグ。color-details.js の優先順位（左右の瞳、虹彩の内外、単色、グラデーション、左右の髪）を
  // 「HEXだけ設定された部位も指定済みとみなす」形でそのまま踏襲する。出力しない条件では空文字を返し、HEXも漏らさない。
  function tag(raw,field){
    var s=raw,id=s.appearance[field],o=id?D.byOption(field,id):null,multi=s.appearance.hairMulticolor||[],text,side;
    if(!isField(field)||!o&&!hexOnly(s,field)||excluded(s,field))return '';
    if(field==='irisColor'){
      if(o&&o.id==='heterochromatic')return o.promptEn;
      if(eyePresent(s,'irisInnerColor')&&eyePresent(s,'irisOuterColor'))return '';
      var left=eyePresent(s,'irisLeftColor'),right=eyePresent(s,'irisRightColor');
      if(left&&right)return '';
      if(left||right){side=left?'right':'left';text=o?o.promptEn.replace(/ eyes$/,'')+' '+side+' eye':side+' eye color';}
      else text=o?o.promptEn:NEUTRAL.irisColor;
      return basis(s,text+suffix(s,field));
    }
    if(HAIR_DETAIL.test(field)){if(multi.indexOf('none')>=0)return '';return (o?o.promptEn:NEUTRAL[field])+suffix(s,field);}
    if(field==='hairColor'){
      if(multi.indexOf('none')<0){
        var l=hairPresent(s,'hairLeftColor'),r=hairPresent(s,'hairRightColor');
        if(l&&r||multi.indexOf('gradient')>=0&&hairPresent(s,'hairRootColor')&&hairPresent(s,'hairTipColor'))return '';
        if(l||r){side=l?'right':'left';return (o?o.promptEn.replace(/ hair$/,'')+' hair':'hair color')+' on the character\'s '+side+' side'+suffix(s,field);}
      }
      return (o?o.promptEn:NEUTRAL.hairColor)+suffix(s,field);
    }
    text=(o?o.promptEn:NEUTRAL[field])+suffix(s,field);
    return field==='irisLeftColor'||field==='irisRightColor'?basis(s,text):text;
  }
  // 設定済みHEXの一覧。active は「今の選択・配色方式でHEX付き出力に実際に載るか」。
  function status(raw){var s=CAW.normalizer.normalize(raw);return FIELDS.filter(function(id){return !!get(s,id);}).map(function(id){var f=D.byField(id),t=tag(s,id);return {field:id,labelJa:f.labelJa,hex:get(s,id),active:!!t&&t.indexOf(get(s,id))>=0,hexOnly:hexOnly(s,id),mismatch:mismatch(s,id)};});}
  CAW.hex={fields:FIELDS,neutral:NEUTRAL,isField:isField,normalizeHex:normalizeHex,normalizeMap:normalizeMap,get:get,set:set,clearAll:clearAll,isFace:isFace,faceMap:faceMap,toRgb:toRgb,toHsv:toHsv,fromHsv:fromHsv,reference:reference,mismatch:mismatch,hexOnly:hexOnly,tag:tag,status:status};
})(typeof window !== 'undefined' ? window : globalThis);
