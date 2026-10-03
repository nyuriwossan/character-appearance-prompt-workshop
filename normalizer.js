(function (root) {
  'use strict';
  var CAW=root.CAW,D=CAW.data;
  function arr(v){return Array.isArray(v)?v:[];}
  function normalize(raw){
    var base=CAW.state.initial(),src=raw&&typeof raw==='object'?raw:{}, legacy=src.appearance||src.selections||{};
    base.id=typeof src.id==='string'?src.id:base.id;
    base.name=typeof src.name==='string'&&src.name.trim()?src.name.slice(0,80):'名称未設定';
    base.createdAt=typeof src.createdAt==='string'?src.createdAt:base.createdAt;
    base.updatedAt=typeof src.updatedAt==='string'?src.updatedAt:base.updatedAt;
    D.fields.forEach(function(f){
      var value=legacy[f.id],ids=f.options.map(function(o){return o.id;});
      base.appearance[f.id]=f.selectionMode==='multi'?arr(value).filter(function(id,i,a){return ids.indexOf(id)>=0&&a.indexOf(id)===i;}):(ids.indexOf(value)>=0?value:null);
    });
    var custom=src.customTags||{};
    Object.keys(base.customTags).forEach(function(k){base.customTags[k]=arr(custom[k]).map(function(x){return String(x).trim();}).filter(Boolean).filter(function(x,i,a){return a.findIndex(function(y){return y.toLowerCase()===x.toLowerCase();})===i;}).slice(0,30);});
    base.preferences=src.preferences&&typeof src.preferences==='object'?src.preferences:base.preferences;
    base.preferences.openCategories=arr(base.preferences.openCategories).filter(function(id){return D.categories.some(function(c){return c.id===id;});});
    base.preferences.colorDetails=arr(base.preferences.colorDetails).filter(function(id){return id==='eyes'||id==='hairColor';});
    if(!src.preferences||!Array.isArray(src.preferences.colorDetails)){['irisColor','irisPattern','hairMulticolor'].forEach(function(f){var v=Array.isArray(base.appearance[f])?base.appearance[f]:[base.appearance[f]];v.filter(Boolean).forEach(function(id){CAW.colors.autoOpen(base,f,id);});});}
    base.metadata=src.metadata&&typeof src.metadata==='object'?src.metadata:{};
    base.faceProfile=CAW.face.sync(base,src.faceProfile);
    return base;
  }
  function parseJson(text){var value;try{value=JSON.parse(text);}catch(e){throw new Error('JSONの形式を確認してください。');}
    if(value&&value.type==='character-appearance-library'&&Array.isArray(value.designs))return {kind:'library',designs:value.designs.map(normalize),faceProfiles:arr(value.faceProfiles).map(CAW.face.validate)};
    if(!value||(!value.appearance&&!value.selections))throw new Error('外見設計データが見つかりません。');
    return {kind:'design',design:normalize(value)};
  }
  CAW.normalizer={normalize:normalize,parseJson:parseJson};
})(typeof window !== 'undefined' ? window : globalThis);
