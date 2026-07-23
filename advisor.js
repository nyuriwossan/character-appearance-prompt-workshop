(function (root) {
  'use strict';
  var CAW=root.CAW,D=CAW.data;
  function has(s,f,id){var v=s.appearance[f];return Array.isArray(v)?v.indexOf(id)>=0:v===id;}
  function issue(id,level,title,message,patch){return{id:id,level:level,titleJa:title,messageJa:message,patch:patch||null};}
  function check(raw){
    var s=CAW.normalizer.normalize(raw),a=s.appearance,out=[],count=CAW.generator.selected(s).length;
    if(has(s,'hairLength','short')&&(has(s,'baseCut','layered_long')||has(s,'baseCut','straight')))out.push(issue('hair_length_cut_conflict','hard','髪の長さとカットが競合しています','短髪と長髪向けカットが同時に選ばれています。',{baseCut:[]}));
    if(has(s,'bangs','none')&&a.bangs.length>1)out.push(issue('bangs_conflict','hard','前髪の指定が競合しています','「前髪なし」と別の前髪が同時に選ばれています。',{bangs:['none']}));
    if(has(s,'irisPattern','solid')&&(has(s,'irisPattern','heterochromia')||has(s,'irisColor','heterochromatic')))out.push(issue('iris_color_conflict','hard','瞳の配色指定が競合しています','単色とオッドアイの指定をどちらかに絞ってください。'));
    if(has(s,'hairMulticolor','none')&&a.hairMulticolor.length>1)out.push(issue('hair_color_conflict','hard','髪の配色指定が競合しています','単色と複数色の指定が同時に選ばれています。',{hairMulticolor:['none']}));
    if((has(s,'silhouette','petite')||has(s,'silhouette','slender'))&&has(s,'muscle','very_high'))out.push(issue('body_conflict','warning','体格の指定が離れています','華奢・細身と非常に筋肉質は、モデルによって片方が弱くなる場合があります。'));
    if(count>42)out.push(issue('too_many_details','warning','細かな指定が多めです','詳細プロンプトが長く、微細な指定が競合しやすい状態です。'));
    if((a.molePosition.length+a.scarPosition.length)>4)out.push(issue('too_many_marks','warning','固有特徴が多めです','ほくろと傷が多いと、位置や数が不安定になりやすくなります。'));
    var side=a.molePosition.concat(a.scarPosition).concat(a.eyeAsymmetry).concat(a.browDetail).some(function(id){return /left|right/.test(id);});
    if(side)out.push(issue('left_right','info','左右指定は反転する場合があります','生成モデルによって左右が反転することがあります。'));
    if(a.molePosition.length||has(s,'scarVisibility','faint'))out.push(issue('subtle_feature','info','小さな特徴は省略される場合があります','小さなほくろや薄い傷は、全身画像では消える場合があります。'));
    if(has(s,'glassesShape','rimless'))out.push(issue('rimless_glasses','info','リムレス眼鏡は省略される場合があります','フレームが薄いため、モデルによって眼鏡自体が省略されます。'));
    if(a.impression.length)out.push(issue('abstract_effect','info','抽象印象は広く作用します','抽象的なタグは顔や体格にも広く影響する場合があります。'));
    if(a.hairColor&&!a.hairLength&&!a.baseCut.length)out.push(issue('missing_hair_style','suggestion','髪型を加えると安定します','髪色はありますが、髪型が未設定です。'));
    if(a.irisColor&&!a.eyeShape.length)out.push(issue('missing_eye_shape','suggestion','目の形を加えると安定します','瞳色はありますが、目の形が未設定です。'));
    if(!a.silhouette&&!a.height)out.push(issue('missing_body','suggestion','身体つきを選べます','身体つきが未設定です。'));
    if(a.hairLength&&!a.baseCut.length)out.push(issue('missing_cut','suggestion','基本カットを選べます','髪の長さだけでなく、基本カットも選ぶと安定します。'));
    if(count<5)out.push(issue('few_selections','suggestion','外見の指定が少なめです','出力の多くがモデル任せになりやすい状態です。'));
    var seen={};return out.filter(function(x){if(seen[x.id])return false;seen[x.id]=1;return true;});
  }
  CAW.advisor={check:check};
})(typeof window !== 'undefined' ? window : globalThis);
