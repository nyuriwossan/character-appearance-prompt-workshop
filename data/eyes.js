(function (root) {
  'use strict';
  var add = root.CAW.data.addField;
  add({id:'eyeShape',labelJa:'目の基本形',category:'eyes',selectionMode:'multi',includeInShort:true,priority:90},[
    'round|丸い目|round eyes','almond|アーモンド型の目|almond-shaped eyes','narrow|細い目|narrow eyes','upturned|つり目|upturned eyes','downturned|たれ目|downturned eyes','half_lidded|半目がち|half-lidded eyes','monolid|一重らしい目元|monolid eyes'
  ]);
  add({id:'eyeSize',labelJa:'目の大きさ',category:'eyes',includeInShort:true,priority:72},['small|小さな目|small eyes','medium|標準的な目|medium-sized eyes','large|大きな目|large eyes']);
  add({id:'eyeHeight',labelJa:'目の縦幅',category:'eyes',priority:42},['narrow|縦幅が狭い|narrow eye opening','balanced|標準的な縦幅|balanced eye height','wide|縦幅が広い|wide eye opening']);
  add({id:'eyeWidth',labelJa:'目の横幅',category:'eyes',priority:48},['short|横幅が短い|short eyes','balanced|標準的な横幅|balanced eye width','long|切れ長|elongated eyes']);
  add({id:'outerCorner',labelJa:'目尻の角度',category:'eyes',priority:68},['down|下がった目尻|downturned outer eye corners','level|水平な目尻|level outer eye corners','up|上がった目尻|upturned outer eye corners']);
  add({id:'upperEyelid',labelJa:'上まぶたの重さ',category:'eyes',selectionMode:'multi',includeInShort:true,priority:74},[
    'light|軽い上まぶた|light upper eyelids','balanced|自然な上まぶた|natural upper eyelids','heavy|重い上まぶた|heavy upper eyelids','hooded|かぶさるまぶた|hooded eyelids'
  ]);
  add({id:'eyelidFold',labelJa:'二重の形',category:'eyes',priority:36},['monolid|一重|monolid','inner_double|末広型の二重|tapered double eyelids','parallel_double|平行型の二重|parallel double eyelids','hidden_double|奥二重|hidden double eyelids']);
  add({id:'lowerEyelid',labelJa:'下まぶた',category:'eyes',selectionMode:'multi',priority:35},['smooth|なめらかな下まぶた|smooth lower eyelids','defined|輪郭のある下まぶた|defined lower eyelids','raised|やや持ち上がった下まぶた|slightly raised lower eyelids','shadowed|影のある下まぶた|shadowed lower eyelids']);
  add({id:'tearBags',labelJa:'涙袋',category:'eyes',selectionMode:'multi',priority:28,modelDependency:'medium'},['none|涙袋なし|no visible tear bags','subtle|控えめな涙袋|subtle under-eye fullness','defined|明瞭な涙袋|defined tear bags','soft|柔らかな涙袋|soft under-eye fullness']);
  add({id:'irisSize',labelJa:'虹彩の大きさ',category:'eyes',priority:30},['small|小さな虹彩|small irises','medium|標準的な虹彩|medium irises','large|大きな虹彩|large irises']);
  add({id:'upperLashes',labelJa:'上まつ毛',category:'eyes',selectionMode:'multi',priority:30},['sparse|まばらな上まつ毛|sparse upper eyelashes','natural|自然な上まつ毛|natural upper eyelashes','long|長い上まつ毛|long upper eyelashes','thick|濃い上まつ毛|thick upper eyelashes']);
  add({id:'lowerLashes',labelJa:'下まつ毛',category:'eyes',selectionMode:'multi',priority:20},['none|下まつ毛を強調しない|unaccented lower eyelashes','sparse|まばらな下まつ毛|sparse lower eyelashes','natural|自然な下まつ毛|natural lower eyelashes','defined|明瞭な下まつ毛|defined lower eyelashes']);
  add({id:'eyeAsymmetry',labelJa:'目の左右差',category:'eyes',selectionMode:'multi',priority:24,modelDependency:'high'},['even|左右差なし|symmetrical eyes','slight|わずかな左右差|slightly asymmetrical eyes','left_narrower|左目がやや細い|slightly narrower left eye','right_narrower|右目がやや細い|slightly narrower right eye']);
  add({id:'irisColor',labelJa:'瞳の基本色',category:'eyes',includeInShort:true,priority:88},[
    'black|黒い瞳|black eyes|#151515','dark_brown|濃い茶色の瞳|dark brown eyes|#3B2418','brown|茶色の瞳|brown eyes|#6B452C','amber|琥珀色の瞳|amber eyes|#C4862A','hazel|ヘーゼルの瞳|hazel eyes|#8A7B3F','gold|金色の瞳|golden eyes|#D5A72E','yellow|黄色の瞳|yellow eyes|#E1C64A','gray|灰色の瞳|gray eyes|#858B92','silver|銀色の瞳|silver eyes|#C1C7CF','blue_gray|青灰色の瞳|blue-gray eyes|#667F96','sky_blue|空色の瞳|sky blue eyes|#76B8E8','blue|青い瞳|blue eyes|#376CA8','navy|紺色の瞳|navy blue eyes|#283C68','teal|青緑の瞳|teal eyes|#2F898A','green|緑の瞳|green eyes|#4E8A52','olive|オリーブ色の瞳|olive eyes|#7E803E','red|赤い瞳|red eyes|#A33C42','crimson|深紅の瞳|crimson eyes|#7E2232','violet|紫色の瞳|violet eyes|#73558F','lavender|ラベンダー色の瞳|lavender eyes|#A38CC2','pink|桃色の瞳|pink eyes|#D77D9C','rose|ローズ色の瞳|rose eyes|#B85672','white|白い瞳|white eyes|#E9EDF2','heterochromatic|左右で異なる瞳色|heterochromatic eyes|#8C719F'
  ]);
  add({id:'irisPattern',labelJa:'瞳の配色方式',category:'eyes',selectionMode:'multi',priority:38,modelDependency:'medium'},['solid|単色の瞳|solid-colored irises','gradient|グラデーションの瞳|gradient irises','central_ring|中央リング|central iris ring','sectoral|部分的な異色|sectoral heterochromia','heterochromia|オッドアイ|complete heterochromia']);
  add({id:'irisBrightness',labelJa:'瞳の明度',category:'eyes',priority:22},['dark|暗い瞳|dark-toned irises','medium|中間明度の瞳|medium-toned irises','light|明るい瞳|light-toned irises','luminous|澄んだ明るい瞳|luminous irises']);
  add({id:'irisSaturation',labelJa:'瞳の彩度',category:'eyes',priority:20},['muted|くすんだ瞳|muted iris color','soft|柔らかな彩度|soft iris color','clear|澄んだ色|clear iris color','vivid|鮮やかな瞳|vivid iris color']);
})(typeof window !== 'undefined' ? window : globalThis);
