import pica from './vendor/pica.mjs';

// Ship the filter with the app: image pixels never leave this device.
const resizer = pica({features: ['js', 'wasm', 'ww'], concurrency: 2});

export async function resizeImage(image, canvas, {method = 'smooth', jpeg = false} = {}) {
  if (method === 'pixel') {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('この端末では画像を処理できません。');
    context.imageSmoothingEnabled = false;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
  } else {
    // Magic Kernel Sharp preserves edges without piling on extra sharpening.
    await resizer.resize(image, canvas, {filter: 'mks2013', unsharpAmount: 0});
  }
  if (jpeg) {
    // Flatten after resizing so PNG edges are filtered with their transparency.
    const context = canvas.getContext('2d');
    context.globalCompositeOperation = 'destination-over';
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.globalCompositeOperation = 'source-over';
  }
}
