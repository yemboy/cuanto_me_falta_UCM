// Tests de integridad sobre los datos reales del tracker.
//
// Los links de progreso (#p=v1 / #p=v2) son un bitmask POSICIONAL sobre
// PROGRESS_ORDER (progress-order.js), un registro congelado y append-only.
// Invariantes:
//   1. El snapshot v1 (tests/canonical-order.snapshot.json, 430 ids) es
//      PREFIJO exacto de PROGRESS_ORDER → los links v1 viejos siguen válidos.
//   2. Todo id que data.js declara (episodios incluidos) está en
//      PROGRESS_ORDER → todo progreso es codificable.
//   3. Todo id de PROGRESS_ORDER existe en data.js o está en RETIRED_IDS
//      (slot muerto declarado).
//   4. El orden de visualización del maratón coincide con
//      tests/marathon-display-order.snapshot.json. Reordenar es seguro para
//      los links, pero debe ser intencional: bun run tests/update-snapshot.js
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { getCanonicalIdOrder, decodeProgress } from '../progress-codec.js';
import { PROGRESS_ORDER } from '../progress-order.js';
import { parseDuration } from '../utils.js';
import { loadClassicScript } from './helpers.js';

const here = dirname(fileURLToPath(import.meta.url));
const readJson = f => JSON.parse(readFileSync(join(here, f), 'utf8'));

const { quickFiveData, fastTrackData, marathonData } = loadClassicScript(
  'data.js',
  '{ quickFiveData, fastTrackData, marathonData }'
);
const dataIds = getCanonicalIdOrder([quickFiveData, fastTrackData, marathonData]);
const dataIdSet = new Set(dataIds);
const registrySet = new Set(PROGRESS_ORDER);

// Ids que salieron de data.js pero conservan su slot en PROGRESS_ORDER.
const RETIRED_IDS = new Set([]);

// Ítems del maratón sin duración conocida (sin estrenar o sin dato fiable).
// Quitar de aquí al completar la duración en data.js.
const DURATION_PENDING = new Set([
  'marathon-wonderman',
  'marathon-daredevilbornagaintemporada2',
  'marathon-daredevilbornagaintemporada3',
  'marathon-spidermanbrandnewday',
  'marathon-visionquest',
  'marathon-avengersdoomsday',
  'marathon-avengerssecretwars',
  'marathon-yourfriendlyneighborhoodspidermant2',
  'marathon-xmen97t2',
  'marathon-spidernoir',
]);

describe('PROGRESS_ORDER (posiciones de bit de los links)', () => {
  test('el snapshot v1 es prefijo exacto del registro', () => {
    const snapshot = readJson('canonical-order.snapshot.json');
    expect(snapshot.length).toBe(430);
    expect(PROGRESS_ORDER.slice(0, snapshot.length)).toEqual(snapshot);
  });

  test('no hay ids duplicados en el registro', () => {
    expect(registrySet.size).toBe(PROGRESS_ORDER.length);
  });

  test('todo id de data.js (episodios incluidos) tiene posición en el registro', () => {
    const missing = dataIds.filter(id => !registrySet.has(id));
    expect(missing).toEqual([]);
  });

  test('todo id del registro existe en data.js o está retirado explícitamente', () => {
    const orphan = PROGRESS_ORDER.filter(id => !dataIdSet.has(id) && !RETIRED_IDS.has(id));
    expect(orphan).toEqual([]);
  });

  test('no hay ids duplicados en los datasets', () => {
    expect(dataIdSet.size).toBe(dataIds.length);
  });

  test('un link v1 real generado antes de la migración decodifica los mismos ids', () => {
    const fixture = readJson('fixtures/v1-link.json');
    expect(fixture.hash.startsWith('#p=v1.')).toBe(true);
    const decoded = decodeProgress(fixture.hash, PROGRESS_ORDER);
    expect([...decoded].sort()).toEqual([...fixture.ids].sort()); // decode devuelve en orden de registro
  });
});

describe('marathonData', () => {
  test('el orden de visualización coincide con el snapshot', () => {
    const snapshot = readJson('marathon-display-order.snapshot.json');
    expect(marathonData.map(i => i.id)).toEqual(snapshot);
  });

  test('todo ítem tiene duration parseable salvo los pendientes declarados', () => {
    const bad = marathonData
      .filter(i => !DURATION_PENDING.has(i.id) && parseDuration(i.duration) <= 0)
      .map(i => i.id);
    expect(bad).toEqual([]);
    const stale = [...DURATION_PENDING].filter(id => {
      const item = marathonData.find(i => i.id === id);
      return !item || parseDuration(item.duration) > 0;
    });
    expect(stale).toEqual([]); // ya tiene duración o no existe: sacar de DURATION_PENDING
  });

  test('details no contiene fechas de estreno (eso vive en releases.js)', () => {
    const bad = marathonData.filter(i => /estreno/i.test(i.details || '')).map(i => i.id);
    expect(bad).toEqual([]);
  });
});

describe('equivalences.js', () => {
  const itemEquivalences = loadClassicScript('equivalences.js', 'itemEquivalences');

  test('todo alias y canónico existe en los datasets', () => {
    const missing = [];
    Object.entries(itemEquivalences).forEach(([alias, canonical]) => {
      if (!dataIdSet.has(alias)) missing.push(alias);
      if (!dataIdSet.has(canonical)) missing.push(canonical);
    });
    expect(missing).toEqual([]);
  });
});

describe('owner_progress.js', () => {
  const ownerProgress = loadClassicScript('owner_progress.js', 'ownerProgress');

  test('todo id del progreso del dueño existe en los datasets', () => {
    const missing = ownerProgress.filter(id => !dataIdSet.has(id));
    expect(missing).toEqual([]);
  });
});
