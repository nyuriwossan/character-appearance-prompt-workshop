(function (root) {
  'use strict';
  var CAW=root.CAW,D=CAW.data;
  var GROUPS=['顔立ち','目元','眉','髪型','体格','配色'];
  var INITIAL_VISIBLE=8;

  function isEmpty(value){
    return Array.isArray(value)?value.length===0:value===null||typeof value==='undefined'||value==='';
  }
  function sameValue(a,b){return JSON.stringify(a)===JSON.stringify(b);}
  function valueLabel(fieldId,value){
    var field=D.byField(fieldId);
    if(!field||isEmpty(value))return '未設定';
    var ids=Array.isArray(value)?value:[value];
    return ids.map(function(id){
      var option=D.byOption(fieldId,id);
      return option?option.labelJa:String(id);
    }).join('・');
  }
  function groups(){
    return GROUPS.filter(function(group){
      return D.presets.some(function(p){return p.group===group;});
    });
  }
  function list(group){
    return D.presets.filter(function(p){return p.group===group;});
  }
  function analyze(preset,rawState){
    var state=CAW.normalizer.normalize(rawState),items=[];
    Object.keys(preset.patch).forEach(function(fieldId){
      var before=state.appearance[fieldId],after=preset.patch[fieldId];
      if(sameValue(before,after))return;
      items.push({
        fieldId:fieldId,
        labelJa:D.byField(fieldId).labelJa,
        beforeJa:valueLabel(fieldId,before),
        afterJa:valueLabel(fieldId,after),
        kind:isEmpty(before)?'added':'changed'
      });
    });
    return {
      items:items,
      added:items.filter(function(item){return item.kind==='added';}).length,
      changed:items.filter(function(item){return item.kind==='changed';}).length,
      total:items.length,
      unchanged:Object.keys(preset.patch).length-items.length
    };
  }

  CAW.presetUi={
    groups:groups,
    list:list,
    analyze:analyze,
    valueLabel:valueLabel,
    initialVisible:INITIAL_VISIBLE
  };
})(typeof window !== 'undefined' ? window : globalThis);
