(function (root) {
  'use strict';
  var CAW=root.CAW,D=CAW.data;
  var ORDER=['basic','face','eyes','features','skin','hairStyle','hairColor','body','marks','impression'];
  function selected(raw){
    var s=CAW.normalizer.normalize(raw),out=[];
    D.fields.forEach(function(f){var values=f.selectionMode==='multi'?s.appearance[f.id]:[s.appearance[f.id]];
      values.filter(Boolean).forEach(function(id){var o=D.byOption(f.id,id);if(o)out.push({field:f,option:o});});
    });return out;
  }
  function dedupe(list){var seen={};return list.map(function(x){return String(x).trim();}).filter(Boolean).filter(function(x){var k=x.toLowerCase().replace(/\s+/g,' ');if(seen[k])return false;seen[k]=1;return true;});}
  function sorted(items){return items.slice().sort(function(a,b){var c=ORDER.indexOf(a.field.category)-ORDER.indexOf(b.field.category);return c||b.option.priority-a.option.priority||a.option.sortOrder-b.option.sortOrder;});}
  function custom(raw){var s=CAW.normalizer.normalize(raw),out=[];Object.keys(s.customTags).forEach(function(k){out=out.concat(s.customTags[k].filter(function(tag){return CAW.face.layer(s,'custom:'+k+':'+tag)!=='excluded';}));});return out;}
  function isGlassesField(id){return ['glassesShape','frameThickness','frameColor','lenses'].indexOf(id)>=0;}
  function isPiercingField(id){return ['piercingPosition','piercingCount','piercingStyle'].indexOf(id)>=0;}
  function outputItems(raw,mode){
    var s=CAW.normalizer.normalize(raw);
    return sorted(selected(s)).filter(function(x){
      var id=x.field.id;
      if(CAW.face.isFace(id,x.option.id)&&CAW.face.layer(s,id+':'+x.option.id)==='excluded')return false;
      if(id==='glassesUsage'||id==='piercingUsage')return false;
      if(isGlassesField(id)){
        if(s.appearance.glassesUsage==='none')return false;
        if((mode==='short'||mode==='base')&&s.appearance.glassesUsage!=='usual')return false;
      }
      if(isPiercingField(id)){
        if(s.appearance.piercingUsage==='none')return false;
        if((mode==='short'||mode==='base')&&s.appearance.piercingUsage!=='usual')return false;
      }
      if(mode==='base'&&x.field.category==='impression')return false;
      return true;
    });
  }
  function detailed(raw){return dedupe(outputItems(raw,'detailed').map(function(x){return x.option.promptEn;}).concat(custom(raw))).join(', ');}
  function short(raw){
    var items=outputItems(raw,'short').filter(function(x){return x.option.includeInShort;});
    var chosen=[],seenCat={};items.forEach(function(x){var key=x.field.id;if(!seenCat[key]||['molePosition','scarPosition','piercingPosition'].indexOf(key)>=0){chosen.push(x.option.promptEn);seenCat[key]=1;}});
    return dedupe(chosen).slice(0,18).join(', ');
  }
  function bodyPrompt(raw){return dedupe(outputItems(raw,'base').map(function(x){return x.option.promptEn;}).concat(custom(raw))).join(', ');}
  function groups(raw,filter){
    var map={};sorted(selected(raw)).filter(filter||function(){return true;}).forEach(function(x){(map[x.field.category]=map[x.field.category]||[]).push(x.option.labelJa);});
    return ORDER.filter(function(k){return map[k];}).map(function(k){var c=D.categories.find(function(x){return x.id===k;});return (c?c.labelJa:k)+'：'+dedupe(map[k]).join('、');}).join('\n');
  }
  function arrange(raw){var s=CAW.normalizer.normalize(raw);return groups(s,function(x){if(x.field.id==='glassesUsage'||x.field.id==='piercingUsage')return false;return x.option.defaultGroup==='arrange'||(isGlassesField(x.field.id)&&s.appearance.glassesUsage==='optional')||(isPiercingField(x.field.id)&&s.appearance.piercingUsage==='optional');});}
  function basic(raw){var s=CAW.normalizer.normalize(raw);return groups(s,function(x){if(x.field.id==='glassesUsage'||x.field.id==='piercingUsage')return false;if(isGlassesField(x.field.id))return s.appearance.glassesUsage==='usual';if(isPiercingField(x.field.id))return s.appearance.piercingUsage==='usual';return x.option.defaultGroup!=='arrange';});}
  function verify(raw,type){var base=detailed(raw), extra=type==='face'?['solo','head-and-shoulders portrait','upper-body portrait','looking at viewer','neutral expression','simple plain shirt','plain light background','clear facial visibility']:['solo','full body','full-body character reference','standing','centered composition','head to toe','feet visible','entire body visible','neutral pose','simple plain clothing','plain white background'];return dedupe((base?base.split(', '):[]).concat(extra)).join(', ');}
  CAW.generator={selected:selected,detailed:detailed,short:short,bodyPrompt:bodyPrompt,summaryJa:groups,basicJa:basic,arrangeJa:arrange,faceVerify:function(s){return verify(s,'face');},bodyVerify:function(s){return verify(s,'body');},dedupe:dedupe,order:ORDER};
})(typeof window !== 'undefined' ? window : globalThis);
