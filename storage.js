(function (root) {
  'use strict';
  var CAW=root.CAW,KEY='caw_draft_v01',LIB='caw_library_v01';
  function get(k,fallback){try{var v=root.localStorage.getItem(k);return v?JSON.parse(v):fallback;}catch(e){return fallback;}}
  function put(k,v){root.localStorage.setItem(k,JSON.stringify(v));}
  function loadDraft(){return CAW.normalizer.normalize(get(KEY,null));}
  function saveDraft(s){put(KEY,CAW.normalizer.normalize(s));}
  function list(){return get(LIB,[]).map(CAW.normalizer.normalize).sort(function(a,b){return b.updatedAt.localeCompare(a.updatedAt);});}
  function save(s,name){var x=CAW.normalizer.normalize(s),items=list(),i=items.findIndex(function(v){return v.id===x.id;});x.name=(name||x.name||'名称未設定').trim().slice(0,80);x.updatedAt=new Date().toISOString();if(i>=0)items[i]=x;else items.unshift(x);put(LIB,items.slice(0,100));return x;}
  function remove(id){put(LIB,list().filter(function(x){return x.id!==id;}));}
  function duplicate(id){var x=list().find(function(v){return v.id===id;});if(!x)return null;x=CAW.normalizer.normalize(x);x.id=CAW.state.uuid();x.name=x.name+'（複製）';x.createdAt=x.updatedAt=new Date().toISOString();return save(x,x.name);}
  function libraryJson(){return JSON.stringify({type:'character-appearance-library',schemaVersion:'0.1',exportedAt:new Date().toISOString(),designs:list()},null,2);}
  CAW.storage={loadDraft:loadDraft,saveDraft:saveDraft,list:list,save:save,remove:remove,duplicate:duplicate,libraryJson:libraryJson,keys:{draft:KEY,library:LIB}};
})(typeof window !== 'undefined' ? window : globalThis);
