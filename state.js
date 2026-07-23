(function (root) {
  'use strict';
  var CAW=root.CAW=root.CAW||{}, D=CAW.data;
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function uuid(){return root.crypto&&root.crypto.randomUUID?root.crypto.randomUUID():'caw-'+Date.now()+'-'+Math.random().toString(16).slice(2);}
  function initial(){
    var now=new Date().toISOString(), selections={};
    D.fields.forEach(function(f){selections[f.id]=f.selectionMode==='multi'?[]:null;});
    return {type:'character-appearance-design',schemaVersion:'0.1',id:uuid(),name:'名称未設定',createdAt:now,updatedAt:now,appearance:selections,customTags:{face:[],eyes:[],hair:[],skin:[],body:[],marks:[],general:[]},preferences:{openCategories:['basic']},metadata:{}};
  }
  function set(raw,fieldId,optionId){
    var s=CAW.normalizer.normalize(raw), f=D.byField(fieldId); if(!f)return s;
    if(f.selectionMode==='multi'){
      var list=s.appearance[fieldId].slice(), i=list.indexOf(optionId);
      if(i>=0)list.splice(i,1); else list.push(optionId);
      s.appearance[fieldId]=list;
    }else s.appearance[fieldId]=s.appearance[fieldId]===optionId?null:optionId;
    s.updatedAt=new Date().toISOString(); return s;
  }
  function patch(raw,p){
    var s=CAW.normalizer.normalize(raw);
    Object.keys(p||{}).forEach(function(k){var f=D.byField(k);if(f)s.appearance[k]=clone(p[k]);});
    s.updatedAt=new Date().toISOString(); return CAW.normalizer.normalize(s);
  }
  function remove(raw,fieldId,optionId){
    var s=CAW.normalizer.normalize(raw),f=D.byField(fieldId);if(!f)return s;
    if(f.selectionMode==='multi')s.appearance[fieldId]=s.appearance[fieldId].filter(function(id){return id!==optionId;});
    else s.appearance[fieldId]=null;
    s.updatedAt=new Date().toISOString();return s;
  }
  CAW.state={initial:initial,set:set,patch:patch,remove:remove,clone:clone,uuid:uuid};
})(typeof window !== 'undefined' ? window : globalThis);
