# NKB-IMG-UPSCALER

JPG・PNGを2〜10倍（0.1刻み）に拡大する日本語Webアプリ。ブラウザのCanvasで補間処理し、画像はサーバーに送信しません。AI超解像ではありません。

- ファイル選択、ドラッグ＆ドロップ、出力プレビューとダウンロード
- − / ＋ボタンで0.1倍ずつ調整（2〜10倍）、数値・スライダー・プリセットと連動
- PNG透明背景、JPG画質50〜100%（透明部分は白）
- pica 10.0.3 の Magic Kernel Sharp（mks2013）による高品質補間／ピクセルアート用の最近傍拡大
- JPGの初期画質98%。PNGでは透明度を維持、JPGの白背景への変換は補間後に実施
- 高品質フィルターはアプリに同梱し、画像データは端末内だけで処理
- 入力30 MB、出力4,000万画素・各辺16,384pxの上限

公開URL: https://nkb-img-upscaler.que-band-2025.workers.dev/

## ローカル

Node.js 22以降で `npm run dev`。 http://127.0.0.1:4173 を開きます。 `npm test` で寸法計算・上限の検証。

## Cloudflare Workersへ公開

```
npm install
npx wrangler login
npm run deploy
```

`wrangler.jsonc` の名前は `nkb-img-upscaler`。公式の静的アセット機能で `public/` のみを配信します。
https://developers.cloudflare.com/workers/static-assets/

## GitHub

NKBfromElectric/NKB-IMG-UPSCALER の新規リポジトリを作成後、このフォルダで実行します。

```
git init -b main
git add .
git commit -m "Create browser image upscaler"
git remote add origin https://github.com/NKBfromElectric/NKB-IMG-UPSCALER.git
git push -u origin main
```

スマートフォンはメモリやCanvasの制限により、上限以内でも失敗することがあります。倍率を下げてください。画像の細部を復元する機能はありません。UIフォントはGoogle Fontsを利用します。

## 依存ライブラリ

[pica](https://github.com/nodeca/pica) 10.0.3（MIT）。配布用ESMとライセンスを public/vendor/ に同梱しています。フィルターは元画像に存在しない細部を復元する機能ではありません。
