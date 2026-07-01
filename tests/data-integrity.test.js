// Tests de integridad sobre los datos reales del tracker.
//
// El más importante: el formato v1 de los links de progreso (#p=v1.…)
// depende del orden global de los ids. Este test guarda un snapshot del
// orden canónico y exige que siga siendo un PREFIJO del orden actual:
// - agregar items al final de marathonData → pasa (operación segura)
// - insertar/reordenar/agregar en quick5 o fast → falla (rompería links viejos)
// Si el fallo es intencional, hay que migrar el formato a v2 y regenerar
// el snapshot: bun run tests/update-snapshot.js
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { getCanonicalIdOrder } from '../progress-codec.js';
import { loadClassicScript } from './helpers.js';

const here = dirname(fileURLToPath(import.meta.url));

const { quickFiveData, fastTrackData, marathonData } = loadClassicScript(
  'data.js',
  '{ quickFiveData, fastTrackData, marathonData }'
);
const order = getCanonicalIdOrder([quickFiveData, fastTrackData, marathonData]);
const allIds = new Set(order);

describe('orden canónico (formato de links v1)', () => {
  test('el snapshot v1 sigue siendo prefijo del orden actual', () => {
    const snapshot = JSON.parse(readFileSync(join(here, 'canonical-order.snapshot.json'), 'utf8'));
    expect(order.length).toBeGreaterThanOrEqual(snapshot.length);
    expect(order.slice(0, snapshot.length)).toEqual(snapshot);
  });

  test('no hay ids duplicados en el orden global', () => {
    expect(allIds.size).toBe(order.length);
  });
});

describe('equivalences.js', () => {
  const itemEquivalences = loadClassicScript('equivalences.js', 'itemEquivalences');

  test('todo alias y canónico existe en los datasets', () => {
    const missing = [];
    Object.entries(itemEquivalences).forEach(([alias, canonical]) => {
      if (!allIds.has(alias)) missing.push(alias);
      if (!allIds.has(canonical)) missing.push(canonical);
    });
    expect(missing).toEqual([]);
  });
});

describe('owner_progress.js', () => {
  const ownerProgress = loadClassicScript('owner_progress.js', 'ownerProgress');

  test('todo id del progreso del dueño existe en los datasets', () => {
    const missing = ownerProgress.filter(id => !allIds.has(id));
    expect(missing).toEqual([]);
  });
});
