(function (root) {
  'use strict';
  var CAW = root.CAW = root.CAW || {};
  var D = CAW.data = CAW.data || { fields: [], presets: [], rules: [] };
  D.categories = [
    { id: 'basic', labelJa: '基本', description: '人物属性と年齢、全体の方向' },
    { id: 'face', labelJa: '顔骨格', description: '顔型、顎、頬、頬骨、額' },
    { id: 'eyes', labelJa: '目・瞳', description: '目の形、まぶた、まつ毛、瞳色' },
    { id: 'features', labelJa: '眉・鼻・口', description: '眉、鼻、口と唇の構造' },
    { id: 'hairStyle', labelJa: '髪型', description: '長さ、前髪、分け目、カット' },
    { id: 'hairColor', labelJa: '髪色・髪質', description: '色、複数色、質感、光沢' },
    { id: 'skin', labelJa: '肌', description: '肌色、アンダートーン、血色、質感' },
    { id: 'body', labelJa: '身体つき', description: '身長、体格、肩、首、手足' },
    { id: 'marks', labelJa: 'ほくろ・傷・メガネ', description: '固有特徴とメガネ' },
    { id: 'impression', labelJa: '配色・印象', description: '外見全体の抽象的な印象' }
  ];
  function slug(text) {
    return String(text).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  }
  function parse(spec) {
    if (typeof spec === 'object') return spec;
    var p = String(spec).split('|');
    return { id: p[0] || slug(p[2]), labelJa: p[1], promptEn: p[2], colorValue: p[3] || null };
  }
  D.addField = function (config, specs) {
    var field = Object.assign({
      selectionMode: 'single', allowEmpty: true, allowCustom: false,
      includeInShort: false, priority: 40, defaultGroup: 'basic',
      modelDependency: 'low', conflictsWith: [], relatedTo: []
    }, config);
    field.options = specs.map(parse).map(function (option, index) {
      return Object.assign({
        category: field.category, field: field.id, selectionMode: field.selectionMode,
        defaultGroup: field.defaultGroup, includeInShort: field.includeInShort,
        priority: field.priority, modelDependency: field.modelDependency,
        conflictsWith: [], relatedTo: [], sortOrder: index + 1
      }, option);
    });
    D.fields.push(field);
    return field;
  };
  D.byField = function (id) { return D.fields.find(function (field) { return field.id === id; }); };
  D.byOption = function (fieldId, optionId) {
    var field = D.byField(fieldId);
    return field && field.options.find(function (option) { return option.id === optionId; });
  };
})(typeof window !== 'undefined' ? window : globalThis);
