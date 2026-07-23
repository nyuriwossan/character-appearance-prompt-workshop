(function (root) {
  'use strict';
  var add=root.CAW.data.addField;
  add({id:'skinTone',labelJa:'肌色',category:'skin',includeInShort:true,priority:78},['porcelain|とても明るい肌|porcelain skin','fair|明るい肌|fair skin','light|淡い肌色|light skin','light_beige|明るいベージュ肌|light beige skin','beige|ベージュ肌|beige skin','olive|オリーブ肌|olive skin','tan|小麦色の肌|tan skin','brown|褐色肌|brown skin','deep_brown|濃い褐色肌|deep brown skin','dark|深い肌色|dark skin','ebony|黒檀色の肌|ebony skin','rosy_fair|赤みのある明るい肌|rosy fair skin']);
  add({id:'undertone',labelJa:'肌のアンダートーン',category:'skin',priority:38},['cool|青み寄り|cool skin undertone','neutral|ニュートラル|neutral skin undertone','warm|黄み寄り|warm skin undertone','olive|オリーブ寄り|olive skin undertone','pink|ピンク寄り|pink skin undertone']);
  add({id:'complexion',labelJa:'血色',category:'skin',priority:28},['pale|血色が淡い|pale complexion','subtle|控えめな血色|subtle complexion','healthy|健康的な血色|healthy complexion','rosy|赤みのある血色|rosy complexion']);
  add({id:'skinTexture',labelJa:'肌質',category:'skin',selectionMode:'multi',priority:24},['smooth|なめらかな肌|smooth skin','soft|柔らかな肌|soft skin','matte|マットな肌|matte skin','dewy|みずみずしい肌|dewy skin','freckled|そばかすのある肌|freckled skin','weathered|風雨にさらされた肌|weathered skin']);
  add({id:'height',labelJa:'身長印象',category:'body',includeInShort:true,priority:76},['short|小柄|short stature','slightly_short|やや低め|slightly short stature','average|標準的な身長|average height','tall|高身長|tall stature']);
  add({id:'silhouette',labelJa:'全体シルエット',category:'body',includeInShort:true,priority:86},['petite|華奢|petite build','slender|細身|slender build','lean|しなやか|lean build','average|標準的な体格|average build','toned|引き締まった体格|toned build','muscular|筋肉質|muscular build','stocky|がっしり|stocky build']);
  add({id:'muscle',labelJa:'筋肉量',category:'body',priority:64},['very_low|筋肉の主張が少ない|very lightly muscled','low|筋肉量少なめ|lightly muscled','moderate|適度な筋肉|moderately muscled','high|筋肉質|well-muscled','very_high|非常に筋肉質|heavily muscled']);
  add({id:'shoulders',labelJa:'肩幅',category:'body',includeInShort:true,priority:54},['narrow|肩幅狭め|narrow shoulders','average|標準的な肩幅|average-width shoulders','broad|幅広い肩|broad shoulders']);
  add({id:'neckLength',labelJa:'首の長さ',category:'body',priority:30},['short|短い首|short neck','average|標準的な首|average-length neck','long|長い首|long neck']);
  add({id:'neckThickness',labelJa:'首の太さ',category:'body',priority:34},['slender|細い首|slender neck','average|標準的な太さの首|average-thickness neck','thick|太い首|thick neck']);
  add({id:'chest',labelJa:'胸板',category:'body',priority:42},['slim|薄い胸板|slim chest','average|標準的な胸板|average chest','thick|厚い胸板|thick chest']);
  add({id:'torso',labelJa:'胴体',category:'body',priority:34},['short|短めの胴|short torso','balanced|標準的な胴|balanced torso','long|長めの胴|long torso']);
  add({id:'arms',labelJa:'腕',category:'body',priority:28},['slender|細い腕|slender arms','balanced|標準的な腕|balanced arms','strong|力強い腕|strong arms']);
  add({id:'legs',labelJa:'脚',category:'body',priority:32},['slender|細い脚|slender legs','balanced|標準的な脚|balanced legs','long|長い脚|long legs','strong|力強い脚|strong legs']);
  add({id:'hands',labelJa:'手・指',category:'body',selectionMode:'multi',priority:20,modelDependency:'medium'},['small|小さな手|small hands','large|大きな手|large hands','slender|細い指|slender fingers','long|長い指|long fingers','broad|幅のある手|broad hands','knuckled|関節の目立つ手|defined knuckles']);
})(typeof window !== 'undefined' ? window : globalThis);
