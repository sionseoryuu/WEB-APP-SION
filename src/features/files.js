// Simpan & bagikan berkas. Di Android (WebView) unduhan lewat <a download> tidak andal,
// jadi berkas ditulis ke cache lalu dibagikan lewat lembar "Bagikan" bawaan sistem.
import { Capacitor } from '@capacitor/core';

const isNative = () => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

const toBase64 = (bytes) => {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  return btoa(bin);
};

export const MIME = {
  pdf: 'application/pdf',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv;charset=utf-8',
  json: 'application/json',
};

// content: string | Uint8Array. Mengembalikan 'shared' | 'downloaded'
export async function saveAndShare({ filename, content, mime, dialogTitle }) {
  const bytes = typeof content === 'string' ? new TextEncoder().encode(content) : content;
  if (isNative()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const res = await Filesystem.writeFile({ path: filename, data: toBase64(bytes), directory: Directory.Cache, recursive: true });
    await Share.share({ title: filename, dialogTitle: dialogTitle || filename, url: res.uri });
    return 'shared';
  }
  const blob = new Blob([bytes], { type: mime || 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return 'downloaded';
}
