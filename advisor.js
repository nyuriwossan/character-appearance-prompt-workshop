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
    if(CAW.colors.selected(s,'irisLeftColor')&&CAW.colors.selected(s,'irisRightColor')&&a.irisLeftColor!==a.irisRightColor&&has(s,'irisPattern','solid'))out.push(issue('eye_side_color_conflict','warning','左右の瞳色と単色指定を確認してください','左右に異なる色と「単色の瞳」が設定されています。オッドアイとして扱う場合は単色を解除できます。',{irisPattern:a.irisPattern.filter(function(x){return x!=='solid';})}));
    if((has(s,'irisColor','heterochromatic')||has(s,'irisPattern','heterochromia'))&&(!CAW.colors.selected(s,'irisLeftColor')||!CAW.colors.selected(s,'irisRightColor')))out.push(issue('missing_eye_side_colors','suggestion','オッドアイの左右の色を指定できます','「瞳色の詳細」で左目・右目の色を設定すると、どちらの目が何色か出力できます。'));
    if(has(s,'hairMulticolor','none')&&D.fields.some(function(f){return f.category==='hairColor'&&f.colorDetail&&a[f.id];}))out.push(issue('inactive_hair_details','info','単色の間は詳細な髪色を出力しません','部分別の髪色は保存されています。使う場合は「単色」を解除してください。'));
    if(has(s,'glassesUsage','none')&&(a.glassesShape||a.frameThickness||a.frameColor||a.lenses))out.push(issue('glasses_state_conflict','hard','メガネの状態が一致していません','「メガネなし」とフレーム・レンズの指定が同時に選ばれています。',{glassesShape:null,frameThickness:null,frameColor:null,lenses:null}));
    if(has(s,'piercingUsage','none')&&(a.piercingPosition.length||a.piercingCount||a.piercingStyle.length))out.push(issue('piercing_state_conflict','hard','ピアスの状態が一致していません','「ピアスなし」と位置・数・形状の指定が同時に選ばれています。',{piercingPosition:[],piercingCount:null,piercingStyle:[]}));
    if((has(s,'silhouette','petite')||has(s,'silhouette','slender'))&&has(s,'muscle','very_high'))out.push(issue('body_conflict','warning','体格の指定が離れています','華奢・細身と非常に筋肉質は、モデルによって片方が弱くなる場合があります。'));
    if(count>42)out.push(issue('too_many_details','warning','細かな指定が多めです','詳細プロンプトが長く、微細な指定が競合しやすい状態です。'));
    if((a.molePosition.length+a.scarPosition.length)>4)out.push(issue('too_many_marks','warning','固有特徴が多めです','ほくろと傷が多いと、位置や数が不安定になりやすくなります。'));
    if(has(s,'piercingCount','multiple')||a.piercingPosition.length>2||a.piercingStyle.length>2)out.push(issue('too_many_piercings','warning','ピアスの指定が多めです','数・位置・形状を多く重ねると、一部が省略される場合があります。'));
    var side=a.molePosition.concat(a.scarPosition).concat(a.eyeAsymmetry).concat(a.browDetail).some(function(id){return /left|right/.test(id);});
    if(side)out.push(issue('left_right','info','左右指定は反転する場合があります','生成モデルによって左右が反転することがあります。'));
    if(a.molePosition.length||has(s,'scarVisibility','faint'))out.push(issue('subtle_feature','info','小さな特徴は省略される場合があります','小さなほくろや薄い傷は、全身画像では消える場合があります。'));
    if(has(s,'glassesShape','rimless'))out.push(issue('rimless_glasses','info','リムレス眼鏡は省略される場合があります','フレームが薄いため、モデルによって眼鏡自体が省略されます。'));
    if(has(s,'piercingStyle','small_stud'))out.push(issue('small_piercing','info','小さなピアスは省略される場合があります','小さなスタッドは、全身画像や低解像度では消える場合があります。'));
    if(has(s,'piercingPosition','mouth')||has(s,'piercingPosition','lip'))out.push(issue('mouth_piercing','info','口元のピアスは位置がずれる場合があります','口元や唇周辺のピアスは、モデルによって位置がぶれる場合があります。'));
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
