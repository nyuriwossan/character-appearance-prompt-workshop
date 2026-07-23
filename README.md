# キャラクター外見設計工房

日本語UIで1人の人間型キャラクター本人の顔、髪、肌、身体つきを構造的に設計し、画像生成AI向けの英語タグ型プロンプトへ変換する静的Webアプリです。

公開予定URL: <https://nyuriwossan.github.io/character-appearance-prompt-workshop/>

## 主な機能

- 約300件以上の外見候補を、基本・顔骨格・目・眉鼻口・髪・肌・身体・固有特徴・印象へ分類
- 顔立ち、目元、眉、髪型、体格、配色の部分プリセット
- 選択中の日本語タグを常時確認し、タグから直接解除
- 短縮プロンプト、詳細プロンプト、日本語まとめ、基本の外見、アレンジ項目を生成
- 顔確認用・身体確認用プロンプト
- hard / warning / info / suggestion の4段階の設計チェックと、明確な場合だけのパッチ型修正
- 下書き自動保存、名前付き保存、読込、複製、削除
- 編集中データと全保存データのJSON書き出し、旧形式の正規化、壊れたJSONの安全な拒否
- 320px級からPCまでのレスポンシブUI、44pxタップ領域、iOS向けコピー代替処理

ガチャ、採点、衣装、具体的な表情、ポーズ、構図、背景、人外パーツ、外部APIは含みません。

## 役割分担

```text
入力UI
  ↓ selection / patch
state.js
  ↓
normalizer.js
  ├─ generator.js → 短縮・詳細・日本語・確認用出力
  ├─ advisor.js   → 4段階の設計チェックと修正patch
  └─ storage.js   → 自動保存・複数保存・JSON
```

`app.js` は画面描画とイベント接続に限定し、大量の候補は `data/` へ分離しています。生成済みプロンプトではなく選択IDを保存の正本にするため、辞書の修正や将来の移行へ対応できます。

## 使い方

1. 必要なら部分プリセットを開始地点として適用します。
2. アコーディオンから必要な項目だけ選びます。
3. 固定バーの日本語タグと「設計チェック」を確認します。
4. 短縮版または詳細版をコピーします。
5. 残したい設計は名前を付けて保存し、定期的にJSONバックアップを書き出します。

保存先は端末のブラウザ内です。ブラウザ履歴、サイトデータ、ストレージを削除すると消える場合があります。重要な設計はJSONバックアップを保管してください。

## ローカル実行

ビルドや依存ライブラリは不要です。`file://` でも表示できますが、保存やコピーを含む確認はローカルサーバー経由を推奨します。

```bash
python -m http.server 8000
```

`http://localhost:8000/` を開きます。

## テスト

Node.js 22以降で実行します。外部パッケージは不要です。

```bash
npm test
```

データ整合性、状態、旧形式正規化、生成、診断、保存、代表キャラクター5例、静的なUI要件を検査します。`tests.html` ではブラウザのスモークテストも実行できます。

## GitHub Pages

`.github/workflows/deploy-pages.yml` は `main` へのpush時にテストを実行し、リポジトリのルートをGitHub Pagesへ公開します。初回は Repository Settings → Pages → Source で **GitHub Actions** を選択してください。

## ファイル構成

```text
index.html / styles.css / app.js
state.js / normalizer.js / generator.js / advisor.js / storage.js
data/
  core.js / basic-face.js / eyes.js / features.js
  hair.js / skin-body.js / marks.js / presets.js / rules.js
tests/
  run-tests.js
tests.html
.github/workflows/deploy-pages.yml
```

## 既知の制限

- 左右指定、薄い傷、小さなほくろ、リムレス眼鏡などはモデルによって反転・省略されます。
- 設計チェックは論理的な補助で、生成結果の再現を保証しません。
- 自由入力は英語タグを前提とし、内容の意味判定は行いません。
- 保存はこの端末のブラウザ内だけで、端末間同期はありません。

## 今後の拡張候補

- 辞書候補と競合ルールの追加
- 旧スキーマ移行ルールの拡充
- 実際の生成モデル別の語彙検証メモ
- 実機Safariでの継続的なアクセシビリティ確認
