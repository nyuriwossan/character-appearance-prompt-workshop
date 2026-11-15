(function (root) {
  'use strict';
  var CAW=root.CAW,KEY='caw_draft_v01',LIB='caw_library_v01',UI='caw_ui_settings_v1';
  function get(k,fallback){try{var v=root.localStorage.getItem(k);return v?JSON.parse(v):fallback;}catch(e){return fallback;}}
  function put(k,v){root.localStorage.setItem(k,JSON.stringify(v));}
  function loadDraft(){return CAW.normalizer.normalize(get(KEY,null));}
  function saveDraft(s){put(KEY,CAW.normalizer.normalize(s));}
  function list(){return get(LIB,[]).map(CAW.normalizer.normalize).sort(function(a,b){return b.updatedAt.localeCompare(a.updatedAt);});}
  function save(s,name){var x=CAW.normalizer.normalize(s),items=list(),i=items.findIndex(function(v){return v.id===x.id;});x.name=(name||x.name||'名称未設定').trim().slice(0,80);x.updatedAt=new Date().toISOString();if(i>=0)items[i]=x;else items.unshift(x);put(LIB,items.slice(0,100));return x;}
  function remove(id){put(LIB,list().filter(function(x){return x.id!==id;}));}
  function duplicate(id){var x=list().find(function(v){return v.id===id;});if(!x)return null;x=CAW.normalizer.normalize(x);x.id=CAW.state.uuid();x.name=x.name+'（複製）';x.createdAt=x.updatedAt=new Date().toISOString();return save(x,x.name);}
  function libraryJson(){return JSON.stringify({type:'character-appearance-library',schemaVersion:'0.3',exportedAt:new Date().toISOString(),designs:list(),faceProfiles:CAW.face.list()},null,2);}
  // 高度な設定の表示状態は端末側のUI設定。キャラクターの外見データ（下書き・保存一覧・JSON）とは別のキーに置く。
  var FORMATS=['tagsHex','markdown','markdownHex'],SCOPES=['detailed','short','base'];
  function normalizeUi(raw){var x=raw&&typeof raw==='object'?raw:{};return {advanced:x.advanced===true,markdown:x.markdown===true,hex:x.hex===true,format:FORMATS.indexOf(x.format)>=0?x.format:null,scope:SCOPES.indexOf(x.scope)>=0?x.scope:'detailed'};}
  function loadUi(){return normalizeUi(get(UI,null));}
  function saveUi(x){var v=normalizeUi(x);try{put(UI,v);}catch(e){}return v;}
  // 部分プリセットの開閉。端末のUI設定として専用のキーに置く（外見データ・JSON・高度な設定とは別）。初回は閉じる。
  var PRESET_UI='caw_ui_presets_v1';
  function loadPresetsOpen(){var v=get(PRESET_UI,null);return !!(v&&v.open===true);}
  function savePresetsOpen(open){try{put(PRESET_UI,{open:open===true});}catch(e){}return open===true;}
  CAW.storage={loadDraft:loadDraft,saveDraft:saveDraft,list:list,save:save,remove:remove,duplicate:duplicate,libraryJson:libraryJson,keys:{draft:KEY,library:LIB,ui:UI,presetUi:PRESET_UI},loadPresetsOpen:loadPresetsOpen,savePresetsOpen:savePresetsOpen,loadUi:loadUi,saveUi:saveUi,normalizeUi:normalizeUi};
})(typeof window !== 'undefined' ? window : globalThis);
