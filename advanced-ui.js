(function (root) {
  'use strict';
  // 高度な設定（端末側のUI設定）、HEX入力とカラーピッカー、高度な出力欄。
  // 高度な設定がOFFの間は何も描画しないため、従来の画面と操作は変わらない。
  var CAW=root.CAW,D=CAW.data,H=CAW.hex,A=CAW.advanced,host,ui,pick={field:null,h:0,s:0,v:0.5,dragging:false};
  var EMPTY='まだ出力できる項目が選ばれていません。',BAD='#RRGGBB（例：#C8CCD6）の形で入力してください。この値は保存・出力していません。';
  function $(id){return document.getElementById(id);}
  function all(sel,p){return Array.from((p||document).querySelectorAll(sel));}
  function esc(x){return String(x).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function hexOn(){return !!(ui&&ui.advanced&&ui.hex);}
  function label(id){var f=D.byField(id);return f?f.labelJa:id;}
  function save(){ui=CAW.storage.saveUi(ui);}

  // ---- 各色項目に添えるHEX入力 ----
  function widget(id,s){
    if(!hexOn()||!H.isField(id))return '';
    var hex=H.get(s,id),name=esc(label(id));
    return '<div class="hex-control" data-hex-field="'+id+'"><button type="button" class="hex-open" data-hex-open="'+id+'" aria-label="'+name+'のカラーピッカーを開く"><span class="hex-swatch'+(hex?'':' empty')+'" style="background:'+(hex||'transparent')+'" aria-hidden="true"></span><span>ピッカー</span></button>'+
      '<label class="hex-field"><span>HEX</span><input type="text" data-hex-input="'+id+'" inputmode="text" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" maxlength="9" placeholder="#RRGGBB" value="'+esc(hex||'')+'" aria-label="'+name+'のHEXコード" aria-describedby="hex-msg-'+id+'"></label>'+
      '<button type="button" class="hex-clear" data-hex-clear="'+id+'" aria-label="'+name+'のHEXを解除"'+(hex?'':' hidden')+'>解除</button>'+
      '<p class="hex-message" id="hex-msg-'+id+'" role="status" aria-live="polite">'+esc(message(s,id).text)+'</p></div>';
  }
  function message(s,id){
    var hex=H.get(s,id);if(!hex)return {text:'',kind:''};
    var st=H.status(s).find(function(x){return x.field===id;});
    if(st.mismatch)return {kind:'warn',text:'選択中の色名とHEXの色味が離れています。意図した配色ならこのままで大丈夫です。'};
    if(!st.active)return {kind:'info',text:'いまの選択・配色方式ではこのHEXは出力されません（設定は保持しています）。'};
    if(st.hexOnly)return {kind:'info',text:'色名が未選択のため「'+H.neutral[id]+' ('+hex+')」のように部位名で出力します。'};
    return {text:'',kind:''};
  }
  function refreshWidgets(){
    var s=host.get();
    all('.hex-control').forEach(function(el){var id=el.dataset.hexField,hex=H.get(s,id),input=el.querySelector('input'),sw=el.querySelector('.hex-swatch'),msg=el.querySelector('.hex-message'),bad=input.classList.contains('bad');
      if(document.activeElement!==input&&!bad)input.value=hex||'';
      sw.style.background=hex||'transparent';sw.classList.toggle('empty',!hex);el.querySelector('.hex-clear').hidden=!hex;
      if(!bad){var m=message(s,id);msg.textContent=m.text;msg.dataset.kind=m.kind;}
    });
    renderOverview();
  }
  function setBad(input,on){var msg=input.closest('.hex-control').querySelector('.hex-message');input.classList.toggle('bad',on);if(on){input.setAttribute('aria-invalid','true');msg.textContent=BAD;msg.dataset.kind='error';}else input.removeAttribute('aria-invalid');}
  function applyHex(id,value,rebuild){var s=H.set(host.get(),id,value);(rebuild?host.set:host.update)(s);}

  // ---- 高度な設定パネル ----
  function renderOverview(){
    var box=$('hex-overview');if(!box)return;var list=H.status(host.get());
    if(!ui.advanced||!list.length){box.innerHTML='';return;}
    if(!ui.hex){box.innerHTML='<p class="face-hint">この外見データにはHEX指定が'+list.length+'件保存されています。HEX機能をONにすると編集・出力できます（OFFの間も消えません）。</p>';return;}
    box.innerHTML='<p class="hex-overview-title">設定中のHEX（'+list.length+'件）</p><div class="hex-overview-list">'+list.map(function(x){return '<button type="button" class="hex-chip'+(x.active?'':' idle')+'" data-hex-open="'+x.field+'" aria-label="'+esc(x.labelJa)+' '+x.hex+(x.active?' 出力中':' 保持のみ')+'。ピッカーを開く"><span class="hex-swatch" style="background:'+x.hex+'" aria-hidden="true"></span><span>'+esc(x.labelJa)+'</span><code>'+x.hex+'</code><small>'+(x.active?'出力中':'保持のみ')+'</small></button>';}).join('')+'</div><button type="button" class="button danger hex-clear-all" data-hex-clear-all>HEXをすべて解除</button>';
  }
  function renderPanel(){
    $('advanced-toggle').checked=ui.advanced;$('advanced-state').textContent=ui.advanced?'ON':'OFF';
    $('advanced-options').hidden=!ui.advanced;$('advanced-markdown').checked=ui.markdown;$('advanced-hex').checked=ui.hex;
    renderOverview();
  }

  // ---- 高度な出力 ----
  function currentFormat(){var list=A.available(ui);return list.length?(list.find(function(f){return f.id===ui.format;})||list[0]).id:null;}
  function renderOutputs(){
    var box=$('advanced-outputs');if(!box)return;var list=A.available(ui),format=currentFormat();
    if(!format){box.hidden=true;box.innerHTML='';return;}
    var s=host.get(),text=A.render(s,format,ui.scope),note=format==='markdown'?'選択した項目を見出しごとに整理した英語Markdownです。':H.status(s).some(function(x){return x.active;})?'色名のあとに、設定したHEXを併記しています。':'HEXが未設定のため、色はまだ色名だけです。外見設計の色の項目でHEXを設定できます。';
    function seg(items,cur,attr,name){return '<div class="segmented" role="group" aria-label="'+name+'">'+items.map(function(x){return '<button type="button" '+attr+'="'+x.id+'" aria-pressed="'+(x.id===cur)+'">'+x.labelJa+'</button>';}).join('')+'</div>';}
    box.hidden=false;
    box.innerHTML='<article class="output-card wide advanced-output"><div class="output-head"><h3>高度な出力 <span class="experimental-badge">実験的</span></h3><button class="copy-button" data-copy="advanced">コピー</button></div>'+seg(list,format,'data-adv-format','出力形式')+seg(A.scopes,ui.scope,'data-adv-scope','出力する範囲')+
      '<pre class="output-text '+(text?'':'empty')+'" id="output-advanced">'+esc(text||EMPTY)+'</pre><p class="face-hint">'+note+' MarkdownやHEXの効き方は画像生成モデルや生成条件で変わります。従来の出力は上の欄をそのまま使えます。</p></article>';
  }

  // ---- カラーピッカー（色相・彩度・明るさ／HEX直接入力／端末のピッカー）----
  function pickHex(){return H.fromHsv(pick);}
  function paint(source){
    var hex=pickHex(),hue='hsl('+Math.round(pick.h)+',100%,50%)',thumb=$('hex-sv-thumb');
    $('hex-sv').style.background='linear-gradient(to top,#000,rgba(0,0,0,0)),linear-gradient(to right,#fff,'+hue+')';
    thumb.style.left='calc(14px + (100% - 28px) * '+pick.s+')';thumb.style.top='calc(14px + (100% - 28px) * '+(1-pick.v)+')';thumb.style.background=hex;
    $('hex-h').value=Math.round(pick.h);$('hex-s').value=Math.round(pick.s*100);$('hex-v').value=Math.round(pick.v*100);
    $('hex-h-val').textContent=Math.round(pick.h)+'°';$('hex-s-val').textContent=Math.round(pick.s*100)+'%';$('hex-v-val').textContent=Math.round(pick.v*100)+'%';
    $('hex-s').style.setProperty('--track','linear-gradient(to right,'+H.fromHsv({h:pick.h,s:0,v:pick.v})+','+H.fromHsv({h:pick.h,s:1,v:pick.v})+')');
    $('hex-v').style.setProperty('--track','linear-gradient(to right,#000,'+H.fromHsv({h:pick.h,s:pick.s,v:1})+')');
    if(source!=='input'){$('hex-dialog-input').value=hex;dialogError(false);}
    $('hex-native').value=hex.toLowerCase();$('hex-preview-swatch').style.background=hex;$('hex-preview-code').textContent=hex;
  }
  // 入力途中や無彩色でつまみが飛ばないよう、色相・彩度は必要なときだけ更新する。
  function loadHex(hex,source){var c=H.toHsv(hex);if(!c)return;if(c.s>0&&c.v>0)pick.h=c.h;if(c.v>0)pick.s=c.s;pick.v=c.v;paint(source);}
  function dialogError(on){var el=$('hex-dialog-message');el.hidden=!on;el.textContent=on?'#RRGGBB（例：#C8CCD6）の形で入力してください。':'';$('hex-dialog-input').classList.toggle('bad',on);}
  function openPicker(id){
    if(!H.isField(id))return;var s=host.get(),cur=H.get(s,id),ref=H.reference(s,id),o=s.appearance[id]?D.byOption(id,s.appearance[id]):null;
    pick.field=id;pick.h=0;pick.s=0;pick.v=0.5;
    $('hex-dialog-title').textContent=label(id)+'のHEX';
    $('hex-preview-name').textContent=(o?'色名：'+o.labelJa:'色名：未選択（HEXだけでも設定できます）')+(cur?'':' ／ HEXは未設定');
    $('hex-reference').hidden=!ref;$('hex-reference').dataset.hex=ref||'';$('hex-reference-swatch').style.background=ref||'transparent';
    $('hex-unset').hidden=!cur;
    loadHex(cur||ref||'#808080');
    $('hex-dialog').showModal();document.body.classList.add('modal-open');
  }
  function closePicker(){if($('hex-dialog').open)$('hex-dialog').close();}
  function refocus(id){var el=document.querySelector('.hex-control [data-hex-open="'+id+'"]')||document.querySelector('[data-hex-open="'+id+'"]');if(el&&el.offsetParent)el.focus({preventScroll:true});}
  function initArea(){
    var area=$('hex-sv');
    function at(e){var r=area.getBoundingClientRect(),w=r.width-28,h=r.height-28;pick.s=Math.min(1,Math.max(0,w>0?(e.clientX-r.left-14)/w:0));pick.v=1-Math.min(1,Math.max(0,h>0?(e.clientY-r.top-14)/h:0));paint();}
    area.addEventListener('pointerdown',function(e){if(e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();pick.dragging=true;try{area.setPointerCapture(e.pointerId);}catch(err){}area.focus({preventScroll:true});at(e);});
    area.addEventListener('pointermove',function(e){if(pick.dragging)at(e);});
    ['pointerup','pointercancel','lostpointercapture'].forEach(function(n){area.addEventListener(n,function(){pick.dragging=false;});});
    area.addEventListener('keydown',function(e){var d={ArrowLeft:[-0.02,0],ArrowRight:[0.02,0],ArrowUp:[0,0.02],ArrowDown:[0,-0.02]}[e.key];if(!d)return;e.preventDefault();pick.s=Math.min(1,Math.max(0,pick.s+d[0]));pick.v=Math.min(1,Math.max(0,pick.v+d[1]));paint();});
  }

  function init(config){
    host=config;ui=CAW.storage.loadUi();initArea();
    document.addEventListener('change',function(e){var el=e.target;
      if(el.id==='advanced-toggle'||el.id==='advanced-markdown'||el.id==='advanced-hex'){ui[el.id==='advanced-toggle'?'advanced':el.id==='advanced-markdown'?'markdown':'hex']=el.checked;save();renderPanel();host.set(host.get());return;}
      if(el.dataset&&el.dataset.hexInput){var id=el.dataset.hexInput,raw=el.value.trim();
        if(raw===''){setBad(el,false);if(H.get(host.get(),id))applyHex(id,null);else refreshWidgets();return;}
        var hex=H.normalizeHex(raw);if(!hex){setBad(el,true);return;}
        setBad(el,false);el.value=hex;applyHex(id,hex);refreshWidgets();}
    });
    document.addEventListener('input',function(e){var el=e.target;
      if(el.dataset&&el.dataset.hexInput){var raw=el.value.trim().replace(/^[#＃]/,''),hex=H.normalizeHex(el.value);
        // 入力途中は何もしない。6桁そろった時点で反映する（3桁は確定時に反映）。
        if(el.classList.contains('bad')&&(hex||raw===''))setBad(el,false);
        if(hex&&raw.length===6)applyHex(el.dataset.hexInput,hex);return;}
      if(el.id==='hex-h'){pick.h=Number(el.value);paint();}
      if(el.id==='hex-s'){pick.s=Number(el.value)/100;paint();}
      if(el.id==='hex-v'){pick.v=Number(el.value)/100;paint();}
      if(el.id==='hex-native'){loadHex(el.value);}
      if(el.id==='hex-dialog-input'){var typed=el.value.trim().replace(/^[#＃]/,''),h=H.normalizeHex(el.value);if(h&&typed.length===6){dialogError(false);loadHex(h,'input');}}
    });
    document.addEventListener('keydown',function(e){var el=e.target;if(e.key!=='Enter'||e.isComposing)return;
      if(el.dataset&&el.dataset.hexInput){e.preventDefault();el.blur();}
      if(el.id==='hex-dialog-input'){e.preventDefault();var h=H.normalizeHex(el.value);if(h){dialogError(false);loadHex(h);}else dialogError(true);}
    });
    $('hex-dialog-input').addEventListener('change',function(){var h=H.normalizeHex(this.value);if(h){dialogError(false);loadHex(h);}else dialogError(this.value.trim()!=='');});
    document.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;
      if(b.dataset.hexOpen){openPicker(b.dataset.hexOpen);return;}
      if(b.dataset.hexClear){var id=b.dataset.hexClear,input=document.querySelector('[data-hex-input="'+id+'"]');if(input){setBad(input,false);input.value='';}applyHex(id,null);host.toast(label(id)+'のHEXを解除しました');return;}
      if(b.hasAttribute('data-hex-clear-all')){if(confirm('この外見データのHEX指定をすべて解除します。色名の選択は変わりません。')){host.set(H.clearAll(host.get()));host.toast('HEXをすべて解除しました');}return;}
      if(b.id==='hex-reference'){loadHex(b.dataset.hex);return;}
      if(b.hasAttribute('data-hex-cancel')){closePicker();return;}
      if(b.id==='hex-unset'){var f=pick.field;closePicker();applyHex(f,null,true);refocus(f);host.toast(label(f)+'のHEXを解除しました');return;}
      if(b.id==='hex-apply'){var typed=H.normalizeHex($('hex-dialog-input').value);if(!typed){dialogError(true);return;}var field=pick.field,value=pickHex();closePicker();applyHex(field,value,true);refocus(field);host.toast(label(field)+'を '+value+' に設定しました');return;}
      if(b.dataset.advFormat){ui.format=b.dataset.advFormat;save();renderOutputs();focusSeg('data-adv-format',ui.format);return;}
      if(b.dataset.advScope){ui.scope=b.dataset.advScope;save();renderOutputs();focusSeg('data-adv-scope',ui.scope);return;}
    });
    $('hex-dialog').addEventListener('close',function(){document.body.classList.remove('modal-open');pick.dragging=false;});
    renderPanel();
  }
  function focusSeg(attr,id){var el=document.querySelector('['+attr+'="'+id+'"]');if(el)el.focus({preventScroll:true});}
  function render(){renderPanel();}
  CAW.advancedUi={init:init,render:render,renderOutputs:renderOutputs,refreshWidgets:refreshWidgets,widget:widget,hexOn:hexOn,settings:function(){return ui;}};
})(window);
