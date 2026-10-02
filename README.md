# NKB-IMG-UPSCALER

JPG・PNGを2〜10倍（0.1刻み）に拡大する日本語Webアプリ。ブラウザのCanvasで補間処理し、画像はサーバーに送信しません。AI超解像ではありません。

- ファイル選択、ドラッグ＆ドロップ、出力プレビューとダウンロード
- PNG透明背景、JPG画質50〜100%（透明部分は白）
- なめらかな補間／ピクセルアート用の最近傍拡大
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
