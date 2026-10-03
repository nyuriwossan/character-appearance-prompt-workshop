(function (root) {
  'use strict';
  var CAW=root.CAW,D=CAW.data,state,pendingPreset=null;
  var activePresetGroup=CAW.presetUi.groups()[0],expandedPresetGroups={};
  var customMap={face:['face'],eyes:['eyes'],features:[],hairStyle:['hair'],hairColor:[],skin:['skin'],body:['body'],marks:['marks'],impression:['general']};
  var customLabels={face:'顔',eyes:'目',hair:'髪',skin:'肌',body:'身体',marks:'固有特徴',general:'全体'};
  function $(s,p){return(p||document).querySelector(s);}function $$(s,p){return Array.from((p||document).querySelectorAll(s));}
  function escapeHtml(v){return String(v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function toast(msg){var el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(function(){el.classList.remove('show');},2200);}
  function scheduleSave(){var el=$('#save-status');el.textContent='保存中…';clearTimeout(scheduleSave.t);scheduleSave.t=setTimeout(function(){try{CAW.storage.saveDraft(state);el.textContent='自動保存済み';}catch(e){el.textContent='保存できません';toast('保存できません。JSONを書き出して保管してください。');}},180);}
  function isSelected(f,id){var v=state.appearance[f.id];return Array.isArray(v)?v.indexOf(id)>=0:v===id;}
  function categoryItems(cat){return CAW.generator.selected(state).filter(function(x){return x.field.category===cat;});}
  function renderPresets(){
    var groups=CAW.presetUi.groups(),presets=CAW.presetUi.list(activePresetGroup),expanded=!!expandedPresetGroups[activePresetGroup];
    var visible=expanded?presets:presets.slice(0,CAW.presetUi.initialVisible);
    var tabs='<div class="preset-tabs" role="tablist" aria-label="部分プリセットのカテゴリ">'+groups.map(function(group){
      var selected=group===activePresetGroup;
      return '<button class="preset-tab" id="preset-tab-'+groups.indexOf(group)+'" role="tab" aria-selected="'+selected+'" aria-controls="preset-panel" tabindex="'+(selected?'0':'-1')+'" data-preset-group="'+escapeHtml(group)+'">'+escapeHtml(group)+'</button>';
    }).join('')+'</div>';
    var cards=visible.map(function(p){
      return '<button class="preset-card" data-preset="'+p.id+'" title="'+escapeHtml(p.summaryJa)+'"><strong>'+escapeHtml(p.labelJa)+'</strong><small>'+escapeHtml(p.summaryJa)+'</small><span class="preset-count">'+Object.keys(p.patch).length+'項目を設定</span></button>';
    }).join('');
    var more=presets.length>CAW.presetUi.initialVisible?'<div class="preset-more"><button class="button" data-preset-more aria-expanded="'+expanded+'" aria-controls="preset-grid">'+(expanded?'表示を減らす':'もっと見る（残り'+(presets.length-visible.length)+'件）')+'</button></div>':'';
    $('#preset-groups').innerHTML=tabs+'<div class="preset-panel" id="preset-panel" role="tabpanel" aria-labelledby="preset-tab-'+groups.indexOf(activePresetGroup)+'"><div class="preset-grid" id="preset-grid">'+cards+'</div>'+more+'</div>';
  }
  function openPresetReview(preset){
    var impact=CAW.presetUi.analyze(preset,state),dialog=$('#preset-dialog');
    pendingPreset=preset;
    $('#preset-dialog-title').textContent='「'+preset.labelJa+'」を適用';
    $('#preset-dialog-summary').textContent=preset.summaryJa+'。適用後も各項目を個別に変更・解除できます。';
    $('#preset-added-count').textContent=impact.added;
    $('#preset-changed-count').textContent=impact.changed;
    $('#preset-total-count').textContent=impact.total;
    $('#preset-impact-list').innerHTML=impact.items.length?impact.items.map(function(item){
      var change=item.kind==='changed'?'<span class="preset-impact-before">'+escapeHtml(item.beforeJa)+'</span><span class="preset-impact-arrow">→</span>':'';
      return '<li class="'+item.kind+'"><strong>'+escapeHtml(item.labelJa)+'</strong>'+change+'<span>'+escapeHtml(item.afterJa)+'</span></li>';
    }).join(''):'<li class="preset-impact-empty">現在の設定と同じため、変更される項目はありません。</li>';
    $('[data-confirm-preset]',dialog).disabled=impact.total===0;
    dialog.showModal();document.body.classList.add('modal-open');
  }
  function fieldHtml(f){
    return '<div class="field"><div class="field-title"><h3>'+escapeHtml(f.labelJa)+'</h3><span class="field-meta">'+(f.selectionMode==='multi'?'複数選択':'1つ選択')+'・未設定可</span></div><div class="chip-grid">'+f.options.map(function(o){return '<button class="choice-chip" data-field="'+f.id+'" data-option="'+o.id+'" aria-pressed="'+isSelected(f,o.id)+'">'+(o.colorValue?'<span class="swatch" style="background:'+o.colorValue+'"></span>':'')+escapeHtml(o.labelJa)+'</button>';}).join('')+'</div></div>';
  }
  function customHtml(cat){
    var keys=customMap[cat]||[];return keys.map(function(k){return '<div class="custom-box"><label for="custom-'+k+'">英語の追加タグ（'+customLabels[k]+'）</label><p>カンマ区切り。選択タグと同じ語は出力時に整理します。</p><input id="custom-'+k+'" data-custom="'+k+'" value="'+escapeHtml(state.customTags[k].join(', '))+'" placeholder="例: subtle freckles, narrow pupils"></div>';}).join('');
  }
  function colorDetailsHtml(cat){
    var fields=D.fields.filter(function(f){return f.category===cat&&f.colorDetail;}),opened=(state.preferences.colorDetails||[]).indexOf(cat)>=0;
    if(!fields.length)return '';
    var modes=state.appearance.hairMulticolor||[],special=modes.filter(function(x){return x!=='none';}),single=modes.indexOf('none')>=0;
    var shown=fields.filter(function(f){return cat==='eyes'||!special.length||!f.detailModes.length||f.detailModes.some(function(m){return special.indexOf(m)>=0;})||state.appearance[f.id];});
    var count=fields.filter(function(f){return state.appearance[f.id];}).length;
    return '<details class="color-details" data-color-details="'+cat+'" '+(opened?'open':'')+'><summary>'+(cat==='eyes'?'瞳色の詳細（左右・虹彩の配色）':'髪色の詳細（部分別の配色）')+(count?' ・ '+count+'項目設定中':'')+'</summary><p class="color-detail-note">'+(cat==='eyes'?'左右は顔IDで選んだ「本人／画面」の基準です。左右の色を指定した場合は、瞳の基本色より優先して出力します。':'髪の左右は本人基準です。部分の色を指定した場合は、その場所の色として出力します。'+(single?' 「単色」が選択中のため詳細色は出力しません。複数色の入れ方から「単色」を解除してください。':''))+'</p><div class="color-detail-grid">'+shown.map(function(f){var o=D.byOption(f.id,state.appearance[f.id]);return '<label class="color-detail-control" for="detail-'+f.id+'"><span>'+escapeHtml(f.labelJa)+'</span><div><span class="swatch" style="background:'+(o?o.colorValue:'#f4f2ed')+'" aria-hidden="true"></span><select id="detail-'+f.id+'" data-detail-field="'+f.id+'"><option value="">未設定</option>'+f.options.map(function(c){return '<option value="'+c.id+'" '+(c.id===state.appearance[f.id]?'selected':'')+'>'+escapeHtml(c.labelJa)+'</option>';}).join('')+'</select></div></label>';}).join('')+'</div></details>';
  }
  function categoryFieldsHtml(cat){return D.fields.filter(function(f){return f.category===cat&&!f.colorDetail;}).map(fieldHtml).join('')+colorDetailsHtml(cat)+customHtml(cat);}
  function renderAccordions(){
    $('#accordions').innerHTML=D.categories.map(function(cat,i){var items=categoryItems(cat.id),sum=items.length?items.slice(0,5).map(function(x){return x.option.labelJa;}).join('／'):'未設定';var open=(state.preferences.openCategories||[]).indexOf(cat.id)>=0;
      return '<article class="accordion"><button class="accordion-head" data-category="'+cat.id+'" aria-expanded="'+open+'" aria-controls="panel-'+cat.id+'"><span class="section-number">'+String(i+1).padStart(2,'0')+'</span><span class="accordion-title">'+escapeHtml(cat.labelJa)+'</span><span class="accordion-summary">'+escapeHtml(sum)+'</span><span class="accordion-chevron" aria-hidden="true">⌄</span></button><div class="accordion-body" id="panel-'+cat.id+'" '+(open?'':'hidden')+'>'+categoryFieldsHtml(cat.id)+'</div></article>';
    }).join('');
  }
  function renderSelection(){
    var items=CAW.generator.selected(state),grouped={};items.forEach(function(x){(grouped[x.field.category]=grouped[x.field.category]||[]).push(x);});
    Object.keys(state.customTags).forEach(function(k){state.customTags[k].forEach(function(tag){(grouped.custom=grouped.custom||[]).push({custom:k,option:{id:tag,labelJa:'追加タグ：'+tag}});});});
    $('#selection-count').textContent=items.length+Object.values(state.customTags).reduce(function(n,a){return n+a.length;},0);
    $('#selection-peek').textContent=items.length?items.slice(0,5).map(function(x){return x.option.labelJa;}).join('・'):'タグを選ぶとここに表示されます';
    $('#selection-list').innerHTML=Object.keys(grouped).map(function(k){var c=D.categories.find(function(x){return x.id===k;});return '<div class="selection-group"><span>'+escapeHtml(c?c.labelJa:'追加タグ')+'</span><div class="selection-chips">'+grouped[k].map(function(x){return '<button class="selected-chip" '+(x.custom?'data-remove-custom="'+x.custom+'" data-tag="'+escapeHtml(x.option.id)+'"':'data-remove-field="'+x.field.id+'" data-option="'+x.option.id+'"')+'>'+escapeHtml(x.option.labelJa)+'</button>';}).join('')+'</div></div>';}).join('')||'<p>まだ選択されていません。</p>';
  }
  function renderDiagnostics(){
    var labels={hard:'矛盾',warning:'注意',info:'モデル上の注意',suggestion:'提案'},icons={hard:'!',warning:'△',info:'i',suggestion:'+'},items=CAW.advisor.check(state);
    $('#diagnostics').innerHTML=items.length?items.map(function(x){return '<article class="diagnostic '+x.level+'"><span class="diagnostic-badge">'+icons[x.level]+' '+labels[x.level]+'</span><div><h3>'+escapeHtml(x.titleJa)+'</h3><p>'+escapeHtml(x.messageJa)+'</p></div>'+(x.patch?'<button class="button" data-apply-diagnostic="'+x.id+'">提案を適用</button>':'')+'</article>';}).join(''):'<div class="all-clear">✓ 現在、目立った矛盾や注意点はありません。</div>';
  }
  var outputDefs=[['short','短縮プロンプト',function(){return CAW.generator.short(state);},'wide'],['detailed','詳細プロンプト',function(){return CAW.generator.detailed(state);},'wide'],['bodyPrompt','素体プロンプト',function(){return CAW.generator.bodyPrompt(state);},'wide'],['summary','日本語の外見まとめ',function(){return CAW.generator.summaryJa(state);},''],['basic','基本の外見一覧',function(){return CAW.generator.basicJa(state);},''],['arrange','アレンジ項目一覧',function(){return CAW.generator.arrangeJa(state);},''],['faceVerify','顔確認用プロンプト',function(){return CAW.generator.faceVerify(state);},''],['bodyVerify','身体確認用プロンプト',function(){return CAW.generator.bodyVerify(state);},'wide']];
  function renderOutputs(){
    $('#outputs').innerHTML=outputDefs.map(function(d){var text=d[2]();return '<article class="output-card '+d[3]+'"><div class="output-head"><h3>'+d[1]+'</h3><button class="copy-button" data-copy="'+d[0]+'">コピー</button></div><pre class="output-text '+(text?'':'empty')+'" id="output-'+d[0]+'">'+escapeHtml(text||'まだ出力できる項目が選ばれていません。')+'</pre></article>';}).join('');
  }
  function renderLibrary(){
    var items=CAW.storage.list();$('#library-list').innerHTML=items.length?items.map(function(x){return '<article class="library-card"><h3>'+escapeHtml(x.name)+'</h3><p class="library-meta">'+CAW.generator.selected(x).length+'項目 ・ 更新 '+new Date(x.updatedAt).toLocaleString('ja-JP')+'</p><div class="library-actions"><button class="button primary" data-load="'+x.id+'">読み込む</button><button class="button" data-duplicate="'+x.id+'">複製</button><button class="button danger" data-delete="'+x.id+'">削除</button></div></article>';}).join(''):'<p class="all-clear">名前を付けて保存した設計はまだありません。</p>';
  }
  function renderAll(){state=CAW.normalizer.normalize(state);renderAccordions();renderSelection();renderDiagnostics();renderOutputs();CAW.faceUi.render();$('#design-name').value=state.name;scheduleSave();}
  function parseCustom(v){var seen={};return String(v).split(',').map(function(x){return x.trim();}).filter(Boolean).filter(function(x){var k=x.toLowerCase();if(seen[k])return false;seen[k]=1;return true;}).slice(0,30);}
  function download(name,text){var blob=new Blob([text],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(function(){URL.revokeObjectURL(a.href);},1000);}
  function copy(text){if(navigator.clipboard&&root.isSecureContext)return navigator.clipboard.writeText(text);var ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');}finally{ta.remove();}return Promise.resolve();}
  function openLibrary(){renderLibrary();var d=$('#library-dialog');d.showModal();document.body.classList.add('modal-open');}
  document.addEventListener('click',function(e){
    var summary=e.target.closest('summary'),detail=summary&&summary.parentElement;if(detail&&detail.dataset.colorDetails){var groups=state.preferences.colorDetails||[],cat=detail.dataset.colorDetails,i=groups.indexOf(cat);if(!detail.open&&i<0)groups.push(cat);if(detail.open&&i>=0)groups.splice(i,1);state.preferences.colorDetails=groups;scheduleSave();}
    var b=e.target.closest('button');if(!b)return;
    if(b.dataset.field){state=CAW.state.set(state,b.dataset.field,b.dataset.option);renderAll();return;}
    if(b.dataset.category){var id=b.dataset.category,list=state.preferences.openCategories||[],i=list.indexOf(id);if(i>=0)list.splice(i,1);else list.push(id);state.preferences.openCategories=list;renderAccordions();return;}
    if(b.dataset.presetGroup){activePresetGroup=b.dataset.presetGroup;renderPresets();return;}
    if(b.hasAttribute('data-preset-more')){expandedPresetGroups[activePresetGroup]=!expandedPresetGroups[activePresetGroup];renderPresets();return;}
    if(b.dataset.preset){var p=D.presets.find(function(x){return x.id===b.dataset.preset;});if(p)openPresetReview(p);return;}
    if(b.hasAttribute('data-confirm-preset')){if(pendingPreset){var applied=pendingPreset;state=applied.facePreset?CAW.face.preset(state,applied.facePreset):CAW.state.patch(state,applied.patch);pendingPreset=null;$('#preset-dialog').close();document.body.classList.remove('modal-open');renderAll();toast('「'+applied.labelJa+'」を適用しました');}return;}
    if(b.hasAttribute('data-close-preset-dialog')){pendingPreset=null;$('#preset-dialog').close();document.body.classList.remove('modal-open');return;}
    if(b.id==='selection-toggle'){var list=$('#selection-list'),open=list.hidden;list.hidden=!open;b.setAttribute('aria-expanded',String(open));return;}
    if(b.dataset.removeField){state=CAW.state.remove(state,b.dataset.removeField,b.dataset.option);renderAll();return;}
    if(b.dataset.removeCustom){state.customTags[b.dataset.removeCustom]=state.customTags[b.dataset.removeCustom].filter(function(x){return x!==b.dataset.tag;});renderAll();return;}
    if(b.dataset.copy){var text=$('#output-'+b.dataset.copy).textContent;if(text.indexOf('まだ出力')===0){toast('コピーする内容がありません');return;}copy(text).then(function(){toast('コピーしました');});return;}
    if(b.dataset.applyDiagnostic){var x=CAW.advisor.check(state).find(function(i){return i.id===b.dataset.applyDiagnostic;});if(x&&x.patch){state=CAW.state.patch(state,x.patch);renderAll();toast('提案を適用しました');}return;}
    if(b.hasAttribute('data-reset')){if(confirm('現在の編集内容を初期化します。名前付き保存は削除されません。')){state=CAW.state.initial();renderAll();toast('編集内容を初期化しました');}return;}
    if(b.hasAttribute('data-back-to-top')){root.scrollTo({top:0,behavior:'smooth'});return;}
    if(b.hasAttribute('data-save-named')){state.name=$('#design-name').value.trim()||'名称未設定';state=CAW.storage.save(state,state.name);renderAll();toast('名前を付けて保存しました');return;}
    if(b.hasAttribute('data-open-library')){openLibrary();return;}
    if(b.hasAttribute('data-export-current')){download('character-appearance-'+state.id+'.json',JSON.stringify(CAW.normalizer.normalize(state),null,2));toast('JSONを書き出しました');return;}
    if(b.hasAttribute('data-export-library')){download('character-appearance-backup.json',CAW.storage.libraryJson());toast('バックアップを書き出しました');return;}
    if(b.hasAttribute('data-close-dialog')){$('#library-dialog').close();document.body.classList.remove('modal-open');return;}
    if(b.dataset.load){var x=CAW.storage.list().find(function(v){return v.id===b.dataset.load;});if(x){state=CAW.normalizer.normalize(x);$('#library-dialog').close();document.body.classList.remove('modal-open');renderAll();toast('保存データを読み込みました');}return;}
    if(b.dataset.duplicate){CAW.storage.duplicate(b.dataset.duplicate);renderLibrary();toast('複製しました');return;}
    if(b.dataset.delete){if(confirm('この保存データを削除します。元に戻せません。')){CAW.storage.remove(b.dataset.delete);renderLibrary();toast('削除しました');}return;}
  });
  document.addEventListener('change',function(e){
    if(e.target.dataset.detailField){var patch={};patch[e.target.dataset.detailField]=e.target.value||null;state=CAW.state.patch(state,patch);renderAll();var el=$('#detail-'+e.target.dataset.detailField);if(el)el.focus();return;}
    if(e.target.dataset.custom){state.customTags[e.target.dataset.custom]=parseCustom(e.target.value);state.updatedAt=new Date().toISOString();renderAll();}
    if(e.target.id==='design-name'){state.name=e.target.value.trim()||'名称未設定';scheduleSave();}
    if(e.target.id==='json-import'&&e.target.files[0]){var reader=new FileReader();reader.onload=function(){try{var parsed=CAW.normalizer.parseJson(reader.result);if(parsed.kind==='design')state=parsed.design;else{if(parsed.faceProfiles.length)CAW.face.importJson(JSON.stringify({type:'character-face-library',profiles:parsed.faceProfiles}));parsed.designs.forEach(function(x){CAW.storage.save(x,x.name);});state=parsed.designs[0]||state;}renderAll();toast('JSONを読み込みました');}catch(err){toast(err.message);}e.target.value='';};reader.readAsText(e.target.files[0]);}
  });
  document.addEventListener('toggle',function(e){if(!e.target.dataset||!e.target.dataset.colorDetails||!e.target.isConnected)return;var cat=e.target.dataset.colorDetails,groups=state.preferences.colorDetails||[],i=groups.indexOf(cat);if(e.target.open&&i<0)groups.push(cat);if(!e.target.open&&i>=0)groups.splice(i,1);state.preferences.colorDetails=groups;scheduleSave();},true);
  $('#library-dialog').addEventListener('close',function(){document.body.classList.remove('modal-open');});
  $('#preset-dialog').addEventListener('close',function(){pendingPreset=null;document.body.classList.remove('modal-open');});
  function updateBackToTop(){var button=$('#back-to-top');button.hidden=root.scrollY<500;}
  root.addEventListener('scroll',updateBackToTop,{passive:true});
  CAW.faceUi.init({get:function(){return state;},set:function(s){state=s;renderAll();},save:scheduleSave,toast:toast,download:download,preset:openPresetReview});
  state=CAW.storage.loadDraft();renderPresets();renderAll();updateBackToTop();
})(window);
