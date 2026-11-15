(function (root) {
  'use strict';
  // 髪型参考一覧。画像と選択肢の対応は assets/hair-reference/manifest.json の fieldId／optionId だけで決め、
  // 表示名と並び順は外見設計と同じ辞書（data/*.js）から取る。画像の追加は「images/ に置く＋manifest に1件足す」だけでよい。
  var CAW=root.CAW,D=CAW.data,BASE='assets/hair-reference/',FIELDS=['baseCut'];
  var IMAGE_PATH=/^images\/[a-z0-9_-]+\.(webp|png|jpe?g|avif)$/;
  function $(id){return document.getElementById(id);}
  function el(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
  // manifest の1件を検証する。辞書にない選択肢・不正な画像パス・重複は表示しない（推測や流用で補わない）。
  function validEntries(list){
    var seen={},out=[];
    (Array.isArray(list)?list:[]).forEach(function(x){
      if(!x||typeof x!=='object')return;var f=D.byField(x.fieldId),o=f&&D.byOption(x.fieldId,x.optionId),key=x.fieldId+':'+x.optionId;
      if(FIELDS.indexOf(x.fieldId)<0||!o||seen[key]||typeof x.image!=='string'||!IMAGE_PATH.test(x.image)){if(root.console)console.warn('hair-reference: skipped manifest entry',x);return;}
      if(x.labelJa&&x.labelJa!==o.labelJa&&root.console)console.warn('hair-reference: label differs from the dictionary; using the dictionary label',x.labelJa,o.labelJa);
      seen[key]=1;out.push({field:f,option:o,description:typeof x.descriptionJa==='string'?x.descriptionJa:'',image:BASE+x.image});
    });
    return out;
  }
  function card(e){
    var item=el('li','reference-card'),fig=el('figure','reference-figure'),frame=el('div','reference-image'),img=el('img');
    img.src=e.image;img.alt=e.option.labelJa+'の参考イラスト';img.width=418;img.height=418;img.loading='lazy';img.decoding='async';
    img.dataset.optionId=e.option.id;
    img.addEventListener('error',function(){frame.classList.add('failed');frame.replaceChildren(el('span','reference-fallback','画像を読み込めませんでした'));item.dataset.failed='true';},{once:true});
    frame.appendChild(img);fig.appendChild(frame);
    var cap=el('figcaption','reference-caption');cap.appendChild(el('span','reference-name',e.option.labelJa));if(e.description)cap.appendChild(el('span','reference-desc',e.description));
    fig.appendChild(cap);item.appendChild(fig);item.dataset.optionId=e.option.id;return item;
  }
  function render(entries){
    var box=$('reference-sections');box.replaceChildren();
    FIELDS.forEach(function(fieldId){
      var f=D.byField(fieldId),mine=entries.filter(function(e){return e.field.id===fieldId;}).sort(function(a,b){return f.options.indexOf(a.option)-f.options.indexOf(b.option);});
      var sec=el('section','reference-section');sec.setAttribute('aria-labelledby','ref-'+fieldId);
      var h=el('h3','reference-field',f.labelJa);h.id='ref-'+fieldId;sec.appendChild(h);
      var grid=el('ul','reference-grid');mine.forEach(function(e){grid.appendChild(card(e));});sec.appendChild(grid);
      // まだ画像がない選択肢は、名前だけを「画像準備中」として示す（画像は出さない）。
      var have={};mine.forEach(function(e){have[e.option.id]=1;});var rest=f.options.filter(function(o){return !have[o.id];});
      if(rest.length){var d=el('details','reference-pending'),s=el('summary',null,'画像準備中の髪型（'+rest.length+'種類）'),ul=el('ul','reference-pending-list');rest.forEach(function(o){var li=el('li',null,o.labelJa);li.dataset.optionId=o.id;ul.appendChild(li);});d.appendChild(s);d.appendChild(el('p','reference-pending-note','これらの髪型は参考画像がまだありません。名前は外見設計の選択肢と同じです。'));d.appendChild(ul);sec.appendChild(d);}
      box.appendChild(sec);
      $('reference-count').textContent=mine.length===f.options.length?'「'+f.labelJa+'」全'+f.options.length+'種類の参考画像を掲載しています。':'現在'+mine.length+'種類の参考画像を掲載しています（「'+f.labelJa+'」全'+f.options.length+'種類のうち）。今後追加していく予定です。';
    });
  }
  // 「外見設計に戻る」：外見設計から来た場合はブラウザの「戻る」と同じ動きにして、Safari の戻るキャッシュで画面をそのまま戻す。
  // 直接開いた場合などは外見設計のページへ移動する（保存データはそのまま読み込まれ、初期化しない）。
  function cameFromApp(){try{if(!document.referrer)return false;var r=new URL(document.referrer),app=new URL('./',location.href);return r.origin===app.origin&&(r.pathname===app.pathname||r.pathname===app.pathname+'index.html');}catch(e){return false;}}
  function initBack(){Array.from(document.querySelectorAll('[data-reference-back]')).forEach(function(a){a.addEventListener('click',function(ev){if(cameFromApp()&&root.history.length>1){ev.preventDefault();root.history.back();}});});}
  function load(){
    initBack();
    fetch(BASE+'manifest.json',{cache:'no-cache'}).then(function(r){if(!r.ok)throw new Error(r.status);return r.json();}).then(function(list){render(validEntries(list));}).catch(function(){
      $('reference-count').textContent='参考画像の一覧を読み込めませんでした。';var e=$('reference-error');e.hidden=false;e.textContent='通信状態を確認して、ページを再読込してください。外見設計の入力内容には影響しません。';
    });
  }
  CAW.hairReference={validEntries:validEntries,base:BASE,fields:FIELDS};
  if(typeof document==='undefined')return;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load);else load();
})(typeof window !== 'undefined' ? window : globalThis);
