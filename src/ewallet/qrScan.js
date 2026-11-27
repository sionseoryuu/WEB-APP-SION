import jsQR from 'jsqr';

// Baca QR langsung di perangkat (tanpa internet, tanpa AI).
// Pakai BarcodeDetector bawaan browser bila ada; bila tidak (mis. iPhone/Safari), pakai jsQR.
let detector = null;
const getDetector = () => {
  if (detector === null) {
    detector = typeof window !== 'undefined' && 'BarcodeDetector' in window
      ? new window.BarcodeDetector({ formats: ['qr_code', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39'] })
      : false;
  }
  return detector;
};

// source: elemen <video>, <img> atau <canvas>. Mengembalikan teks kode atau ''.
export async function decodeCode(source) {
  const det = getDetector();
  if (det) {
    try {
      const codes = await det.detect(source);
      if (codes && codes[0] && codes[0].rawValue) return codes[0].rawValue;
    } catch {
      /* lanjut ke jsQR */
    }
  }
  const w = source.videoWidth || source.naturalWidth || source.width;
  const h = source.videoHeight || source.naturalHeight || source.height;
  if (!w || !h) return '';
  // perkecil agar cepat; QR tetap terbaca
  const scale = Math.min(1, 900 / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const res = jsQR(img.data, img.width, img.height, { inversionAttempts: 'attemptBoth' });
  return res?.data || '';
}

export function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}
