(function (root) {
  'use strict';
  root.CAW.data.rules=[
    {id:'hair_length_cut_conflict',level:'hard',titleJa:'髪の長さとカットが競合しています'},
    {id:'bangs_conflict',level:'hard',titleJa:'前髪の指定が競合しています'},
    {id:'iris_color_conflict',level:'hard',titleJa:'瞳の配色指定が競合しています'},
    {id:'hair_color_conflict',level:'hard',titleJa:'髪の配色指定が競合しています'},
    {id:'glasses_state_conflict',level:'hard',titleJa:'メガネの状態が一致していません'},
    {id:'body_conflict',level:'warning',titleJa:'体格の指定が離れています'},
    {id:'too_many_details',level:'warning',titleJa:'細かな指定が多めです'},
    {id:'too_many_marks',level:'warning',titleJa:'固有特徴が多めです'},
    {id:'left_right',level:'info',titleJa:'左右指定は反転する場合があります'},
    {id:'subtle_feature',level:'info',titleJa:'小さな特徴は省略される場合があります'},
    {id:'rimless_glasses',level:'info',titleJa:'リムレス眼鏡は省略される場合があります'},
    {id:'abstract_effect',level:'info',titleJa:'抽象印象は広く作用します'},
    {id:'missing_hair_style',level:'suggestion',titleJa:'髪型を加えると安定します'},
    {id:'missing_eye_shape',level:'suggestion',titleJa:'目の形を加えると安定します'},
    {id:'missing_body',level:'suggestion',titleJa:'身体つきを選べます'},
    {id:'missing_cut',level:'suggestion',titleJa:'基本カットを選べます'},
    {id:'few_selections',level:'suggestion',titleJa:'外見の指定が少なめです'}
  ];
})(typeof window !== 'undefined' ? window : globalThis);
