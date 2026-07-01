// Regenera tests/canonical-order.snapshot.json a partir de data.js.
// SOLO ejecutar cuando un cambio de orden sea intencional (implica migrar
// el formato de links a v2 — leer la advertencia en progress-codec.js).
//   bun run tests/update-snapshot.js
import { writeFileSync } from 'node:fs';
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
writeFileSync(join(here, 'canonical-order.snapshot.json'), JSON.stringify(order, null, 2) + '\n');
console.log(`Snapshot regenerado: ${order.length} ids`);
