// Ruang kerja ganda per akun: satu akun Google bisa punya beberapa "akun" (mis. Pribadi dan Usaha),
// masing-masing berisi data sendiri. Logika murni (tanpa React) agar mudah diuji.
//
// Kunci penyimpanan:
//   ruang kerja utama  -> workspaceKey = baseKey                (kompatibel dengan data lama)
//   ruang kerja lain   -> workspaceKey = `${baseKey}~${id}`
// Di Google Drive: utama = life-os-backup.json, lainnya = life-os-backup-<id>.json
export const MAIN_WS = 'main';

export const wsRegKey = (base) => `lifeos:wslist:${base}`;
export const lastWsKey = (base) => `lifeos:lastws:${base}`;
export const keyFor = (base, id) => (!id || id === MAIN_WS ? base : `${base}~${id}`);
export const baseOf = (key) => String(key || '').split('~')[0];
export const idOf = (key) => {
  const i = String(key || '').indexOf('~');
  return i === -1 ? MAIN_WS : String(key).slice(i + 1);
};
export const newWsId = () => `w${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export const typeOf = (data) => (data?.profile?.ledgerType === 'business' ? 'business' : 'personal');
export const nameOf = (data) =>
  (typeOf(data) === 'business' ? data?.pos?.shopName || data?.profile?.name : data?.profile?.name) || '';
export const entryFromData = (id, data) => ({ id, type: typeOf(data), name: nameOf(data) });

export function readRegistry(base, storage = globalThis.localStorage) {
  try {
    const v = JSON.parse(storage.getItem(wsRegKey(base)) || '[]');
    return Array.isArray(v) ? v.filter((w) => w && w.id) : [];
  } catch {
    return [];
  }
}
export function writeRegistry(base, list, storage = globalThis.localStorage) {
  try {
    storage.setItem(wsRegKey(base), JSON.stringify(list));
  } catch {
    /* abaikan */
  }
}

// Tambah/perbarui satu entri; mengembalikan daftar yang sama bila tidak ada perubahan
export function upsert(list, entry) {
  const i = list.findIndex((w) => w.id === entry.id);
  if (i === -1) return [...list, entry];
  const cur = list[i];
  if (cur.type === entry.type && cur.name === entry.name) return list;
  const next = list.slice();
  next[i] = { ...cur, ...entry };
  return next;
}

// Urutan tampil: utama dulu, lalu menurut urutan dibuat
export const sortList = (list) => [...list].sort((a, b) => (a.id === MAIN_WS ? -1 : b.id === MAIN_WS ? 1 : 0));

// Gabungkan daftar lokal + daftar dari cloud (cloud menang untuk tipe & nama)
export function mergeRegistry(local, cloud) {
  return cloud.reduce((acc, w) => upsert(acc, { id: w.id, type: typeOf(w.data), name: nameOf(w.data) }), local);
}

// Pilih ruang kerja yang dibuka saat registrasi/masuk.
//  setup = { type } untuk pendaftar baru; null bila hanya masuk.
//  Hasil: { target, create } — create=true bila ruang kerja bertipe itu belum ada dan harus dibuat.
export function pickWorkspace(list, setup, lastId) {
  if (setup?.type) {
    const found = sortList(list).find((w) => w.type === setup.type);
    if (found) return { target: found, create: false };
    return { target: { id: list.length === 0 ? MAIN_WS : newWsId(), type: setup.type }, create: true };
  }
  const found = list.find((w) => w.id === lastId) || sortList(list)[0];
  if (found) return { target: found, create: false };
  return { target: { id: MAIN_WS, type: 'personal' }, create: true };
}

// Konfirmasi hapus akun: pengguna harus mengetik "hapus akun" (huruf besar/spasi ganda diabaikan)
export const DELETE_PHRASE = 'hapus akun';
export const matchesPhrase = (input, phrase = DELETE_PHRASE) =>
  String(input || '').trim().replace(/\s+/g, ' ').toLowerCase() === phrase;

// Rencana setelah menghapus satu akun:
//  { list: sisa daftar, open: id akun yang dibuka (atau null), signOut: true bila tidak ada akun tersisa }
export function planDelete(list, deleteId, currentId) {
  const rest = sortList(list.filter((w) => w.id !== deleteId));
  if (rest.length === 0) return { list: rest, open: null, signOut: true };
  if (deleteId === currentId) return { list: rest, open: rest[0].id, signOut: false };
  return { list: rest, open: currentId, signOut: false };
}
