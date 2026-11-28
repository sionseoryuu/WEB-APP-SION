// Migrasi data V2: aditif saja (tidak menghapus/mengubah field lama), idempoten, dan punya rollback.
export const SCHEMA_V2 = 2;
const ADDED = ['goals', 'subscriptions'];

export function migrateToV2(data) {
  if (!data || typeof data !== 'object') throw new Error('Data tidak valid');
  if ((data.schemaVersion || 1) >= SCHEMA_V2) return data;
  const next = { ...data, schemaVersion: SCHEMA_V2 };
  ADDED.forEach((k) => { if (!Array.isArray(next[k])) next[k] = []; });
  return next;
}

// Rollback ke bentuk v1: hanya membuang field baru yang KOSONG. Jika sudah berisi data pengguna → ditolak
// supaya tidak ada kehilangan data diam-diam.
export function rollbackV2(data) {
  const filled = ADDED.filter((k) => Array.isArray(data?.[k]) && data[k].length);
  if (filled.length) throw new Error(`Rollback ditolak: ${filled.join(', ')} berisi data`);
  const { schemaVersion, ...rest } = data;
  ADDED.forEach((k) => delete rest[k]);
  return rest;
}
