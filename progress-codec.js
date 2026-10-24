// Codec del progreso compartido por URL (#p=v2.{bitmask en base64url}).
//
// Las posiciones de bit las define PROGRESS_ORDER (progress-order.js), un
// registro congelado y append-only, independiente del orden de data.js.
// El formato v1 usaba el orden de declaración de los datasets; ese orden
// quedó congelado como prefijo de PROGRESS_ORDER, así que v1 se decodifica
// con el mismo registro (payload más corto → bits faltantes = no visto).
// getCanonicalIdOrder se conserva para los tests de integridad (calcula el
// conjunto de ids que data.js declara, episodios incluidos).
import { getEpisodeIdsForSeries } from './utils.js';

export function getCanonicalIdOrder(datasets) {
  const order = [];
  datasets.forEach(dataset => {
    dataset.forEach(item => {
      order.push(item.id);
      if (item.episodes && item.episodes.length > 0) {
        getEpisodeIdsForSeries(item).forEach(epId => order.push(epId));
      }
    });
  });
  return order;
}

export function encodeProgress(order, watchedSet) {
  const bytes = new Uint8Array(Math.ceil(order.length / 8));
  order.forEach((id, i) => {
    if (watchedSet.has(id)) bytes[i >> 3] |= (1 << (i & 7));
  });
  let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  const b64url = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `#p=v2.${b64url}`;
}

// Devuelve array de ids o null si el hash no es un payload v1/v2 válido.
// v1 y v2 comparten layout: v1 es un prefijo (ver progress-order.js).
export function decodeProgress(hash, order) {
  const match = hash.match(/^#p=v[12]\.([A-Za-z0-9_-]+)$/);
  if (!match) return null;
  let b64 = match[1].replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  let bin;
  try { bin = atob(b64); } catch (e) { return null; }
  const ids = [];
  for (let i = 0; i < order.length; i++) {
    const byte = bin.charCodeAt(i >> 3);
    if (Number.isNaN(byte)) break; // link viejo: el payload es más corto que los datos actuales
    if (byte & (1 << (i & 7))) ids.push(order[i]);
  }
  return ids;
}
