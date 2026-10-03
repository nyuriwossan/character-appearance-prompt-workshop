(function(root){
  'use strict';
  var CAW=root.CAW,D=CAW.data;
  function selected(s,id){var v=s.appearance[id];return v&&!Array.isArray(v)&&(!s.faceProfile||s.faceProfile.excludedTags.indexOf(id+':'+v)<0);}
  function prompt(s,field,id){var o=D.byOption(field,id);if(!o)return '';var left=selected(s,'irisLeftColor'),right=selected(s,'irisRightColor');
    if(field==='irisColor'&&id!=='heterochromatic'&&selected(s,'irisInnerColor')&&selected(s,'irisOuterColor'))return '';
    if(field==='irisColor'&&id!=='heterochromatic'&&(left||right)){if(left&&right)return '';return o.promptEn.replace(/ eyes$/,'')+' '+(left?'right':'left')+' eye';}
    if(/^hair(?:Root|Tip|Streak|Inner|Underlayer|Left|Right|Bangs)Color$/.test(field)&&s.appearance.hairMulticolor.indexOf('none')>=0)return '';
    if(field==='hairColor'&&s.appearance.hairMulticolor.indexOf('none')<0){if(s.appearance.hairLeftColor&&s.appearance.hairRightColor||s.appearance.hairMulticolor.indexOf('gradient')>=0&&s.appearance.hairRootColor&&s.appearance.hairTipColor)return '';if(s.appearance.hairLeftColor||s.appearance.hairRightColor)return o.promptEn.replace(/ hair$/,'')+' hair on the character\'s '+(s.appearance.hairLeftColor?'right':'left')+' side';}
    return o.promptEn;
  }
  function tag(s,field,id){var result=prompt(s,field,id);if(result&&['irisColor','irisLeftColor','irisRightColor'].indexOf(field)>=0&&/\b(left|right)\b/.test(result))result+=' ('+(s.faceProfile.leftRightBasis==='screen'?'image-space':'character\'s own')+' left/right)';return result;}
  function autoOpen(s,field,option){var group=field==='irisColor'&&option==='heterochromatic'||field==='irisPattern'&&['heterochromia','sectoral','gradient','central_ring'].indexOf(option)>=0?'eyes':field==='hairMulticolor'&&option!=='none'?'hairColor':null;
    if(group){var v=s.appearance[field];if(Array.isArray(v)?v.indexOf(option)<0:v!==option)return;s.preferences.colorDetails=s.preferences.colorDetails||[];if(s.preferences.colorDetails.indexOf(group)<0)s.preferences.colorDetails.push(group);}}
  CAW.colors={prompt:prompt,tag:tag,autoOpen:autoOpen,selected:selected};
})(typeof window!=='undefined'?window:globalThis);
