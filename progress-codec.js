// Codec del progreso compartido por URL (#p=v1.{bitmask en base64url}).
//
// ADVERTENCIA: el formato v1 depende del ORDEN GLOBAL de declaración:
// quickFiveData → fastTrackData → marathonData (concatenados), con los
// episodios de cada serie inmediatamente después de su padre.
// ÚNICA operación segura: agregar items al FINAL de marathonData.
// Agregar al final de quickFiveData o fastTrackData, insertar en medio de
// cualquier array, o insertar episodios en una serie existente DESPLAZA
// todos los bits posteriores y corrompe los links viejos SILENCIOSAMENTE
// (el decode no falla: devuelve IDs incorrectos).
// Si el orden cambia de forma incompatible, subir el payload a v2 y
// rechazar v1 en decodeProgress.
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
  return `#p=v1.${b64url}`;
}

// Devuelve array de ids o null si el hash no es un payload v1 válido
export function decodeProgress(hash, order) {
  const match = hash.match(/^#p=v1\.([A-Za-z0-9_-]+)$/);
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
