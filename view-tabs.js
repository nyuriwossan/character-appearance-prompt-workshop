(function (root) {
  'use strict';
  // 「外見設計」「顔ID・LoRA」の表示切り替え。表示を切り替えるだけで、外見データの描画・保存・初期化には触れない。
  // 両タブは同じ state を参照しており、顔IDの適用などで state が変わると app.js の renderAll が両方を描き直す。
  var CAW=root.CAW,TABS=['design','face'],current='design',scrollMemo={};
  function $(id){return document.getElementById(id);}
  function tab(id){return $('tab-'+id);}
  function panel(id){return $('view-'+id);}
  // タブバーより下を見ている状態で切り替えたときは、新しいタブの先頭（タブバー直下）から表示する。
  // タブバーは sticky なので、その位置ではなく表示したパネルの位置から「タブバー直下」を求める。
  // ページ全体は scroll-behavior:smooth。タブ切り替えでは高さが変わるため、アニメーションさせずに一度で移動する。
  function jump(fn){var html=document.documentElement,prev=html.style.scrollBehavior;html.style.scrollBehavior='auto';try{fn();}finally{html.style.scrollBehavior=prev;}}
  function topOf(id){var bar=$('view-tabs'),p=panel(id);return Math.max(0,p.getBoundingClientRect().top+root.scrollY-(bar?bar.offsetHeight:0)-12);}
  function show(id,opts){
    opts=opts||{};if(TABS.indexOf(id)<0)return;
    if(id===current){if(opts.target)reveal(opts.target);return;}
    scrollMemo[current]=root.scrollY;
    TABS.forEach(function(t){var on=t===id,b=tab(t),p=panel(t);b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;p.hidden=!on;});
    document.body.dataset.view=id;current=id;
    if(opts.target){reveal(opts.target);}
    else{var y=scrollMemo[id],top=topOf(id);jump(function(){root.scrollTo(0,y!==undefined?y:Math.min(root.scrollY,top));});}
    if(opts.focus)tab(id).focus({preventScroll:true});
  }
  function reveal(targetId){var el=$(targetId);if(!el)return;jump(function(){el.scrollIntoView({block:'start'});});if(el.tabIndex<0&&!el.hasAttribute('tabindex'))el.setAttribute('tabindex','-1');el.focus({preventScroll:true});}
  function init(){
    document.body.dataset.view=current;
    document.addEventListener('click',function(e){var b=e.target.closest('[data-view-tab]');if(!b)return;e.preventDefault();show(b.dataset.viewTab,{target:b.dataset.viewTarget,focus:b.getAttribute('role')==='tab'});});
    // WAI-ARIA のタブパターン：左右キー・Home・End で移動して切り替える。
    $('view-tabs').addEventListener('keydown',function(e){var i=TABS.indexOf(current),next={ArrowLeft:i-1,ArrowRight:i+1,Home:0,End:TABS.length-1}[e.key];if(next===undefined)return;e.preventDefault();show(TABS[(next+TABS.length)%TABS.length],{focus:true});});
  }
  CAW.viewTabs={init:init,show:show,current:function(){return current;}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(window);
