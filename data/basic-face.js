(function (root) {
  'use strict';
  var D = root.CAW.data, add = D.addField;
  add({ id:'genderPresentation', labelJa:'性別表現', category:'basic', includeInShort:true, priority:100 },[
    'feminine|女性的|feminine appearance','masculine|男性的|masculine appearance','androgynous|中性的|androgynous appearance','boyish|少年らしい|boyish appearance','girlish|少女らしい|girlish appearance'
  ]);
  add({ id:'ageImpression', labelJa:'年齢印象', category:'basic', includeInShort:true, priority:95 },[
    'child|子ども|child','early_teen|十代前半|early teen','late_teen|十代後半|late teen','young_adult|若い成人|young adult','adult|成人|adult','mature|落ち着いた成人|mature adult'
  ]);
  add({ id:'overallDirection', labelJa:'全体の外見方向', category:'basic', includeInShort:true, priority:70 },[
    'delicate|繊細|delicate features','soft|柔らかい|soft features','defined|骨格が明瞭|well-defined features','refined|端正|refined features','neutral|自然体|natural appearance'
  ]);
  add({ id:'faceShape', labelJa:'顔型', category:'face', includeInShort:true, priority:90 },[
    'oval|卵型|oval face','round|丸顔|round face','long|面長|long face','square|四角い顔|square face','heart|ハート型|heart-shaped face','inverted_triangle|逆三角形|inverted triangular face','diamond|ひし形|diamond-shaped face'
  ]);
  add({ id:'jawShape', labelJa:'顎の形', category:'face', includeInShort:true, priority:82 },[
    'narrow|細い顎|narrow chin','short|短い顎|short chin','rounded|丸い顎|rounded chin','pointed|尖った顎|pointed chin','broad|広い顎|broad chin','square|角張った顎|square chin'
  ]);
  add({ id:'jawline', labelJa:'顎線', category:'face', priority:60 },[
    'soft|柔らかな顎線|soft jawline','defined|明瞭な顎線|defined jawline','angular|角張った顎線|angular jawline','tapered|細くなる顎線|tapered jawline'
  ]);
  add({ id:'cheeks', labelJa:'頬', category:'face', priority:55 },[
    'soft|柔らかな頬|soft cheeks','full|ふっくらした頬|full cheeks','lean|すっきりした頬|lean cheeks','hollow|くぼんだ頬|hollow cheeks'
  ]);
  add({ id:'cheekbones', labelJa:'頬骨', category:'face', priority:45 },[
    'subtle|目立たない頬骨|subtle cheekbones','high|高い頬骨|high cheekbones','wide|幅のある頬骨|wide cheekbones','defined|明瞭な頬骨|defined cheekbones'
  ]);
  add({ id:'forehead', labelJa:'額', category:'face', priority:30 },[
    'low|狭めの額|low forehead','balanced|標準的な額|balanced forehead','high|広めの額|high forehead'
  ]);
  add({ id:'faceExtra', labelJa:'顔の追加タグ', category:'face', selectionMode:'multi', allowCustom:true, priority:25 },[
    'small_face|小顔|small face','broad_face|幅広の顔|broad face','symmetrical_face|左右対称な顔|symmetrical face','subtle_asymmetry|自然な左右差|subtle facial asymmetry'
  ]);
})(typeof window !== 'undefined' ? window : globalThis);
