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
  function custom(raw){var s=CAW.normalizer.normalize(raw),out=[];Object.keys(s.customTags).forEach(function(k){out=out.concat(s.customTags[k]);});return out;}
  function detailed(raw){return dedupe(sorted(selected(raw)).map(function(x){return x.option.promptEn;}).concat(custom(raw))).join(', ');}
  function short(raw){
    var items=sorted(selected(raw)).filter(function(x){return x.option.includeInShort;});
    var chosen=[],seenCat={};items.forEach(function(x){var key=x.field.id;if(!seenCat[key]||['molePosition','scarPosition'].indexOf(key)>=0){chosen.push(x.option.promptEn);seenCat[key]=1;}});
    return dedupe(chosen).slice(0,18).join(', ');
  }
  function groups(raw,filter){
    var map={};sorted(selected(raw)).filter(filter||function(){return true;}).forEach(function(x){(map[x.field.category]=map[x.field.category]||[]).push(x.option.labelJa);});
    return ORDER.filter(function(k){return map[k];}).map(function(k){var c=D.categories.find(function(x){return x.id===k;});return (c?c.labelJa:k)+'：'+dedupe(map[k]).join('、');}).join('\n');
  }
  function arrange(raw){return groups(raw,function(x){return x.option.defaultGroup==='arrange'||(x.field.id.indexOf('glasses')===0&&CAW.normalizer.normalize(raw).appearance.glassesUsage==='optional');});}
  function basic(raw){return groups(raw,function(x){if(x.field.id==='glassesUsage'&&x.option.id==='none')return false;if(x.field.id.indexOf('glasses')===0)return CAW.normalizer.normalize(raw).appearance.glassesUsage==='usual';return x.option.defaultGroup!=='arrange';});}
  function verify(raw,type){var base=detailed(raw), extra=type==='face'?['solo','bust portrait','looking at viewer','neutral expression','simple plain shirt','plain light background','clear facial visibility']:['solo','full body','standing','neutral pose','simple plain clothing','plain light background','entire body visible'];return dedupe((base?base.split(', '):[]).concat(extra)).join(', ');}
  CAW.generator={selected:selected,detailed:detailed,short:short,summaryJa:groups,basicJa:basic,arrangeJa:arrange,faceVerify:function(s){return verify(s,'face');},bodyVerify:function(s){return verify(s,'body');},dedupe:dedupe,order:ORDER};
})(typeof window !== 'undefined' ? window : globalThis);
