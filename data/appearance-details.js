(function(root){
  'use strict';
  var D=root.CAW.data;
  function extend(id,specs){var f=D.byField(id),count=f.options.length,temp=D.addField(Object.assign({},f),specs);D.fields.pop();temp.options.forEach(function(o){o.sortOrder+=count;});f.options=f.options.concat(temp.options);}
  extend('irisColor',[
    'gray_green|灰緑の瞳|gray-green eyes|#819487','ice_blue|氷青の瞳|ice blue eyes|#B1D8E8','steel_blue|鋼青の瞳|steel blue eyes|#64849B','emerald|エメラルドの瞳|emerald eyes|#288761','mint|ミントの瞳|mint green eyes|#9ACCB5','turquoise|ターコイズの瞳|turquoise eyes|#4CAFAF','seafoam|淡い青緑の瞳|seafoam green eyes|#A4C8BB','sapphire|サファイアの瞳|sapphire blue eyes|#2D55A5','honey|蜂蜜色の瞳|honey-colored eyes|#BE9849','gold_brown|金茶の瞳|golden brown eyes|#9F793E','copper|銅色の瞳|copper-colored eyes|#AA6B47','burgundy|ワイン色の瞳|burgundy eyes|#773D50','amethyst|アメジストの瞳|amethyst eyes|#9571AD','lilac|薄紫の瞳|lilac eyes|#BDABD2','peach|淡い桃色の瞳|peach-colored eyes|#DCA69A','pale_gray|淡い灰色の瞳|pale gray eyes|#B9C1C5'
  ]);
  extend('hairColor',[
    'ash_blonde|アッシュブロンド|ash blonde hair|#B9AA8D','honey_blonde|ハニーブロンド|honey blonde hair|#C9A365','strawberry_blonde|ストロベリーブロンド|strawberry blonde hair|#D39B7A','champagne|シャンパンブロンド|champagne blonde hair|#E3D1AD','rose_gold|ローズゴールド|rose gold hair|#CD9F90','silver_blue|青みの銀髪|silver-blue hair|#A9BACA','silver_lavender|藤色の銀髪|silver-lavender hair|#B8ACCD','pearl_white|真珠色の白髪|pearl white hair|#EAE6DC','smoky_gray|スモーキーグレー|smoky gray hair|#91909A','charcoal|チャコール|charcoal gray hair|#46464D','dusty_pink|くすみピンク|dusty pink hair|#B68F9F','peach|ピーチ|peach hair|#E9B29F','pastel_blue|パステルブルー|pastel blue hair|#A7CCEA','mint|ミント|mint green hair|#A9D2BE','pastel_green|パステルグリーン|pastel green hair|#B5D4AE','lilac|ライラック|lilac hair|#C4B0DB','burgundy|ワインレッド|burgundy hair|#773748','dark_purple|深い紫|dark purple hair|#453553'
  ]);
  function colorField(id,label,category,source,suffix,mode){
    var specs=D.byField(source).options.filter(function(o){return o.id!=='heterochromatic';}).map(function(o){return {id:o.id,labelJa:o.labelJa.replace(/の瞳$|い瞳$|色の髪$|髪$/,''),promptEn:o.promptEn.replace(/ eyes$| hair$/,'')+' '+suffix,colorValue:o.colorValue};});
    D.addField({id:id,labelJa:label,category:category,colorDetail:true,detailModes:mode||[],priority:89,includeInShort:true,defaultGroup:category==='hairColor'?'arrange':'basic',modelDependency:'high'},specs);
  }
  colorField('irisLeftColor','左目の色','eyes','irisColor','left eye');
  colorField('irisRightColor','右目の色','eyes','irisColor','right eye');
  colorField('irisInnerColor','虹彩の内側の色','eyes','irisColor','inner irises');
  colorField('irisOuterColor','虹彩の外側の色','eyes','irisColor','outer irises');
  colorField('irisRingColor','中央リングの色','eyes','irisColor','central iris rings');
  colorField('irisSectorColor','部分的な異色の色','eyes','irisColor','iris sectors');
  colorField('hairRootColor','根元の色','hairColor','hairColor','hair roots',['gradient']);
  colorField('hairTipColor','毛先の色','hairColor','hairColor','hair tips',['tips','gradient']);
  colorField('hairStreakColor','メッシュの色','hairColor','hairColor','hair streaks',['streaks']);
  colorField('hairInnerColor','インナーカラー','hairColor','hairColor','inner hair',['inner']);
  colorField('hairUnderlayerColor','内側の層の色','hairColor','hairColor','hair underlayer',['underlayer']);
  colorField('hairLeftColor','左側の髪色（本人基準）','hairColor','hairColor','hair on the character\'s left side',['split']);
  colorField('hairRightColor','右側の髪色（本人基準）','hairColor','hairColor','hair on the character\'s right side',['split']);
  colorField('hairBangsColor','前髪の色','hairColor','hairColor','bangs');
  extend('baseCut',[
    'high_ponytail|高いポニーテール|high ponytail','side_ponytail|サイドポニーテール|side ponytail','twin_tails|ツインテール|twin tails','low_twin_tails|低いツインテール|low twin tails','twin_braids|ツイン三つ編み|twin braids','double_buns|ツインお団子|double hair buns','half_up|ハーフアップ|half-up hairstyle','half_up_bun|ハーフアップお団子|half-up hair bun','side_braid|サイド三つ編み|side braid','fishtail|フィッシュボーン|fishtail braid','french_braid|フレンチブレイド|French braid','dutch_braid|ダッチブレイド|Dutch braid','crown_braid|編み込みの冠|crown braid','braided_bun|編み込みお団子|braided bun','messy_bun|無造作なお団子|messy hair bun','chignon|低いシニヨン|low chignon','slicked_back|オールバック|slicked-back hair','two_block|ツーブロック|two-block haircut','hime|姫カット|hime cut','jellyfish|クラゲカット|jellyfish haircut','butterfly|バタフライカット|butterfly haircut','asym_bob|アシンメトリーボブ|asymmetrical bob','a_line_bob|前下がりボブ|A-line bob','inverted_bob|後ろ短めのボブ|inverted bob','french_bob|フレンチボブ|French bob','pageboy|ページボーイ|pageboy haircut','pompadour|ポンパドール|pompadour','quiff|クイッフ|quiff hairstyle','dreadlocks|ドレッドロックス|dreadlocks','cornrows|コーンロウ|cornrows','afro|アフロ|afro hairstyle','bowl|ボウルカット|bowl cut'
  ]);
  [
    ['hair_twintails','ツインテール','長髪／左右2つに結ぶ',{hairLength:'long',baseCut:['twin_tails']}],
    ['hair_low_twintails','低いツインテール','肩まで／低い位置で2つ結び',{hairLength:'shoulder',baseCut:['low_twin_tails']}],
    ['hair_twin_braids','ツイン三つ編み','長髪／左右の編み髪',{hairLength:'long',baseCut:['twin_braids']}],
    ['hair_double_buns','ツインお団子','左右のお団子／短い前髪',{baseCut:['double_buns'],bangs:['short']}],
    ['hair_half_up','ハーフアップ','胸上／上半分をまとめる',{hairLength:'medium',baseCut:['half_up']}],
    ['hair_half_up_bun','ハーフアップお団子','肩まで／上半分をお団子に',{hairLength:'shoulder',baseCut:['half_up_bun']}],
    ['hair_high_ponytail','高いポニーテール','長髪／高い位置で1つ結び',{hairLength:'long',baseCut:['high_ponytail']}],
    ['hair_side_braid','サイド三つ編み','長髪／片側に編み髪',{hairLength:'long',baseCut:['side_braid']}],
    ['hair_crown_braid','編み込みの冠','頭周りの編み込み／顔周りの毛束',{baseCut:['crown_braid'],sideHair:['face_framing']}],
    ['hair_chignon','低いシニヨン','低いまとめ髪／センターパート',{baseCut:['chignon'],parting:'center'}],
    ['hair_hime','姫カット','長髪／ぱっつん前髪／短い横髪',{hairLength:'long',baseCut:['hime'],bangs:['straight'],sideHair:['short_sidelocks']}],
    ['hair_jellyfish','クラゲカット','段差のある上下／長い襟足',{baseCut:['jellyfish'],nape:'long'}],
    ['hair_butterfly','バタフライカット','長いレイヤー／顔周りの毛束',{hairLength:'long',baseCut:['butterfly'],sideHair:['face_framing']}],
    ['hair_asym_bob','アシンメトリーボブ','顎まで／左右で異なる長さ',{hairLength:'chin',baseCut:['asym_bob']}],
    ['hair_slicked_back','オールバック','短髪／後ろへ流す／前髪なし',{hairLength:'short',baseCut:['slicked_back'],bangs:['none']}],
    ['hair_cornrows','コーンロウ','頭皮に沿う編み込み',{baseCut:['cornrows'],bangs:['none']}]
  ].forEach(function(p){D.presets.push({id:p[0],group:'髪型',labelJa:p[1],summaryJa:p[2],patch:p[3]});});
})(typeof window!=='undefined'?window:globalThis);
