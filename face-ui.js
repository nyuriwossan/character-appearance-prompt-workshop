(function (root) {
  'use strict';
  var CAW=root.CAW,F=CAW.face,host,acknowledged=new Set();
  function $(id){return document.getElementById(id);}
  function esc(x){return String(x).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  var labels={fixed:'固定',variable:'可変',excluded:'除外'};
  var notes={alias:'別名・検索用メモ',model:'使用モデル',baseModel:'学習ベースモデル',loraVersion:'LoRAバージョン',imageCount:'学習画像枚数',reference:'代表画像URL・ファイル名',front:'正面画像',threeQuarter:'斜め画像',profile:'横顔画像',identity:'固有特徴メモ',unusedImages:'学習に使わない画像メモ',loraName:'LoRA名',loraWeight:'LoRA強度',sampler:'サンプラー',steps:'ステップ数',cfg:'CFG',resolution:'解像度',seed:'Seed'};
  function set(s,preserve){(preserve?host.update:host.set)(CAW.normalizer.normalize(s));}
  function layerRow(s,x){return '<div class="face-layer-row" data-face-key="'+esc(x.key)+'" data-layer="'+F.layer(s,x.key)+'"><span class="identity-badge">'+F.importance(x)+'</span><div class="face-tag-copy"><strong>'+esc(x.label)+'</strong><small>'+esc(x.en)+'</small></div><select data-face-layer="'+esc(x.key)+'" aria-label="'+esc(x.label)+'の扱い">'+Object.keys(labels).map(function(l){return '<option value="'+l+'" '+(F.layer(s,x.key)===l?'selected':'')+'>'+labels[l]+'</option>';}).join('')+'</select><button class="icon-button face-remove" data-face-remove="'+esc(x.key)+'" aria-label="'+esc(x.label)+'を解除">×</button></div>';}
  function renderTags(preserve){var s=host.get(),xs=F.entries(s),diagnosis=F.diagnosis(s),container=$('face-layers');
    if(preserve&&xs.length){
      var rows=new Map();Array.from(container.children).forEach(function(row){if(xs.some(function(x){return x.key===row.dataset.faceKey;}))rows.set(row.dataset.faceKey,row);else row.remove();});
      xs.forEach(function(x,i){var row=rows.get(x.key);if(!row){var temp=document.createElement('div');temp.innerHTML=layerRow(s,x);row=temp.firstElementChild;}if(container.children[i]!==row)container.insertBefore(row,container.children[i]||null);row.dataset.layer=F.layer(s,x.key);var select=row.querySelector('select');if(select.value!==F.layer(s,x.key))select.value=F.layer(s,x.key);});
    }else container.innerHTML=xs.length?xs.map(function(x){return layerRow(s,x);}).join(''):'<p class="face-hint">下の外見設計で顔の特徴を選ぶか、構造プリセットから始めてください。</p>';
    var issues=F.conflicts(s),ids=new Set(issues.map(function(x){return x.id;}));acknowledged.forEach(function(id){if(!ids.has(id))acknowledged.delete(id);});
    $('face-conflicts').innerHTML=issues.map(function(x){var kept=acknowledged.has(x.id);return '<article class="face-conflict"><strong>△ '+x.tags.map(function(t){return '「'+esc(t.label)+'」';}).join('と')+'が同時選択されています</strong><p>意図した組み合わせなら、両方残せます。</p><div class="action-row">'+(kept?'<span class="face-hint">確認済み・両方を保持</span>':x.tags.map(function(t){return '<button class="button" data-face-remove="'+esc(t.key)+'">'+esc(t.label)+'を解除</button>';}).join('')+'<button class="button" data-face-keep="'+esc(x.id)+'">両方残す</button>')+'</div></article>';}).join('');
    $('face-scores').innerHTML=diagnosis.groups.map(function(g){return '<div><span>'+g.label+'</span><strong>'+g.count+'<small> / '+g.target+' 目安</small></strong></div>';}).join('');$('face-advice').textContent=diagnosis.message+' 数字は固定タグの設定数です。生成品質の評価ではありません。';
  }
  function card(id,title,value){return '<article class="output-card"><div class="output-head"><h3>'+title+'</h3><button class="copy-button" data-copy="'+id+'">コピー</button></div><pre class="output-text '+(value?'':'empty')+'" id="output-'+id+'">'+esc(value||'まだ出力できる項目が選ばれていません。')+'</pre></article>';}
  function renderOutputs(){var s=host.get();
    $('face-outputs').innerHTML=card('face-fixed','顔固定ブロック',F.block(s,'fixed'))+card('face-variable','顔可変ブロック',F.block(s,'variable'))+card('face-negative','顔ネガティブブロック',F.block(s,'excluded'))+card('face-pixai','PixAI貼り付け用1行',F.pixai(s));
    $('face-verification').innerHTML=card('face-check','選んだ目的の顔確認',F.positive(s,$('face-view').value))+card('face-training-negative','確認・学習用ネガティブ',F.negative(s));
    var views=[['front','LoRA正面学習用'],['threeQuarter','LoRA斜め顔学習用'],['profile','LoRA横顔学習用'],['expression','LoRA表情差分用'],['eyes','目元クローズアップ用']];
    $('face-dataset').innerHTML=views.map(function(v){return card('face-data-'+v[0],v[1],F.positive(s,v[0]));}).join('');
  }
  function render(options){var s=host.get(),p=s.faceProfile,preserve=options&&options.preserveControls;
    document.querySelectorAll('[data-face-meta]').forEach(function(el){var key=el.dataset.faceMeta;if(el.type==='checkbox')el.checked=p[key];else if(el.value!==p[key])el.value=p[key];});
    $('face-version').textContent=p.id?'顔ID：'+p.id+' ・ 保存版 v'+p.version+' ・ 作成 '+new Date(p.createdAt).toLocaleDateString('ja-JP'):'まだ名前付き保存されていない顔です。';
    $('face-orientation').textContent=(p.leftRightBasis==='character'?'本人基準：正面を向いた本人の左は、画面では右に見えます。':'画面基準：表示画像の左／右として出力します。')+' 生成画像では左右が反転することがあるため、確認用出力で位置を見比べてください。';
    if(!preserve){$('face-presets').innerHTML=F.presets.map(function(p){return '<button class="button" data-face-preset="'+p.id+'">'+p.label+'</button>';}).join('');
    $('face-notes').innerHTML=Object.keys(notes).map(function(k){return '<label>'+notes[k]+'<input data-face-note="'+k+'" maxlength="'+(k==='identity'||k==='unusedImages'?2000:300)+'" value="'+esc(p.notes[k])+'"></label>';}).join('');}renderTags(preserve);renderOutputs();
  }
  function showDiff(a,b){var d=F.diff(a,b);$('face-comparison').innerHTML='<h3>'+esc(a.name||'現在の顔')+' → '+esc(b.name||'現在の顔')+'</h3><p>追加：'+esc(d.added.map(function(x){return x.label;}).join('、')||'なし')+'</p><p>解除：'+esc(d.removed.map(function(x){return x.label;}).join('、')||'なし')+'</p><p>レイヤー変更：'+esc(d.changed.map(function(x){return x.label;}).join('、')||'なし')+'</p>'+card('face-compare-a','比較元の固定ブロック',d.promptA)+card('face-compare-b','比較先の固定ブロック',d.promptB)+'<p class="face-hint">トリガー：'+esc(a.triggerWord||'未設定')+' → '+esc(b.triggerWord||'未設定')+'<br>保存版：v'+a.version+' → v'+b.version+'<br>左右基準：'+(a.leftRightBasis==='screen'?'画面':'本人')+' → '+(b.leftRightBasis==='screen'?'画面':'本人')+'</p>';}
  function renderLibrary(){var ps=F.list();$('face-library-list').innerHTML='<div class="action-row"><button class="button" data-face-export-all>顔IDをすべて書き出し</button></div>'+ (ps.length?ps.map(function(p){return '<article class="library-card"><h3>'+esc(p.name)+' <small>v'+p.version+'</small></h3><p class="library-meta">'+esc(p.triggerWord||'トリガー未設定')+' ・ '+p.fixedTags.length+'固定 / '+p.variableTags.length+'可変 / '+p.excludedTags.length+'除外<br>'+esc(p.memo)+'</p><div class="library-actions"><button class="button primary" data-face-apply="'+esc(p.id)+'">顔を適用</button><button class="button" data-face-diff="'+esc(p.id)+'">現在の顔と比較</button><button class="button danger" data-face-delete="'+esc(p.id)+'">削除</button></div></article>';}).join(''):'<p class="all-clear">保存した顔プロファイルはまだありません。</p>');
    if(ps.length>1){$('face-library-list').innerHTML+='<div class="face-compare-selects"><label>比較元<select id="face-compare-from">'+ps.map(function(p){return '<option value="'+esc(p.id)+'">'+esc(p.name)+' v'+p.version+'</option>';}).join('')+'</select></label><label>比較先<select id="face-compare-to">'+ps.map(function(p,i){return '<option value="'+esc(p.id)+'" '+(i===1?'selected':'')+'>'+esc(p.name)+' v'+p.version+'</option>';}).join('')+'</select></label><button class="button" data-face-compare>2つの顔IDを比較</button></div>';}
  }
  function init(config){host=config;
    document.addEventListener('input',function(e){var el=e.target,s=host.get();if(el.dataset.faceMeta){s.faceProfile[el.dataset.faceMeta]=el.type==='checkbox'?el.checked:el.value;s.updatedAt=new Date().toISOString();host.save();renderOutputs();}if(el.dataset.faceNote){s.faceProfile.notes[el.dataset.faceNote]=el.value;s.updatedAt=new Date().toISOString();host.save();}});
    document.addEventListener('change',function(e){var el=e.target;if(el.dataset.faceLayer)set(F.setLayer(host.get(),el.dataset.faceLayer,el.value),true);
      if(el.id==='face-basis'||el.id==='face-strength'||el.id==='face-mirror'){host.get().faceProfile[el.dataset.faceMeta]=el.type==='checkbox'?el.checked:el.value;set(host.get(),true);}
      if(el.id==='face-view')renderOutputs();
      if(el.id==='face-import'&&el.files[0]){var reader=new FileReader();reader.onload=function(){try{F.importJson(reader.result);renderLibrary();host.toast('顔IDを読み込みました。一覧から適用できます。');$('face-library-dialog').showModal();document.body.classList.add('modal-open');}catch(err){host.toast(err.message);}el.value='';};reader.readAsText(el.files[0]);}
    });
    document.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;var s=host.get();try{
      if(b.hasAttribute('data-face-save')||b.hasAttribute('data-face-new')){var p=F.save(s,b.hasAttribute('data-face-new'));s.faceProfile=p;set(s);host.toast('顔を保存しました（v'+p.version+'）');}
      if(b.hasAttribute('data-face-library')){renderLibrary();$('face-comparison').innerHTML='';$('face-library-dialog').showModal();document.body.classList.add('modal-open');}
      if(b.hasAttribute('data-face-close'))$('face-library-dialog').close();
      if(b.hasAttribute('data-face-reset')&&confirm('顔の設定だけリセットします。髪・肌・身体つきと保存済み顔IDは残ります。')){set(F.clear(s));host.toast('顔だけリセットしました');}
      if(b.dataset.faceApply){var p=F.list().find(function(x){return x.id===b.dataset.faceApply;});if(p){set(F.apply(s,p));$('face-library-dialog').close();host.toast('顔IDを適用しました');}}
      if(b.dataset.faceDelete&&confirm('この顔IDを削除します。元に戻せません。')){root.localStorage.setItem(F.key,JSON.stringify(F.list().filter(function(p){return p.id!==b.dataset.faceDelete;})));renderLibrary();$('face-comparison').innerHTML='';}
      if(b.hasAttribute('data-face-export'))host.download('face-profile.json',JSON.stringify({type:'character-face-profile',schemaVersion:'0.2',faceProfile:F.snapshot(s)},null,2));
      if(b.hasAttribute('data-face-export-all'))host.download('face-library.json',JSON.stringify({type:'character-face-library',schemaVersion:'0.2',profiles:F.list()},null,2));
      if(b.dataset.faceRemove){var x=F.entries(s).find(function(t){return t.key===b.dataset.faceRemove;});if(x){if(x.custom){s.customTags[x.custom]=s.customTags[x.custom].filter(function(t){return t!==x.en;});set(s);}else set(CAW.state.remove(s,x.field,x.option));}}
      if(b.dataset.faceKeep){acknowledged.add(b.dataset.faceKeep);renderTags();}
      if(b.dataset.facePreset){var p=F.presets.find(function(x){return x.id===b.dataset.facePreset;});host.preset({id:p.id,labelJa:p.label,summaryJa:'顔の構造と固定タグを設定します',patch:F.presetPatch(s,p.id),facePreset:p.id});}
      if(b.dataset.faceDiff){var p=F.list().find(function(x){return x.id===b.dataset.faceDiff;});if(p)showDiff(F.snapshot(s),p);}
      if(b.hasAttribute('data-face-compare')){var ps=F.list(),a=ps.find(function(x){return x.id===$('face-compare-from').value;}),c=ps.find(function(x){return x.id===$('face-compare-to').value;});if(a&&c)showDiff(a,c);}
    }catch(err){host.toast('保存・操作に失敗しました：'+err.message);}});
    $('face-library-dialog').addEventListener('close',function(){document.body.classList.remove('modal-open');});
  }
  CAW.faceUi={init:init,render:render};
})(window);
